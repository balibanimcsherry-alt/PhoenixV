import { useState, useEffect } from 'react';
import { api } from './api';

interface CleanerRes {
  key: string; platform: string;
  checkin: string; checkout: string;
  guest_name: string; nights: number; is_new: boolean;
}

const PC: Record<string, string> = {
  airbnb: '#FF5A5F', vrbo: '#3D5A80', booking: '#003580', direct: '#0d5f6b',
};
const PL: Record<string, string> = {
  airbnb: 'Airbnb', vrbo: 'VRBO', booking: 'Booking.com', direct: 'Direct',
};

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

function ResRow({ r }: { r: CleanerRes }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ width: 4, height: 44, background: PC[r.platform], borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
          <Badge platform={r.platform} />
          {r.is_new && (
            <span style={{ background: '#d9a14e', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
              NEW
            </span>
          )}
          <strong style={{ fontSize: 14 }}>{r.guest_name}</strong>
        </div>
        <div style={{ fontSize: 12, color: '#777' }}>
          {r.checkin} → {r.checkout} · {r.nights} night{r.nights !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export default function CleanerDashboard() {
  const [token, setToken] = useState(localStorage.getItem('cleanerToken') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [reservations, setReservations] = useState<CleanerRes[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError(''); setLoading(true);
    try {
      const r = await api<{ token: string }>('/api/cleaner/login', {
        method: 'POST', body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('cleanerToken', r.token);
      setToken(r.token);
    } catch {
      setError('Invalid username or password.');
    }
    setLoading(false);
  };

  const load = async (t = token) => {
    try {
      const r = await api<CleanerRes[]>('/api/cleaner/reservations', {
        headers: { Authorization: `Bearer ${t}` },
      });
      setReservations(r);
      // Mark new ones as seen
      await api('/api/cleaner/seen', { method: 'POST', headers: { Authorization: `Bearer ${t}` } });
    } catch {
      localStorage.removeItem('cleanerToken');
      setToken('');
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  if (!token) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f5f9fa,#e8f4f5)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, boxShadow: '0 8px 40px rgba(0,0,0,.12)', width: '100%', maxWidth: 340 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧹</div>
          <h2 style={{ margin: 0, color: '#0d5f6b', fontSize: 22 }}>Cleaner Portal</h2>
          <p style={{ margin: '6px 0 0', color: '#888', fontSize: 13 }}>Coastal Haven · Phoenix V Unit 1408</p>
        </div>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
          style={{ width: '100%', padding: '11px 14px', marginBottom: 12, borderRadius: 9, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password"
          style={{ width: '100%', padding: '11px 14px', marginBottom: 18, borderRadius: 9, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
          onKeyDown={e => e.key === 'Enter' && login()} />
        {error && <p style={{ color: '#dc3545', fontSize: 13, margin: '-8px 0 14px', textAlign: 'center' }}>{error}</p>}
        <button onClick={login} disabled={loading}
          style={{ width: '100%', padding: 13, background: '#0d5f6b', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </main>
  );

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const todayOut = reservations.filter(r => r.checkout === today);
  const todayIn  = reservations.filter(r => r.checkin === today);
  const tomorrowIn = reservations.filter(r => r.checkin === tomorrow);
  const upcoming = reservations.filter(r => r.checkin > today && r.checkin !== tomorrow);
  const newOnes  = reservations.filter(r => r.is_new);

  return (
    <main style={{ minHeight: '100vh', background: '#f5f9fa', padding: '24px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: '#0d5f6b', fontSize: 22 }}>🧹 Cleaner Portal</h1>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Phoenix V Unit 1408 · Orange Beach, AL</p>
          </div>
          <button onClick={() => { localStorage.removeItem('cleanerToken'); setToken(''); }}
            style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#888', fontSize: 13 }}>
            Sign out
          </button>
        </div>

        {/* New reservations alert */}
        {newOnes.length > 0 && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <strong style={{ color: '#856404' }}>🔔 {newOnes.length} new reservation{newOnes.length !== 1 ? 's' : ''} added</strong>
            {newOnes.map(r => (
              <div key={r.key} style={{ marginTop: 8, fontSize: 13 }}>
                • <Badge platform={r.platform} /> <strong>{r.guest_name}</strong> — {r.checkin} → {r.checkout}
              </div>
            ))}
          </div>
        )}

        {/* Today check-outs */}
        {todayOut.length > 0 && (
          <div style={{ background: '#fff', border: '2px solid #ffc107', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 17, color: '#856404' }}>🧹 Clean today — guests checking out</h2>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12, padding: '8px 12px', background: '#fffbf0', borderRadius: 8 }}>
              Checkout by <strong>10:00 AM</strong>. Unit should be ready by <strong>3:00 PM</strong> for next check-in.
            </div>
            {todayOut.map(r => <ResRow key={r.key} r={r} />)}
          </div>
        )}

        {/* Today check-ins */}
        {todayIn.length > 0 && (
          <div style={{ background: '#fff', border: '2px solid #28a745', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 17, color: '#155724' }}>🏠 Guests arriving today</h2>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8 }}>
              Check-in is after <strong>4:00 PM</strong>. Unit must be ready before then.
            </div>
            {todayIn.map(r => <ResRow key={r.key} r={r} />)}
          </div>
        )}

        {/* No tasks today */}
        {todayOut.length === 0 && todayIn.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #e0e8e6', borderRadius: 14, padding: 28, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <p style={{ margin: 0, color: '#555', fontWeight: 600 }}>No check-ins or check-outs today</p>
            <p style={{ margin: '6px 0 0', color: '#aaa', fontSize: 13 }}>Enjoy the day off!</p>
          </div>
        )}

        {/* Tomorrow's arrivals */}
        {tomorrowIn.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e8efed', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>📅 Arriving tomorrow</h2>
            {tomorrowIn.map(r => <ResRow key={r.key} r={r} />)}
          </div>
        )}

        {/* All upcoming */}
        {upcoming.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e8efed', borderRadius: 14, padding: 20 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>📋 Upcoming reservations</h2>
            {upcoming.map(r => <ResRow key={r.key} r={r} />)}
          </div>
        )}
      </div>
    </main>
  );
}
