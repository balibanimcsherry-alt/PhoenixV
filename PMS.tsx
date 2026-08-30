import { useState, useEffect } from 'react';
import { api } from './api';

const PC: Record<string, string> = {
  airbnb: '#FF5A5F', vrbo: '#3D5A80', booking: '#003580', direct: '#0d5f6b',
};
const PL: Record<string, string> = {
  airbnb: 'Airbnb', vrbo: 'VRBO', booking: 'Booking.com', direct: 'Direct',
};

interface OTARes {
  id: number; uid: string; platform: string;
  checkin: string; checkout: string; guest_name: string;
  summary: string; raw_description: string; notes: string;
  is_new: boolean; synced_at: string | null;
}
interface DirectRes {
  id: number; checkin: string; checkout: string; guests: number;
  guest_name: string; email: string; phone: string;
  total: number; status: string; created_at: string;
}
interface PMSData { ota: OTARes[]; direct: DirectRes[]; last_synced: string | null; calendar_url: string; }
interface Unified {
  key: string; platform: string; checkin: string; checkout: string;
  guest_name: string; nights: number; is_new: boolean;
  ota?: OTARes; direct?: DirectRes;
}

function nightCount(ci: string, co: string) {
  return Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);
}

function Badge({ platform }: { platform: string }) {
  return (
    <span style={{
      background: PC[platform] || '#888', color: '#fff',
      padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700,
    }}>
      {PL[platform] || platform}
    </span>
  );
}

export function PMSTab({ token }: { token: string }) {
  const [data, setData] = useState<PMSData | null>(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [platform, setPlatform] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setError('');
    try {
      setData(await api<PMSData>('/api/pms/reservations', { headers }));
    } catch (e: any) {
      setError(e?.message || 'Failed to load PMS data');
    }
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    setError('');
    try {
      await api('/api/pms/sync', { method: 'POST', headers });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Sync failed');
    }
    setSyncing(false);
  };

  const saveNote = async (id: number) => {
    setNoteSaving(true);
    try {
      await api(`/api/pms/reservations/${id}/notes`, { method: 'PUT', headers, body: JSON.stringify({ notes: noteText }) });
      await load();
    } catch {}
    setNoteSaving(false);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (error && !data) return (
    <div style={{ padding: 24 }}>
      <h1>Property Management</h1>
      <div style={{ background: '#fde7e5', border: '1px solid #f5c2c0', borderRadius: 10, padding: '16px 20px', color: '#a74840' }}>
        <strong>Error loading PMS data:</strong> {error}
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={load}>Retry</button>
        </div>
      </div>
    </div>
  );

  if (!data) return <p style={{ padding: 24, color: '#aaa' }}>Loading PMS data…</p>;

  const today = new Date().toISOString().slice(0, 10);
  const all: Unified[] = [
    ...data.ota.map(r => ({ key: `ota-${r.id}`, platform: r.platform, checkin: r.checkin, checkout: r.checkout, guest_name: r.guest_name || '(Guest)', nights: nightCount(r.checkin, r.checkout), is_new: r.is_new, ota: r })),
    ...data.direct.map(r => ({ key: `direct-${r.id}`, platform: 'direct', checkin: r.checkin, checkout: r.checkout, guest_name: r.guest_name || '(Direct guest)', nights: nightCount(r.checkin, r.checkout), is_new: false, direct: r })),
  ].sort((a, b) => a.checkin.localeCompare(b.checkin));

  const upcoming = all.filter(r => r.checkout >= today);
  const filtered = upcoming.filter(r => platform === 'all' || r.platform === platform);
  const todayOut = upcoming.filter(r => r.checkout === today);
  const todayIn = upcoming.filter(r => r.checkin === today);
  const newCount = upcoming.filter(r => r.is_new).length;
  const sel = selected ? all.find(r => r.key === selected) : null;

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Property Management</h1>
        <button className="btn" onClick={sync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {syncing ? '⟳ Syncing…' : '⟳ Sync OTA Calendars'}
        </button>
        {data.last_synced && (
          <span style={{ color: '#888', fontSize: 12 }}>Last synced: {data.last_synced.replace('T', ' ').slice(0, 16)}</span>
        )}
      </div>

      {error && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '10px 16px', color: '#856404', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 20 }}>
        <div className="kpi-card"><div className="kpi-value">{upcoming.length}</div><div className="kpi-label">Upcoming</div></div>
        <div className="kpi-card"><div className="kpi-value" style={{ color: PC.airbnb }}>{upcoming.filter(r => r.platform === 'airbnb').length}</div><div className="kpi-label">Airbnb</div></div>
        <div className="kpi-card"><div className="kpi-value" style={{ color: PC.vrbo }}>{upcoming.filter(r => r.platform === 'vrbo').length}</div><div className="kpi-label">VRBO</div></div>
        <div className="kpi-card"><div className="kpi-value" style={{ color: PC.booking }}>{upcoming.filter(r => r.platform === 'booking').length}</div><div className="kpi-label">Booking.com</div></div>
        {newCount > 0
          ? <div className="kpi-card" style={{ border: '2px solid #d9a14e' }}><div className="kpi-value" style={{ color: '#d9a14e' }}>{newCount}</div><div className="kpi-label">New (unread)</div></div>
          : <div className="kpi-card"><div className="kpi-value">{todayIn.length}/{todayOut.length}</div><div className="kpi-label">Check-in/out today</div></div>
        }
      </div>

      {/* Today alerts */}
      {(todayOut.length > 0 || todayIn.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {todayOut.length > 0 && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 10, padding: 14 }}>
              <strong>🧹 Check-outs today ({todayOut.length})</strong>
              {todayOut.map(r => <div key={r.key} style={{ marginTop: 8, fontSize: 13 }}><Badge platform={r.platform} /> {r.guest_name}</div>)}
            </div>
          )}
          {todayIn.length > 0 && (
            <div style={{ background: '#d4edda', border: '1px solid #28a745', borderRadius: 10, padding: 14 }}>
              <strong>🏠 Check-ins today ({todayIn.length})</strong>
              {todayIn.map(r => <div key={r.key} style={{ marginTop: 8, fontSize: 13 }}><Badge platform={r.platform} /> {r.guest_name}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Platform filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'airbnb', 'vrbo', 'booking', 'direct'].map(p => (
          <button key={p} onClick={() => setPlatform(p)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
            background: platform === p ? (PC[p] || '#0d5f6b') : '#f0f0f0',
            color: platform === p ? '#fff' : '#444', fontWeight: platform === p ? 700 : 400,
          }}>
            {p === 'all' ? 'All' : PL[p]}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 400px' : '1fr', gap: 16 }}>
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: 48 }}>
              No upcoming reservations.
              {data.ota.length === 0 && <><br /><small style={{ display: 'block', marginTop: 8 }}>Click "Sync OTA Calendars" to fetch from Airbnb/VRBO/Booking.com.</small></>}
            </div>
          ) : filtered.map(r => (
            <div key={r.key} onClick={() => { setSelected(selected === r.key ? null : r.key); setNoteText(r.ota?.notes || ''); }}
              style={{
                border: selected === r.key ? `2px solid ${PC[r.platform]}` : '1px solid #e8efed',
                borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer',
                background: selected === r.key ? '#f8fbfb' : '#fff', display: 'flex', alignItems: 'center', gap: 14,
              }}>
              <div style={{ width: 4, alignSelf: 'stretch', background: PC[r.platform], borderRadius: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <Badge platform={r.platform} />
                  {r.is_new && <span style={{ background: '#d9a14e', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>NEW</span>}
                  <strong style={{ marginLeft: 2 }}>{r.guest_name}</strong>
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>{r.checkin} → {r.checkout} · {r.nights} night{r.nights !== 1 ? 's' : ''}</div>
                {r.ota?.notes && <div style={{ fontSize: 12, color: '#999', marginTop: 3, fontStyle: 'italic' }}>📝 {r.ota.notes}</div>}
                {r.direct && <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{r.direct.guests} guests · ${r.direct.total.toFixed(0)} · <span style={{ textTransform: 'capitalize' }}>{r.direct.status.replace(/_/g, ' ')}</span></div>}
              </div>
              {r.checkin === today && <span style={{ fontSize: 12, color: '#28a745', fontWeight: 700, flexShrink: 0 }}>Arriving today</span>}
              {r.checkout === today && <span style={{ fontSize: 12, color: '#dc3545', fontWeight: 700, flexShrink: 0 }}>Departing today</span>}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {sel && (
          <div style={{ border: '1px solid #e8efed', borderRadius: 12, padding: 20, alignSelf: 'start', position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Badge platform={sel.platform} />
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#999' }}>✕</button>
            </div>
            <h3 style={{ margin: '0 0 14px', fontSize: 17 }}>{sel.guest_name}</h3>
            <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Check-in:</strong> {sel.checkin}</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}><strong>Check-out:</strong> {sel.checkout}</div>
            <div style={{ fontSize: 14, marginBottom: 16 }}><strong>Nights:</strong> {sel.nights}</div>

            {sel.direct && (
              <div style={{ background: '#f8fbfb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                <div style={{ marginBottom: 4 }}><strong>Guests:</strong> {sel.direct.guests}</div>
                {sel.direct.email && <div style={{ marginBottom: 4 }}><strong>Email:</strong> <a href={`mailto:${sel.direct.email}`} style={{ color: '#0d5f6b' }}>{sel.direct.email}</a></div>}
                {sel.direct.phone && <div style={{ marginBottom: 4 }}><strong>Phone:</strong> {sel.direct.phone}</div>}
                <div style={{ marginBottom: 4 }}><strong>Total:</strong> ${sel.direct.total.toFixed(2)}</div>
                <div><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{sel.direct.status.replace(/_/g, ' ')}</span></div>
              </div>
            )}

            {sel.ota && <>
              {sel.ota.raw_description && (
                <div style={{ marginBottom: 14 }}>
                  <strong style={{ fontSize: 13 }}>Guest info from {PL[sel.platform]}:</strong>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 6, background: '#f5f5f5', borderRadius: 6, padding: 10, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto' }}>
                    {sel.ota.raw_description}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <strong style={{ fontSize: 13 }}>Private notes:</strong>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Add notes about this reservation…"
                  style={{ width: '100%', minHeight: 80, marginTop: 6, padding: 8, borderRadius: 6, border: '1px solid #ddd', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
                <button className="btn" onClick={() => saveNote(sel.ota!.id)} disabled={noteSaving}
                  style={{ marginTop: 6, padding: '6px 14px', fontSize: 13 }}>
                  {noteSaving ? 'Saving…' : 'Save notes'}
                </button>
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
                <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>
                  💬 Guest messages are only available in the {PL[sel.platform]} host app — iCal feeds don't include messages.
                </p>
              </div>
            </>}
          </div>
        )}
      </div>

      {/* iCal URL box */}
      <div style={{ marginTop: 36, padding: 20, background: '#f0f8ff', border: '1px solid #cce5ff', borderRadius: 12 }}>
        <h3 style={{ margin: '0 0 8px', color: '#0d5f6b' }}>📅 Your Direct Booking iCal Feed</h3>
        <p style={{ fontSize: 13, color: '#555', margin: '0 0 12px' }}>
          Add this URL to Airbnb, VRBO, and Booking.com so they block dates when guests book directly through your site, preventing double-bookings.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input readOnly value={data.calendar_url}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #b8d8f8', fontSize: 13, background: '#fff' }}
            onClick={e => (e.target as HTMLInputElement).select()} />
          <button className="btn" onClick={() => copyUrl(data.calendar_url)} style={{ padding: '8px 16px', fontSize: 13, flexShrink: 0 }}>
            {copied ? '✓ Copied' : 'Copy URL'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#888', margin: '10px 0 0' }}>
          <strong>Airbnb:</strong> Calendar → Availability → Import Calendar &nbsp;|&nbsp;
          <strong>VRBO:</strong> Calendar → Import &nbsp;|&nbsp;
          <strong>Booking.com:</strong> Calendar → Sync/Import iCal
        </p>
      </div>
    </div>
  );
}
