import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import { api } from './api';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState('');
  const [message, setMessage] = useState('');
  const [honey, setHoney] = useState('');  // honeypot
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honey) return;  // bot detected
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErr('Please fill in your name, email, and message.');
      return;
    }
    setLoading(true); setErr('');
    try {
      await api('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: [
            message.trim(),
            phone ? `Phone: ${phone}` : '',
            checkin ? `Requested check-in: ${checkin}` : '',
            checkout ? `Requested checkout: ${checkout}` : '',
            guests ? `Guests: ${guests}` : '',
          ].filter(Boolean).join('\n'),
        }),
      });
      setSent(true);
    } catch {
      setErr('Message failed to send. Please use the chat widget below to reach us.');
    } finally { setLoading(false); }
  };

  return <>
    <SEOMeta
      title="Contact Coastal Haven | Orange Beach Vacation Rental"
      description="Contact the owner of Coastal Haven at Phoenix V in Orange Beach, Alabama. Ask questions or inquire about availability."
      canonical="/contact"
      noindex={false}
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>Contact</span>
        </nav>
        <div className="eyebrow dark">GET IN TOUCH</div>
        <h1>Contact the Owner</h1>
        <p>Questions about the condo, dates, or anything else? Send a message and we'll reply promptly.</p>
      </section>

      <section className="section">
        <div className="contact-layout">
          <div className="contact-form-wrap">
            {sent ? (
              <div className="contact-success">
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <h2>Message received!</h2>
                <p>We'll reply to {email} within a few hours.</p>
                <a className="btn" href="/book" style={{ marginTop: 20 }}>Check Availability</a>
              </div>
            ) : (
              <form onSubmit={submit} className="contact-form" noValidate>
                <h2>Send a message</h2>

                {/* Honeypot — hidden from real users */}
                <input
                  type="text"
                  name="website"
                  value={honey}
                  onChange={e => setHoney(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <label>Full name <span className="req">*</span>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" autoComplete="name" required />
                </label>
                <label>Email address <span className="req">*</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" autoComplete="email" required />
                </label>
                <label>Phone number <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12 }}>(optional)</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" autoComplete="tel" />
                </label>

                <div className="two">
                  <label>Check-in date
                    <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} />
                  </label>
                  <label>Checkout date
                    <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} />
                  </label>
                </div>

                <label>Number of guests
                  <select value={guests} onChange={e => setGuests(e.target.value)}>
                    <option value="">Select…</option>
                    {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>{i+1} guest{i > 0 ? 's' : ''}</option>)}
                  </select>
                </label>

                <label>Message <span className="req">*</span>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask us anything about the condo, availability, or your stay." rows={5} required />
                </label>

                {err && <p className="error">{err}</p>}

                <button type="submit" className="btn wide" disabled={loading}>
                  {loading ? 'Sending…' : 'Send message'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 0' }}>
                  You can also reach us via the chat widget in the bottom-right corner.
                </p>
              </form>
            )}
          </div>

          <div className="contact-info-wrap">
            <h2>Quick answers</h2>
            <p>Check-in is at <strong>4:00 PM</strong>. Checkout is <strong>10:00 AM</strong>.</p>
            <p>Phoenix V is at 24400 Perdido Beach Blvd, Orange Beach, AL 36561.</p>
            <p>Exact unit information is provided after confirmed booking.</p>

            <div style={{ marginTop: 28 }}>
              <h3>Prefer to book now?</h3>
              <p>Check real-time availability and get an instant price quote — no account required.</p>
              <a className="btn" href="/book" style={{ marginTop: 8, display: 'inline-flex' }}>Check Availability</a>
            </div>

            <div style={{ marginTop: 28 }}>
              <h3>Common questions</h3>
              <p><a href="/faq">See the full FAQ →</a></p>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
