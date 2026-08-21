import { useEffect, useState } from 'react';
import { api } from './api';

const FIELDS: { key: string; label: string; multi?: boolean }[] = [
  { key:'wifi_name', label:'WiFi Network Name' },
  { key:'wifi_password', label:'WiFi Password' },
  { key:'door_code', label:'Door Code / Keypad' },
  { key:'parking_info', label:'Parking Info', multi:true },
  { key:'checkin_instructions', label:'Check-in Instructions', multi:true },
  { key:'checkout_instructions', label:'Check-out Instructions', multi:true },
  { key:'house_rules', label:'House Rules', multi:true },
  { key:'emergency_contacts', label:'Emergency Contacts', multi:true },
  { key:'trash_info', label:'Trash & Recycling', multi:true },
  { key:'pool_info', label:'Pool / Hot Tub Info', multi:true },
  { key:'thermostat_info', label:'Thermostat / AC Info', multi:true },
  { key:'extra_notes', label:'Extra Notes', multi:true },
];

const blank = () => Object.fromEntries(FIELDS.map(f=>[f.key,''])) as Record<string,string>;

export function PropertyTab({ token }:{ token:string }) {
  const [form, setForm] = useState<Record<string,string>>(blank());
  const [saved, setSaved] = useState('');
  const h = { Authorization:`Bearer ${token}` };

  useEffect(()=>{
    api<any>('/api/admin/property',{headers:h}).then(d=>{
      if(d) setForm(prev=>({...prev,...d}));
    }).catch(()=>{});
  },[token]);

  const save = async () => {
    await api('/api/admin/property',{method:'PUT',headers:h,body:JSON.stringify(form)});
    setSaved('Saved ✓');
    setTimeout(()=>setSaved(''),2000);
  };

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

  return (
    <div>
      <h1>Property Info</h1>
      <p className="sub">Stored here for reference — share with cleaners, guests, and house manuals.</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
        {/* Quick access card */}
        {(form.wifi_name||form.wifi_password||form.door_code) && (
          <div className="admin-card" style={{gridColumn:'span 2',background:'#e8f6f8',border:'1px solid #b0d9de'}}>
            <h2 style={{marginTop:0}}>Quick Access</h2>
            <div style={{display:'flex',gap:32,flexWrap:'wrap'}}>
              {form.wifi_name && <div><span style={{fontSize:12,color:'#555'}}>WiFi</span><div style={{fontSize:18,fontWeight:700,fontFamily:'monospace'}}>{form.wifi_name}</div></div>}
              {form.wifi_password && <div><span style={{fontSize:12,color:'#555'}}>Password</span><div style={{fontSize:18,fontWeight:700,fontFamily:'monospace'}}>{form.wifi_password}</div></div>}
              {form.door_code && <div><span style={{fontSize:12,color:'#555'}}>Door Code</span><div style={{fontSize:18,fontWeight:700,fontFamily:'monospace'}}>{form.door_code}</div></div>}
            </div>
          </div>
        )}

        {FIELDS.map(f=>(
          <div key={f.key} className="admin-card" style={{margin:0,padding:'14px 16px'}}>
            <label style={{fontWeight:700,fontSize:13,color:'#555',display:'block',marginBottom:6}}>{f.label}</label>
            {f.multi
              ? <textarea rows={3} style={{width:'100%',resize:'vertical',boxSizing:'border-box'}} value={form[f.key]||''} onChange={e=>set(f.key,e.target.value)} />
              : <input style={{width:'100%',boxSizing:'border-box'}} value={form[f.key]||''} onChange={e=>set(f.key,e.target.value)} />
            }
          </div>
        ))}
      </div>

      <div style={{marginTop:18,display:'flex',gap:12,alignItems:'center'}}>
        <button className="btn" onClick={save}>Save All</button>
        {saved && <span style={{color:'#28704e',fontWeight:700}}>{saved}</span>}
      </div>
    </div>
  );
}
