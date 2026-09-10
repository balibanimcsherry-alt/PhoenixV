import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from './api';

const INPUT: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 9, border: '1px solid #ddd',
  fontSize: 14, boxSizing: 'border-box', outline: 'none',
};

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [accountType, setAccountType] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const r = await api<{ ok: boolean; account_type: string }>('/api/reset-password', {
        method: 'POST', body: JSON.stringify({ token, password }),
      });
      setAccountType(r.account_type);
      setDone(true);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid'))
        setError('This reset link is invalid or has expired. Please request a new one.');
      else if (msg.includes('8 characters')) setError('Password must be at least 8 characters.');
      else setError('Could not reset your password. Please try again.');
    }
    setLoading(false);
  };

  const backLink = accountType === 'customer' ? '/book' : '/caretaker';

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f5f9fa,#e8f4f5)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 8px 40px rgba(0,0,0,.12)', width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌊</div>
          <h2 style={{ margin: 0, color: '#0d5f6b', fontSize: 22 }}>Reset Password</h2>
          <p style={{ margin: '6px 0 0', color: '#888', fontSize: 13 }}>Coastal Haven · Phoenix V Unit 1408</p>
        </div>

        {!token ? (
          <p style={{ color: '#dc3545', fontSize: 14, textAlign: 'center' }}>
            This link is missing its reset token. Please use the link from your email.
          </p>
        ) : done ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#28704e', fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>
              ✓ Your password has been reset.
            </p>
            <Link to={backLink} style={{ display: 'inline-block', padding: '13px 28px', background: '#0d5f6b', color: '#fff', borderRadius: 9, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && <p style={{ color: '#dc3545', fontSize: 13, margin: '0 0 14px', textAlign: 'center' }}>{error}</p>}
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="New password"
              style={{ ...INPUT, marginBottom: 12 }} />
            <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="Confirm new password"
              style={{ ...INPUT, marginBottom: 20 }} onKeyDown={e => e.key === 'Enter' && submit()} />
            <button onClick={submit} disabled={loading}
              style={{ width: '100%', padding: 13, background: '#0d5f6b', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
