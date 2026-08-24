from datetime import datetime, timedelta, timezone, date
from fastapi import FastAPI, Depends, HTTPException, Header, Query, Request, BackgroundTasks
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import BaseModel
import stripe
import httpx
import asyncio
from config import settings
from db import Base, engine, get_db
from models import AppSettings, ChatMessage, BookingRequest, Customer, IcalReservation, Task, Expense, GuestReview, AutoMessage, PropertyInfo, DailyPrice
from schemas import AdminLogin, ChatIn, BookingIn, SettingsSchema, CustomerRegister, CustomerLogin
from passlib.context import CryptContext
_pwd=CryptContext(schemes=['bcrypt'],deprecated='auto')
from integrations import airbnb_available, pricelabs_nightly_rate, sync_platform_ical, _extract_guest_name
import analytics as _analytics
from email_service import (send_booking_confirmation, send_owner_notification,
    preview_booking_confirmation, preview_pre_arrival, preview_checkout_reminder, preview_review_request)
app=FastAPI(title='Coastal Haven API',version='1.0.0')

async def _pricelabs_sync_loop():
    await asyncio.sleep(5)  # wait for DB to be ready
    while True:
        try:
            if settings.pricelabs_api_key and settings.pricelabs_listing_id:
                today=date.today()
                import calendar as _cal2
                ey=today.year+1; em=today.month; _,ed=_cal2.monthrange(ey,em)
                hdrs={'X-API-Key':settings.pricelabs_api_key,'Content-Type':'application/json'}
                pl={'listings':[{'id':settings.pricelabs_listing_id,'pms':settings.pricelabs_pms,'start_date':today.isoformat(),'end_date':f'{ey}-{em:02d}-{ed:02d}'}]}
                async with httpx.AsyncClient(timeout=60) as c:
                    r=await c.post('https://api.pricelabs.co/v1/listing_prices',headers=hdrs,json=pl)
                if r.status_code<400:
                    results=r.json()
                    daily=(results[0].get('data') or []) if isinstance(results,list) and results else []
                    now=datetime.utcnow()
                    db=next(get_db())
                    try:
                        for d in daily:
                            ds=d.get('date'); price=d.get('price',0)
                            if not ds or not price: continue
                            existing=db.query(DailyPrice).filter(DailyPrice.date==ds).first()
                            if existing:
                                existing.price=float(price); existing.min_stay=d.get('min_stay',1) or 1
                                existing.demand_color=d.get('demand_color','') or ''; existing.occupancy=d.get('occupancy',0) or 0
                                existing.synced_at=now
                            else:
                                db.add(DailyPrice(date=ds,price=float(price),min_stay=d.get('min_stay',1) or 1,demand_color=d.get('demand_color','') or '',occupancy=d.get('occupancy',0) or 0,synced_at=now))
                        db.commit()
                        print(f'PriceLabs auto-sync: {len(daily)} days cached')
                    finally: db.close()
        except Exception as e: print(f'PriceLabs sync error: {e}')
        await asyncio.sleep(3600)  # 1 hour

@app.on_event('startup')
async def _startup():
    try: Base.metadata.create_all(bind=engine)
    except Exception as e: print(f'DB init warning: {e}')
    asyncio.create_task(_pricelabs_sync_loop())
app.add_middleware(CORSMiddleware,allow_origins=[settings.frontend_url,'https://www.orangebeachstay.com','https://coastal-haven.onrender.com','http://localhost:5173'],allow_credentials=True,allow_methods=['*'],allow_headers=['*','X-Session-ID'])

_SKIP_ANALYTICS={'/docs','/openapi.json','/favicon.ico'}

class _AnalyticsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self,request:Request,call_next):
        response=await call_next(request)
        path=request.url.path
        if path in _SKIP_ANALYTICS or path.startswith('/api/analytics') or request.method!='GET':
            return response
        ip=(request.headers.get('x-forwarded-for') or (request.client.host if request.client else '127.0.0.1')).split(',')[0].strip()
        ua=request.headers.get('user-agent','')
        ref=request.headers.get('referer','')
        sid=request.headers.get('x-session-id','')
        asyncio.create_task(_analytics.log_event('server_request',ip,ua,ref,path,sid))
        return response

app.add_middleware(_AnalyticsMiddleware)

def get_settings(db:Session):
    s=db.get(AppSettings,1)
    if not s:
        s=AppSettings(id=1); db.add(s); db.commit(); db.refresh(s)
    return s

def make_token(): return jwt.encode({'sub':'admin','exp':datetime.now(timezone.utc)+timedelta(hours=12)},settings.jwt_secret,algorithm='HS256')
def require_admin(authorization:str|None=Header(default=None)):
    if not authorization or not authorization.startswith('Bearer '): raise HTTPException(401,'Admin login required')
    try:
        p=jwt.decode(authorization.split(' ',1)[1],settings.jwt_secret,algorithms=['HS256'])
        if p.get('sub')!='admin': raise HTTPException(401,'Admin access required')
    except JWTError: raise HTTPException(401,'Invalid or expired token')

DEMO_FLIGHTS_OUT=[
    {'flight':'AA1842','airline':'American Airlines','airline_iata':'AA','dep_time':'06:00','arr_time':'08:15','status':'scheduled','aircraft':'Boeing 737','price':189,'dep_terminal':'T','dep_gate':'B2','arr_terminal':None,'arr_gate':'A4','arr_baggage':'2','dep_delay':None,'arr_delay':None},
    {'flight':'DL4023','airline':'Delta Air Lines','airline_iata':'DL','dep_time':'09:30','arr_time':'11:45','status':'scheduled','aircraft':'Airbus A320','price':224,'dep_terminal':'S','dep_gate':'S12','arr_terminal':None,'arr_gate':'B1','arr_baggage':'1','dep_delay':None,'arr_delay':None},
    {'flight':'UA2291','airline':'United Airlines','airline_iata':'UA','dep_time':'13:15','arr_time':'15:30','status':'delayed','aircraft':'Boeing 737','price':197,'dep_terminal':'C','dep_gate':'C24','arr_terminal':None,'arr_gate':'A6','arr_baggage':'3','dep_delay':18,'arr_delay':18},
    {'flight':'WN3847','airline':'Southwest Airlines','airline_iata':'WN','dep_time':'16:45','arr_time':'18:55','status':'scheduled','aircraft':'Boeing 737 MAX','price':159,'dep_terminal':None,'dep_gate':'A10','arr_terminal':None,'arr_gate':'B3','arr_baggage':'4','dep_delay':None,'arr_delay':None},
    {'flight':'AA2956','airline':'American Airlines','airline_iata':'AA','dep_time':'19:20','arr_time':'21:35','status':'scheduled','aircraft':'Airbus A321','price':211,'dep_terminal':'T','dep_gate':'B7','arr_terminal':None,'arr_gate':'A2','arr_baggage':'5','dep_delay':None,'arr_delay':None},
]
DEMO_FLIGHTS_RET=[
    {'flight':'AA1843','airline':'American Airlines','airline_iata':'AA','dep_time':'07:30','arr_time':'09:45','status':'scheduled','aircraft':'Boeing 737','price':194,'dep_terminal':None,'dep_gate':'A3','arr_terminal':'T','arr_gate':'B4','arr_baggage':None,'dep_delay':None,'arr_delay':None},
    {'flight':'DL4024','airline':'Delta Air Lines','airline_iata':'DL','dep_time':'11:00','arr_time':'13:20','status':'scheduled','aircraft':'Airbus A320','price':229,'dep_terminal':None,'dep_gate':'B2','arr_terminal':'S','arr_gate':'S8','arr_baggage':None,'dep_delay':None,'arr_delay':None},
    {'flight':'UA2292','airline':'United Airlines','airline_iata':'UA','dep_time':'14:45','arr_time':'17:05','status':'scheduled','aircraft':'Boeing 737','price':202,'dep_terminal':None,'dep_gate':'A7','arr_terminal':'C','arr_gate':'C11','arr_baggage':None,'dep_delay':None,'arr_delay':None},
    {'flight':'WN3848','airline':'Southwest Airlines','airline_iata':'WN','dep_time':'18:10','arr_time':'20:25','status':'scheduled','aircraft':'Boeing 737 MAX','price':164,'dep_terminal':None,'dep_gate':'B5','arr_terminal':None,'arr_gate':'A9','arr_baggage':None,'dep_delay':None,'arr_delay':None},
]
DEMO_CARS=[
    {'category':'Economy','example':'Toyota Yaris or similar','seats':4,'bags':2,'price_per_day':44,'company':'Enterprise'},
    {'category':'Compact','example':'Toyota Corolla or similar','seats':5,'bags':3,'price_per_day':56,'company':'Hertz'},
    {'category':'Midsize','example':'Toyota Camry or similar','seats':5,'bags':3,'price_per_day':69,'company':'Avis'},
    {'category':'Full-size','example':'Chevrolet Impala or similar','seats':5,'bags':4,'price_per_day':79,'company':'National'},
    {'category':'SUV','example':'Ford Explorer or similar','seats':7,'bags':5,'price_per_day':98,'company':'Enterprise'},
    {'category':'Minivan','example':'Chrysler Pacifica or similar','seats':7,'bags':6,'price_per_day':91,'company':'Budget'},
]

def _build_demo_flights(base,dep,arr,d):
    return [{**f,'from':dep,'to':arr,'date':d} for f in base]

def _t(iso): return iso[11:16] if iso else '—'
def _parse_live_flights(data,dep,arr,d):
    out=[]
    for f in data:
        if not f.get('flight',{}).get('iata'): continue
        dep_info=f.get('departure',{}); arr_info=f.get('arrival',{})
        out.append({
            'flight':f['flight']['iata'],
            'airline':f['airline']['name'],
            'airline_iata':f['airline'].get('iata',''),
            'dep_time':_t(dep_info.get('scheduled')),
            'arr_time':_t(arr_info.get('scheduled')),
            'dep_actual':_t(dep_info.get('actual')),
            'arr_actual':_t(arr_info.get('actual')),
            'status':f['flight_status'],
            'aircraft':f.get('aircraft',{}).get('iata','') if f.get('aircraft') else '',
            'price':None,
            'dep_terminal':dep_info.get('terminal'),
            'dep_gate':dep_info.get('gate'),
            'dep_delay':dep_info.get('delay'),
            'arr_terminal':arr_info.get('terminal'),
            'arr_gate':arr_info.get('gate'),
            'arr_baggage':arr_info.get('baggage'),
            'arr_delay':arr_info.get('delay'),
            'from':dep,'to':arr,'date':d,
        })
    return out

@app.get('/api/config')
def public_config():
    return {'stripe_publishable_key': settings.active_stripe_publishable_key, 'stripe_mode': settings.stripe_mode}

@app.get('/api/flights')
async def flights(dep:str,arr:str,date:str,return_date:str|None=None):
    dep=dep.upper().strip(); arr=arr.upper().strip()
    if not dep or not arr or not date: raise HTTPException(400,'dep, arr and date are required')
    try: datetime.strptime(date,'%Y-%m-%d')
    except: raise HTTPException(400,'date must be YYYY-MM-DD')
    if return_date:
        try: datetime.strptime(return_date,'%Y-%m-%d')
        except: raise HTTPException(400,'return_date must be YYYY-MM-DD')
    today_dt=datetime.utcnow().date()
    req_date=datetime.strptime(date,'%Y-%m-%d').date()
    is_today=(req_date==today_dt)
    if not settings.aviationstack_api_key or not is_today:
        out=_build_demo_flights(DEMO_FLIGHTS_OUT,dep,arr,date)
        ret=_build_demo_flights(DEMO_FLIGHTS_RET,arr,dep,return_date) if return_date else []
        src='demo' if not settings.aviationstack_api_key else 'demo-date'
        return {'outbound':out,'return':ret,'source':src}
    BASE='http://api.aviationstack.com/v1'
    KEY=settings.aviationstack_api_key
    async with httpx.AsyncClient() as client:
        try:
            r=await client.get(f'{BASE}/flights',params={'access_key':KEY,'dep_iata':dep,'arr_iata':arr,'limit':20},timeout=15)
        except Exception: raise HTTPException(502,'Flight data unavailable')
        if r.status_code!=200:
            out=_build_demo_flights(DEMO_FLIGHTS_OUT,dep,arr,date)
            ret=_build_demo_flights(DEMO_FLIGHTS_RET,arr,dep,return_date) if return_date else []
            return {'outbound':out,'return':ret,'source':'demo'}
        out=_parse_live_flights(r.json().get('data',[]),dep,arr,date)
        ret=[]
        if return_date:
            try:
                r2=await client.get(f'{BASE}/flights',params={'access_key':KEY,'dep_iata':arr,'arr_iata':dep,'limit':20},timeout=15)
                if r2.status_code==200: ret=_parse_live_flights(r2.json().get('data',[]),arr,dep,return_date)
            except Exception: pass
    return {'outbound':out,'return':ret,'source':'live'}

@app.get('/api/cars')
async def cars(airport:str,pickup:str,dropoff:str):
    airport=airport.upper().strip()
    try:
        p=datetime.strptime(pickup,'%Y-%m-%d'); d=datetime.strptime(dropoff,'%Y-%m-%d')
    except: raise HTTPException(400,'pickup and dropoff must be YYYY-MM-DD')
    if d<=p: raise HTTPException(400,'dropoff must be after pickup')
    days=(d-p).days
    result=[{**c,'days':days,'total':c['price_per_day']*days,'airport':airport,'pickup':pickup,'dropoff':dropoff} for c in DEMO_CARS]
    return {'cars':result,'source':'demo'}

DEMO_LISTING={
    '_id':'demo-listing-1',
    'type':'SINGLE',
    'propertyType':'Condominium',
    'roomType':'Entire home/apt',
    'title':'Coastal Haven at Phoenix V — Gulf-Front 3BR Condo',
    'accommodates':10,
    'bedrooms':3,
    'bathrooms':2,
    'beds':4,
    'address':{'city':'Orange Beach','state':'Alabama','country':'United States','street':'Phoenix V','neighborhood':'Gulf Shores'},
    'amenities':['Air conditioning','Wireless Internet','Kitchen','Washer','Dryer','TV','Patio or balcony','Beach essentials','Outdoor pool','Hot tub','Gym','BBQ grill','Free parking on premises'],
    'prices':{'basePrice':300,'currency':'USD','cleaningFee':250,'extraPersonFee':25},
    'publicDescription':{'summary':'Gulf-front 3-bedroom condo on the 14th floor of Phoenix V in Orange Beach, Alabama. Oceanfront balcony, full kitchen, direct beach access.'},
    'reviews':{'avg':4.9,'total':47},
    'picture':{'original':'/images/balcony.jpg','thumbnail':'/images/balcony.jpg'},
}

@app.get('/api/listings')
async def get_listings(
    checkIn:str|None=None, checkOut:str|None=None,
    minOccupancy:int|None=None, numberOfBedrooms:int|None=None,
    numberOfBathrooms:int|None=None, limit:int=20,
    cursor:str|None=None
):
    if not settings.guesty_api_token:
        return {'results':[DEMO_LISTING],'pagination':{'total':1,'cursor':{'next':None}},'source':'demo'}
    headers={'authorization':settings.guesty_api_token,'accept':'application/json'}
    params:dict={k:v for k,v in {'checkIn':checkIn,'checkOut':checkOut,'minOccupancy':minOccupancy,
        'numberOfBedrooms':numberOfBedrooms,'numberOfBathrooms':numberOfBathrooms,
        'limit':min(limit,100),'cursor':cursor}.items() if v is not None}
    async with httpx.AsyncClient(timeout=15) as c:
        try:
            r=await c.get('https://booking.guesty.com/api/listings',headers=headers,params=params)
        except Exception: raise HTTPException(502,'Guesty listings unavailable')
        if r.status_code==401: raise HTTPException(401,'Invalid Guesty token')
        if r.status_code>=400: raise HTTPException(502,'Guesty listings unavailable')
        return {**r.json(),'source':'live'}

@app.get('/api/availability/blocked')
async def blocked_dates():
    from integrations import _parse_ical_date, _blocked_ranges
    url=settings.airbnb_ical_url
    if not url: return {'blocked':[],'source':'demo'}
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r=await c.get(url,follow_redirects=True)
        if r.status_code!=200: return {'blocked':[],'source':'error'}
        ranges=_blocked_ranges(r.text)
        today_dt=datetime.utcnow().date()
        result=[{'start':str(s),'end':str(e)} for s,e in ranges if e>today_dt]
        return {'blocked':result,'source':'airbnb'}
    except Exception:
        return {'blocked':[],'source':'error'}

def _build_calendar_ics(db: Session) -> str:
    bookings = db.query(BookingRequest).filter(
        BookingRequest.status.in_(['confirmed','payment_pending','pending_approval'])
    ).all()
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Coastal Haven//Direct Booking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Coastal Haven Direct Bookings',
        'X-WR-TIMEZONE:America/New_York',
    ]
    # Placeholder event — keeps the feed non-empty so OTA validators accept it on first import
    lines += [
        'BEGIN:VEVENT',
        'UID:setup@coastalhaven',
        'DTSTART;VALUE=DATE:20260101',
        'DTEND;VALUE=DATE:20260102',
        'SUMMARY:Coastal Haven - Calendar Active',
        'STATUS:CONFIRMED',
        'END:VEVENT',
    ]
    for b in bookings:
        try:
            ci = date.fromisoformat(b.checkin)
            co = date.fromisoformat(b.checkout)
        except Exception:
            continue
        uid = f'booking-{b.id}@coastalhaven'
        created = b.created_at.strftime('%Y%m%dT%H%M%SZ') if b.created_at else datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        lines += [
            'BEGIN:VEVENT',
            f'UID:{uid}',
            f'DTSTART;VALUE=DATE:{ci.strftime("%Y%m%d")}',
            f'DTEND;VALUE=DATE:{co.strftime("%Y%m%d")}',
            'SUMMARY:Coastal Haven - Reserved',
            f'DESCRIPTION:Direct booking ({b.guests} guests)',
            'STATUS:CONFIRMED',
            f'CREATED:{created}',
            'END:VEVENT',
        ]
    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines)

@app.get('/api/calendar.ics', response_class=PlainTextResponse)
def export_calendar(token:str=Query(''), db:Session=Depends(get_db)):
    if token != settings.calendar_token:
        raise HTTPException(403, 'Invalid calendar token')
    return PlainTextResponse(_build_calendar_ics(db), media_type='text/calendar; charset=utf-8')

# Clean path-based alias — no query params — compatible with VRBO, Booking.com, Airbnb
@app.get('/api/calendar/{token}.ics', response_class=PlainTextResponse)
def export_calendar_path(token:str, db:Session=Depends(get_db)):
    if token != settings.calendar_token:
        raise HTTPException(403, 'Invalid calendar token')
    return PlainTextResponse(_build_calendar_ics(db), media_type='text/calendar; charset=utf-8')

@app.get('/health')
def health(): return {'ok':True,'service':'coastal-haven-api'}

@app.get('/api/booking/quote')
async def quote(checkin:str,checkout:str,guests:int=4,db:Session=Depends(get_db)):
    try: ci=date.fromisoformat(checkin); co=date.fromisoformat(checkout)
    except: raise HTTPException(400,'Invalid dates')
    nights=(co-ci).days
    if nights<1: raise HTTPException(400,'Checkout must be after check-in')
    if guests<1 or guests>10: raise HTTPException(400,'Guest count must be 1–10')
    available,availability_source=await airbnb_available(checkin,checkout)
    cached=[p for p in db.query(DailyPrice).filter(DailyPrice.date>=checkin,DailyPrice.date<checkout).all()]
    if len(cached)==nights:
        nightly=sum(p.price for p in cached)/nights; pricing_source='PriceLabs (cached)'
    else:
        nightly,pricing_source=await pricelabs_nightly_rate(checkin,checkout)
    s=get_settings(db)
    disc_pct=s.direct_discount_percent/100
    gross=nightly*nights                          # Airbnb subtotal (nightly only)
    discount=gross*disc_pct                       # direct-booking saving
    subtotal=gross-discount                       # direct nightly subtotal
    taxable=subtotal+s.cleaning_fee
    taxes=taxable*(s.tax_percent/100)
    total=taxable+taxes
    security=round(total*0.20,2) if s.security_mode=='authorization' else 0
    # Airbnb comparison (same cleaning fee + taxes applied to their higher base)
    airbnb_taxable=gross+s.cleaning_fee
    airbnb_total_est=airbnb_taxable*(1+s.tax_percent/100)
    return {
        'available':available,'nights':nights,
        'airbnb_nightly':round(nightly,2),
        'airbnb_subtotal':round(gross,2),
        'airbnb_total_est':round(airbnb_total_est,2),
        'direct_nightly':round(nightly*(1-disc_pct),2),
        'nightly_rate':round(nightly*(1-disc_pct),2),
        'subtotal':round(subtotal,2),
        'cleaning_fee':s.cleaning_fee,
        'taxes':round(taxes,2),
        'security_deposit':security,
        'direct_discount':round(discount,2),
        'discount_percent':s.direct_discount_percent,
        'total':round(total,2),
        'currency':'USD',
        'booking_mode':'instant' if s.instant_booking else 'approval',
        'source':f'{pricing_source}; {availability_source}'
    }

def _make_customer_token(customer_id:int):
    return jwt.encode({'sub':f'customer:{customer_id}','exp':datetime.now(timezone.utc)+timedelta(days=30)},settings.jwt_secret,algorithm='HS256')

def _customer_id_from_token(authorization:str|None=Header(default=None)) -> int|None:
    if not authorization or not authorization.startswith('Bearer '): return None
    try:
        payload=jwt.decode(authorization.split(' ',1)[1],settings.jwt_secret,algorithms=['HS256'])
        sub=payload.get('sub','')
        if sub.startswith('customer:'): return int(sub.split(':')[1])
    except Exception: pass
    return None

def _require_customer(authorization:str|None=Header(default=None)) -> int:
    cid=_customer_id_from_token(authorization)
    if not cid: raise HTTPException(401,'Customer login required')
    return cid

@app.post('/api/customer/register')
def customer_register(payload:CustomerRegister,db:Session=Depends(get_db)):
    if db.query(Customer).filter(Customer.email==payload.email).first():
        raise HTTPException(409,'An account with this email already exists')
    c=Customer(name=payload.name,email=payload.email,phone=payload.phone,address=payload.address,password_hash=_pwd.hash(payload.password))
    db.add(c);db.commit();db.refresh(c)
    return {'token':_make_customer_token(c.id),'customer':{'id':c.id,'name':c.name,'email':c.email,'phone':c.phone,'address':c.address}}

@app.post('/api/customer/login')
def customer_login(payload:CustomerLogin,db:Session=Depends(get_db)):
    c=db.query(Customer).filter(Customer.email==payload.email).first()
    if not c or not _pwd.verify(payload.password,c.password_hash): raise HTTPException(401,'Invalid email or password')
    return {'token':_make_customer_token(c.id),'customer':{'id':c.id,'name':c.name,'email':c.email,'phone':c.phone,'address':c.address}}

@app.get('/api/customer/me')
def customer_me(cid:int=Depends(_require_customer),db:Session=Depends(get_db)):
    c=db.get(Customer,cid)
    if not c: raise HTTPException(404,'Customer not found')
    return {'id':c.id,'name':c.name,'email':c.email,'phone':c.phone,'address':c.address,'created_at':c.created_at.isoformat()}

@app.get('/api/customer/bookings')
def customer_bookings(cid:int=Depends(_require_customer),db:Session=Depends(get_db)):
    rows=db.query(BookingRequest).filter(BookingRequest.customer_id==cid).order_by(BookingRequest.created_at.desc()).all()
    return [{'id':b.id,'checkin':b.checkin,'checkout':b.checkout,'guests':b.guests,'total':b.total,'status':b.status,'created_at':b.created_at.isoformat()} for b in rows]

@app.post('/api/booking/checkout')
async def checkout(payload:BookingIn,db:Session=Depends(get_db),authorization:str|None=Header(default=None)):
    if not payload.email: raise HTTPException(400,'Email is required')
    if not payload.phone: raise HTTPException(400,'Phone number is required')
    if not payload.address: raise HTTPException(400,'Address is required')
    q=await quote(payload.checkin,payload.checkout,payload.guests,db)
    if not q['available']: raise HTTPException(409,'Dates are not available')
    s=get_settings(db)
    # Link to existing customer or create one if requested
    cid=_customer_id_from_token(authorization)
    if not cid and payload.create_account and payload.password:
        existing=db.query(Customer).filter(Customer.email==payload.email).first()
        if not existing:
            c=Customer(name=payload.guest_name,email=payload.email,phone=payload.phone,address=payload.address,password_hash=_pwd.hash(payload.password))
            db.add(c);db.commit();db.refresh(c);cid=c.id
        else:
            cid=existing.id
    booking=BookingRequest(checkin=payload.checkin,checkout=payload.checkout,guests=payload.guests,guest_name=payload.guest_name,email=payload.email,phone=payload.phone,address=payload.address,customer_id=cid,total=q['total'],status='payment_pending' if s.instant_booking else 'pending_approval')
    db.add(booking);db.commit();db.refresh(booking)
    if not s.instant_booking: return {'status':'pending_approval','booking_id':booking.id}
    if not settings.active_stripe_secret_key: raise HTTPException(503,'Stripe is not configured. Please contact us to complete your booking.')
    stripe.api_key=settings.active_stripe_secret_key
    success_url=settings.stripe_success_url+f'&booking_id={booking.id}'
    try:
        session=stripe.checkout.Session.create(
            mode='payment',
            line_items=[{'price_data':{'currency':'usd','product_data':{'name':'Coastal Haven — Orange Beach stay','description':f"{payload.checkin} to {payload.checkout}, {payload.guests} guests"},'unit_amount':max(50,round(q['total']*100))},'quantity':1}],
            customer_email=payload.email or None,
            success_url=success_url,
            cancel_url=settings.stripe_cancel_url,
            metadata={'booking_id':str(booking.id)}
        )
    except stripe.error.AuthenticationError:
        raise HTTPException(503,'Payment system configuration error. Please contact us to complete your booking.')
    except stripe.error.InvalidRequestError as e:
        print(f'Stripe InvalidRequestError booking {booking.id}: {e}')
        raise HTTPException(400,'Payment session could not be created. Please check your details and try again.')
    except stripe.error.StripeError as e:
        print(f'Stripe error booking {booking.id}: {e}')
        raise HTTPException(502,'Payment provider unavailable. Please try again in a moment.')
    return {'url':session.url,'booking_id':booking.id}

@app.get('/api/booking/{booking_id}')
def get_booking(booking_id:int,db:Session=Depends(get_db)):
    b=db.get(BookingRequest,booking_id)
    if not b: raise HTTPException(404,'Booking not found')
    # Send confirmation email on first view of success page (fallback if webhook not configured)
    if not b.email_sent and b.email and b.status in ('payment_pending','confirmed'):
        data={'id':b.id,'checkin':b.checkin,'checkout':b.checkout,'guests':b.guests,'guest_name':b.guest_name,'email':b.email,'phone':b.phone,'address':b.address,'total':b.total}
        sent=send_booking_confirmation(data)
        send_owner_notification(data)
        if sent:
            b.email_sent=True; db.commit()
    return {'id':b.id,'checkin':b.checkin,'checkout':b.checkout,'guests':b.guests,'guest_name':b.guest_name,'email':b.email,'phone':b.phone,'address':b.address,'total':b.total,'status':b.status,'created_at':b.created_at.isoformat()}

@app.post('/api/stripe/webhook')
async def stripe_webhook(request:Request,db:Session=Depends(get_db)):
    payload=await request.body()
    sig=request.headers.get('stripe-signature','')
    webhook_secret=settings.stripe_webhook_secret
    try:
        if webhook_secret:
            event=stripe.Webhook.construct_event(payload,sig,webhook_secret)
        else:
            import json; event=json.loads(payload)
    except Exception as e:
        raise HTTPException(400,str(e))
    if event['type']=='checkout.session.completed':
        session=event['data']['object']
        bid=int(session.get('metadata',{}).get('booking_id',0))
        if bid:
            b=db.get(BookingRequest,bid)
            if b:
                b.status='confirmed'; db.commit(); db.refresh(b)
                if not b.email_sent and b.email:
                    data={'id':b.id,'checkin':b.checkin,'checkout':b.checkout,'guests':b.guests,'guest_name':b.guest_name,'email':b.email,'phone':b.phone,'address':b.address,'total':b.total}
                    sent=send_booking_confirmation(data)
                    send_owner_notification(data)
                    if sent: b.email_sent=True; db.commit()
    return {'ok':True}

@app.post('/api/chat/messages')
def chat(payload:ChatIn,db:Session=Depends(get_db)):
    m=ChatMessage(name=payload.name,email=payload.email,message=payload.message);db.add(m);db.commit();return {'ok':True}

@app.post('/api/admin/login')
def login(payload:AdminLogin):
    if payload.username!=settings.admin_username or payload.password!=settings.admin_password: raise HTTPException(401,'Invalid credentials')
    return {'token':make_token()}

@app.get('/api/admin/settings',response_model=SettingsSchema)
def admin_settings(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    s=get_settings(db);return SettingsSchema.model_validate(s,from_attributes=True)

@app.put('/api/admin/settings',response_model=SettingsSchema)
def update_settings(payload:SettingsSchema,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    s=get_settings(db)
    for k,v in payload.model_dump().items(): setattr(s,k,v)
    db.commit();db.refresh(s);return SettingsSchema.model_validate(s,from_attributes=True)

@app.post('/api/admin/test-email')
def admin_test_email(_:None=Depends(require_admin)):
    import smtplib, ssl as _ssl
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText as _MIMEText
    cfg = {'smtp_host':settings.smtp_host,'smtp_port':settings.smtp_port,'smtp_user':settings.smtp_user,'smtp_password_set':bool(settings.smtp_password),'from_email':settings.from_email}
    if not settings.smtp_user or not settings.smtp_password:
        raise HTTPException(400, f'SMTP not configured. Current config: {cfg}')
    try:
        html = preview_booking_confirmation()
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '✓ Test Email — Coastal Haven Templates Working!'
        msg['From'] = f'Coastal Haven <{settings.from_email or settings.smtp_user}>'
        msg['To'] = settings.smtp_user
        msg.attach(_MIMEText('Test email from Coastal Haven. Your beautiful templates are working!', 'plain'))
        msg.attach(_MIMEText(html, 'html'))
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=_ssl.create_default_context()) as s:
                s.login(settings.smtp_user, settings.smtp_password)
                s.sendmail(settings.smtp_user, settings.smtp_user, msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
                s.ehlo(); s.starttls(); s.login(settings.smtp_user, settings.smtp_password)
                s.sendmail(settings.smtp_user, settings.smtp_user, msg.as_string())
        return {'ok': True, 'message': f'Sent beautiful template to {settings.smtp_user}', 'config': cfg}
    except Exception as e:
        raise HTTPException(500, f'SMTP error: {type(e).__name__}: {e} | Config: {cfg}')

from fastapi.responses import HTMLResponse

def _require_admin_flex(authorization:str|None=Header(default=None), token:str|None=Query(default=None)):
    raw = None
    if authorization and authorization.startswith('Bearer '): raw = authorization.split(' ',1)[1]
    elif token: raw = token
    if not raw: raise HTTPException(401,'Admin login required')
    try:
        p = jwt.decode(raw, settings.jwt_secret, algorithms=['HS256'])
        if p.get('sub') != 'admin': raise HTTPException(401,'Admin access required')
    except JWTError: raise HTTPException(401,'Invalid or expired token')

@app.get('/api/admin/preview-email/{template}', response_class=HTMLResponse)
def preview_email(template:str, _:None=Depends(_require_admin_flex)):
    templates = {
        'booking': preview_booking_confirmation,
        'pre-arrival': preview_pre_arrival,
        'checkout': preview_checkout_reminder,
        'review': preview_review_request,
    }
    fn = templates.get(template)
    if not fn: raise HTTPException(404, f'Unknown template: {template}. Options: {list(templates.keys())}')
    return HTMLResponse(content=fn())

@app.get('/api/admin/chat')
def admin_chat(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(100).all();return [{'id':r.id,'name':r.name,'email':r.email,'message':r.message,'created_at':r.created_at.isoformat()} for r in rows]

@app.get('/api/admin/bookings')
def admin_bookings(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(BookingRequest).order_by(BookingRequest.created_at.desc()).all()
    return [{'id':b.id,'checkin':b.checkin,'checkout':b.checkout,'guests':b.guests,'guest_name':b.guest_name,'email':b.email,'phone':b.phone,'address':b.address,'customer_id':b.customer_id,'total':b.total,'status':b.status,'created_at':b.created_at.isoformat()} for b in rows]

@app.get('/api/admin/customers')
def admin_customers(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(Customer).order_by(Customer.created_at.desc()).all()
    return [{'id':c.id,'name':c.name,'email':c.email,'phone':c.phone,'address':c.address,'created_at':c.created_at.isoformat()} for c in rows]

@app.get('/api/admin/analytics')
def admin_analytics(_:None=Depends(require_admin),days:int=30):
    return _analytics.aggregate(days)

class AnalyticsEventIn(BaseModel):
    event:str; path:str=''; referrer:str=''; props:dict={}

@app.post('/api/analytics/event')
async def track_event(payload:AnalyticsEventIn,request:Request):
    ip=(request.headers.get('x-forwarded-for') or (request.client.host if request.client else '127.0.0.1')).split(',')[0].strip()
    ua=request.headers.get('user-agent','')
    sid=request.headers.get('x-session-id','')
    asyncio.create_task(_analytics.log_event(payload.event,ip,ua,payload.referrer,payload.path,sid,payload.props))
    return {'ok':True}

_PROPERTY_CONTEXT="""You are Cove, the friendly AI concierge for Coastal Haven — Unit 1408 at Phoenix V, a luxury Gulf-front condo on the 14th floor in Orange Beach, Alabama.

Property facts:
- Unit: 1408, 14th floor, Phoenix V
- Address: 24400 Perdido Beach Blvd, Orange Beach, AL 36561
- 3 bedrooms, 2 bathrooms, sleeps up to 10 guests
- Primary suite: king bed, Gulf-front balcony access | 2nd bedroom: 2 queens | 3rd bedroom: twin bunks
- Direct Gulf of Mexico views, private balcony with unobstructed water view
- Full kitchen, in-unit washer/dryer, high-speed WiFi
- Resort amenities: heated pool, hot tub, fitness center, sauna, tennis, beach access, covered parking
- Check-in: 4:00 PM | Check-out: 10:00 AM
- Parking: $55/vehicle, max 2 vehicles
- Cleaning fee: $220 | Taxes: 15%
- No smoking, no pets, no parties — primary renter must be 25+
- Book direct and save ~10% vs Airbnb

Local area:
- Nearest airport: Pensacola International (PNS) ~45 min drive
- Also: Destin/Ft Walton (VPS) ~1 hr, Mobile (MOB) ~1 hr
- Gulf State Park: 2 miles east (bike trails, nature center, pier)
- Popular restaurants: LuLu's (family-friendly), The Gulf (seafood), Cobalt (upscale), Ginny Lane
- Activities: dolphin cruises, deep-sea fishing, parasailing, kayaking, paddleboarding
- Shopping: The Wharf (entertainment/dining complex), Tanger Outlets
- Flora-Bama Lounge: 5 miles west, legendary Gulf Coast landmark

Rules:
- Be warm, concise, and helpful — like a knowledgeable friend who knows the property
- Always refer to the unit as "Unit 1408" or "Coastal Haven" — never a generic name
- For exact pricing/availability, direct guests to use the booking tool on the site
- Don't make up specific prices or availability — say to check the booking page
- Keep replies under 150 words unless a detailed answer is genuinely needed"""

_PAGE_CONTEXTS={
    '/':' The guest is on the home page viewing the property overview.',
    '/book':' The guest is on the booking page — help with dates, pricing, and availability for Unit 1408.',
    '/availability':' The guest is checking availability for Unit 1408.',
    '/flights':' The guest is on the flights page. Nearest airports: PNS (Pensacola, 45 min), VPS (Destin, 1 hr), MOB (Mobile, 1 hr).',
    '/gallery':' The guest is viewing the photo gallery — describe the Gulf-front balcony, primary suite, open living room, and full kitchen of Unit 1408.',
    '/amenities':' The guest is on the amenities page — cover pool, hot tub, gym, beach access, parking, full kitchen, washer/dryer, sauna, tennis.',
    '/faq':' The guest is reading the FAQ — answer questions about check-in (4 PM), checkout (10 AM), pets (not allowed), parking ($55/vehicle), min age (25).',
    '/reviews':' The guest is reading reviews — highlight the 4.9-star rating and common guest praise about views and cleanliness.',
    '/about':' The guest is on the about page learning about Coastal Haven and why to book direct vs Airbnb.',
    '/contact':' The guest is on the contact page — encourage them to reach out via the form.',
    '/cancellation-policy':' Full refund more than 30 days out, 50% refund up to 14 days, non-refundable within 14 days.',
    '/house-rules':' No smoking, no pets, no parties, quiet hours 10 PM–8 AM, primary renter must be 25+.',
}

class AIChatIn(BaseModel):
    messages:list[dict]
    page:str=''

class TTSIn(BaseModel):
    text:str

# ── Local Guide ─────────────────────────────────────────────────────────
import json as _json
from datetime import date as _date

_GUIDE_CACHE: dict = {'date': None, 'data': None}

_GUIDE_FALLBACK = {
    'date_note': 'Gulf Coast fun year-round',
    'event': {
        'title': 'Flora-Bama Live Music Weekend',
        'description': 'The legendary Flora-Bama roadhouse on the Alabama-Florida line runs live music every Friday and Saturday night. One of the most iconic Gulf Coast experiences — catch a set before or after dinner.',
        'type': 'weekly'
    },
    'restaurants': [
        {'name': "GT's On The Bay", 'type': 'Seafood', 'vibe': 'Waterfront dockside', 'must_try': 'Gulf shrimp basket', 'note': 'Right on the water — great for lunch or a casual sunset dinner.'},
        {'name': "Luna's Eat & Drink", 'type': 'Gulf Coast fusion', 'vibe': 'Upscale casual', 'must_try': 'Gulf fish tacos or the craft cocktail menu', 'note': 'One of Orange Beach\'s most celebrated dining spots. Reservations recommended.'},
        {'name': 'Cobalt', 'type': 'Fine dining', 'vibe': 'Elegant, Gulf views', 'must_try': 'Fresh grouper or the Gulf Coast sampler', 'note': 'Special-occasion dining with stunning waterfront views. Book ahead.'},
        {'name': "Tacky Jack's", 'type': 'Bar & Grill', 'vibe': 'Laid-back waterfront', 'must_try': 'Fish tacos and frozen drinks', 'note': 'Perfect for a low-key lunch or watching boats from the deck.'},
        {'name': "Voyagers at Perdido Beach Resort", 'type': 'Resort dining', 'vibe': 'Beachfront, upscale', 'must_try': 'Catch of the day — sourced fresh daily', 'note': 'Stunning Gulf views from every table. Best at sunset.'},
        {'name': "Doc's Seafood Shack & Oyster Bar", 'type': 'Seafood', 'vibe': 'Old-school local', 'must_try': 'Fresh oysters and fried shrimp platter', 'note': 'A Gulf Shores institution since 1956. Casual, cheap, and delicious.'},
        {'name': "Fisher's at Orange Beach Marina", 'type': 'Upscale seafood', 'vibe': 'Marina-side, refined', 'must_try': 'Seared grouper or crab-stuffed flounder', 'note': 'Consistently ranked among the best fine dining on the Gulf Coast.'},
        {'name': "The Ugly Grouper", 'type': 'Seafood bar', 'vibe': 'Casual, fun', 'must_try': 'Ugly Burger or Gulf fish sandwich', 'note': 'Beachside spot with great food, cold beer, and no pretension.'},
        {'name': "LuLu's Gulf Shores", 'type': 'Family waterfront', 'vibe': 'Festive, all-ages', 'must_try': 'Cheeseburger in Paradise or seafood platter', 'note': "Jimmy Buffett's sister's restaurant — lively, fun, and perfect for families."},
        {'name': "Zekes Landing", 'type': 'Marina grill', 'vibe': 'Local hangout', 'must_try': 'Grilled snapper or shrimp po-boy', 'note': 'Where local fishermen eat — fresh, honest, and affordable.'},
    ],
    'activities': [
        {'title': 'Dolphin Cruise', 'duration': '2 hrs', 'tip': 'Book morning departures (9–11 AM) for calmer water and higher sighting rates.', 'note': 'Cetacean Cruises and Lost Bay Dolphin Tours both depart near the Orange Beach Marina.'},
        {'title': 'Gulf State Park', 'duration': 'Half or full day', 'tip': 'Rent bikes at the park entrance — the 28-mile paved trail runs right to the beach.', 'note': 'Also has a nature center with live sea turtles, kayak rentals, and back-bay launches.'},
        {'title': 'The Wharf', 'duration': '2–4 hrs', 'tip': 'Visit evenings when the SkyWheel lights up and the amphitheater has live music.', 'note': '112-foot Ferris wheel, waterfront dining, shops, and a marina — walkable entertainment hub.'},
        {'title': 'Deep-Sea Fishing Charter', 'duration': '4–8 hrs', 'tip': 'Half-day charters are great for families; full-day for serious anglers targeting snapper and grouper.', 'note': 'Orange Beach Marina has dozens of licensed charter boats. Book 24–48 hours ahead.'},
        {'title': 'Kayak & Paddleboard the Back Bays', 'duration': '2–3 hrs', 'tip': 'Early morning is glassy-calm. Wolf Bay and Terry Cove are excellent for beginners.', 'note': 'Rentals available at Adventure Island and several waterfront shops.'},
        {'title': 'Snorkeling at Perdido Pass', 'duration': '2–3 hrs', 'tip': 'Take a boat tour out to nearshore reefs — visibility is best June through September.', 'note': 'Several local outfitters offer guided snorkel trips with gear included.'},
        {'title': 'Jet Ski & Pontoon Rentals', 'duration': 'Hourly', 'tip': 'Pontoon boats are perfect for a family sunset cruise on the Intracoastal Waterway.', 'note': 'Coastal Watersports and Liquid Life Watersports are close to Phoenix V.'},
        {'title': 'Flora-Bama Live Music', 'duration': 'Evening', 'tip': 'Arrive early for a waterfront table. The Mullet Toss every April is a bucket-list event.', 'note': 'A legendary roadhouse right on the Alabama-Florida state line. Multiple stages, cold beer, real characters.'},
        {'title': 'Sunset Sailboat Cruise', 'duration': '2 hrs', 'tip': 'Several operators depart from the Orange Beach Marina around 5–6 PM. Cash bar on board.', 'note': 'A Gulf Coast rite of passage. The light on the water at golden hour is genuinely special.'},
        {'title': 'Orange Beach Indian & Sea Museum', 'duration': '1–2 hrs', 'tip': 'Great rainy-day option and surprisingly fascinating for both kids and adults.', 'note': 'Covers local Native American history and the Gulf Coast fishing and maritime heritage.'},
    ],
    'highlights': [
        {'title': 'Check-in at 4 PM sharp', 'note': 'Plan your grocery run for right after check-in. Publix on Canal Road (~10 min drive) is the go-to. Walmart is nearby for bulk and supplies.'},
        {'title': 'Parking is $55 per vehicle', 'note': 'Phoenix V limits guests to 2 vehicles. The parking pass is managed through the HOA — details in your booking confirmation.'},
        {'title': 'Best sunrise spot', 'note': 'Your 14th-floor balcony faces the Gulf. Sunrises are spectacular — set an alarm once at least.'},
        {'title': 'Beach chair rentals', 'note': 'Chairs and umbrellas can be rented at the base of Phoenix V. Rates vary by season. First-come basis early in the day.'},
        {'title': 'Book tours 24–48 hours ahead', 'note': 'Dolphin cruises, fishing charters, and snorkel tours fill fast in summer. Walk-up availability is rare June–August.'},
        {'title': 'Gulf State Park trail', 'note': '28 miles of paved, flat trails — excellent for cycling with kids. Bike rentals available at the park. No car needed once you\'re on a bike.'},
        {'title': 'Flora-Bama is 10 minutes east', 'note': 'One of the most unique bars in America, sitting literally on the state line. Worth a visit any time of year for the vibe alone.'},
        {'title': 'No fishing license for shore/pier fishing', 'note': 'Alabama does not require a license for saltwater fishing from the shore, a pier, or a private vessel. Charter boats handle licensing for passengers.'},
        {'title': 'Grocery delivery available', 'note': 'Instacart and Shipt both deliver to Phoenix V. Pre-order groceries to arrive an hour after check-in so the fridge is stocked.'},
        {'title': 'Gulf Shores vs Orange Beach', 'note': 'Gulf Shores is 15 minutes west and has Waterville water park, more family attractions, and Gulf Place shopping. Orange Beach is quieter and more marina-focused.'},
    ]
}

_GUIDE_PROMPT = """You are a local expert for Orange Beach, Alabama and the Alabama Gulf Coast.

Today is {weekday}, {month_day}, {year} (season: {season}).

Generate a comprehensive daily local guide for guests at Coastal Haven — a Gulf-front condo at Phoenix V, 14th floor, Orange Beach, AL.

Use REAL Orange Beach and Gulf Shores venues only. Be specific, brief, and genuinely helpful. Content should feel appropriate for the current season.

Return ONLY valid JSON — no markdown, no extra text. The JSON must match this structure exactly:
{{
  "date_note": "Short phrase for current season vibe (e.g. 'Peak summer — book everything ahead')",
  "event": {{
    "title": "One seasonal event or local happening right now",
    "description": "2 sentences on what it is and why guests should go",
    "type": "festival|market|concert|sport|seasonal|weekly"
  }},
  "restaurants": [
    {{"name": "...", "type": "cuisine type", "vibe": "atmosphere in 3 words", "must_try": "specific dish", "note": "1 sentence"}}
  ],
  "activities": [
    {{"title": "...", "duration": "time estimate", "tip": "1 practical tip", "note": "1 sentence context"}}
  ],
  "highlights": [
    {{"title": "short title", "note": "1–2 sentences of actionable info"}}
  ]
}}

Rules:
- restaurants: exactly 10 items. Mix seafood, casual, upscale, family-friendly. Include GT's On The Bay, Luna's, Cobalt, Tacky Jack's, Fisher's, Doc's, LuLu's, The Ugly Grouper, Voyagers, and one seasonal pick.
- activities: exactly 10 items. Include dolphin cruises, Gulf State Park, The Wharf, fishing, watersports, Flora-Bama, and others relevant to {season}.
- highlights: exactly 10 items. Practical guest tips: parking, check-in, booking ahead, grocery, beach access, local knowledge."""

def _get_season(m: int) -> str:
    if m in (12, 1, 2): return 'winter'
    if m in (3, 4, 5):  return 'spring'
    if m in (6, 7, 8):  return 'summer (peak season)'
    return 'fall'

@app.get('/api/local-guide')
async def local_guide():
    today = _date.today()
    if _GUIDE_CACHE['date'] == today and _GUIDE_CACHE['data']:
        return _GUIDE_CACHE['data']

    if not settings.openai_api_key:
        return _GUIDE_FALLBACK

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        prompt = _GUIDE_PROMPT.format(
            weekday=today.strftime('%A'),
            month_day=f"{today.strftime('%B')} {today.day}",
            year=today.year,
            season=_get_season(today.month),
        )
        resp = await client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=2000,
            temperature=0.7,
            response_format={'type': 'json_object'},
        )
        data = _json.loads(resp.choices[0].message.content)
        _GUIDE_CACHE['date'] = today
        _GUIDE_CACHE['data'] = data
        return data
    except Exception:
        return _GUIDE_FALLBACK

# ────────────────────────────────────────────────────────────────────────

@app.post('/api/tts')
async def text_to_speech(payload:TTSIn):
    if not settings.openai_api_key:
        raise HTTPException(status_code=503,detail='TTS not configured')
    clean=payload.text[:600]
    try:
        from openai import AsyncOpenAI
        from fastapi.responses import Response as _Resp
        client=AsyncOpenAI(api_key=settings.openai_api_key)
        resp=await client.audio.speech.create(
            model='tts-1-hd',  # highest quality — noticeably more natural
            voice='nova',      # female, warm, conversational
            input=clean,
            speed=0.92,
        )
        return _Resp(content=resp.content,media_type='audio/mpeg')
    except Exception as e:
        raise HTTPException(status_code=500,detail='TTS failed')

@app.post('/api/chat/ai')
async def ai_chat(payload:AIChatIn):
    if not settings.openai_api_key:
        return {'reply':"Hi! I'm Cove, your concierge for Unit 1408 at Phoenix V. Our AI chat is finishing setup — use the contact form and we'll reply quickly!"}
    page_note=_PAGE_CONTEXTS.get(payload.page,'')
    system=_PROPERTY_CONTEXT+(('\n\nCurrent context:'+page_note) if page_note else '')
    try:
        from openai import AsyncOpenAI
        client=AsyncOpenAI(api_key=settings.openai_api_key)
        resp=await client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role':'system','content':system}]+payload.messages[-12:],
            max_tokens=350,temperature=0.7
        )
        return {'reply':resp.choices[0].message.content}
    except Exception as e:
        return {'reply':"Sorry, I'm having a wave of trouble right now. Please use the contact form and we'll reply shortly!"}

# ── PMS ─────────────────────────────────────────────────────────────────────
_pms_last_synced: str | None = None

def _consolidate_daily_blocks(events: list[dict]) -> list[dict]:
    """Merge consecutive 1-day blocks (common VRBO iCal format) into multi-night stays."""
    if not events: return events
    # Sort by checkin
    evs = sorted([e for e in events if e.get('checkin') and e.get('checkout')], key=lambda e: e['checkin'])
    merged: list[dict] = []
    for ev in evs:
        try:
            ci = date.fromisoformat(ev['checkin']); co = date.fromisoformat(ev['checkout'])
        except: merged.append(ev); continue
        if (co - ci).days != 1:  # not a daily block — keep as-is
            merged.append(ev); continue
        if merged:
            last = merged[-1]
            try: last_co = date.fromisoformat(last['checkout'])
            except: merged.append(ev); continue
            # If this block starts where the last ended, extend it
            if last_co == ci:
                last['checkout'] = ev['checkout']
                last['uid'] = last['uid']  # keep original uid of the merged block
                if not last.get('raw_description') and ev.get('raw_description'):
                    last['raw_description'] = ev['raw_description']
                continue
        merged.append(dict(ev))
    return merged

async def _do_pms_sync(db: Session) -> int:
    global _pms_last_synced
    platforms = [
        ('airbnb', settings.airbnb_ical_url),
        ('vrbo',   settings.vrbo_ical_url),
        ('booking',settings.booking_ical_url),
    ]
    total_new = 0
    today = date.today()
    for platform, url in platforms:
        if not url: continue
        raw_events = await sync_platform_ical(platform, url)
        events = _consolidate_daily_blocks(raw_events)
        for ev in events:
            uid = ev.get('uid')
            if not uid: continue
            scoped = f'{platform}:{uid}'
            ci, co = ev.get('checkin',''), ev.get('checkout','')
            if not ci or not co: continue
            try:
                if date.fromisoformat(co) < today: continue
            except: continue
            name = _extract_guest_name(ev.get('summary',''), ev.get('raw_description',''))
            existing = db.query(IcalReservation).filter(IcalReservation.uid==scoped).first()
            if existing:
                existing.checkin=ci; existing.checkout=co; existing.guest_name=name
                existing.summary=ev.get('summary',''); existing.raw_description=ev.get('raw_description','')
                existing.synced_at=datetime.utcnow()
            else:
                db.add(IcalReservation(uid=scoped,platform=platform,checkin=ci,checkout=co,
                    guest_name=name,summary=ev.get('summary',''),raw_description=ev.get('raw_description','')))
                total_new+=1
        db.commit()
    _pms_last_synced = datetime.utcnow().isoformat()
    if total_new>0 and settings.caretaker_email:
        try:
            from email_service import _send
            _send(settings.caretaker_email,
                f'Coastal Haven: {total_new} new reservation{"s" if total_new>1 else ""}',
                f'<p>{total_new} new reservation(s) added. <a href="{settings.frontend_url}/caretaker">View in caretaker portal</a>.</p>',
                f'{total_new} new reservation(s). Visit {settings.frontend_url}/caretaker')
        except: pass
    return total_new

@app.post('/api/pms/sync')
async def pms_sync(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    n=await _do_pms_sync(db)
    return {'ok':True,'new_reservations':n,'synced_at':_pms_last_synced}

@app.get('/api/pms/reservations')
def pms_reservations(_:None=Depends(require_admin),db:Session=Depends(get_db),all:bool=False):
    today_s=date.today().isoformat()
    ota_q=db.query(IcalReservation)
    direct_q=db.query(BookingRequest).filter(BookingRequest.status.in_(['confirmed','payment_pending','pending_approval']))
    if not all:
        ota_q=ota_q.filter(IcalReservation.checkout>=today_s)
        direct_q=direct_q.filter(BookingRequest.checkout>=today_s)
    ota=ota_q.order_by(IcalReservation.checkin).all()
    direct=direct_q.order_by(BookingRequest.checkin).all()
    base=settings.frontend_url.rstrip('/')
    return {
        'ota':[{'id':r.id,'uid':r.uid,'platform':r.platform,'checkin':r.checkin,'checkout':r.checkout,
                'guest_name':r.guest_name,'summary':r.summary,'raw_description':r.raw_description,
                'notes':r.notes,'is_new':r.is_new,'synced_at':r.synced_at.isoformat() if r.synced_at else None} for r in ota],
        'direct':[{'id':b.id,'checkin':b.checkin,'checkout':b.checkout,'guests':b.guests,'guest_name':b.guest_name,
                   'email':b.email,'phone':b.phone,'total':b.total,'status':b.status,'created_at':b.created_at.isoformat()} for b in direct],
        'last_synced':_pms_last_synced,
        'calendar_url':f'{base}/api/calendar.ics?token={settings.calendar_token}',
    }

class _NotesIn(BaseModel): notes:str

@app.put('/api/pms/reservations/{res_id}/notes')
def pms_notes(res_id:int,payload:_NotesIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    r=db.get(IcalReservation,res_id)
    if not r: raise HTTPException(404,'Not found')
    r.notes=payload.notes; db.commit()
    return {'ok':True}

# ── Caretaker auth ───────────────────────────────────────────────────────────
class _CaretakerLogin(BaseModel): username:str; password:str

def _make_caretaker_token():
    return jwt.encode({'sub':'caretaker','exp':datetime.now(timezone.utc)+timedelta(days=7)},settings.jwt_secret,algorithm='HS256')

def _require_caretaker(authorization:str|None=Header(default=None)):
    if not authorization or not authorization.startswith('Bearer '): raise HTTPException(401,'Caretaker login required')
    try:
        p=jwt.decode(authorization.split(' ',1)[1],settings.jwt_secret,algorithms=['HS256'])
        if p.get('sub')!='caretaker': raise HTTPException(401,'Not a caretaker token')
    except JWTError: raise HTTPException(401,'Invalid or expired token')

@app.post('/api/caretaker/login')
def caretaker_login(payload:_CaretakerLogin):
    if payload.username!=settings.caretaker_username or payload.password!=settings.caretaker_password:
        raise HTTPException(401,'Invalid credentials')
    return {'token':_make_caretaker_token()}

@app.get('/api/caretaker/reservations')
def caretaker_reservations(_:None=Depends(_require_caretaker),db:Session=Depends(get_db)):
    today_s=date.today().isoformat()
    cutoff=(datetime.utcnow()-timedelta(hours=48))
    ota=db.query(IcalReservation).filter(IcalReservation.checkout>=today_s).order_by(IcalReservation.checkin).all()
    direct=db.query(BookingRequest).filter(BookingRequest.checkout>=today_s,BookingRequest.status.in_(['confirmed','payment_pending','pending_approval'])).order_by(BookingRequest.checkin).all()
    result=[]
    for r in ota:
        try: n=(date.fromisoformat(r.checkout)-date.fromisoformat(r.checkin)).days
        except: n=0
        result.append({'key':f'ota-{r.id}','platform':r.platform,'checkin':r.checkin,'checkout':r.checkout,
                       'guest_name':r.guest_name or 'Guest','nights':n,'is_new':r.is_new})
    for b in direct:
        try: n=(date.fromisoformat(b.checkout)-date.fromisoformat(b.checkin)).days
        except: n=0
        is_new=(b.created_at>cutoff)
        result.append({'key':f'direct-{b.id}','platform':'direct','checkin':b.checkin,'checkout':b.checkout,
                       'guest_name':b.guest_name or 'Guest','nights':n,'is_new':is_new})
    result.sort(key=lambda x:x['checkin'])
    return result

@app.post('/api/caretaker/seen')
def caretaker_seen(_:None=Depends(_require_caretaker),db:Session=Depends(get_db)):
    db.query(IcalReservation).filter(IcalReservation.is_new==True).update({'is_new':False})
    db.commit(); return {'ok':True}

# Serve React SPA in production
from pathlib import Path as _Path
# ── Tasks ──────────────────────────────────────────────────────────────────
class _TaskIn(BaseModel):
    title:str; category:str='cleaning'; priority:str='normal'; assigned_to:str=''; notes:str=''; due_date:str=''; status:str='pending'

@app.get('/api/admin/tasks')
def get_tasks(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(Task).order_by(Task.created_at.desc()).all()
    return [{'id':t.id,'title':t.title,'category':t.category,'status':t.status,'priority':t.priority,'assigned_to':t.assigned_to,'notes':t.notes,'due_date':t.due_date,'created_at':t.created_at.isoformat(),'completed_at':t.completed_at.isoformat() if t.completed_at else None} for t in rows]

@app.post('/api/admin/tasks')
def create_task(p:_TaskIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    t=Task(title=p.title,category=p.category,priority=p.priority,assigned_to=p.assigned_to,notes=p.notes,due_date=p.due_date,status=p.status)
    db.add(t);db.commit();db.refresh(t)
    return {'id':t.id,'title':t.title,'category':t.category,'status':t.status,'priority':t.priority,'assigned_to':t.assigned_to,'notes':t.notes,'due_date':t.due_date,'created_at':t.created_at.isoformat(),'completed_at':None}

@app.put('/api/admin/tasks/{tid}')
def update_task(tid:int,p:_TaskIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    t=db.get(Task,tid)
    if not t: raise HTTPException(404)
    for k,v in p.model_dump().items(): setattr(t,k,v)
    if p.status=='done' and not t.completed_at: t.completed_at=datetime.utcnow()
    elif p.status!='done': t.completed_at=None
    db.commit()
    return {'ok':True}

@app.delete('/api/admin/tasks/{tid}')
def delete_task(tid:int,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    t=db.get(Task,tid);db.delete(t);db.commit();return {'ok':True}

# ── Expenses ────────────────────────────────────────────────────────────────
class _ExpenseIn(BaseModel):
    date:str; category:str; description:str; amount:float

@app.get('/api/admin/expenses')
def get_expenses(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(Expense).order_by(Expense.date.desc()).all()
    return [{'id':e.id,'date':e.date,'category':e.category,'description':e.description,'amount':e.amount,'created_at':e.created_at.isoformat()} for e in rows]

@app.post('/api/admin/expenses')
def create_expense(p:_ExpenseIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    e=Expense(date=p.date,category=p.category,description=p.description,amount=p.amount)
    db.add(e);db.commit();db.refresh(e)
    return {'id':e.id,'date':e.date,'category':e.category,'description':e.description,'amount':e.amount,'created_at':e.created_at.isoformat()}

@app.delete('/api/admin/expenses/{eid}')
def delete_expense(eid:int,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    e=db.get(Expense,eid);db.delete(e);db.commit();return {'ok':True}

# ── Reviews ────────────────────────────────────────────────────────────────
class _ReviewIn(BaseModel):
    platform:str; guest_name:str=''; rating:float; review_text:str=''; review_date:str; response:str=''

@app.get('/api/admin/reviews')
def get_reviews(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(GuestReview).order_by(GuestReview.review_date.desc()).all()
    return [{'id':r.id,'platform':r.platform,'guest_name':r.guest_name,'rating':r.rating,'review_text':r.review_text,'response':r.response,'review_date':r.review_date,'created_at':r.created_at.isoformat()} for r in rows]

@app.post('/api/admin/reviews')
def create_review(p:_ReviewIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    r=GuestReview(platform=p.platform,guest_name=p.guest_name,rating=p.rating,review_text=p.review_text,review_date=p.review_date,response=p.response)
    db.add(r);db.commit();db.refresh(r)
    return {'id':r.id,'platform':r.platform,'guest_name':r.guest_name,'rating':r.rating,'review_text':r.review_text,'response':r.response,'review_date':r.review_date,'created_at':r.created_at.isoformat()}

@app.put('/api/admin/reviews/{rid}')
def update_review(rid:int,p:_ReviewIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    r=db.get(GuestReview,rid)
    if not r: raise HTTPException(404)
    for k,v in p.model_dump().items(): setattr(r,k,v)
    db.commit();return {'ok':True}

@app.delete('/api/admin/reviews/{rid}')
def delete_review(rid:int,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    r=db.get(GuestReview,rid);db.delete(r);db.commit();return {'ok':True}

# ── Auto-messages ───────────────────────────────────────────────────────────
class _AMsgIn(BaseModel):
    name:str; trigger:str; send_hours:int=0; subject:str=''; body:str; enabled:bool=True

@app.get('/api/admin/automessages')
def get_automessages(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(AutoMessage).order_by(AutoMessage.created_at).all()
    return [{'id':m.id,'name':m.name,'trigger':m.trigger,'send_hours':m.send_hours,'subject':m.subject,'body':m.body,'enabled':m.enabled,'created_at':m.created_at.isoformat()} for m in rows]

@app.post('/api/admin/automessages')
def create_automessage(p:_AMsgIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    m=AutoMessage(name=p.name,trigger=p.trigger,send_hours=p.send_hours,subject=p.subject,body=p.body,enabled=p.enabled)
    db.add(m);db.commit();db.refresh(m)
    return {'id':m.id,'name':m.name,'trigger':m.trigger,'send_hours':m.send_hours,'subject':m.subject,'body':m.body,'enabled':m.enabled,'created_at':m.created_at.isoformat()}

@app.put('/api/admin/automessages/{mid}')
def update_automessage(mid:int,p:_AMsgIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    m=db.get(AutoMessage,mid)
    if not m: raise HTTPException(404)
    for k,v in p.model_dump().items(): setattr(m,k,v)
    db.commit();return {'ok':True}

@app.delete('/api/admin/automessages/{mid}')
def delete_automessage(mid:int,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    m=db.get(AutoMessage,mid);db.delete(m);db.commit();return {'ok':True}

# ── Property Info ───────────────────────────────────────────────────────────
class _PropIn(BaseModel):
    wifi_name:str=''; wifi_password:str=''; door_code:str=''; parking_info:str=''; checkin_instructions:str=''; checkout_instructions:str=''; house_rules:str=''; emergency_contacts:str=''; trash_info:str=''; pool_info:str=''; thermostat_info:str=''; extra_notes:str=''

def _get_prop(db:Session)->PropertyInfo:
    p=db.get(PropertyInfo,1)
    if not p: p=PropertyInfo(id=1);db.add(p);db.commit();db.refresh(p)
    return p

@app.get('/api/admin/property')
def get_property(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    p=_get_prop(db)
    return {k:getattr(p,k) for k in ['wifi_name','wifi_password','door_code','parking_info','checkin_instructions','checkout_instructions','house_rules','emergency_contacts','trash_info','pool_info','thermostat_info','extra_notes']}

@app.put('/api/admin/property')
def update_property(payload:_PropIn,_:None=Depends(require_admin),db:Session=Depends(get_db)):
    p=_get_prop(db)
    for k,v in payload.model_dump().items(): setattr(p,k,v)
    db.commit();return {'ok':True}

# ── Financials ──────────────────────────────────────────────────────────────
@app.get('/api/admin/financials')
def admin_financials(_:None=Depends(require_admin),year:int=0,db:Session=Depends(get_db)):
    import calendar as _cal
    if not year: year=date.today().year
    ys=str(year)
    bookings=[b for b in db.query(BookingRequest).all() if b.checkin.startswith(ys) and b.status in ('confirmed','payment_pending')]
    ota_res=[r for r in db.query(IcalReservation).all() if r.checkin.startswith(ys)]
    expenses=db.query(Expense).filter(Expense.date.startswith(ys)).all()
    monthly=[{'month':m,'month_name':_cal.month_abbr[m],'revenue':0.0,'bookings':0,'direct_nights':0,'ota_nights':0,'expenses':0.0} for m in range(1,13)]
    def nights(ci,co):
        try: return max(0,(date.fromisoformat(co)-date.fromisoformat(ci)).days)
        except: return 0
    for b in bookings:
        m=int(b.checkin[5:7])-1; n=nights(b.checkin,b.checkout)
        monthly[m]['revenue']+=b.total; monthly[m]['bookings']+=1; monthly[m]['direct_nights']+=n
    for r in ota_res:
        m=int(r.checkin[5:7])-1; monthly[m]['ota_nights']+=nights(r.checkin,r.checkout)
    for e in expenses:
        m=int(e.date[5:7])-1; monthly[m]['expenses']+=e.amount
    total_rev=sum(b.total for b in bookings)
    direct_nights=sum(nights(b.checkin,b.checkout) for b in bookings)
    ota_nights=sum(nights(r.checkin,r.checkout) for r in ota_res)
    total_nights=direct_nights+ota_nights
    total_exp=sum(e.amount for e in expenses)
    avail=366 if _cal.isleap(year) else 365
    exp_by_cat:dict={}
    for e in expenses: exp_by_cat[e.category]=exp_by_cat.get(e.category,0)+e.amount
    return {'year':year,'revenue':total_rev,'expenses':total_exp,'net':total_rev-total_exp,'bookings':len(bookings),'direct_nights':direct_nights,'ota_nights':ota_nights,'total_nights':total_nights,'occupancy':round(total_nights/avail*100,1),'adr':round(total_rev/direct_nights,2) if direct_nights else 0,'revpan':round(total_rev/avail,2),'monthly':monthly,'expenses_by_cat':exp_by_cat}

# ── Pricing (PriceLabs) ─────────────────────────────────────────────────────
@app.get('/api/admin/pricing')
async def admin_pricing(_:None=Depends(require_admin),year:int=0,month:int=0,db:Session=Depends(get_db)):
    import calendar as _cal
    if not year: year=date.today().year
    if not month: month=date.today().month
    _,days=_cal.monthrange(year,month)
    start=f'{year}-{month:02d}-01'; end=f'{year}-{month:02d}-{days:02d}'
    cached=db.query(DailyPrice).filter(DailyPrice.date>=start,DailyPrice.date<=end).all()
    if cached:
        daily=[{'date':p.date,'price':p.price,'min_stay':p.min_stay,'demand_color':p.demand_color,'occupancy':p.occupancy} for p in cached]
        return {'daily':daily,'year':year,'month':month}
    if not settings.pricelabs_api_key or not settings.pricelabs_listing_id:
        return {'daily':[],'error':'PriceLabs not configured — add PRICELABS_API_KEY and PRICELABS_LISTING_ID on Render'}
    # Don't request past dates — PriceLabs may reject them
    api_start=max(date.today(),date(year,month,1)).isoformat()
    headers={'X-API-Key':settings.pricelabs_api_key,'Content-Type':'application/json'}
    payload={'listings':[{'id':settings.pricelabs_listing_id,'pms':settings.pricelabs_pms,'start_date':api_start,'end_date':end}]}
    async with httpx.AsyncClient(timeout=15) as c:
        r=await c.post('https://api.pricelabs.co/v1/listing_prices',headers=headers,json=payload)
        if r.status_code>=400: return {'daily':[],'error':f'PriceLabs API error ({r.status_code}) — click Sync Now to retry'}
        results=r.json()
        daily=(results[0].get('data') or []) if isinstance(results,list) and results else []
        return {'daily':daily,'year':year,'month':month}

@app.get('/api/pricing/calendar')
def public_pricing_calendar(year:int,month:int,db:Session=Depends(get_db)):
    import calendar as _cal
    _,days=_cal.monthrange(year,month)
    start=f'{year}-{month:02d}-01'; end=f'{year}-{month:02d}-{days:02d}'
    cached=db.query(DailyPrice).filter(DailyPrice.date>=start,DailyPrice.date<=end).all()
    s=get_settings(db)
    disc=s.direct_discount_percent/100
    prices=[{'date':p.date,'price':round(p.price,2),'direct_price':round(p.price*(1-disc),0)} for p in cached]
    return {'prices':prices,'discount_percent':s.direct_discount_percent}

@app.get('/api/admin/pricing/sync-status')
def pricing_sync_status(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    latest=db.query(DailyPrice).order_by(DailyPrice.synced_at.desc()).first()
    count=db.query(DailyPrice).count()
    return {'last_synced':latest.synced_at.isoformat() if latest else None,'cached_days':count}

@app.post('/api/admin/pricing/sync')
async def sync_pricing(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    if not settings.pricelabs_api_key or not settings.pricelabs_listing_id:
        raise HTTPException(400,'PriceLabs not configured')
    today=date.today()
    import calendar as _cal
    end_year=today.year+1; end_month=today.month
    _,end_days=_cal.monthrange(end_year,end_month)
    start_str=today.isoformat(); end_str=f'{end_year}-{end_month:02d}-{end_days:02d}'
    headers={'X-API-Key':settings.pricelabs_api_key,'Content-Type':'application/json'}
    payload={'listings':[{'id':settings.pricelabs_listing_id,'pms':settings.pricelabs_pms,'start_date':start_str,'end_date':end_str}]}
    async with httpx.AsyncClient(timeout=60) as c:
        r=await c.post('https://api.pricelabs.co/v1/listing_prices',headers=headers,json=payload)
    if r.status_code>=400: raise HTTPException(502,'PriceLabs API error')
    results=r.json()
    daily=(results[0].get('data') or []) if isinstance(results,list) and results else []
    now=datetime.utcnow(); count=0
    for d in daily:
        ds=d.get('date'); price=d.get('price',0)
        if not ds or not price: continue
        existing=db.query(DailyPrice).filter(DailyPrice.date==ds).first()
        if existing:
            existing.price=float(price); existing.min_stay=d.get('min_stay',1) or 1
            existing.demand_color=d.get('demand_color','') or ''; existing.occupancy=d.get('occupancy',0) or 0
            existing.synced_at=now
        else:
            db.add(DailyPrice(date=ds,price=float(price),min_stay=d.get('min_stay',1) or 1,demand_color=d.get('demand_color','') or '',occupancy=d.get('occupancy',0) or 0,synced_at=now))
        count+=1
    db.commit()
    return {'synced':count,'synced_at':now.isoformat()}

from fastapi.staticfiles import StaticFiles as _StaticFiles
from fastapi.responses import FileResponse as _FileResponse

_dist = _Path(__file__).parent / 'dist'
_public = _Path(__file__).parent / 'public'

if _dist.exists():
    app.mount('/assets', _StaticFiles(directory=str(_dist / 'assets')), name='assets')

if (_public / 'images').exists():
    app.mount('/images', _StaticFiles(directory=str(_public / 'images')), name='images')

if _dist.exists():
    @app.get('/{full_path:path}')
    async def _spa(full_path: str):
        pub = _public / full_path
        if pub.exists() and pub.is_file():
            return _FileResponse(str(pub))
        return _FileResponse(str(_dist / 'index.html'))
