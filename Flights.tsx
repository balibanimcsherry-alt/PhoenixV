import { useState } from 'react';
import { Plane, ArrowRight, ArrowLeftRight, Clock, Info, Car, Users, Briefcase } from 'lucide-react';
import Header from './Header';
import { api } from './api';

type Flight = {
  flight: string; airline: string; airline_iata: string;
  dep_time: string; arr_time: string; dep_actual: string; arr_actual: string;
  status: string; aircraft: string; price: number | null;
  dep_terminal: string | null; dep_gate: string | null; dep_delay: number | null;
  arr_terminal: string | null; arr_gate: string | null; arr_baggage: string | null; arr_delay: number | null;
  from: string; to: string; date: string;
};
type CarResult = {
  category: string; example: string; seats: number; bags: number;
  price_per_day: number; company: string; days: number; total: number; airport: string;
};
type FlightResult = { outbound: Flight[]; return: Flight[]; source: string };
type CarApiResult  = { cars: CarResult[]; source: string };

const NEARBY = [
  { code: 'PNS', label: 'Pensacola, FL (PNS)' },
  { code: 'VPS', label: 'Destin / Ft Walton (VPS)' },
  { code: 'MOB', label: 'Mobile, AL (MOB)' },
];
const STATUS_STYLE: Record<string, string> = {
  scheduled: 'status-scheduled', active: 'status-active',
  landed: 'status-landed',       cancelled: 'status-cancelled', delayed: 'status-delayed',
};

function FlightCard({ f, depCode, arrCode }: { f: Flight; depCode: string; arrCode: string }) {
  const depInfo = [f.dep_terminal && `Terminal ${f.dep_terminal}`, f.dep_gate && `Gate ${f.dep_gate}`].filter(Boolean).join(' · ');
  const arrInfo = [f.arr_terminal && `Terminal ${f.arr_terminal}`, f.arr_gate && `Gate ${f.arr_gate}`, f.arr_baggage && `Baggage ${f.arr_baggage}`].filter(Boolean).join(' · ');
  return (
    <article className="flight-card">
      <div className="flight-airline">
        <Plane size={15} />
        <strong>{f.airline}</strong>
        <span className="flight-number">{f.flight}</span>
        {f.dep_delay != null && f.dep_delay > 0 && (
          <span className="delay-badge">+{f.dep_delay}m late</span>
        )}
      </div>
      <div className="flight-times">
        <div className="flight-time">
          <span className="time-val">{f.dep_time}</span>
          <span className="time-label">{depCode}</span>
          {depInfo && <span className="flight-info-line">{depInfo}</span>}
        </div>
        <ArrowRight size={17} className="flight-arrow" />
        <div className="flight-time">
          <span className="time-val">{f.arr_time}</span>
          <span className="time-label">{arrCode}</span>
          {arrInfo && <span className="flight-info-line">{arrInfo}</span>}
        </div>
      </div>
      <div className="flight-right">
        {f.price != null && <span className="flight-price">${f.price}</span>}
        <div className="flight-meta-row">
          {f.aircraft && <span className="flight-meta"><Clock size={11}/>{f.aircraft}</span>}
          <span className={`flight-status ${STATUS_STYLE[f.status] || 'status-scheduled'}`}>{f.status}</span>
        </div>
      </div>
    </article>
  );
}

export default function Flights() {
  const [tripType, setTripType]     = useState<'round' | 'one'>('round');
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('PNS');
  const [date, setDate]             = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [result, setResult]         = useState<FlightResult | null>(null);
  const [cars, setCars]             = useState<CarResult[] | null>(null);
  const [carSource, setCarSource]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const today = new Date().toISOString().split('T')[0];
  const isRound = tripType === 'round';

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setResult(null); setCars(null); setLoading(true);
    try {
      const rd = isRound && returnDate ? `&return_date=${returnDate}` : '';
      const [flightRes, carRes] = await Promise.all([
        api<FlightResult>(`/api/flights?dep=${from}&arr=${to}&date=${date}${rd}`),
        isRound && returnDate
          ? api<CarApiResult>(`/api/cars?airport=${to}&pickup=${date}&dropoff=${returnDate}`)
          : api<CarApiResult>(`/api/cars?airport=${to}&pickup=${date}&dropoff=${date}`),
      ]);
      setResult(flightRes);
      setCars(carRes.cars);
      setCarSource(carRes.source);
    } catch {
      setError('Could not load travel data. Check airport codes and try again.');
    } finally {
      setLoading(false);
    }
  }

  const isDemo = result?.source === 'demo';
  const days = (isRound && returnDate && date)
    ? Math.max(1, Math.round((new Date(returnDate).getTime() - new Date(date).getTime()) / 86400000))
    : 1;

  return (
    <div>
      <Header />
      <main className="flights-page">
        <div className="flights-hero">
          <div className="eyebrow">PLAN YOUR ARRIVAL</div>
          <h1>Flights &amp; Rental Cars</h1>
          <p>Find flights and cars for your trip to Orange Beach, Alabama.</p>
        </div>

        <div className="flights-container">
          {/* Search form */}
          <form className="flights-form" onSubmit={search}>
            <div className="trip-toggle">
              <button type="button" className={isRound ? 'trip-btn active' : 'trip-btn'} onClick={() => setTripType('round')}>
                <ArrowLeftRight size={14}/> Round Trip
              </button>
              <button type="button" className={!isRound ? 'trip-btn active' : 'trip-btn'} onClick={() => setTripType('one')}>
                <Plane size={14}/> One Way
              </button>
            </div>

            <div className="flights-grid">
              <div className="flights-field">
                <label>From (IATA code)</label>
                <input placeholder="e.g. ATL, ORD, JFK" value={from}
                  onChange={e => setFrom(e.target.value.toUpperCase().slice(0, 3))}
                  maxLength={3} required />
              </div>

              <div className="flights-field">
                <label>Depart</label>
                <input type="date" value={date} min={today}
                  onChange={e => { setDate(e.target.value); if (returnDate && e.target.value >= returnDate) setReturnDate(''); }}
                  required />
              </div>

              {isRound && (
                <div className="flights-field">
                  <label>Return</label>
                  <input type="date" value={returnDate} min={date || today}
                    onChange={e => setReturnDate(e.target.value)} required={isRound} />
                </div>
              )}
            </div>

            <div className="flights-field">
              <label>To — nearest airports to Orange Beach</label>
              <div className="flights-nearby">
                {NEARBY.map(a => (
                  <button type="button" key={a.code}
                    className={to === a.code ? 'nearby-btn active' : 'nearby-btn'}
                    onClick={() => setTo(a.code)}>{a.label}</button>
                ))}
                <input placeholder="or type IATA code"
                  value={NEARBY.some(a => a.code === to) ? '' : to}
                  onChange={e => setTo(e.target.value.toUpperCase().slice(0, 3))} maxLength={3} />
              </div>
            </div>

            <button className="btn" type="submit" disabled={loading}>
              <Plane size={15}/>{loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {error && <p className="flights-error">{error}</p>}

          {result && (
            <>
              {isDemo && (
                <p className="flights-demo-note"><Info size={13}/> Demo data — add AVIATIONSTACK_API_KEY to .env for live prices &amp; status</p>
              )}

              {/* Outbound flights */}
              <section className="flights-section">
                <h3 className="flights-section-title">
                  <Plane size={16}/> Outbound · {from} → {to} · {date}
                </h3>
                {result.outbound.length === 0
                  ? <p className="flights-empty">No outbound flights found.</p>
                  : <div className="flights-list">
                      {result.outbound.map(f => <FlightCard key={f.flight+f.dep_time} f={f} depCode={from} arrCode={to}/>)}
                    </div>
                }
              </section>

              {/* Return flights */}
              {isRound && returnDate && (
                <section className="flights-section">
                  <h3 className="flights-section-title">
                    <Plane size={16} style={{transform:'scaleX(-1)'}}/> Return · {to} → {from} · {returnDate}
                  </h3>
                  {result.return.length === 0
                    ? <p className="flights-empty">No return flights found.</p>
                    : <div className="flights-list">
                        {result.return.map(f => <FlightCard key={f.flight+f.dep_time} f={f} depCode={to} arrCode={from}/>)}
                      </div>
                  }
                </section>
              )}

              {/* Rental cars */}
              {cars && cars.length > 0 && (
                <section className="flights-section">
                  <h3 className="flights-section-title">
                    <Car size={16}/> Rental Cars at {to}
                    {days > 1 && <span className="cars-days">· {days} day{days > 1 ? 's' : ''}</span>}
                    {carSource === 'demo' && <span className="cars-demo-tag">Demo prices</span>}
                  </h3>
                  <div className="cars-grid">
                    {cars.map(c => (
                      <article className="car-card" key={c.category}>
                        <div className="car-category">{c.category}</div>
                        <div className="car-example">{c.example}</div>
                        <div className="car-specs">
                          <span><Users size={12}/>{c.seats} seats</span>
                          <span><Briefcase size={12}/>{c.bags} bags</span>
                        </div>
                        <div className="car-pricing">
                          <div className="car-price-day">${c.price_per_day}<span>/day</span></div>
                          {days > 1 && <div className="car-price-total">${c.total} total</div>}
                        </div>
                        <div className="car-company">{c.company}</div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
