import { useEffect, useState } from 'react';
import { api } from './api';

const TRIGGERS = [
  { value:'booking_confirmed', label:'Booking Confirmed', desc:'Sent immediately when a booking is confirmed' },
  { value:'day_before_checkin', label:'Day Before Check-in', desc:'Sent 24 hours before check-in' },
  { value:'checkin_day', label:'Check-in Day', desc:'Sent on the morning of check-in' },
  { value:'day_before_checkout', label:'Day Before Check-out', desc:'Sent 24 hours before check-out' },
  { value:'checkout_day', label:'Check-out Day', desc:'Sent on check-out morning' },
  { value:'post_checkout', label:'Post Check-out', desc:'Sent after guests leave (e.g. +2h)' },
  { value:'manual', label:'Manual', desc:'Send manually — not automated' },
];

const DEFAULT_TEMPLATES = [
  { name:'Booking Confirmed', trigger:'booking_confirmed', send_hours:0, subject:'Your booking at Orange Beach Stay is confirmed!', body:`Hi {{guest_name}},\n\nThank you for booking with us! We're excited to host you.\n\nYour reservation:\n📅 Check-in: {{checkin}}\n📅 Check-out: {{checkout}}\n👥 Guests: {{guests}}\n\nCheck-in time is 4:00 PM. You'll receive door code instructions the morning of your arrival.\n\nFeel free to message us with any questions!\n\nWarm regards,\nOrange Beach Stay` },
  { name:'Pre-Arrival Instructions', trigger:'day_before_checkin', send_hours:-24, subject:'Your check-in details for tomorrow', body:`Hi {{guest_name}},\n\nYou're arriving tomorrow! Here are your check-in details:\n\n🔑 Door Code: {{door_code}}\n📶 WiFi: {{wifi_name}} / {{wifi_password}}\n🏠 Address: 123 Gulf Shore Dr, Orange Beach, AL\n\nCheck-in is at 4:00 PM. Parking is available in the driveway (2 spaces).\n\nSee you tomorrow!\nOrange Beach Stay` },
  { name:'Check-out Reminder', trigger:'day_before_checkout', send_hours:-24, subject:'Check-out reminder — tomorrow by 10 AM', body:`Hi {{guest_name}},\n\nJust a friendly reminder that check-out is tomorrow by 10:00 AM.\n\nCheck-out steps:\n☑ Strip beds and leave linens in the laundry room\n☑ Run the dishwasher\n☑ Take out trash\n☑ Lock the door and return the key\n\nWe hope you had an amazing stay at Orange Beach!\n\nOrange Beach Stay` },
  { name:'Review Request', trigger:'post_checkout', send_hours:2, subject:'How was your stay? We\'d love your review!', body:`Hi {{guest_name}},\n\nThank you for staying with us! We hope you had a wonderful time at Orange Beach.\n\nWould you mind leaving us a review? It helps future guests and means the world to us.\n\nLeave a review: https://www.airbnb.com/users/reviews\n\nIf anything could have been better, please let us know directly — we'd love to make it right.\n\nUntil next time!\nOrange Beach Stay` },
];

interface Msg { id:number; name:string; trigger:string; send_hours:number; subject:string; body:string; enabled:boolean; created_at:string }
const blank = ():Msg => ({id:0,name:'',trigger:'booking_confirmed',send_hours:0,subject:'',body:'',enabled:true,created_at:''});

export function MessagesTab({ token }:{ token:string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [form, setForm] = useState<Msg>(blank());
  const [editing, setEditing] = useState<number|null>(null);
  const [saved, setSaved] = useState('');
  const h = { Authorization:`Bearer ${token}` };

  const load = () => api<Msg[]>('/api/admin/automessages',{headers:h}).then(setMsgs).catch(()=>{});
  useEffect(()=>{ load(); },[token]);

  const save = async () => {
    if(!form.name.trim()||!form.body.trim()) return;
    if(editing) await api(`/api/admin/automessages/${editing}`,{method:'PUT',headers:h,body:JSON.stringify(form)});
    else await api('/api/admin/automessages',{method:'POST',headers:h,body:JSON.stringify(form)});
    setSaved('Saved ✓'); setTimeout(()=>setSaved(''),1500);
    setForm(blank()); setEditing(null); load();
  };
  const del = async (id:number) => { await api(`/api/admin/automessages/${id}`,{method:'DELETE',headers:h}); load(); };
  const toggle = async (m:Msg) => {
    await api(`/api/admin/automessages/${m.id}`,{method:'PUT',headers:h,body:JSON.stringify({...m,enabled:!m.enabled})});
    load();
  };
  const edit = (m:Msg) => { setForm({...m}); setEditing(m.id); window.scrollTo({top:0,behavior:'smooth'}); };
  const loadTemplate = (t:typeof DEFAULT_TEMPLATES[0]) => {
    setForm({...blank(),...t});
    setEditing(null);
  };

  const triggerLabel = (v:string) => TRIGGERS.find(t=>t.value===v)?.label || v;

  const VARS = ['{{guest_name}}','{{checkin}}','{{checkout}}','{{guests}}','{{door_code}}','{{wifi_name}}','{{wifi_password}}'];

  return (
    <div>
      <h1>Auto Messages</h1>
      <p className="sub">Message templates triggered at key points in the guest journey. Variables are filled in automatically when sent.</p>

      {/* Available variables */}
      <div className="admin-card" style={{padding:'12px 16px',marginBottom:18}}>
        <div style={{fontSize:12,fontWeight:700,color:'#555',marginBottom:6}}>Available variables</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {VARS.map(v=>(
            <code key={v} style={{background:'#f0f4f3',padding:'2px 8px',borderRadius:6,fontSize:12,cursor:'pointer'}} onClick={()=>setForm(f=>({...f,body:f.body+v}))} title="Click to insert">{v}</code>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="admin-card">
        <h2>{editing ? 'Edit Message' : 'New Message Template'}</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <label>Template Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Check-in Instructions" /></label>
          <label>Trigger
            <select value={form.trigger} onChange={e=>setForm({...form,trigger:e.target.value})}>
              {TRIGGERS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label>Send offset (hours)
            <input type="number" value={form.send_hours} onChange={e=>setForm({...form,send_hours:parseInt(e.target.value)||0})} placeholder="0 = at trigger time, -24 = 24h before" />
          </label>
          <label>Enabled
            <div style={{marginTop:10}}>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:'normal'}}>
                <input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})} />
                {form.enabled ? 'Active — will be sent automatically' : 'Disabled'}
              </label>
            </div>
          </label>
          <label style={{gridColumn:'span 2'}}>Subject (email)<input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Email subject line" /></label>
          <label style={{gridColumn:'span 2'}}>Message Body
            <textarea rows={10} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Write your message here. Use variables above." style={{fontFamily:'inherit',lineHeight:1.6}} />
          </label>
        </div>
        <div style={{marginTop:14,display:'flex',gap:10,alignItems:'center'}}>
          <button className="btn" onClick={save}>{editing?'Update Template':'Save Template'}</button>
          {editing && <button className="btn light" onClick={()=>{setForm(blank());setEditing(null);}}>Cancel</button>}
          {saved && <span style={{color:'#28704e',fontWeight:700}}>{saved}</span>}
        </div>

        {/* Starter templates */}
        {!editing && (
          <div style={{marginTop:18,paddingTop:16,borderTop:'1px solid #eee'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#555',marginBottom:10}}>Or load a starter template:</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {DEFAULT_TEMPLATES.map(t=>(
                <button key={t.trigger} className="btn light" style={{padding:'6px 14px',fontSize:12}} onClick={()=>loadTemplate(t)}>{t.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages list */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {msgs.length===0 && <p style={{color:'#aaa'}}>No templates yet. Add one above or use a starter template.</p>}
        {msgs.map(m=>{
          const trig = TRIGGERS.find(t=>t.value===m.trigger);
          return (
            <div key={m.id} className="admin-card" style={{margin:0,opacity:m.enabled?1:.6}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                    <strong style={{fontSize:15}}>{m.name}</strong>
                    <span style={{background:m.enabled?'#e5f5ed':'#f5f5f5',color:m.enabled?'#28704e':'#999',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:700}}>{m.enabled?'Active':'Disabled'}</span>
                    <span style={{background:'#f0f4f3',borderRadius:6,padding:'2px 8px',fontSize:11,color:'#555'}}>{triggerLabel(m.trigger)}{m.send_hours?` ${m.send_hours>0?'+':''}${m.send_hours}h`:''}</span>
                  </div>
                  {m.subject && <div style={{fontSize:13,color:'#555',marginBottom:4}}>📧 {m.subject}</div>}
                  {trig && <div style={{fontSize:12,color:'#888',marginBottom:6}}>{trig.desc}</div>}
                  <pre style={{margin:0,fontSize:12,color:'#666',background:'#f9f9f7',borderRadius:8,padding:'10px 12px',whiteSpace:'pre-wrap',maxHeight:120,overflow:'hidden',fontFamily:'inherit',lineHeight:1.5}}>{m.body.slice(0,300)}{m.body.length>300?'…':''}</pre>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0,flexDirection:'column',alignItems:'flex-end'}}>
                  <button className="btn light" style={{padding:'6px 12px',fontSize:12}} onClick={()=>edit(m)}>Edit</button>
                  <button className="btn light" style={{padding:'6px 12px',fontSize:12,color:m.enabled?'#c9534f':'#28704e'}} onClick={()=>toggle(m)}>{m.enabled?'Disable':'Enable'}</button>
                  <button onClick={()=>del(m.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#c9534f',fontSize:16,padding:'6px'}}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
