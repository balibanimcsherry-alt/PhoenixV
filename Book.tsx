import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import Header from './Header';
import ChatWidget from './ChatWidget';
import DateRangePicker from './DateRangePicker';
import AddressInput from './AddressInput';
import { api } from './api';
import { track } from './analytics';

interface Quote {
  available: boolean; nights: number;
  airbnb_nightly: number; airbnb_subtotal: number; airbnb_total_est: number;
  direct_nightly: number; nightly_rate: number;
  subtotal: number; cleaning_fee: number; taxes: number;
  security_deposit: number; direct_discount: number; discount_percent: number;
  total: number; currency: string; booking_mode: string; source: string;
}

interface BookingDetail {
  id: number; checkin: string; checkout: string; guests: number;
  guest_name: string; email: string; phone: string; address: string;
  total: number; status: string; created_at: string;
}

interface Customer { id: number; name: string; email: string; phone: string; address: string; }

// ── Confirmation Page ──────────────────────────────────────────
function ConfirmationPage({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<BookingDetail>(`/api/booking/${bookingId}`)
      .then(setBooking)
      .catch(() => setError('Could not load booking details.'));
  }, [bookingId]);

  const nights = booking
    ? differenceInCalendarDays(parseISO(booking.checkout), parseISO(booking.checkin))
    : 0;

  return <>
    <Header />
    <main className="confirmation-page">
      {error && <p className="error" style={{ textAlign: 'center', padding: 40 }}>{error}</p>}
      {!booking && !error && <p style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading your confirmation…</p>}
      {booking && (
        <div className="confirmation-card">
          <div className="confirmation-check">✓</div>
          <h1>You're going to the beach!</h1>
          <p className="confirmation-sub">
            {booking.guest_name ? `Hi ${booking.guest_name.split(' ')[0]}! Your` : 'Your'} booking is confirmed.
            A receipt has been sent{booking.email ? ` to ${booking.email}` : ''}.
          </p>
          <div className="confirmation-ref">
            Booking reference <strong>#CHV-{String(booking.id).padStart(4, '0')}</strong>
          </div>
          <div className="confirmation-details">
            <div className="conf-row">
              <div className="conf-block">
                <div className="conf-label">Check-in</div>
                <div className="conf-value">{format(parseISO(booking.checkin), 'EEEE, MMMM d, yyyy')}</div>
                <div className="conf-note">After 4:00 PM</div>
              </div>
              <div className="conf-arrow">→</div>
              <div className="conf-block">
                <div className="conf-label">Check-out</div>
                <div className="conf-value">{format(parseISO(booking.checkout), 'EEEE, MMMM d, yyyy')}</div>
                <div className="conf-note">By 10:00 AM</div>
              </div>
            </div>
            <div className="conf-divider" />
            <div className="conf-grid">
              <div className="conf-item"><div className="conf-label">Guests</div><div className="conf-value">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</div></div>
              <div className="conf-item"><div className="conf-label">Nights</div><div className="conf-value">{nights}</div></div>
              <div className="conf-item"><div className="conf-label">Total charged</div><div className="conf-value">${booking.total.toFixed(2)}</div></div>
              <div className="conf-item"><div className="conf-label">Status</div><div className="conf-value conf-status">Confirmed</div></div>
            </div>
            <div className="conf-divider" />
            <div className="conf-property">
              <div className="conf-label">Property</div>
              <div className="conf-value">Coastal Haven at Phoenix V</div>
              <div className="conf-note">24400 Perdido Beach Blvd, Orange Beach, AL 36561</div>
            </div>
            <div className="conf-divider" />
            <div className="conf-checkin-info">
              <div className="conf-label">Getting in</div>
              <ul>
                <li>Check-in instructions and door code will be sent 48 hours before arrival.</li>
                <li>Parking is available in the covered garage — one space included.</li>
                <li>Pool, hot tub, and beach access available 24/7.</li>
              </ul>
            </div>
            <div className="conf-divider" />
            <div className="conf-cancel">
              <div className="conf-label">Cancellation policy</div>
              <div className="conf-note">Full refund up to 30 days before arrival · 50% refund up to 14 days · Non-refundable inside 14 days.</div>
            </div>
          </div>
          <div className="confirmation-actions">
            <a className="btn" href="/">Back to home</a>
            <a className="btn light" href="/contact">Contact host</a>
          </div>
        </div>
      )}
    </main>
    <ChatWidget />
  </>;
}

// ── Customer Auth Modal ────────────────────────────────────────
function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (c: Customer, token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/customer/login' : '/api/customer/register';
      const body = mode === 'login'
        ? { email, password }
        : { name, email, phone, address, password };
      const r = await api<{ token: string; customer: Customer }>(endpoint, {
        method: 'POST', body: JSON.stringify(body),
      });
      localStorage.setItem('customerToken', r.token);
      onAuth(r.customer, r.token);
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
        </div>
        {mode === 'register' && <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" /></label>}
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" /></label>
        {mode === 'register' && <>
          <label>Phone<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" /></label>
          <label>Home address<AddressInput value={address} onChange={setAddress} /></label>
        </>}
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></label>
        {err && <p className="error">{err}</p>}
        <button className="btn wide" onClick={submit} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button className="auth-modal-close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

// ── Main Book Page ─────────────────────────────────────────────
export default function Book() {
  const [sp] = useSearchParams();

  const isSuccess = sp.get('success') === '1';
  const bookingId = sp.get('booking_id') || '';

  if (isSuccess && bookingId) return <ConfirmationPage bookingId={bookingId} />;

  // Customer auth state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerToken, setCustomerToken] = useState(localStorage.getItem('customerToken') || '');
  const [showAuth, setShowAuth] = useState(false);

  // Load saved customer on mount
  useEffect(() => {
    if (customerToken) {
      api<Customer>('/api/customer/me', { headers: { Authorization: `Bearer ${customerToken}` } })
        .then(setCustomer)
        .catch(() => { localStorage.removeItem('customerToken'); setCustomerToken(''); });
    }
  }, []);

  const handleAuth = (c: Customer, token: string) => {
    setCustomer(c); setCustomerToken(token);
    setShowAuth(false);
    // Pre-fill form fields from account
    setGuestName(c.name); setEmail(c.email); setPhone(c.phone); setAddress(c.address);
  };

  const signOut = () => {
    localStorage.removeItem('customerToken'); setCustomerToken(''); setCustomer(null);
    setGuestName(''); setEmail(''); setPhone(''); setAddress('');
  };

  const [checkin, setCheckin] = useState(sp.get('checkin') || '');
  const [checkout, setCheckout] = useState(sp.get('checkout') || '');
  const [guests, setGuests] = useState(Number(sp.get('guests') || 4));
  const [guestName, setGuestName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [createAccount, setCreateAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nights = useMemo(() =>
    checkin && checkout ? differenceInCalendarDays(new Date(checkout), new Date(checkin)) : 0,
    [checkin, checkout]);

  const getQuote = async () => {
    setLoading(true); setError('');
    try {
      const q = await api<Quote>(`/api/booking/quote?checkin=${checkin}&checkout=${checkout}&guests=${guests}`);
      setQuote(q);
      track('quote_requested', { checkin, checkout, guests });
    } catch { setError('Could not load a live quote. Check your dates or send us a message.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (nights > 0) getQuote(); }, []);

  const checkoutNow = async () => {
    if (!quote) return;
    if (!guestName.trim()) { alert('Please enter your full name.'); return; }
    if (!email.trim()) { alert('Email is required.'); return; }
    if (!phone.trim()) { alert('Phone number is required.'); return; }
    if (!address.trim()) { alert('Address is required.'); return; }
    if (createAccount && !customerToken && !newPassword.trim()) { alert('Please set a password for your new account.'); return; }
    track('checkout_started', { checkin, checkout, total: quote.total });
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customerToken) headers['Authorization'] = `Bearer ${customerToken}`;
      const r = await api<{ url?: string; status?: string; token?: string }>('/api/booking/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          checkin, checkout, guests,
          guest_name: guestName, email, phone, address,
          create_account: createAccount && !customerToken,
          password: createAccount && !customerToken ? newPassword : undefined,
        }),
      });
      if (r.token) { localStorage.setItem('customerToken', r.token); setCustomerToken(r.token); }
      if (r.url) location.href = r.url;
      else alert('Your booking request has been sent for approval.');
    } catch (e: any) { alert(e?.message || 'Checkout failed. Please try again or contact us.'); }
  };

  const fmt = (n: number) => `$${n.toFixed(0)}`;

  if (isSuccess && !bookingId) return <>
    <Header />
    <main className="confirmation-page">
      <div className="confirmation-card">
        <div className="confirmation-check">✓</div>
        <h1>Payment received!</h1>
        <p className="confirmation-sub">Your booking is confirmed. Check your email for details.</p>
        <div className="confirmation-actions"><a className="btn" href="/">Back to home</a></div>
      </div>
    </main>
    <ChatWidget />
  </>;

  return <>
    <Header />
    {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
    <main className="booking-page">
      <section className="booking-intro">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="eyebrow dark">BOOK COASTAL HAVEN</div>
            <h1>Pick your beach dates.</h1>
            <p>Book directly and save {quote ? `${quote.discount_percent}%` : '10%'} vs Airbnb — same condo, same nights, lower price.</p>
          </div>
          <div className="account-bar">
            {customer ? <>
              <span className="account-greeting">👋 Hi, {customer.name.split(' ')[0]}</span>
              <a href="/account" className="btn light" style={{ fontSize: 13, padding: '8px 16px' }}>My bookings</a>
              <button className="btn light" style={{ fontSize: 13, padding: '8px 16px' }} onClick={signOut}>Sign out</button>
            </> : <>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Have an account?</span>
              <button className="btn light" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => setShowAuth(true)}>Sign in</button>
            </>}
          </div>
        </div>
      </section>

      <section className="booking-layout">
        <div className="booking-card">
          <h2>Your stay</h2>
          <div style={{ marginBottom: 12 }}>
            <DateRangePicker checkin={checkin} checkout={checkout} onCheckin={setCheckin} onCheckout={setCheckout} inline />
          </div>
          <label>Guests
            <select value={guests} onChange={e => setGuests(Number(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}
            </select>
          </label>
          <button className="btn wide" disabled={!checkin || !checkout || nights < 1 || loading} onClick={getQuote}>
            {loading ? 'Checking…' : 'Get exact price'}
          </button>
          {error && <p className="error">{error}</p>}

          {quote?.available && <>
            <div className="conf-divider" style={{ margin: '20px 0' }} />
            <h3 style={{ marginBottom: 4, fontSize: '1rem' }}>Your details <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--muted)' }}>— all fields required</span></h3>

            <label>Full name <span className="req">*</span>
              <input type="text" placeholder="Jane Smith" value={guestName} onChange={e => setGuestName(e.target.value)} />
            </label>
            <label>Email <span className="req">*</span>
              <input type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label>Phone number <span className="req">*</span>
              <input type="tel" placeholder="+1 555 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </label>
            <label>Home address <span className="req">*</span>
              <AddressInput value={address} onChange={setAddress} />
            </label>

            {!customer && <>
              <div className="conf-divider" style={{ margin: '14px 0' }} />
              <label className="checkbox-row">
                <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} />
                <span>Create a free account to track your bookings</span>
              </label>
              {createAccount && (
                <label>Set a password <span className="req">*</span>
                  <input type="password" placeholder="At least 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </label>
              )}
              {!createAccount && (
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>
                  Or <button className="link-btn" onClick={() => setShowAuth(true)}>sign in</button> to use saved details.
                </p>
              )}
            </>}
            {customer && <p style={{ fontSize: 12, color: '#28704e', margin: '8px 0 0' }}>✓ Signed in as {customer.email}</p>}
          </>}
        </div>

        <div className="quote-card">
          {quote ? <>
            <div className="quote-photo"><img src="/images/balcony.jpg" /></div>
            <div className="quote-body">
              <div className="quote-top">
                <div>
                  <h2>Coastal Haven</h2>
                  <p>{format(new Date(checkin), 'MMM d')} – {format(new Date(checkout), 'MMM d')} · {guests} guests</p>
                </div>
                <span className={quote.available ? 'available' : 'unavailable'}>
                  {quote.available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {quote.available && <>
                <div className="price-compare">
                  <div className="price-compare-col airbnb-col">
                    <div className="price-compare-label">Airbnb price</div>
                    <div className="price-compare-nightly"><s>{fmt(quote.airbnb_nightly)}</s><span>/night</span></div>
                    <div className="price-compare-total">Est. total <strong><s>{fmt(quote.airbnb_total_est)}</s></strong></div>
                  </div>
                  <div className="price-compare-divider">
                    <div className="price-compare-badge">SAVE {quote.discount_percent}%</div>
                  </div>
                  <div className="price-compare-col direct-col">
                    <div className="price-compare-label">Book direct</div>
                    <div className="price-compare-nightly"><strong>{fmt(quote.direct_nightly)}</strong><span>/night</span></div>
                    <div className="price-compare-total">Your total <strong>{fmt(quote.total)}</strong></div>
                  </div>
                </div>

                <div className="price-lines">
                  <div><span>{fmt(quote.direct_nightly)} × {quote.nights} nights</span><span>${quote.subtotal.toFixed(2)}</span></div>
                  {quote.direct_discount > 0 && <div className="discount"><span>Direct-booking savings vs Airbnb</span><span>−${quote.direct_discount.toFixed(2)}</span></div>}
                  <div><span>Cleaning fee</span><span>${quote.cleaning_fee.toFixed(2)}</span></div>
                  <div><span>Taxes</span><span>${quote.taxes.toFixed(2)}</span></div>
                  {quote.security_deposit > 0 && <div><span>Security authorization</span><span>${quote.security_deposit.toFixed(2)}</span></div>}
                  <div className="total"><span>Total</span><span>${quote.total.toFixed(2)} {quote.currency}</span></div>
                </div>

                <p className="tiny">Pricing source: {quote.source}. Airbnb estimate uses same cleaning fee and tax rate for comparison.</p>
                <button className="btn wide" onClick={checkoutNow}>
                  {quote.booking_mode === 'instant' ? 'Continue to secure checkout' : 'Request to book'}
                </button>
              </>}
            </div>
          </> : <div className="quote-empty">
            <img src="/logo.svg" />
            <h2>Your exact total will appear here.</h2>
            <p>Choose dates and guests to check availability and see how much you save vs Airbnb.</p>
          </div>}
        </div>
      </section>
    </main>
    <ChatWidget />
  </>;
}
