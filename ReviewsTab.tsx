import { useEffect, useState } from 'react';
import { api } from './api';

const PLATFORMS = ['Airbnb','VRBO','Google','Direct','TripAdvisor','Other'];
const STARS = [1,2,3,4,5];

interface Review { id:number; platform:string; guest_name:string; rating:number; review_text:string; response:string; review_date:string; created_at:string }
const blank = ():Review => ({id:0,platform:'Airbnb',guest_name:'',rating:5,review_text:'',response:'',review_date:new Date().toISOString().slice(0,10),created_at:''});

function Stars({n,set}:{n:number,set?:(v:number)=>void}) {
  return (
    <span>
      {STARS.map(s=>(
        <span key={s} onClick={()=>set?.(s)} style={{fontSize:18,cursor:set?'pointer':'default',color:s<=n?'#f5a623':'#ddd'}}>{s<=n?'★':'☆'}</span>
      ))}
    </span>
  );
}

function PlatformBadge({p}:{p:string}) {
  const colors:Record<string,string> = {Airbnb:'#ff5a5f',VRBO:'#1C5EB4',Google:'#4285F4',Direct:'#0d5f6b',TripAdvisor:'#00AF87',Other:'#888'};
  return <span style={{background:colors[p]||'#888',color:'white',borderRadius:6,padding:'2px 10px',fontSize:11,fontWeight:700}}>{p}</span>;
}

export function ReviewsTab({ token }:{ token:string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [form, setForm] = useState<Review>(blank());
  const [replyId, setReplyId] = useState<number|null>(null);
  const [replyText, setReplyText] = useState('');
  const [saved, setSaved] = useState('');
  const h = { Authorization:`Bearer ${token}` };

  const load = () => api<Review[]>('/api/admin/reviews',{headers:h}).then(setReviews).catch(()=>{});
  useEffect(()=>{ load(); },[token]);

  const add = async () => {
    if(!form.review_text.trim()) return;
    await api('/api/admin/reviews',{method:'POST',headers:h,body:JSON.stringify(form)});
    setSaved('Added ✓'); setTimeout(()=>setSaved(''),1500);
    setForm(blank()); load();
  };
  const del = async (id:number) => { await api(`/api/admin/reviews/${id}`,{method:'DELETE',headers:h}); load(); };
  const saveReply = async (r:Review) => {
    await api(`/api/admin/reviews/${r.id}`,{method:'PUT',headers:h,body:JSON.stringify({...r,response:replyText})});
    setReplyId(null); setReplyText(''); load();
  };

  const avg = reviews.length ? reviews.reduce((a,r)=>a+r.rating,0)/reviews.length : 0;
  const dist = STARS.reduce((acc,s)=>({...acc,[s]:reviews.filter(r=>r.rating===s).length}),{} as Record<number,number>);

  return (
    <div>
      <h1>Reviews</h1>
      <p className="sub">Track guest reviews across all platforms and craft responses.</p>

      {reviews.length > 0 && (
        <div className="admin-card" style={{display:'flex',gap:32,alignItems:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:48,fontWeight:800,color:'#0d5f6b'}}>{avg.toFixed(1)}</div>
            <Stars n={Math.round(avg)} />
            <div style={{fontSize:12,color:'#888',marginTop:4}}>{reviews.length} reviews</div>
          </div>
          <div style={{flex:1}}>
            {[5,4,3,2,1].map(s=>(
              <div key={s} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:12,width:12,textAlign:'right'}}>{s}</span>
                <span style={{fontSize:14,color:'#f5a623'}}>★</span>
                <div style={{flex:1,height:8,background:'#eee',borderRadius:4,overflow:'hidden'}}>
                  <div style={{width:`${reviews.length?((dist[s]||0)/reviews.length)*100:0}%`,height:'100%',background:'#f5a623',borderRadius:4}} />
                </div>
                <span style={{fontSize:12,color:'#888',width:20}}>{dist[s]||0}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {PLATFORMS.map(p=>{
              const c = reviews.filter(r=>r.platform===p).length;
              if(!c) return null;
              return <div key={p} style={{fontSize:13}}><PlatformBadge p={p} /> <span style={{marginLeft:6,color:'#888'}}>{c}</span></div>;
            })}
          </div>
        </div>
      )}

      {/* Add review */}
      <div className="admin-card">
        <h2>Add Review</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          <label>Platform
            <select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})}>
              {PLATFORMS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>Guest Name<input value={form.guest_name} onChange={e=>setForm({...form,guest_name:e.target.value})} placeholder="Optional" /></label>
          <label>Review Date<input type="date" value={form.review_date} onChange={e=>setForm({...form,review_date:e.target.value})} /></label>
          <label style={{gridColumn:'span 3'}}>Rating
            <div style={{marginTop:6}}><Stars n={form.rating} set={v=>setForm({...form,rating:v})} /></div>
          </label>
          <label style={{gridColumn:'span 3'}}>Review Text
            <textarea rows={3} value={form.review_text} onChange={e=>setForm({...form,review_text:e.target.value})} placeholder="Paste or type the review…" />
          </label>
          <label style={{gridColumn:'span 3'}}>Your Response (optional)
            <textarea rows={2} value={form.response} onChange={e=>setForm({...form,response:e.target.value})} />
          </label>
        </div>
        <div style={{marginTop:14,display:'flex',gap:10}}>
          <button className="btn" onClick={add}>Add Review</button>
          {saved && <span style={{color:'#28704e',fontWeight:700,lineHeight:'44px'}}>{saved}</span>}
        </div>
      </div>

      {/* Reviews list */}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {reviews.length===0 && <p style={{color:'#aaa'}}>No reviews yet.</p>}
        {reviews.map(r=>(
          <div key={r.id} className="admin-card" style={{margin:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <PlatformBadge p={r.platform} />
                  {r.guest_name && <strong>{r.guest_name}</strong>}
                  <Stars n={r.rating} />
                  <span style={{fontSize:12,color:'#aaa'}}>{r.review_date}</span>
                </div>
                <p style={{margin:'6px 0 0',color:'#444',lineHeight:1.6}}>{r.review_text}</p>
                {r.response && (
                  <div style={{marginTop:10,padding:'10px 14px',background:'#f0f4f3',borderRadius:8,borderLeft:'3px solid #0d5f6b'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#0d5f6b',marginBottom:4}}>Your Response</div>
                    <p style={{margin:0,fontSize:14,color:'#555'}}>{r.response}</p>
                  </div>
                )}
                {replyId===r.id && (
                  <div style={{marginTop:10}}>
                    <textarea rows={3} style={{width:'100%',boxSizing:'border-box'}} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Write your response…" />
                    <div style={{display:'flex',gap:8,marginTop:6}}>
                      <button className="btn" style={{padding:'6px 14px',fontSize:13}} onClick={()=>saveReply(r)}>Save Response</button>
                      <button className="btn light" style={{padding:'6px 14px',fontSize:13}} onClick={()=>setReplyId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                {!r.response && replyId!==r.id && (
                  <button className="btn light" style={{padding:'6px 12px',fontSize:12}} onClick={()=>{setReplyId(r.id);setReplyText(r.response||'');}}>Reply</button>
                )}
                {r.response && replyId!==r.id && (
                  <button className="btn light" style={{padding:'6px 12px',fontSize:12}} onClick={()=>{setReplyId(r.id);setReplyText(r.response);}}>Edit reply</button>
                )}
                <button onClick={()=>del(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#c9534f',fontSize:16}}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
