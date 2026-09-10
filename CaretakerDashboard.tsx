import { useState, useEffect } from 'react';
import { api } from './api';

interface CaretakerRes {
  key: string; platform: string;
  checkin: string; checkout: string;
  guest_name: string; nights: number; is_new: boolean; guests: number | null;
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

function ResRow({ r }: { r: CaretakerRes }) {
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
          {r.guests != null && ` · ${r.guests} guest${r.guests !== 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  );
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function CalendarView({ reservations }: { reservations: CaretakerRes[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build set of dates occupied by each reservation (checkin inclusive, checkout exclusive)
  const byDate: Record<string, CaretakerRes[]> = {};
  for (const res of reservations) {
    let d = new Date(res.checkin + 'T12:00:00');
    const end = new Date(res.checkout + 'T12:00:00');
    while (d < end) {
      const k = d.toISOString().slice(0, 10);
      (byDate[k] = byDate[k] || []).push(res);
      d = new Date(d.getTime() + 86400000);
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const today = now.toISOString().slice(0, 10);

  // pad cells
  const cells: (string | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e8efed' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>‹</button>
        <strong style={{ fontSize: 15, color: '#0d5f6b' }}>{MONTH_NAMES[month]} {year}</strong>
        <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>›</button>
      </div>

      {/* DOW headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
        {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#aaa', padding: '2px 0' }}>{d}</div>)}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((ds, i) => {
          if (!ds) return <div key={i} />;
          const reses = byDate[ds] || [];
          const res = reses[0];
          const isToday = ds === today;
          const isCheckin = res?.checkin === ds;
          const isCheckout = reses.length === 0 && reservations.some(r => r.checkout === ds);
          const day = parseInt(ds.slice(-2));
          const bg = res ? PC[res.platform] : 'transparent';

          return (
            <div key={ds} style={{
              minHeight: 54,
              borderRadius: 6,
              border: isToday ? `2px solid #0d5f6b` : '1px solid #eee',
              background: res ? bg + '18' : isToday ? '#e8f4f5' : '#fafafa',
              padding: '3px 4px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Day number */}
              <div style={{ fontSize: 11, fontWeight: isToday ? 800 : 400, color: isToday ? '#0d5f6b' : '#555', lineHeight: 1 }}>{day}</div>

              {/* Check-in chip */}
              {isCheckin && res && (
                <div style={{
                  marginTop: 3,
                  background: PC[res.platform],
                  color: '#fff',
                  borderRadius: 4,
                  padding: '2px 4px',
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    ▶ {res.guest_name.split(' ')[0]}
                  </div>
                  {res.guests != null && (
                    <div style={{ opacity: .85 }}>{res.guests} guest{res.guests !== 1 ? 's' : ''}</div>
                  )}
                  <div style={{ opacity: .75 }}>{res.nights}n</div>
                </div>
              )}

              {/* Continuation bar */}
              {res && !isCheckin && (
                <div style={{ marginTop: 6, height: 5, borderRadius: 2, background: PC[res.platform] + '88' }} />
              )}

              {/* Checkout marker */}
              {isCheckout && (
                <div style={{ marginTop: 4, fontSize: 8, color: '#aaa', textAlign: 'right' }}>out</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
        {Object.entries(PL).map(([k, v]) => {
          if (!reservations.some(r => r.platform === k)) return null;
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: PC[k] }} />
              <span style={{ color: '#555' }}>{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 9, border: '1px solid #ddd',
  fontSize: 14, boxSizing: 'border-box', outline: 'none',
};

export default function CaretakerDashboard() {
  const [token, setToken] = useState(localStorage.getItem('caretakerToken') || '');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regPin, setRegPin] = useState('');
  const [reservations, setReservations] = useState<CaretakerRes[]>([]);
  const [view, setView] = useState<'today' | 'calendar'>('today');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError(''); setLoading(true);
    try {
      const r = await api<{ token: string }>('/api/caretaker/login', {
        method: 'POST', body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('caretakerToken', r.token);
      setToken(r.token);
    } catch {
      setError('Invalid username or password.');
    }
    setLoading(false);
  };

  const register = async () => {
    setError(''); setSuccess('');
    if (!regName || !regUsername || !regEmail || !regPassword) {
      setError('All fields are required.'); return;
    }
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api('/api/caretaker/register', {
        method: 'POST',
        body: JSON.stringify({ name: regName, username: regUsername, email: regEmail, password: regPassword, pin: regPin }),
      });
      setSuccess('Account created! You can now sign in.');
      setMode('login');
      setUsername(regUsername);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('409') || msg.toLowerCase().includes('taken')) setError('Username already taken.');
      else if (msg.includes('403') || msg.toLowerCase().includes('pin')) setError('Invalid PIN. Registration requires the correct PIN.');
      else setError('Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const forgot = async () => {
    setError(''); setSuccess('');
    if (!forgotEmail) { setError('Please enter your account email.'); return; }
    setLoading(true);
    try {
      const r = await api<{ message: string }>('/api/caretaker/forgot-password', {
        method: 'POST', body: JSON.stringify({ email: forgotEmail }),
      });
      setSuccess(r.message || 'If an account exists for that email, a reset link is on its way.');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const load = async (t = token) => {
    try {
      const r = await api<CaretakerRes[]>('/api/caretaker/reservations', {
        headers: { Authorization: `Bearer ${t}` },
      });
      setReservations(r);
      await api('/api/caretaker/seen', { method: 'POST', headers: { Authorization: `Bearer ${t}` } });
    } catch {
      localStorage.removeItem('caretakerToken');
      setToken('');
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  if (!token) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f5f9fa,#e8f4f5)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,.12)', width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
          <h2 style={{ margin: 0, color: '#0d5f6b', fontSize: 22 }}>Caretaker Portal</h2>
          <p style={{ margin: '6px 0 0', color: '#888', fontSize: 13 }}>Coastal Haven · Phoenix V Unit 1408</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f0f4f3', borderRadius: 10, padding: 4, marginBottom: 22 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{ flex: 1, background: mode === m ? '#fff' : 'transparent', border: 0, borderRadius: 7,
                padding: '9px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                color: mode === m ? '#0d5f6b' : '#888',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,.08)' : 'none' }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {success && <p style={{ color: '#28704e', fontSize: 13, margin: '0 0 14px', textAlign: 'center', fontWeight: 600 }}>{success}</p>}
        {error && <p style={{ color: '#dc3545', fontSize: 13, margin: '0 0 14px', textAlign: 'center' }}>{error}</p>}

        {mode === 'login' ? (
          <>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
              style={{ ...INPUT, marginBottom: 12 }} />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password"
              style={{ ...INPUT, marginBottom: 20 }} onKeyDown={e => e.key === 'Enter' && login()} />
            <button onClick={login} disabled={loading}
              style={{ width: '100%', padding: 13, background: '#0d5f6b', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <p style={{ textAlign: 'center', margin: '16px 0 0' }}>
              <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 0, color: '#0d5f6b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Forgot password?
              </button>
            </p>
          </>
        ) : mode === 'forgot' ? (
          <>
            <p style={{ color: '#555', fontSize: 13, margin: '0 0 14px', textAlign: 'center', lineHeight: 1.6 }}>
              Enter your account email and we'll send you a link to reset your password.
            </p>
            <input value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Email address" type="email"
              style={{ ...INPUT, marginBottom: 20 }} onKeyDown={e => e.key === 'Enter' && forgot()} />
            <button onClick={forgot} disabled={loading}
              style={{ width: '100%', padding: 13, background: '#0d5f6b', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p style={{ textAlign: 'center', margin: '16px 0 0' }}>
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 0, color: '#0d5f6b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Back to Sign In
              </button>
            </p>
          </>
        ) : (
          <>
            <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Full name"
              style={{ ...INPUT, marginBottom: 10 }} />
            <input value={regUsername} onChange={e => setRegUsername(e.target.value)} placeholder="Username"
              style={{ ...INPUT, marginBottom: 10 }} />
            <input value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Email address" type="email"
              style={{ ...INPUT, marginBottom: 10 }} />
            <input value={regPassword} onChange={e => setRegPassword(e.target.value)} type="password" placeholder="Password"
              style={{ ...INPUT, marginBottom: 10 }} />
            <input value={regConfirm} onChange={e => setRegConfirm(e.target.value)} type="password" placeholder="Confirm password"
              style={{ ...INPUT, marginBottom: 10 }} />
            <input value={regPin} onChange={e => setRegPin(e.target.value)} type="password" placeholder="Registration PIN"
              style={{ ...INPUT, marginBottom: 20 }} />
            <button onClick={register} disabled={loading}
              style={{ width: '100%', padding: 13, background: '#0d5f6b', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </>
        )}
      </div>
    </main>
  );

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const todayOut  = reservations.filter(r => r.checkout === today);
  const todayIn   = reservations.filter(r => r.checkin === today);
  const tomorrowIn = reservations.filter(r => r.checkin === tomorrow);
  const upcoming  = reservations.filter(r => r.checkin > today && r.checkin !== tomorrow);
  const newOnes   = reservations.filter(r => r.is_new);

  return (
    <main style={{ minHeight: '100vh', background: '#f5f9fa', padding: '24px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, color: '#0d5f6b', fontSize: 22 }}>🏠 Caretaker Portal</h1>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Phoenix V Unit 1408 · Orange Beach, AL</p>
          </div>
          <button onClick={() => { localStorage.removeItem('caretakerToken'); setToken(''); }}
            style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#888', fontSize: 13 }}>
            Sign out
          </button>
        </div>

        {/* View tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#eaf0ef', borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {(['today', 'calendar'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ flex: 1, background: view === v ? '#fff' : 'transparent', border: 0, borderRadius: 7,
                padding: '9px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                color: view === v ? '#0d5f6b' : '#777',
                boxShadow: view === v ? '0 2px 8px rgba(0,0,0,.08)' : 'none' }}>
              {v === 'today' ? '📋 Today' : '📅 Calendar'}
            </button>
          ))}
        </div>

        {view === 'calendar' && <CalendarView reservations={reservations} />}

        {view === 'today' && newOnes.length > 0 && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <strong style={{ color: '#856404' }}>🔔 {newOnes.length} new reservation{newOnes.length !== 1 ? 's' : ''} added</strong>
            {newOnes.map(r => (
              <div key={r.key} style={{ marginTop: 8, fontSize: 13 }}>
                • <Badge platform={r.platform} /> <strong>{r.guest_name}</strong> — {r.checkin} → {r.checkout}
              </div>
            ))}
          </div>
        )}

        {view === 'today' && todayOut.length > 0 && (
          <div style={{ background: '#fff', border: '2px solid #ffc107', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 17, color: '#856404' }}>🧹 Clean today — guests checking out</h2>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12, padding: '8px 12px', background: '#fffbf0', borderRadius: 8 }}>
              Checkout by <strong>10:00 AM</strong>. Unit should be ready by <strong>3:00 PM</strong> for next check-in.
            </div>
            {todayOut.map(r => <ResRow key={r.key} r={r} />)}
          </div>
        )}

        {view === 'today' && todayIn.length > 0 && (
          <div style={{ background: '#fff', border: '2px solid #28a745', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 17, color: '#155724' }}>🏠 Guests arriving today</h2>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8 }}>
              Check-in is after <strong>4:00 PM</strong>. Unit must be ready before then.
            </div>
            {todayIn.map(r => <ResRow key={r.key} r={r} />)}
          </div>
        )}

        {view === 'today' && todayOut.length === 0 && todayIn.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid #e0e8e6', borderRadius: 14, padding: 28, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <p style={{ margin: 0, color: '#555', fontWeight: 600 }}>No check-ins or check-outs today</p>
            <p style={{ margin: '6px 0 0', color: '#aaa', fontSize: 13 }}>Enjoy the day off!</p>
          </div>
        )}

        {view === 'today' && tomorrowIn.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e8efed', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>📅 Arriving tomorrow</h2>
            {tomorrowIn.map(r => <ResRow key={r.key} r={r} />)}
          </div>
        )}

        {view === 'today' && upcoming.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e8efed', borderRadius: 14, padding: 20 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: '#333' }}>📋 Upcoming reservations</h2>
            {upcoming.map(r => <ResRow key={r.key} r={r} />)}
          </div>
        )}
      </div>
    </main>
  );
}
