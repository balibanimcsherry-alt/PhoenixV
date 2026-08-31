import React, { useEffect, useState } from 'react';
import { PMSTab } from './PMS';
import { CalendarTab } from './CalendarTab';
import { TasksTab } from './TasksTab';
import { FinancialsTab } from './FinancialsTab';
import { PricingTab } from './PricingTab';
import { PropertyTab } from './PropertyTab';
import { ReviewsTab } from './ReviewsTab';
import { MessagesTab } from './MessagesTab';
import { ScreenshotTab } from './ScreenshotTab';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { api } from './api';

type Settings = {
  instant_booking: boolean; direct_discount_percent: number; cleaning_fee: number;
  tax_percent: number; security_mode: string; security_amount: number;
  cancellation_policy: string; promo_code: string; promo_percent: number;
  airbnb_markup_percent: number; vrbo_markup_percent: number; booking_markup_percent: number;
};
const defaults: Settings = {
  instant_booking: true, direct_discount_percent: 10, cleaning_fee: 220,
  tax_percent: 15, security_mode: 'authorization', security_amount: 500,
  cancellation_policy: 'Full refund up to 30 days before arrival; 50% refund up to 14 days before arrival; non-refundable inside 14 days.',
  promo_code: 'RETURN10', promo_percent: 10,
  airbnb_markup_percent: 17, vrbo_markup_percent: 20, booking_markup_percent: 25,
};

const COLORS = ['#0d5f6b', '#6baeb6', '#d9a14e', '#d98871', '#174b50', '#a8d5db', '#f6f2e9', '#28704e'];

function kpi(label: string, value: string | number, sub?: string) {
  return (
    <div className="kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function TestEmailButton({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle'|'sending'|'ok'|'err'>('idle');
  const [msg, setMsg] = useState('');
  const send = async () => {
    setStatus('sending');
    try {
      const r = await api<any>('/api/admin/test-email', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setMsg(r.message || 'Sent!'); setStatus('ok');
    } catch (e: any) {
      setMsg(e?.message || 'Failed — check Render env vars'); setStatus('err');
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button className="btn light" onClick={send} disabled={status === 'sending'} style={{ minWidth: 160 }}>
        {status === 'sending' ? 'Sending…' : '📧 Send test email'}
      </button>
      {status === 'ok' && <span style={{ color: '#28704e', fontWeight: 700 }}>✓ {msg}</span>}
      {status === 'err' && <span style={{ color: '#a74840', fontWeight: 700 }}>✕ {msg}</span>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="admin-card"><h2>{title}</h2>{children}</div>;
}

function SendConfirmBtn({dbId, headers, onSent}: {dbId: number; headers: ()=>Record<string,string>; onSent: ()=>void}) {
  const [state, setState] = React.useState<'idle'|'sending'|'done'|'err'>('idle');
  if (state === 'done') return <span style={{color:'#28704e',fontWeight:700,fontSize:12}}>✓ Sent</span>;
  return (
    <button disabled={state==='sending'}
      onClick={async e => {
        e.stopPropagation();
        if (!confirm('Send booking confirmation email to this guest now?')) return;
        setState('sending');
        try {
          await api(`/api/admin/bookings/${dbId}/send-confirmation`, {method:'POST', headers:headers()});
          setState('done'); onSent();
        } catch { setState('err'); }
      }}
      style={{padding:'5px 12px',borderRadius:6,background:'#0d5f6b',color:'#fff',border:'none',fontWeight:700,fontSize:12,cursor:'pointer'}}>
      {state==='sending'?'Sending…':state==='err'?'Failed — retry':'Send to guest'}
    </button>
  );
}

const SOURCE_LABELS: Record<string,string> = {direct:'Direct',airbnb:'Airbnb',vrbo:'VRBO',booking:'Booking.com'};
const SOURCE_COLORS: Record<string,string> = {direct:'#0d5f6b',airbnb:'#e84393',vrbo:'#1557a0',booking:'#003580'};

function SourceBadge({source}: {source: string}) {
  return <span style={{display:'inline-block',padding:'2px 8px',borderRadius:12,fontSize:10,fontWeight:700,color:'#fff',background:SOURCE_COLORS[source]||'#888',letterSpacing:.5}}>{SOURCE_LABELS[source]||source}</span>;
}

function BookingsTab({ bookings, headers, load, fetchingEmails, fetchMsg, setFetchMsg }: {
  bookings: any[];
  headers: () => Record<string,string>; load: () => void;
  fetchingEmails: boolean; fetchMsg: string; setFetchMsg: (s: string) => void;
}) {
  const [expanded, setExpanded] = React.useState<string|null>(null);
  const [srcFilter, setSrcFilter] = React.useState<string>('all');
  const [editingId, setEditingId] = React.useState<string|null>(null);
  const [editForm, setEditForm] = React.useState({guest_name:'',guest_phone:'',guest_email:'',platform:''});
  const [editSaving, setEditSaving] = React.useState(false);

  const direct   = bookings.filter(b => b.source === 'direct');
  const ota      = bookings.filter(b => b.source !== 'direct');
  const confirmed= direct.filter(b => ['confirmed','payment_pending'].includes(b.status));
  const totalRev = confirmed.reduce((s, b) => s + b.total, 0);
  const emailSent= bookings.filter(b => b.email_sent).length;

  const byMonth: Record<string,number> = {};
  confirmed.forEach(b => { const m = b.created_at.slice(0,7); byMonth[m]=(byMonth[m]||0)+1; });
  const monthData = Object.entries(byMonth).sort().slice(-6).map(([month,count])=>({month:month.slice(5),count}));

  const filtered = srcFilter === 'all' ? bookings : bookings.filter(b => b.source === srcFilter);

  const missingTag = (v: string) => v
    ? <span>{v}</span>
    : <span style={{background:'#fde7e5',color:'#a74840',fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4}}>MISSING</span>;

  return <>
    <h1>All Reservations</h1>
    <div className="kpi-grid">
      {kpi('Total', bookings.length, 'all sources')}
      {kpi('Direct Bookings', direct.length, 'via website')}
      {kpi('OTA Reservations', ota.length, 'Airbnb / VRBO / Booking')}
      {kpi('Direct Revenue', `$${totalRev.toLocaleString('en-US',{maximumFractionDigits:0})}`, 'confirmed direct')}
      {kpi('Cancelled', direct.filter(b=>b.status==='cancelled').length, 'direct only')}
      {kpi('Emails Sent', emailSent, 'all sources')}
    </div>

    {monthData.length > 0 && (
      <SectionCard title="Confirmed direct bookings by month">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthData}>
            <XAxis dataKey="month" tick={{fontSize:12}}/>
            <YAxis tick={{fontSize:12}} allowDecimals={false}/>
            <Tooltip/>
            <Bar dataKey="count" fill="#0d5f6b" radius={[6,6,0,0]} name="Bookings"/>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    )}

    <SectionCard title="All reservations">
      {/* Toolbar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {(['all','direct','airbnb','vrbo','booking'] as const).map(s=>(
            <button key={s} onClick={()=>setSrcFilter(s)}
              style={{padding:'4px 14px',borderRadius:20,border:'1px solid',fontSize:12,fontWeight:600,cursor:'pointer',
                borderColor: srcFilter===s ? (SOURCE_COLORS[s]||'#0d5f6b') : '#d0e4e8',
                background:  srcFilter===s ? (SOURCE_COLORS[s]||'#0d5f6b') : '#fff',
                color:       srcFilter===s ? '#fff' : '#555'}}>
              {s==='all'?'All':SOURCE_LABELS[s]}
              <span style={{marginLeft:6,opacity:.8}}>({s==='all'?bookings.length:bookings.filter(b=>b.source===s).length})</span>
            </button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {fetchingEmails
            ? <span style={{fontSize:12,color:'#0d5f6b',fontStyle:'italic'}}>📥 Syncing inbox…</span>
            : fetchMsg && <span style={{fontSize:12,color:'#28704e',fontWeight:600}}>{fetchMsg}</span>
          }
          <button
            onClick={async()=>{
              setFetchMsg('Exporting…');
              try {
                const data = await api<object[]>('/api/admin/export-email-guests',{headers:headers()});
                const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `email-guests-${new Date().toISOString().slice(0,10)}.json`;
                a.click();
                setFetchMsg(`✓ Exported ${data.length} record${data.length!==1?'s':''}`);
              } catch { setFetchMsg('Export failed'); }
            }}
            style={{padding:'5px 14px',borderRadius:8,border:'1px solid #555',background:'#f5f5f5',color:'#333',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
            💾 Export to JSON
          </button>
        </div>
      </div>

      {filtered.length === 0
        ? <p style={{color:'#888',padding:'20px 0'}}>No reservations.</p>
        : <div style={{overflowX:'auto'}}>
          <table className="admin-table" style={{fontSize:13,minWidth:800}}>
          <thead>
            <tr>
              <th>Platform</th><th>Guest name</th><th>Contact</th>
              <th>Check-in</th><th>Check-out</th><th>Nights</th>
              <th>Total</th><th>Status</th><th>Notified</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => {
              const nights = Math.round((new Date(b.checkout).getTime()-new Date(b.checkin).getTime())/86400000);
              const open   = expanded === b.id;
              const isDirect = b.source === 'direct';
              const otaNote = `via ${SOURCE_LABELS[b.source]||b.source} app`;
              return <React.Fragment key={b.id}>
                <tr style={{cursor:'pointer',background:open?'#f0f9fa':undefined}}
                    onClick={()=>setExpanded(open?null:b.id)}>
                  <td><SourceBadge source={b.source}/></td>
                  <td>
                    <div style={{fontWeight:600}}>{b.guest_name||<span style={{color:'#aaa',fontStyle:'italic',fontWeight:400}}>Not shared</span>}</div>
                    {isDirect && b.guests && <div style={{fontSize:11,color:'#888'}}>{b.guests} guest{b.guests!==1?'s':''}</div>}
                    {!isDirect && b.uid && <div style={{fontSize:10,color:'#aaa',fontFamily:'monospace'}}>{b.uid.split('@')[0]}</div>}
                  </td>
                  <td>
                    {b.phone
                      ? <div><a href={`tel:${b.phone}`} style={{color:'#0d5f6b',fontWeight:600}} onClick={e=>e.stopPropagation()}>📞 {b.phone}</a></div>
                      : <div style={{color:'#aaa',fontSize:11}}>{isDirect?'No phone':otaNote}</div>}
                    {b.email
                      ? <div style={{marginTop:2}}><a href={`mailto:${b.email}`} style={{color:'#0d5f6b',fontSize:12}} onClick={e=>e.stopPropagation()}>✉ {b.email}</a></div>
                      : !b.phone && <div style={{color:'#aaa',fontSize:11}}>{isDirect?'No email':''}</div>}
                  </td>
                  <td style={{fontWeight:500}}>{b.checkin}</td>
                  <td style={{fontWeight:500}}>{b.checkout}</td>
                  <td style={{textAlign:'center'}}>{nights}</td>
                  <td>{isDirect?<strong>${b.total.toFixed(2)}</strong>:<span style={{color:'#aaa',fontSize:11}}>OTA rate</span>}</td>
                  <td><span className={`status-badge status-${b.status.replace(/_/g,'-')}`}>{b.status.replace(/_/g,' ')}</span></td>
                  <td style={{textAlign:'center'}}>{b.email_sent?<span style={{color:'#28704e',fontWeight:700}}>✓</span>:<span style={{color:'#bbb'}}>—</span>}</td>
                  <td onClick={e=>e.stopPropagation()}>
                    {isDirect && b.status !== 'cancelled' && (
                      <button style={{fontSize:11,padding:'3px 8px',background:'#fde7e5',border:'1px solid #f5c2c0',borderRadius:5,color:'#a74840',cursor:'pointer'}}
                        onClick={async()=>{
                          if(!confirm('Cancel this booking?'))return;
                          await api(`/api/admin/bookings/${b.db_id}/status`,{method:'PATCH',headers:headers(),body:JSON.stringify({status:'cancelled'})});
                          load();
                        }}>Cancel</button>
                    )}
                  </td>
                </tr>
                {open&&(
                  <tr style={{background:'#f0f9fa'}}>
                    <td colSpan={10} style={{padding:'16px 20px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:10,fontSize:13}}>
                        {/* Platform always shown first */}
                        <div style={{padding:'10px 14px',background:SOURCE_COLORS[b.source]||'#555',borderRadius:8,color:'#fff'}}>
                          <div style={{fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:1,opacity:.8,marginBottom:4}}>Booked via</div>
                          <div style={{fontWeight:800,fontSize:16}}>{SOURCE_LABELS[b.source]||b.source}</div>
                          {!isDirect && b.uid && (() => {
                            const code = b.uid.split('@')[0];
                            const url = b.source === 'airbnb'
                              ? `https://www.airbnb.com/hosting/reservations/details/${code}`
                              : b.source === 'vrbo'
                              ? `https://www.vrbo.com/owner/reservations`
                              : null;
                            return <>
                              <div style={{fontSize:11,opacity:.85,marginTop:4,fontWeight:600}}>Ref: {code}</div>
                              {url && <a href={url} target="_blank" rel="noopener noreferrer"
                                style={{display:'inline-block',marginTop:6,fontSize:11,padding:'3px 10px',background:'rgba(255,255,255,.2)',borderRadius:12,color:'#fff',textDecoration:'none',fontWeight:600}}>
                                View in {SOURCE_LABELS[b.source]} →
                              </a>}
                            </>;
                          })()}
                        </div>
                        <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                          <div style={{color:'#5a8a90',fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Guest name</div>
                          <div style={{fontWeight:600}}>{b.guest_name||<span style={{color:'#aaa',fontStyle:'italic'}}>Not shared by platform</span>}</div>
                        </div>
                        <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                          <div style={{color:'#5a8a90',fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Phone</div>
                          {b.phone
                            ? <a href={`tel:${b.phone}`} style={{color:'#0d5f6b',fontWeight:600}}>{b.phone}</a>
                            : <span style={{color:'#aaa',fontSize:12,fontStyle:'italic'}}>{isDirect?'Not provided':'Not in iCal feed'}</span>}
                        </div>
                        <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                          <div style={{color:'#5a8a90',fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Email</div>
                          {b.email
                            ? <a href={`mailto:${b.email}`} style={{color:'#0d5f6b',fontWeight:600,wordBreak:'break-all'}}>{b.email}</a>
                            : <span style={{color:'#aaa',fontSize:12,fontStyle:'italic'}}>{isDirect?'Not provided':'Not in iCal feed'}</span>}
                        </div>
                        {isDirect && <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                          <div style={{color:'#5a8a90',fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Home address</div>
                          <div style={{fontWeight:500}}>{b.address||<span style={{color:'#aaa',fontStyle:'italic'}}>Not provided</span>}</div>
                        </div>}
                        <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                          <div style={{color:'#5a8a90',fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Stay</div>
                          <div style={{fontWeight:600}}>{b.checkin} → {b.checkout}</div>
                          <div style={{color:'#888',fontSize:12}}>{nights} night{nights!==1?'s':''}{isDirect&&b.guests?` · ${b.guests} guest${b.guests!==1?'s':''}`:''}</div>
                        </div>
                        {isDirect && <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                          <div style={{color:'#5a8a90',fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Total charged</div>
                          <div style={{fontWeight:800,fontSize:18,color:'#0d5f6b'}}>${b.total.toFixed(2)}</div>
                        </div>}
                        <div style={{padding:'10px 14px',background:b.email_sent?'#edf7f0':'#fff8f5',borderRadius:8,border:`1px solid ${b.email_sent?'#b3e0c0':'#f5c2c0'}`}}>
                          <div style={{color:'#5a8a90',fontWeight:700,fontSize:10,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Confirmation email</div>
                          <div style={{fontWeight:700,color:b.email_sent?'#28704e':'#a74840',marginBottom:b.email_sent?0:8}}>{b.email_sent?'✓ Sent to guest':'Not sent yet'}</div>
                          {!b.email_sent && isDirect && b.email && (
                            <SendConfirmBtn dbId={b.db_id} headers={headers} onSent={load}/>
                          )}
                        </div>
                      </div>
                      {/* Edit guest details inline form */}
                      {editingId === b.id ? (
                        <div style={{marginTop:14,padding:'14px 16px',background:'#fff',borderRadius:8,border:'1px solid #c5dde2'}}>
                          <div style={{fontWeight:700,fontSize:13,color:'#0d5f6b',marginBottom:10}}>Edit guest details</div>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
                            {!isDirect && (
                              <div>
                                <div style={{fontSize:11,fontWeight:600,color:'#5a8a90',marginBottom:4,textTransform:'uppercase'}}>Platform</div>
                                <select value={editForm.platform} onChange={e=>setEditForm(f=>({...f,platform:e.target.value}))}
                                  style={{width:'100%',padding:'6px 10px',borderRadius:6,border:'1px solid #c5dde2',fontSize:13,boxSizing:'border-box'}}>
                                  <option value="airbnb">Airbnb</option>
                                  <option value="vrbo">VRBO</option>
                                  <option value="booking.com">Booking.com</option>
                                  <option value="direct">Direct</option>
                                </select>
                              </div>
                            )}
                            {(['guest_name','guest_phone','guest_email'] as const).map(field=>(
                              <div key={field}>
                                <div style={{fontSize:11,fontWeight:600,color:'#5a8a90',marginBottom:4,textTransform:'uppercase'}}>{field.replace('guest_','').replace('_',' ')}</div>
                                <input value={editForm[field]} onChange={e=>setEditForm(f=>({...f,[field]:e.target.value}))}
                                  placeholder={field==='guest_email'?'email@example.com':field==='guest_phone'?'+1 (555) 000-0000':'Full name'}
                                  style={{width:'100%',padding:'6px 10px',borderRadius:6,border:'1px solid #c5dde2',fontSize:13,boxSizing:'border-box'}}/>
                              </div>
                            ))}
                          </div>
                          <div style={{display:'flex',gap:8,marginTop:12}}>
                            <button disabled={editSaving}
                              onClick={async()=>{
                                setEditSaving(true);
                                await api(`/api/admin/ical/${b.db_id}/guest`,{method:'PATCH',headers:headers(),body:JSON.stringify(editForm)});
                                setEditSaving(false); setEditingId(null); load();
                              }}
                              style={{padding:'6px 18px',borderRadius:6,background:'#0d5f6b',color:'#fff',border:'none',fontWeight:700,fontSize:13,cursor:'pointer'}}>
                              {editSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={()=>setEditingId(null)}
                              style={{padding:'6px 14px',borderRadius:6,background:'#f0f4f5',color:'#555',border:'1px solid #d0e4e8',fontSize:13,cursor:'pointer'}}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={e=>{e.stopPropagation();setEditingId(b.id);setEditForm({guest_name:b.guest_name,guest_phone:b.phone,guest_email:b.email,platform:b.source});}}
                          style={{marginTop:12,padding:'5px 14px',borderRadius:6,border:'1px solid #0d5f6b',background:'#f0fafb',color:'#0d5f6b',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                          ✏️ Edit guest details
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>;
            })}
          </tbody>
        </table>
        </div>
      }
    </SectionCard>
  </>;
}

type Campaign = {
  id: string; emoji: string; name: string; timing: string;
  subject: string; headline: string; body_html: string;
  sent_at: string | null; recipient_count: number;
};

function MarketingTab({ headers }: { headers: () => Record<string, string> }) {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [guestCount, setGuestCount] = React.useState(0);
  const [sending, setSending] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<Record<string, string>>({});
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    api<{ campaigns: Campaign[]; guest_email_count: number }>(
      '/api/admin/marketing/campaigns', { headers: headers() }
    ).then(r => { setCampaigns(r.campaigns); setGuestCount(r.guest_email_count); }).catch(() => {});
  }, []);

  async function send(c: Campaign) {
    if (!confirm(`Send "${c.name}" to all ${guestCount} guests with email addresses?\n\nThis will send immediately and cannot be undone.`)) return;
    setSending(c.id);
    setMsg(m => ({ ...m, [c.id]: '' }));
    try {
      const r = await api<{ sent: number; failed: number }>(`/api/admin/marketing/campaigns/${c.id}/send`, { method: 'POST', headers: headers() });
      setMsg(m => ({ ...m, [c.id]: `✓ Sent to ${r.sent} guest${r.sent !== 1 ? 's' : ''}${r.failed ? ` (${r.failed} failed)` : ''}` }));
      setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, sent_at: new Date().toISOString(), recipient_count: r.sent } : x));
    } catch {
      setMsg(m => ({ ...m, [c.id]: '✗ Send failed — check server logs' }));
    } finally {
      setSending(null);
    }
  }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#0a4f5e', fontSize: 22, fontWeight: 800 }}>Email Marketing</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
            {guestCount} guest{guestCount !== 1 ? 's' : ''} with email addresses in database
          </p>
        </div>
        <div style={{ background: '#e6f6f8', border: '1px solid #a8d8e4', borderRadius: 10, padding: '8px 18px', fontSize: 13, color: '#0a4f5e', fontWeight: 700 }}>
          ⚠️ All sends require your approval
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
        {campaigns.map(c => (
          <div key={c.id} style={{ background: '#fff', border: '1.5px solid #d0eaf0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(10,79,94,.07)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>{c.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0a4f5e' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{c.timing}</div>
              </div>
              {c.sent_at && (
                <div style={{ fontSize: 10, color: '#28704e', fontWeight: 700, background: '#edfaf3', border: '1px solid #b6e8cc', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                  ✓ Sent {new Date(c.sent_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, color: '#334', lineHeight: 1.6, marginBottom: 14 }}>
              <strong>Subject:</strong> {c.subject}
            </div>

            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: 16 }}
              dangerouslySetInnerHTML={{ __html: c.body_html.replace(/<p>/g, '<p style="margin:0 0 8px">') }} />

            {preview === c.id && (
              <div style={{ background: '#f6fbfc', border: '1px solid #c8e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 14, fontSize: 12, color: '#334', lineHeight: 1.7 }}>
                <strong>Email preview:</strong><br />
                <em>To:</em> guest@example.com<br />
                <em>Subject:</em> {c.subject}<br />
                <em>Headline:</em> {c.headline}<br />
                <em>CTA:</em> Book Now → orangebeachstay.com/book
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPreview(preview === c.id ? null : c.id)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #0a4f5e', background: '#f0fafb', color: '#0a4f5e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {preview === c.id ? 'Hide preview' : '👁 Preview'}
              </button>
              <button
                disabled={sending === c.id || guestCount === 0}
                onClick={() => send(c)}
                style={{ padding: '6px 18px', borderRadius: 8, border: 'none', background: sending === c.id ? '#aaa' : '#0a4f5e', color: '#fff', fontSize: 12, fontWeight: 800, cursor: sending === c.id || guestCount === 0 ? 'not-allowed' : 'pointer' }}>
                {sending === c.id ? 'Sending…' : `✉ Approve & Send to ${guestCount} guests`}
              </button>
              {msg[c.id] && (
                <span style={{ fontSize: 12, fontWeight: 700, color: msg[c.id].startsWith('✓') ? '#28704e' : '#c0392b' }}>
                  {msg[c.id]}
                </span>
              )}
            </div>

            {c.sent_at && (
              <div style={{ marginTop: 10, fontSize: 11, color: '#888' }}>
                Last sent {new Date(c.sent_at).toLocaleString()} · {c.recipient_count} recipients
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('overview');
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [emailStats, setEmailStats] = useState<any>(null);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [fetchMsg, setFetchMsg] = useState('');

  const headers = (t = token) => ({ Authorization: `Bearer ${t}` });

  const load = async (t = token) => {
    try {
      const [s, c, b, a, cu, es] = await Promise.all([
        api<Settings>('/api/admin/settings', { headers: headers(t) }),
        api<any[]>('/api/admin/chat', { headers: headers(t) }),
        api<any[]>('/api/admin/bookings', { headers: headers(t) }),
        api<any>(`/api/admin/analytics?days=${analyticsDays}`, { headers: headers(t) }),
        api<any[]>('/api/admin/customers', { headers: headers(t) }),
        api<any>('/api/admin/email-stats', { headers: headers(t) }),
      ]);
      setSettings(s); setChats(c); setBookings(b); setAnalytics(a); setCustomers(cu); setEmailStats(es);
    } catch { }
    // Sync guest details from inbox in the background, then refresh bookings
    setFetchingEmails(true);
    api('/api/admin/fetch-emails', { method: 'POST', headers: headers(t) })
      .then((r: any) => {
        if (r.updated > 0) setFetchMsg(`✓ ${r.updated} guest${r.updated !== 1 ? 's' : ''} synced from inbox`);
        return api<any[]>('/api/admin/bookings', { headers: headers(t) });
      })
      .then(setBookings)
      .catch(() => {})
      .finally(() => setFetchingEmails(false));
  };

  useEffect(() => { if (token) load(); }, [token]);
  useEffect(() => {
    if (token) api<any>(`/api/admin/analytics?days=${analyticsDays}`, { headers: headers() }).then(setAnalytics).catch(() => {});
  }, [analyticsDays]);

  const login = async () => {
    const r = await api<{ token: string }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    localStorage.setItem('adminToken', r.token);
    setToken(r.token);
  };

  const save = async () => {
    await api('/api/admin/settings', { method: 'PUT', headers: headers(), body: JSON.stringify(settings) });
    setSaved('Saved ✓'); setTimeout(() => setSaved(''), 2000);
  };

  if (!token) return (
    <main className="admin-login">
      <img src="/logo.svg" />
      <h1>Coastal Haven Admin</h1>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" onKeyDown={e => e.key === 'Enter' && login()} />
      <button className="btn wide" onClick={login}>Sign in</button>
    </main>
  );

  const confirmedBookings = bookings.filter(b => b.source === 'direct' && ['confirmed', 'payment_pending'].includes(b.status));
  const totalRevenue = confirmedBookings.reduce((s, b) => s + b.total, 0);
  const avgBooking = confirmedBookings.length ? totalRevenue / confirmedBookings.length : 0;
  const convRate = analytics?.unique_sessions ? ((analytics.funnel?.find((f: any) => f.step === 'Booking Confirmed')?.count || 0) / analytics.unique_sessions * 100).toFixed(1) : '0.0';

  const tabs = ['overview', 'calendar', 'pms', 'tasks', 'financials', 'pricing', 'screenshot', 'property', 'reviews', 'messages', 'analytics', 'bookings', 'payments', 'customers', 'chat', 'marketing', 'settings'];

  return (
    <main className="admin-page">
      <div className="admin-side">
        <img src="/logo.svg" />
        <h3>Owner Dashboard</h3>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.07)' }}>
            {t === 'pms' ? 'PMS' : t === 'financials' ? 'Financials' : t === 'screenshot' ? 'Import Data' : t.replace(/_/g,' ').charAt(0).toUpperCase() + t.replace(/_/g,' ').slice(1)}
          </button>
        ))}
        <button onClick={() => { localStorage.removeItem('adminToken'); setToken(''); }} style={{ marginTop: 'auto', background: 'rgba(200,60,60,.55)', borderRadius: 8, fontWeight: 600 }}>
          Sign out
        </button>
      </div>

      <div className="admin-main" style={{ overflowY: 'auto' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && <>
          <h1>Overview</h1>
          <p className="sub">Your property at a glance.</p>
          <div className="kpi-grid">
            {kpi('Total Revenue', `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 'confirmed bookings')}
            {kpi('Bookings', confirmedBookings.length, 'confirmed / paid')}
            {kpi('Unique Visitors', analytics?.unique_sessions ?? '–', `last ${analyticsDays} days`)}
            {kpi('Conversion Rate', `${convRate}%`, 'visitor → booking')}
            {kpi('Avg Booking Value', `$${avgBooking.toFixed(0)}`, 'per stay')}
            {kpi('Open Inquiries', chats.length, 'guest messages')}
            {kpi('Emails Sent', emailStats?.total_sent ?? '–', 'guest + OTA notifications')}
          </div>

          {emailStats && (
            <SectionCard title="Email delivery">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e8efed' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#5a8a90', fontWeight: 600 }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: '#5a8a90', fontWeight: 600 }}>Sent</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: '#5a8a90', fontWeight: 600 }}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f0f5f5' }}>
                    <td style={{ padding: '10px 12px' }}>Guest booking confirmations (direct)</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0d5f6b' }}>{emailStats.direct_confirmations_sent}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: emailStats.direct_unsent > 0 ? '#c0392b' : '#7aabb0' }}>{emailStats.direct_unsent}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px' }}>OTA reservation notifications (owner)</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0d5f6b' }}>{emailStats.ota_notifications_sent}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7aabb0' }}>{emailStats.ota_pending}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #e8efed', background: '#f5fafa' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>Total</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0d5f6b', fontSize: 16 }}>{emailStats.total_sent}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </SectionCard>
          )}

          {analytics?.daily && <>
            <SectionCard title="Traffic — last 30 days">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8efed" />
                  <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#0d5f6b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Booking status">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { status: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
                  { status: 'Pmt Pending', count: bookings.filter(b => b.status === 'payment_pending').length },
                  { status: 'Pending Approval', count: bookings.filter(b => b.status === 'pending_approval').length },
                ]}>
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d5f6b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </>}
        </>}

        {/* ── CALENDAR ── */}
        {tab === 'calendar' && <CalendarTab token={token} />}

        {/* ── PMS ── */}
        {tab === 'pms' && <PMSTab token={token} />}

        {/* ── TASKS ── */}
        {tab === 'tasks' && <TasksTab token={token} />}

        {/* ── FINANCIALS ── */}
        {tab === 'financials' && <FinancialsTab token={token} />}

        {/* ── SCREENSHOT ── */}
        {tab === 'screenshot' && <ScreenshotTab token={token} onSaved={load} />}

        {/* ── PRICING ── */}
        {tab === 'pricing' && <PricingTab token={token} />}

        {/* ── PROPERTY ── */}
        {tab === 'property' && <PropertyTab token={token} />}

        {/* ── REVIEWS ── */}
        {tab === 'reviews' && <ReviewsTab token={token} />}

        {/* ── MESSAGES ── */}
        {tab === 'messages' && <MessagesTab token={token} />}

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && <>
          <h1>Analytics</h1>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[7, 14, 30, 60, 90].map(d => (
              <button key={d} className={`btn${analyticsDays === d ? '' : ' light'}`} style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setAnalyticsDays(d)}>{d}d</button>
            ))}
          </div>
          {analytics && <>
            <div className="kpi-grid">
              {kpi('Total Events', analytics.total_events)}
              {kpi('Unique Sessions', analytics.unique_sessions)}
              {kpi('Page Views', analytics.event_counts?.page_view ?? 0)}
              {kpi('Quotes Requested', analytics.event_counts?.quote_requested ?? 0)}
              {kpi('Checkout Started', analytics.event_counts?.checkout_started ?? 0)}
              {kpi('Confirmed', analytics.event_counts?.booking_confirmed ?? 0)}
            </div>

            <SectionCard title="Daily traffic">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8efed" />
                  <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#0d5f6b" strokeWidth={2} dot={false} name="Events" />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Conversion funnel">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.funnel} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="step" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d5f6b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
              <SectionCard title="Devices">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={analytics.devices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {analytics.devices.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </SectionCard>

              <SectionCard title="Browsers">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={analytics.browsers} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {analytics.browsers.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </SectionCard>

              <SectionCard title="Operating Systems">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={analytics.os} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {analytics.os.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            <SectionCard title="Traffic by hour (UTC)">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={analytics.hourly}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={h => `${h}h`} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="events" fill="#6baeb6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <SectionCard title="Top countries">
                <table className="admin-table">
                  <thead><tr><th>Country</th><th>Visits</th></tr></thead>
                  <tbody>{analytics.countries.map((c: any) => <tr key={c.name}><td>{c.name || '(unknown)'}</td><td>{c.count}</td></tr>)}</tbody>
                </table>
              </SectionCard>
              <SectionCard title="Top referrers">
                <table className="admin-table">
                  <thead><tr><th>Source</th><th>Visits</th></tr></thead>
                  <tbody>{analytics.referrers.length ? analytics.referrers.map((r: any) => <tr key={r.name}><td>{r.name}</td><td>{r.count}</td></tr>) : <tr><td colSpan={2} style={{ color: '#aaa' }}>No referrer data yet</td></tr>}</tbody>
                </table>
              </SectionCard>
            </div>

            <SectionCard title="Recent events">
              <table className="admin-table">
                <thead><tr><th>Time</th><th>Event</th><th>Path</th><th>Country</th><th>Device</th><th>Browser</th></tr></thead>
                <tbody>
                  {analytics.recent.slice().reverse().slice(0, 30).map((e: any) => (
                    <tr key={e.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{e.ts.replace('T', ' ').slice(0, 19)}</td>
                      <td><span className={`event-badge event-${e.event}`}>{e.event}</span></td>
                      <td style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.path}</td>
                      <td>{e.country || '–'}</td>
                      <td>{e.device || '–'}</td>
                      <td>{e.browser || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          </>}
        </>}

        {/* ── BOOKINGS ── */}
        {tab === 'bookings' && <BookingsTab bookings={bookings} headers={headers} load={load} fetchingEmails={fetchingEmails} fetchMsg={fetchMsg} setFetchMsg={setFetchMsg}/>}


        {/* ── PAYMENTS ── */}
        {tab === 'payments' && <>
          <h1>Payments</h1>
          <div className="kpi-grid">
            {kpi('Total Revenue', `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
            {kpi('Paid Bookings', confirmedBookings.length)}
            {kpi('Avg Stay Value', `$${avgBooking.toFixed(2)}`)}
            {kpi('Stripe Mode', settings ? (localStorage.getItem('adminToken') ? 'test / live' : '–') : '–')}
          </div>

          {analytics?.daily && <SectionCard title="Revenue over time (estimate by booking date)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={(() => {
                const byDay: Record<string, number> = {};
                confirmedBookings.forEach(b => {
                  const d = b.created_at.slice(0, 10);
                  byDay[d] = (byDay[d] || 0) + b.total;
                });
                return analytics.daily.map((d: any) => ({ date: d.date, revenue: byDay[d.date] || 0 }));
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8efed" />
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#d9a14e" strokeWidth={2} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>}

          <SectionCard title="Payment records">
            <table className="admin-table">
              <thead><tr><th>Ref</th><th>Guest</th><th>Email</th><th>Dates</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {confirmedBookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>#CHV-{String(b.id).padStart(4, '0')}</strong></td>
                    <td>{b.guest_name || '—'}</td>
                    <td style={{ fontSize: 12 }}>{b.email || '—'}</td>
                    <td style={{ fontSize: 12 }}>{b.checkin} → {b.checkout}</td>
                    <td><strong>${b.total.toFixed(2)}</strong></td>
                    <td><span className={`status-badge status-${b.status.replace(/_/g, '-')}`}>{b.status}</span></td>
                    <td style={{ fontSize: 11 }}>{b.created_at.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </>}

        {/* ── CUSTOMERS ── */}
        {tab === 'customers' && (() => {
          const otaGuests  = bookings.filter(b => b.source !== 'direct' && (b.guest_name || b.email || b.phone));
          const directGuests = bookings.filter(b => b.source === 'direct' && (b.guest_name || b.email || b.phone));
          return <>
            <h1>Guests</h1>
            <div className="kpi-grid">
              {kpi('OTA Guests', otaGuests.length, 'Airbnb / VRBO / imported')}
              {kpi('Direct Guests', directGuests.length, 'booked via website')}
              {kpi('Registered accounts', customers.length, 'have login')}
              {kpi('Unique visitors', analytics?.unique_sessions ?? '–', `last ${analyticsDays} days`)}
            </div>

            {/* OTA / imported guests */}
            <SectionCard title="OTA & Imported Guests (Airbnb / VRBO)">
              <table className="admin-table">
                <thead><tr><th>Platform</th><th>Name</th><th>Email</th><th>Phone</th><th>Check-in</th><th>Check-out</th><th>Payout</th></tr></thead>
                <tbody>
                  {otaGuests.length === 0 && (
                    <tr><td colSpan={7} style={{ color: '#aaa', textAlign: 'center' }}>No OTA guests yet — import from the Import Data tab.</td></tr>
                  )}
                  {otaGuests.map(b => (
                    <tr key={b.id}>
                      <td><SourceBadge source={b.source} /></td>
                      <td><strong>{b.guest_name || '—'}</strong></td>
                      <td style={{ fontSize: 12 }}>{b.email ? <a href={`mailto:${b.email}`} style={{ color: 'var(--teal)' }}>{b.email}</a> : '—'}</td>
                      <td style={{ fontSize: 12 }}>{b.phone || '—'}</td>
                      <td style={{ fontSize: 12 }}>{b.checkin}</td>
                      <td style={{ fontSize: 12 }}>{b.checkout || '—'}</td>
                      <td style={{ fontSize: 12 }}>{b.total > 0 ? `$${b.total.toFixed(0)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>

            {/* Direct booking guests */}
            <SectionCard title="Direct Booking Guests">
              <table className="admin-table">
                <thead><tr><th>Ref</th><th>Name</th><th>Email</th><th>Phone</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {directGuests.length === 0 && (
                    <tr><td colSpan={8} style={{ color: '#aaa', textAlign: 'center' }}>No direct bookings with guest details yet.</td></tr>
                  )}
                  {directGuests.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontSize: 12 }}>#CHV-{String(b.db_id).padStart(4,'0')}</td>
                      <td><strong>{b.guest_name || '—'}</strong></td>
                      <td style={{ fontSize: 12 }}>{b.email ? <a href={`mailto:${b.email}`} style={{ color: 'var(--teal)' }}>{b.email}</a> : '—'}</td>
                      <td style={{ fontSize: 12 }}>{b.phone || '—'}</td>
                      <td style={{ fontSize: 12 }}>{b.checkin}</td>
                      <td style={{ fontSize: 12 }}>{b.checkout}</td>
                      <td><strong>${b.total.toFixed(0)}</strong></td>
                      <td><span className={`status-badge status-${b.status.replace(/_/g,'-')}`}>{b.status.replace(/_/g,' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>

            {/* Registered accounts */}
            <SectionCard title="Registered Accounts (direct login)">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Joined</th></tr></thead>
                <tbody>
                  {customers.length === 0 && (
                    <tr><td colSpan={5} style={{ color: '#aaa', textAlign: 'center' }}>No registered accounts yet.</td></tr>
                  )}
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.name || '—'}</strong></td>
                      <td><a href={`mailto:${c.email}`} style={{ color: 'var(--teal)' }}>{c.email}</a></td>
                      <td>{c.phone || '—'}</td>
                      <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                      <td style={{ fontSize: 11 }}>{c.created_at.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          </>;
        })()}

        {/* ── CHAT ── */}
        {tab === 'chat' && <>
          <h1>Guest Messages</h1>
          <p className="sub">{chats.length} message{chats.length !== 1 ? 's' : ''} received.</p>
          <SectionCard title="Inbox">
            {chats.length ? chats.map((c, i) => (
              <div className="chat-row" key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong>{c.name || 'Guest'}</strong>
                    {c.email && <> · <a href={`mailto:${c.email}`} style={{ color: 'var(--teal)' }}>{c.email}</a></>}
                  </div>
                  <span style={{ fontSize: 11, color: '#aaa' }}>{c.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <p style={{ margin: '8px 0 0' }}>{c.message}</p>
              </div>
            )) : <p style={{ color: '#aaa' }}>No messages yet.</p>}
          </SectionCard>
        </>}

        {/* ── MARKETING ── */}
        {tab === 'marketing' && <MarketingTab headers={headers} />}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && <>
          <h1>Settings</h1>
          <p className="sub">Change booking behavior without editing code.</p>
          <SectionCard title="Booking">
            <label className="switch-row">
              <span><strong>Instant booking</strong><small>Turn off to require owner approval before payment.</small></span>
              <input type="checkbox" checked={settings.instant_booking} onChange={e => setSettings({ ...settings, instant_booking: e.target.checked })} />
            </label>
            <label>Security protection
              <select value={settings.security_mode} onChange={e => setSettings({ ...settings, security_mode: e.target.value })}>
                <option value="authorization">Refundable card authorization (20% of total)</option>
                <option value="waiver">Damage waiver</option>
                <option value="none">None</option>
              </select>
            </label>
            <label>Security amount ($)<input type="number" value={settings.security_amount} onChange={e => setSettings({ ...settings, security_amount: Number(e.target.value) })} /></label>
          </SectionCard>
          <SectionCard title="Pricing">
            <label>Direct discount (%)<input type="number" value={settings.direct_discount_percent} onChange={e => setSettings({ ...settings, direct_discount_percent: Number(e.target.value) })} /></label>
            <label>Cleaning fee ($)<input type="number" value={settings.cleaning_fee} onChange={e => setSettings({ ...settings, cleaning_fee: Number(e.target.value) })} /></label>
            <label>Tax rate (%)<input type="number" value={settings.tax_percent} onChange={e => setSettings({ ...settings, tax_percent: Number(e.target.value) })} /></label>
            <div className="two">
              <label>Promo code<input value={settings.promo_code} onChange={e => setSettings({ ...settings, promo_code: e.target.value })} /></label>
              <label>Promo %<input type="number" value={settings.promo_percent} onChange={e => setSettings({ ...settings, promo_percent: Number(e.target.value) })} /></label>
            </div>
          </SectionCard>
          <SectionCard title="OTA Platform Markups">
            <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: 14 }}>
              Markup applied on top of PriceLabs base price for each platform. Higher OTA prices incentivize direct bookings. View calculated prices in the Pricing tab → Platform Prices.
            </p>
            <label>Airbnb markup (%)<input type="number" min={0} value={settings.airbnb_markup_percent} onChange={e => setSettings({ ...settings, airbnb_markup_percent: Number(e.target.value) })} /></label>
            <label>VRBO markup (%)<input type="number" min={0} value={settings.vrbo_markup_percent} onChange={e => setSettings({ ...settings, vrbo_markup_percent: Number(e.target.value) })} /></label>
            <label>Booking.com markup (%)<input type="number" min={0} value={settings.booking_markup_percent} onChange={e => setSettings({ ...settings, booking_markup_percent: Number(e.target.value) })} /></label>
          </SectionCard>
          <SectionCard title="Cancellation policy">
            <textarea rows={5} value={settings.cancellation_policy} onChange={e => setSettings({ ...settings, cancellation_policy: e.target.value })} />
          </SectionCard>
          <button className="btn" onClick={save}>Save settings</button>
          {saved && <span className="saved" style={{ marginLeft: 12 }}>{saved}</span>}

          <SectionCard title="Email">
            <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: 14 }}>
              Send a test email (booking confirmation template) to your SMTP address to verify everything is working.
            </p>
            <TestEmailButton token={token} />
          </SectionCard>

          <SectionCard title="Email Template Previews">
            <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14 }}>
              Preview all 4 marketing email templates in a new tab — beach & Gulf imagery, industry-standard design.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { key: 'booking', label: '✅ Booking Confirmation', desc: 'Sent on payment success' },
                { key: 'pre-arrival', label: '🏠 Pre-Arrival (48h)', desc: 'Door code & check-in guide' },
                { key: 'checkout', label: '🌅 Checkout Reminder', desc: 'Sent night before checkout' },
                { key: 'review', label: '⭐ Review Request', desc: 'Sent after checkout' },
              ].map(t => (
                <a
                  key={t.key}
                  href={`/api/admin/preview-email/${t.key}?token=${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', padding: '14px 16px', borderRadius: 10,
                    background: 'var(--cream)', border: '1px solid var(--border)',
                    textDecoration: 'none', color: 'inherit', transition: 'box-shadow .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(13,95,107,.15)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.desc}</div>
                </a>
              ))}
            </div>
          </SectionCard>
        </>}
      </div>
    </main>
  );
}
