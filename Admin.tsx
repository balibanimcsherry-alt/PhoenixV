import { useEffect, useState } from 'react';
import { PMSTab } from './PMS';
import { CalendarTab } from './CalendarTab';
import { TasksTab } from './TasksTab';
import { FinancialsTab } from './FinancialsTab';
import { PricingTab } from './PricingTab';
import { PropertyTab } from './PropertyTab';
import { ReviewsTab } from './ReviewsTab';
import { MessagesTab } from './MessagesTab';
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

  const confirmedBookings = bookings.filter(b => ['confirmed', 'payment_pending'].includes(b.status));
  const totalRevenue = confirmedBookings.reduce((s, b) => s + b.total, 0);
  const avgBooking = confirmedBookings.length ? totalRevenue / confirmedBookings.length : 0;
  const convRate = analytics?.unique_sessions ? ((analytics.funnel?.find((f: any) => f.step === 'Booking Confirmed')?.count || 0) / analytics.unique_sessions * 100).toFixed(1) : '0.0';

  const tabs = ['overview', 'calendar', 'pms', 'tasks', 'financials', 'pricing', 'property', 'reviews', 'messages', 'analytics', 'bookings', 'payments', 'customers', 'chat', 'settings'];

  return (
    <main className="admin-page">
      <div className="admin-side">
        <img src="/logo.svg" />
        <h3>Owner Dashboard</h3>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? 'rgba(255,255,255,.15)' : undefined }}>
            {t === 'pms' ? 'PMS' : t === 'financials' ? 'Financials' : t.replace(/_/g,' ').charAt(0).toUpperCase() + t.replace(/_/g,' ').slice(1)}
          </button>
        ))}
        <button onClick={() => { localStorage.removeItem('adminToken'); setToken(''); }} style={{ marginTop: 'auto', background: 'rgba(255,255,255,.12)', borderRadius: 8, fontWeight: 600 }}>
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
        {tab === 'bookings' && (() => {
          const [expandedBooking, setExpandedBooking] = React.useState<number|null>(null);
          const cancelled = bookings.filter(b => b.status === 'cancelled').length;
          const emailSentCount = bookings.filter(b => b.email_sent).length;
          const totalRev = confirmedBookings.reduce((s: number, b: any) => s + b.total, 0);

          // monthly bookings for bar chart
          const byMonth: Record<string, number> = {};
          confirmedBookings.forEach((b: any) => {
            const m = b.created_at.slice(0, 7);
            byMonth[m] = (byMonth[m] || 0) + 1;
          });
          const monthData = Object.entries(byMonth).sort().slice(-6).map(([month, count]) => ({ month: month.slice(5), count }));

          // revenue by day aligned to analytics daily
          const revenueByDay: Record<string, number> = {};
          confirmedBookings.forEach((b: any) => { const d = b.created_at.slice(0,10); revenueByDay[d] = (revenueByDay[d]||0)+b.total; });

          return <>
          <h1>Bookings</h1>
          <div className="kpi-grid">
            {kpi('Total Bookings', bookings.length, 'all time')}
            {kpi('Confirmed', bookings.filter((b:any) => b.status === 'confirmed').length, 'paid & active')}
            {kpi('Revenue', `$${totalRev.toLocaleString('en-US',{maximumFractionDigits:0})}`, 'confirmed stays')}
            {kpi('Pending Approval', bookings.filter((b:any) => b.status === 'pending_approval').length, 'awaiting review')}
            {kpi('Cancelled', cancelled, 'all time')}
            {kpi('Confirmations Sent', emailSentCount, 'emails delivered')}
          </div>

          {/* Revenue over time */}
          {analytics?.daily && analytics.daily.some((d: any) => revenueByDay[d.date]) && (
            <SectionCard title="Revenue by booking date">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.daily.map((d: any) => ({ date: d.date, revenue: revenueByDay[d.date] || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8efed" />
                  <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(0)}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#0d5f6b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {monthData.length > 0 && (
            <SectionCard title="Confirmed bookings by month">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d5f6b" radius={[6,6,0,0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          <SectionCard title="All bookings">
            <table className="admin-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Ref</th><th>Guest</th><th>Phone</th><th>Email</th>
                  <th>Check-in</th><th>Check-out</th><th>Nights</th><th>Guests</th>
                  <th>Total</th><th>Status</th><th>Sent</th><th>Booked</th><th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => {
                  const nights = Math.round((new Date(b.checkout).getTime() - new Date(b.checkin).getTime()) / 86400000);
                  const ref = `#CHV-${String(b.id).padStart(4,'0')}`;
                  const expanded = expandedBooking === b.id;
                  const missing = !b.guest_name || !b.email || !b.phone || !b.address;
                  const missingTag = (v: string) => v
                    ? v
                    : <span style={{background:'#fde7e5',color:'#a74840',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4}}>MISSING</span>;
                  return <React.Fragment key={b.id}>
                    <tr style={{ cursor: 'pointer', background: expanded ? '#f0f9fa' : missing ? '#fffaf8' : undefined }}
                        onClick={() => setExpandedBooking(expanded ? null : b.id)}>
                      <td><strong>{ref}</strong>{missing && <span style={{marginLeft:6,fontSize:9,background:'#fde7e5',color:'#a74840',padding:'1px 5px',borderRadius:4,fontWeight:700}}>!</span>}</td>
                      <td>{b.guest_name || <span style={{color:'#c0392b',fontWeight:600,fontSize:12}}>Missing</span>}</td>
                      <td style={{ fontSize: 12 }}>{b.phone || <span style={{color:'#c0392b',fontSize:12}}>Missing</span>}</td>
                      <td style={{ fontSize: 12 }}>{b.email ? <a href={`mailto:${b.email}`} style={{color:'#0d5f6b'}} onClick={e=>e.stopPropagation()}>{b.email}</a> : <span style={{color:'#c0392b',fontSize:12}}>Missing</span>}</td>
                      <td>{b.checkin}</td>
                      <td>{b.checkout}</td>
                      <td>{nights}</td>
                      <td>{b.guests}</td>
                      <td><strong>${b.total.toFixed(2)}</strong></td>
                      <td><span className={`status-badge status-${b.status.replace(/_/g,'-')}`}>{b.status.replace(/_/g,' ')}</span></td>
                      <td>{b.email_sent ? <span style={{color:'#28704e',fontWeight:700}}>✓</span> : <span style={{color:'#bbb',fontSize:12}}>No</span>}</td>
                      <td style={{ fontSize: 11 }}>{b.created_at.slice(0,10)}</td>
                      <td onClick={e=>e.stopPropagation()}>
                        {!['cancelled'].includes(b.status) && (
                          <button style={{ fontSize: 11, padding: '3px 8px', background: '#fde7e5', border: '1px solid #f5c2c0', borderRadius: 5, color: '#a74840', cursor: 'pointer' }}
                            onClick={async () => {
                              if (!confirm(`Cancel ${ref}?`)) return;
                              await api(`/api/admin/bookings/${b.id}/status`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status: 'cancelled' }) });
                              load();
                            }}>Cancel</button>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr style={{ background: '#f5fbfc' }}>
                        <td colSpan={13} style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, fontSize: 13 }}>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Full name</div>
                              <div style={{fontWeight:600}}>{missingTag(b.guest_name)}</div>
                            </div>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Email</div>
                              <div>{b.email ? <a href={`mailto:${b.email}`} style={{color:'#0d5f6b',fontWeight:600}}>{b.email}</a> : missingTag('')}</div>
                            </div>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Phone</div>
                              <div>{b.phone ? <a href={`tel:${b.phone}`} style={{color:'#0d5f6b',fontWeight:600}}>{b.phone}</a> : missingTag('')}</div>
                            </div>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0',gridColumn:'span 2'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Home address</div>
                              <div style={{fontWeight:500}}>{missingTag(b.address)}</div>
                            </div>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Booking ref</div>
                              <div style={{fontWeight:700}}>{ref}</div>
                            </div>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Stay</div>
                              <div>{b.checkin} → {b.checkout} · <strong>{nights}n</strong> · {b.guests} guest{b.guests!==1?'s':''}</div>
                            </div>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Total charged</div>
                              <div style={{fontSize:18,fontWeight:800,color:'#0d5f6b'}}>${b.total.toFixed(2)}</div>
                            </div>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Status</div>
                              <span className={`status-badge status-${b.status.replace(/_/g,'-')}`}>{b.status.replace(/_/g,' ')}</span>
                            </div>
                            <div style={{padding:'10px 14px',background: b.email_sent ? '#edf7f0' : '#fff8f5',borderRadius:8,border:`1px solid ${b.email_sent?'#b3e0c0':'#f5c2c0'}`}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Confirmation email</div>
                              <div style={{fontWeight:700,color: b.email_sent ? '#28704e' : '#a74840'}}>{b.email_sent ? '✓ Sent' : '✕ Not sent'}</div>
                            </div>
                            <div style={{padding:'10px 14px',background:'#fff',borderRadius:8,border:'1px solid #ddeef0'}}>
                              <div style={{color:'#5a8a90',fontWeight:700,fontSize:11,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Booked on</div>
                              <div>{b.created_at.slice(0,16).replace('T',' ')}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>;
                })}
              </tbody>
            </table>
          </SectionCard>
          </>;
        })()}

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
        {tab === 'customers' && <>
          <h1>Customers</h1>
          <div className="kpi-grid">
            {kpi('Registered accounts', customers.length)}
            {kpi('Direct bookings', bookings.filter(b => b.guest_name || b.email).length)}
            {kpi('Unique visitors', analytics?.unique_sessions ?? '–', `last ${analyticsDays} days`)}
            {kpi('Top country', analytics?.countries?.[0]?.name || '–')}
          </div>

          {/* Registered accounts */}
          <SectionCard title="Registered accounts">
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

          {/* All bookings with full contact */}
          <SectionCard title="All direct bookings — full guest details">
            <table className="admin-table">
              <thead><tr><th>Ref</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Check-in</th><th>Check-out</th><th>Guests</th><th>Total</th><th>Status</th><th>Booked</th></tr></thead>
              <tbody>
                {bookings.filter(b => b.guest_name || b.email || b.phone).map(b => (
                  <tr key={b.id}>
                    <td style={{ fontSize: 12 }}>#CHV-{String(b.id).padStart(4,'0')}</td>
                    <td><strong>{b.guest_name || '—'}</strong></td>
                    <td style={{ fontSize: 12 }}><a href={`mailto:${b.email}`} style={{ color: 'var(--teal)' }}>{b.email || '—'}</a></td>
                    <td style={{ fontSize: 12 }}>{b.phone || '—'}</td>
                    <td style={{ fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address || '—'}</td>
                    <td style={{ fontSize: 12 }}>{b.checkin}</td>
                    <td style={{ fontSize: 12 }}>{b.checkout}</td>
                    <td>{b.guests}</td>
                    <td><strong>${b.total.toFixed(0)}</strong></td>
                    <td><span className={`status-badge status-${b.status.replace(/_/g,'-')}`}>{b.status.replace(/_/g,' ')}</span></td>
                    <td style={{ fontSize: 11 }}>{b.created_at.slice(0,10)}</td>
                  </tr>
                ))}
                {bookings.filter(b => b.guest_name || b.email || b.phone).length === 0 && (
                  <tr><td colSpan={11} style={{ color: '#aaa', textAlign: 'center' }}>No direct bookings with guest details yet.</td></tr>
                )}
              </tbody>
            </table>
          </SectionCard>
        </>}

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
