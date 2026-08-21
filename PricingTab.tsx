import { useEffect, useState } from 'react';
import { api } from './api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function priceColor(price:number, min:number, max:number) {
  if(max===min) return '#6baeb6';
  const pct = (price - min) / (max - min);
  if(pct > 0.75) return '#22863a';
  if(pct > 0.4)  return '#d9a14e';
  return '#6baeb6';
}

export function PricingTab({ token }:{ token:string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const h = { Authorization:`Bearer ${token}` };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await api<any>(`/api/admin/pricing?year=${year}&month=${month+1}`,{headers:h});
      if(r.error) setError(r.error);
      else setData(r.daily||[]);
    } catch { setError('Failed to load pricing'); }
    setLoading(false);
  };
  useEffect(()=>{ load(); },[year,month,token]);

  const prev = () => month===0 ? (setMonth(11),setYear(y=>y-1)) : setMonth(m=>m-1);
  const next = () => month===11 ? (setMonth(0),setYear(y=>y+1)) : setMonth(m=>m+1);

  const dayMap:Record<string,any> = {};
  data.forEach(d=>{ dayMap[d.date]=d; });

  const prices = data.map(d=>d.price).filter(Boolean);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const avgP = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;
  const bookedNights = data.filter(d=>d.occupancy===1).length;

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells:(number|null)[] = [...Array(firstDow).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while(cells.length%7!==0) cells.push(null);

  const todayStr = today.toISOString().slice(0,10);

  return (
    <div>
      <h1>Pricing Calendar</h1>
      <p className="sub">Live nightly rates from PriceLabs. Color = demand: green high, amber medium, blue low.</p>

      {/* Stats */}
      {data.length>0 && (
        <div className="kpi-grid" style={{marginBottom:20}}>
          <div className="kpi-card"><div className="kpi-value">${avgP.toFixed(0)}</div><div className="kpi-label">Avg nightly</div></div>
          <div className="kpi-card"><div className="kpi-value">${minP}</div><div className="kpi-label">Min price</div></div>
          <div className="kpi-card"><div className="kpi-value">${maxP}</div><div className="kpi-label">Max price</div></div>
          <div className="kpi-card"><div className="kpi-value">{bookedNights}</div><div className="kpi-label">Booked nights</div></div>
        </div>
      )}

      {/* Month nav */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
        <button className="btn light" style={{padding:'6px 14px',fontSize:16}} onClick={prev}>‹</button>
        <h2 style={{margin:0,minWidth:200,textAlign:'center'}}>{MONTHS[month]} {year}</h2>
        <button className="btn light" style={{padding:'6px 14px',fontSize:16}} onClick={next}>›</button>
        <button className="btn light" style={{padding:'6px 12px',fontSize:13,marginLeft:8}} onClick={()=>{setMonth(today.getMonth());setYear(today.getFullYear());}}>Today</button>
        {loading && <span style={{color:'#888',fontSize:13}}>Loading…</span>}
      </div>

      {error && <div style={{background:'#fde7e5',borderRadius:10,padding:'12px 16px',color:'#a74840',marginBottom:16}}>{error} — Make sure PRICELABS_API_KEY and PRICELABS_LISTING_ID are set on Render.</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {DOWS.map(d=>(
          <div key={d} style={{textAlign:'center',fontSize:12,fontWeight:700,color:'#666',padding:'6px 0'}}>{d}</div>
        ))}
        {cells.map((day,i)=>{
          if(!day) return <div key={`e${i}`} style={{minHeight:80,background:'#f9f9f7',borderRadius:6}} />;
          const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const d = dayMap[ds];
          const isToday = ds===todayStr;
          const isPast = ds<todayStr;
          const isBooked = d?.occupancy===1;
          const price = d?.price;
          const minStay = d?.min_stay;
          return (
            <div key={ds} title={d ? `$${d.price}/night${minStay?` · ${minStay}n min`:''}${isBooked?' · BOOKED':''}` : ''} style={{
              minHeight:80,background:isBooked?'#f0e8e8':isToday?'#e6f4f6':isPast?'#fafaf8':'#fff',
              borderRadius:6,border:isToday?'2px solid #0d5f6b':'1px solid #eee',
              padding:'5px 6px',opacity:isPast&&!price ? .5 : 1,cursor:'default',
              position:'relative',
            }}>
              <div style={{fontSize:13,fontWeight:isToday?700:400,color:isToday?'#0d5f6b':isPast?'#aaa':'#222',marginBottom:2}}>{day}</div>
              {price && (
                <div style={{fontSize:14,fontWeight:700,color:isBooked?'#a74840':priceColor(price,minP,maxP)}}>
                  ${price}
                </div>
              )}
              {minStay && minStay>1 && <div style={{fontSize:9,color:'#aaa',marginTop:1}}>{minStay}n min</div>}
              {isBooked && <div style={{fontSize:9,fontWeight:700,color:'#a74840',marginTop:1}}>BOOKED</div>}
              {d?.demand_color && d.demand_color!=='#EDEDED' && (
                <div style={{position:'absolute',top:4,right:4,width:6,height:6,borderRadius:'50%',background:d.demand_color}} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{marginTop:16,display:'flex',gap:20,fontSize:12,color:'#888'}}>
        <span><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#22863a',marginRight:4}} />High demand</span>
        <span><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#d9a14e',marginRight:4}} />Medium demand</span>
        <span><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#6baeb6',marginRight:4}} />Low demand</span>
        <span><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#a74840',marginRight:4}} />Booked</span>
      </div>
    </div>
  );
}
