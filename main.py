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
from models import AppSettings, ChatMessage, BookingRequest, Customer
from schemas import AdminLogin, ChatIn, BookingIn, SettingsSchema, CustomerRegister, CustomerLogin
from passlib.context import CryptContext
_pwd=CryptContext(schemes=['bcrypt'],deprecated='auto')
from integrations import airbnb_available, pricelabs_nightly_rate
import analytics as _analytics
from email_service import send_booking_confirmation, send_owner_notification
Base.metadata.create_all(bind=engine)
app=FastAPI(title='Coastal Haven API',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=[settings.frontend_url,'http://localhost:5173'],allow_credentials=True,allow_methods=['*'],allow_headers=['*','X-Session-ID'])

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
    try: jwt.decode(authorization.split(' ',1)[1],settings.jwt_secret,algorithms=['HS256'])
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
    from .integrations import _parse_ical_date, _blocked_ranges
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

@app.get('/api/calendar.ics', response_class=PlainTextResponse)
def export_calendar(token:str=Query(''), db:Session=Depends(get_db)):
    if token != settings.calendar_token:
        raise HTTPException(403, 'Invalid calendar token')
    bookings = db.query(BookingRequest).filter(
        BookingRequest.status.in_(['confirmed','payment_pending','pending_approval'])
    ).all()
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Coastal Haven//Direct Booking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Coastal Haven - Direct Bookings',
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
            f'SUMMARY:Coastal Haven - Reserved',
            f'DESCRIPTION:Direct booking ({b.guests} guests)',
            f'STATUS:CONFIRMED',
            f'CREATED:{created}',
            'END:VEVENT',
        ]
    lines.append('END:VCALENDAR')
    return PlainTextResponse('\r\n'.join(lines), media_type='text/calendar; charset=utf-8')

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
    if not settings.active_stripe_secret_key: raise HTTPException(503,'Stripe is not configured')
    stripe.api_key=settings.active_stripe_secret_key
    success_url=settings.stripe_success_url+f'&booking_id={booking.id}'
    session=stripe.checkout.Session.create(
        mode='payment',
        line_items=[{'price_data':{'currency':'usd','product_data':{'name':'Coastal Haven — Orange Beach stay','description':f"{payload.checkin} to {payload.checkout}, {payload.guests} guests"},'unit_amount':round(q['total']*100)},'quantity':1}],
        customer_email=payload.email or None,
        success_url=success_url,
        cancel_url=settings.stripe_cancel_url,
        metadata={'booking_id':str(booking.id)}
    )
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

@app.get('/api/admin/chat')
def admin_chat(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(100).all();return [{'id':r.id,'name':r.name,'email':r.email,'message':r.message,'created_at':r.created_at.isoformat()} for r in rows]

@app.get('/api/admin/bookings')
def admin_bookings(_:None=Depends(require_admin),db:Session=Depends(get_db)):
    rows=db.query(BookingRequest).order_by(BookingRequest.created_at.desc()).all()
    return [{'id':b.id,'checkin':b.checkin,'checkout':b.checkout,'guests':b.guests,'guest_name':b.guest_name,'email':b.email,'phone':b.phone,'address':b.address,'customer_id':b.customer_id,'total':b.total,'status':b.status,'created_at':b.created_at.isoformat()} for b in rows]

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

_PROPERTY_CONTEXT="""You are Cove, the friendly AI concierge for Coastal Haven at Phoenix V — a luxury oceanfront condo in Orange Beach, Alabama.

Property facts:
- Address: 26802 Perdido Beach Blvd, Unit 1506, Orange Beach, AL 36561
- 3 bedrooms, 2 bathrooms, sleeps up to 8 guests
- 15th floor, direct Gulf of Mexico views, private balcony
- Full kitchen, in-unit washer/dryer, high-speed WiFi
- Resort amenities: heated pool, hot tub, fitness center, beach access, covered parking
- Check-in: 4:00 PM | Check-out: 10:00 AM
- Cleaning fee: $220 | Taxes: 15%
- Book direct and save 10% vs Airbnb

Local area:
- Nearest airport: Pensacola International (PNS) ~45 min drive
- Gulf State Park: 2 miles east (bike trails, nature center, pier)
- Popular restaurants: LuLu's (family), The Gulf (seafood), Cobalt (upscale), Ginny Lane
- Activities: dolphin cruises, deep-sea fishing, parasailing, kayaking, paddleboarding
- Shopping: The Wharf (entertainment/dining complex), Tanger Outlets
- Flora-Bama Lounge: 5 miles west, legendary Gulf Coast landmark

Rules:
- Be warm, concise, and helpful
- For exact pricing/availability, direct guests to use the booking tool on this page
- Don't make up specific prices or availability — say "check availability above"
- Keep replies under 150 words unless a detailed answer is needed"""

class AIChatIn(BaseModel):
    messages:list[dict]

@app.post('/api/chat/ai')
async def ai_chat(payload:AIChatIn):
    if not settings.openai_api_key:
        return {'reply':'Hi! I\'m the Coastal Haven concierge. We\'re getting our AI chat set up — in the meantime please use the contact form below and we\'ll reply quickly!'}
    try:
        from openai import AsyncOpenAI
        client=AsyncOpenAI(api_key=settings.openai_api_key)
        resp=await client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role':'system','content':_PROPERTY_CONTEXT}]+payload.messages[-12:],
            max_tokens=350,temperature=0.7
        )
        return {'reply':resp.choices[0].message.content}
    except Exception as e:
        return {'reply':'Sorry, I\'m having trouble right now. Please use the contact form and we\'ll reply shortly!'}

# Serve React SPA in production (after npm run build creates dist/)
from pathlib import Path as _Path
from fastapi.staticfiles import StaticFiles as _StaticFiles
from fastapi.responses import FileResponse as _FileResponse

_dist = _Path(__file__).parent / 'dist'
if _dist.exists():
    app.mount('/assets', _StaticFiles(directory=str(_dist / 'assets')), name='assets')

    @app.get('/{full_path:path}')
    async def _spa(full_path: str):
        return _FileResponse(str(_dist / 'index.html'))
