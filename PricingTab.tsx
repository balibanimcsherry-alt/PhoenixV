import { useEffect, useState } from 'react';
import { api } from './api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const PLATFORMS = [
  { key: 'airbnb',  label: 'Airbnb',       color: '#FF5A5F', markupKey: 'airbnb_markup_percent'  },
  { key: 'vrbo',    label: 'VRBO',          color: '#3D5A80', markupKey: 'vrbo_markup_percent'    },
  { key: 'booking', label: 'Booking.com',   color: '#003580', markupKey: 'booking_markup_percent' },
];

function priceColor(price: number, min: number, max: number) {
  if (max === min) return '#6baeb6';
  const pct = (price - min) / (max - min);
  if (pct > 0.75) return '#22863a';
  if (pct > 0.4)  return '#d9a14e';
  return '#6baeb6';
}

export function PricingTab({ token }: { token: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [data, setData] = useState<any[]>([]);
  const [markups, setMarkups] = useState({ airbnb_markup_percent: 17, vrbo_markup_percent: 20, booking_markup_percent: 25 });
  const [directDiscount, setDirectDiscount] = useState(10);
  const [configOpen, setConfigOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState({ airbnb_markup_percent: 17, vrbo_markup_percent: 20, booking_markup_percent: 25, direct_discount_percent: 10 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ last_synced: string | null; cached_days: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<'calendar' | 'platform'>('calendar');
  const h = { Authorization: `Bearer ${token}` };

  const loadSyncStatus = () =>
    api<any>('/api/admin/pricing/sync-status', { headers: h }).then(setSyncStatus).catch(() => {});

  useEffect(() => { loadSyncStatus(); }, [token]);

  const syncNow = async () => {
    setSyncing(true);
    setError('');
    try {
      await api<any>('/api/admin/pricing/sync', { method: 'POST', headers: h });
      await loadSyncStatus();
      load();
    } catch (e: any) {
      setError(e?.message || 'Sync failed');
    }
    setSyncing(false);
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await api<any>(`/api/admin/pricing?year=${year}&month=${month + 1}`, { headers: h });
      if (r.error) setError(r.error);
      else setData(r.daily || []);
      if (r.airbnb_markup_percent !== undefined) {
        const m = { airbnb_markup_percent: r.airbnb_markup_percent, vrbo_markup_percent: r.vrbo_markup_percent, booking_markup_percent: r.booking_markup_percent };
        setMarkups(m);
        setConfigDraft(d => ({ ...d, ...m }));
      }
    } catch { setError('Failed to load pricing'); }
    setLoading(false);
  };

  // Load full settings (for direct_discount_percent) when config panel opens
  useEffect(() => {
    if (!configOpen) return;
    api<any>('/api/admin/settings', { headers: h }).then(s => {
      setDirectDiscount(s.direct_discount_percent ?? 10);
      setConfigDraft(d => ({ ...d, direct_discount_percent: s.direct_discount_percent ?? 10 }));
    }).catch(() => {});
  }, [configOpen]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const current = await api<any>('/api/admin/settings', { headers: h });
      await api('/api/admin/settings', { method: 'PUT', headers: h, body: JSON.stringify({ ...current, ...configDraft }) });
      setMarkups({ airbnb_markup_percent: configDraft.airbnb_markup_percent, vrbo_markup_percent: configDraft.vrbo_markup_percent, booking_markup_percent: configDraft.booking_markup_percent });
      setDirectDiscount(configDraft.direct_discount_percent);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  useEffect(() => { load(); }, [year, month, token]);

  const prev = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const next = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);

  const dayMap: Record<string, any> = {};
  data.forEach(d => { dayMap[d.date] = d; });

  const prices = data.map(d => d.price).filter(Boolean);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 1;
  const avgP = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const bookedNights = data.filter(d => d.occupancy === 1).length;

  const getMarkup = (platformKey: string) => {
    if (platformKey === 'airbnb') return markups.airbnb_markup_percent;
    if (platformKey === 'vrbo') return markups.vrbo_markup_percent;
    if (platformKey === 'booking') return markups.booking_markup_percent;
    return 0;
  };

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div>
      <h1>Pricing Calendar</h1>
      <p className="sub">Live nightly rates from PriceLabs with OTA platform markups.</p>

      {/* Sync bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: '#f5f9fa', borderRadius: 8, border: '1px solid #deeaec' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0d5f6b' }}>PriceLabs Sync</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {syncStatus?.last_synced
              ? `Last synced: ${new Date(syncStatus.last_synced + 'Z').toLocaleString()} · ${syncStatus.cached_days} days cached`
              : 'Not yet synced — click Sync Now to cache all prices'}
          </div>
        </div>
        <button className="btn" style={{ padding: '8px 18px', fontSize: 13, whiteSpace: 'nowrap' }} onClick={syncNow} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {/* Configurable markups / markdown */}
      <div style={{ marginBottom: 20, border: '1px solid #deeaec', borderRadius: 10, overflow: 'hidden' }}>
        <button onClick={() => setConfigOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f5f9fa', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#0d5f6b' }}>
          <span>⚙️ Configure Markups &amp; Direct Discount</span>
          <span style={{ fontSize: 12, color: '#888' }}>{configOpen ? '▲ Close' : '▼ Edit'}</span>
        </button>
        {configOpen && (
          <div style={{ padding: '16px 20px', background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, alignItems: 'end' }}>
            {[
              { label: 'Airbnb markup', key: 'airbnb_markup_percent', color: '#FF5A5F', sign: '+' },
              { label: 'VRBO markup',   key: 'vrbo_markup_percent',   color: '#3D5A80', sign: '+' },
              { label: 'Booking.com markup', key: 'booking_markup_percent', color: '#003580', sign: '+' },
              { label: 'Direct discount', key: 'direct_discount_percent', color: '#0d5f6b', sign: '−' },
            ].map(f => (
              <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: f.color }}>{f.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, color: f.color, fontWeight: 700 }}>{f.sign}</span>
                  <input
                    type="number" min={0} max={100}
                    value={(configDraft as any)[f.key]}
                    onChange={e => setConfigDraft(d => ({ ...d, [f.key]: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '7px 10px', border: `1px solid ${f.color}50`, borderRadius: 6, fontSize: 14, fontWeight: 700, color: f.color }}
                  />
                  <span style={{ fontSize: 13, color: '#aaa' }}>%</span>
                </div>
              </label>
            ))}
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn" onClick={saveConfig} disabled={saving} style={{ padding: '8px 20px' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saved && <span style={{ color: '#28a745', fontWeight: 700, alignSelf: 'center' }}>✓ Saved</span>}
              <span style={{ color: '#aaa', fontSize: 12, alignSelf: 'center' }}>Changes apply immediately to the price display below.</span>
            </div>
          </div>
        )}
      </div>

      {/* Platform markup summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {PLATFORMS.map(p => {
          const markup = getMarkup(p.key);
          const avgWithMarkup = avgP ? Math.round(avgP * (1 + markup / 100)) : 0;
          return (
            <div key={p.key} style={{ background: '#fff', border: `1px solid ${p.color}30`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                <strong style={{ fontSize: 12, color: p.color }}>{p.label}</strong>
                <span style={{ marginLeft: 'auto', background: p.color + '20', color: p.color, padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>+{markup}%</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#222' }}>${avgWithMarkup}/night</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>avg this month · base ${Math.round(avgP)}</div>
            </div>
          );
        })}
        {/* Direct booking */}
        <div style={{ background: '#fff', border: '1px solid #0d5f6b30', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#0d5f6b', display: 'inline-block' }} />
            <strong style={{ fontSize: 12, color: '#0d5f6b' }}>Direct</strong>
            <span style={{ marginLeft: 'auto', background: '#0d5f6b20', color: '#0d5f6b', padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>−{directDiscount}%</span>
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#222' }}>${avgP ? Math.round(avgP * (1 - directDiscount / 100)) : 0}/night</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>avg this month · save vs OTAs</div>
        </div>
      </div>

      {/* Stats */}
      {data.length > 0 && (
        <div className="kpi-grid" style={{ marginBottom: 20 }}>
          <div className="kpi-card"><div className="kpi-value">${avgP.toFixed(0)}</div><div className="kpi-label">PriceLabs avg</div></div>
          <div className="kpi-card"><div className="kpi-value">${minP}</div><div className="kpi-label">Min price</div></div>
          <div className="kpi-card"><div className="kpi-value">${maxP}</div><div className="kpi-label">Max price</div></div>
          <div className="kpi-card"><div className="kpi-value">{bookedNights}</div><div className="kpi-label">Booked nights</div></div>
        </div>
      )}

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={view === 'calendar' ? 'btn' : 'btn light'} style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setView('calendar')}>📅 Calendar</button>
        <button className={view === 'platform' ? 'btn' : 'btn light'} style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setView('platform')}>📊 Platform Prices</button>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn light" style={{ padding: '6px 14px', fontSize: 16 }} onClick={prev}>‹</button>
        <h2 style={{ margin: 0, minWidth: 200, textAlign: 'center' }}>{MONTHS[month]} {year}</h2>
        <button className="btn light" style={{ padding: '6px 14px', fontSize: 16 }} onClick={next}>›</button>
        <button className="btn light" style={{ padding: '6px 12px', fontSize: 13, marginLeft: 8 }} onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}>Today</button>
        {loading && <span style={{ color: '#888', fontSize: 13 }}>Loading…</span>}
      </div>

      {error && <div style={{ background: '#fde7e5', borderRadius: 10, padding: '12px 16px', color: '#a74840', marginBottom: 16 }}>{error}</div>}

      {/* Calendar view */}
      {view === 'calendar' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {DOWS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#666', padding: '6px 0' }}>{d}</div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} style={{ minHeight: 80, background: '#f9f9f7', borderRadius: 6 }} />;
              const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const d = dayMap[ds];
              const isToday = ds === todayStr;
              const isPast = ds < todayStr;
              const isBooked = d?.occupancy === 1;
              const price = d?.price;
              const minStay = d?.min_stay;
              const airbnbP = price ? Math.round(price * (1 + markups.airbnb_markup_percent / 100)) : null;
              return (
                <div key={ds} title={d ? `Base: $${d.price} · Airbnb: $${airbnbP} · VRBO: $${price ? Math.round(price * (1 + markups.vrbo_markup_percent / 100)) : '?'} · Booking: $${price ? Math.round(price * (1 + markups.booking_markup_percent / 100)) : '?'}${minStay ? ` · ${minStay}n min` : ''}${isBooked ? ' · BOOKED' : ''}` : ''} style={{
                  minHeight: 80, background: isBooked ? '#f0e8e8' : isToday ? '#e6f4f6' : isPast ? '#fafaf8' : '#fff',
                  borderRadius: 6, border: isToday ? '2px solid #0d5f6b' : '1px solid #eee',
                  padding: '5px 6px', opacity: isPast && !price ? .5 : 1, cursor: 'default',
                  position: 'relative',
                }}>
                  <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#0d5f6b' : isPast ? '#aaa' : '#222', marginBottom: 2 }}>{day}</div>
                  {price && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: isBooked ? '#a74840' : priceColor(price, minP, maxP) }}>
                      ${price}
                    </div>
                  )}
                  {airbnbP && !isBooked && (
                    <div style={{ fontSize: 9, color: '#FF5A5F', marginTop: 1 }}>AB ${airbnbP}</div>
                  )}
                  {minStay && minStay > 1 && <div style={{ fontSize: 9, color: '#aaa', marginTop: 1 }}>{minStay}n min</div>}
                  {isBooked && <div style={{ fontSize: 9, fontWeight: 700, color: '#a74840', marginTop: 1 }}>BOOKED</div>}
                  {d?.demand_color && d.demand_color !== '#EDEDED' && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: d.demand_color }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 20, fontSize: 12, color: '#888' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22863a', marginRight: 4 }} />High demand</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#d9a14e', marginRight: 4 }} />Medium demand</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#6baeb6', marginRight: 4 }} />Low demand</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#a74840', marginRight: 4 }} />Booked</span>
            <span style={{ color: '#FF5A5F' }}>AB = Airbnb price shown in cell</span>
          </div>
        </>
      )}

      {/* Platform prices table view */}
      {view === 'platform' && (
        <div>
          {data.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: 48 }}>No pricing data — sync from PriceLabs first.</div>
          ) : (
            <>
              <div style={{ background: '#f0f8ff', border: '1px solid #cce5ff', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#555' }}>
                These are the prices that should be set on each OTA. Configure channel markups in your PriceLabs dashboard (Channel Management → Markup) to auto-push these prices to each platform.
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>PriceLabs Base</th>
                      <th style={{ color: '#FF5A5F' }}>Airbnb (+{markups.airbnb_markup_percent}%)</th>
                      <th style={{ color: '#3D5A80' }}>VRBO (+{markups.vrbo_markup_percent}%)</th>
                      <th style={{ color: '#003580' }}>Booking.com (+{markups.booking_markup_percent}%)</th>
                      <th>Min Stay</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(d => {
                      const airbnbP = Math.round(d.price * (1 + markups.airbnb_markup_percent / 100));
                      const vrboP = Math.round(d.price * (1 + markups.vrbo_markup_percent / 100));
                      const bookingP = Math.round(d.price * (1 + markups.booking_markup_percent / 100));
                      const isBooked = d.occupancy === 1;
                      const isPast = d.date < todayStr;
                      return (
                        <tr key={d.date} style={{ opacity: isPast ? 0.5 : 1 }}>
                          <td style={{ fontWeight: d.date === todayStr ? 700 : 400, color: d.date === todayStr ? '#0d5f6b' : undefined }}>{d.date}</td>
                          <td><strong>${d.price}</strong></td>
                          <td style={{ color: '#FF5A5F', fontWeight: 600 }}>${airbnbP}</td>
                          <td style={{ color: '#3D5A80', fontWeight: 600 }}>${vrboP}</td>
                          <td style={{ color: '#003580', fontWeight: 600 }}>${bookingP}</td>
                          <td>{d.min_stay > 1 ? `${d.min_stay}n` : '1n'}</td>
                          <td>
                            {isBooked
                              ? <span style={{ color: '#a74840', fontWeight: 700, fontSize: 11 }}>BOOKED</span>
                              : isPast
                              ? <span style={{ color: '#aaa', fontSize: 11 }}>past</span>
                              : <span style={{ color: '#28a745', fontSize: 11 }}>available</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
