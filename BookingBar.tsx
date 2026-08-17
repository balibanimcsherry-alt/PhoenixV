import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DateRangePicker from './DateRangePicker';

export default function BookingBar({ floating = false }: { floating?: boolean }) {
  const nav = useNavigate();
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState(4);
  const go = () => nav(`/book?checkin=${checkin}&checkout=${checkout}&guests=${guests}`);

  if (floating) {
    return (
      <div className="booking-bar floating">
        <button className="btn wide" onClick={() => nav('/book')}>Check Availability</button>
      </div>
    );
  }

  return (
    <div className="booking-bar">
      <DateRangePicker checkin={checkin} checkout={checkout} onCheckin={setCheckin} onCheckout={setCheckout} />
      <label style={{ borderLeft: '1px solid var(--line)', paddingLeft: 14 }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, display: 'block', marginBottom: 4, color: 'var(--muted)' }}>Guests</span>
        <select value={guests} onChange={e => setGuests(Number(e.target.value))} style={{ border: 0, padding: 0, borderRadius: 0 }}>
          {Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}
        </select>
      </label>
      <button className="btn" onClick={go} disabled={!checkin || !checkout}>Check Availability</button>
    </div>
  );
}
