import { useEffect, useState } from 'react';
import { Utensils, Waves, Car, Wifi, Calendar, Clock, ChefHat } from 'lucide-react';
import { api } from './api';

interface GuideData {
  date_note: string;
  event: { title: string; description: string; type: string };
  seafood: { pick: string; dish: string; note: string };
  dolphins: { tip: string; best_time: string };
  wharf: { highlight: string; note: string };
  planning_tip: string;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  festival: 'Festival',
  market: 'Market',
  concert: 'Live Music',
  sport: 'Sporting Event',
  seasonal: 'In Season',
  weekly: 'Weekly Happening',
};

export default function LocalGuide() {
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<GuideData>('/api/local-guide')
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="guide" className="section local-guide-section">
      <div className="section-head">
        <div>
          <div className="eyebrow dark">ORANGE BEACH, ALABAMA</div>
          <h2>Your Gulf Coast days, planned.</h2>
        </div>
        {data?.date_note && (
          <p className="guide-date-note">{data.date_note}</p>
        )}
      </div>

      {/* Today's Event Card */}
      {(loading || data?.event) && (
        <div className={`guide-event-card${loading ? ' guide-skeleton' : ''}`}>
          <div className="guide-event-badge">
            <Calendar size={14} />
            {loading ? '…' : (EVENT_TYPE_LABEL[data!.event.type] ?? 'Happening Now')}
          </div>
          <h3 className="guide-event-title">{loading ? ' ' : data!.event.title}</h3>
          <p className="guide-event-desc">{loading ? ' ' : data!.event.description}</p>
        </div>
      )}

      {/* 4 Detail Cards */}
      <div className="guide-cards">

        <div className={`guide-card${loading ? ' guide-skeleton' : ''}`}>
          <div className="guide-card-icon"><Utensils size={22} /></div>
          <div className="guide-card-label">Local Seafood</div>
          <div className="guide-card-pick">{loading ? '…' : data?.seafood.pick ?? 'GT\'s On The Bay'}</div>
          <div className="guide-card-dish">{loading ? '…' : data?.seafood.dish ?? 'Fresh Gulf shrimp'}</div>
          <p className="guide-card-note">{loading ? ' ' : data?.seafood.note ?? ''}</p>
        </div>

        <div className={`guide-card${loading ? ' guide-skeleton' : ''}`}>
          <div className="guide-card-icon"><Waves size={22} /></div>
          <div className="guide-card-label">Dolphin Cruises</div>
          <div className="guide-card-pick">
            {loading ? '…' : (
              data?.dolphins.best_time === 'morning' ? 'Best: Morning departures' :
              data?.dolphins.best_time === 'evening' ? 'Best: Sunset cruises' :
              'Best: Afternoon trips'
            )}
          </div>
          <p className="guide-card-note">{loading ? ' ' : data?.dolphins.tip ?? ''}</p>
          <div className="guide-card-time-tip">
            <Clock size={12} />
            {loading ? '…' : (
              data?.dolphins.best_time === 'morning' ? '9 – 11 AM' :
              data?.dolphins.best_time === 'evening' ? '6 – 8 PM' :
              '1 – 4 PM'
            )}
          </div>
        </div>

        <div className={`guide-card${loading ? ' guide-skeleton' : ''}`}>
          <div className="guide-card-icon"><Car size={22} /></div>
          <div className="guide-card-label">The Wharf</div>
          <div className="guide-card-pick">{loading ? '…' : data?.wharf.highlight ?? 'SkyWheel & Marina Village'}</div>
          <p className="guide-card-note">{loading ? ' ' : data?.wharf.note ?? ''}</p>
        </div>

        <div className={`guide-card${loading ? ' guide-skeleton' : ''}`}>
          <div className="guide-card-icon"><Wifi size={22} /></div>
          <div className="guide-card-label">Easy Planning</div>
          <div className="guide-card-pick">
            <ChefHat size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Insider tips
          </div>
          <p className="guide-card-note">{loading ? ' ' : data?.planning_tip ?? ''}</p>
          <p className="guide-card-note" style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
            Guests receive a detailed arrival guide after booking with addresses, parking, and local favourites.
          </p>
        </div>

      </div>
    </section>
  );
}
