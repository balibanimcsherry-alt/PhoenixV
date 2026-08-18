import { useEffect, useState } from 'react';
import { Calendar, UtensilsCrossed, Waves, MapPin, Shell } from 'lucide-react';
import { api } from './api';

interface Restaurant {
  name: string; type: string; vibe: string; must_try: string; note: string;
}
interface Activity {
  title: string; duration: string; tip: string; note: string;
}
interface Highlight {
  title: string; note: string;
}
interface GuideData {
  date_note: string;
  event: { title: string; description: string; type: string };
  restaurants: Restaurant[];
  activities: Activity[];
  highlights: Highlight[];
}

const EVENT_LABEL: Record<string, string> = {
  festival: 'Festival', market: 'Market', concert: 'Live Music',
  sport: 'Sporting Event', seasonal: 'In Season', weekly: 'Weekly',
};

type Tab = 'restaurants' | 'activities' | 'highlights' | 'shells';

// ── Static sea shell data ────────────────────────────────────────────────
const SHELLS = [
  { emoji: '🐚', name: 'Lightning Whelk', rarity: 'uncommon', desc: "Alabama's official state shell. Large left-handed spiral with lightning bolt markings. Found whole after storms — a true Gulf Coast trophy." },
  { emoji: '🐌', name: 'Lettered Olive', rarity: 'common', desc: 'Smooth, cylindrical, glossy shell with intricate brown hieroglyph markings. The most abundant quality shell on the Alabama coast.' },
  { emoji: '🦪', name: 'Angel Wings', rarity: 'rare', desc: 'Delicate, pure white, wing-shaped bivalves — beautiful but fragile. Best found in winter after heavy surf. Often broken; a whole pair is a real find.' },
  { emoji: '🐚', name: 'Florida Fighting Conch', rarity: 'common', desc: 'Heavy, orange-pink interior, pointed spire. Juveniles ("rollies") are common in the surf year-round. Great for kids to collect.' },
  { emoji: '⭕', name: 'Sand Dollar', rarity: 'uncommon', desc: 'Flat, disc-shaped skeleton of a sea urchin. Find them at low tide in the early morning, just offshore in the shallows. Green ones are still alive — put them back.' },
  { emoji: '🐚', name: 'Moon Snail (Shark Eye)', rarity: 'common', desc: 'Smooth, round, grey-brown shell with a distinctive dark spot at the center. One of the most common finds. The snail drills perfectly round holes in other shells.' },
  { emoji: '🌀', name: 'Channeled Whelk', rarity: 'uncommon', desc: 'Large right-handed spiral with channeled sutures between whorls. Beautiful in size and form — a more elegant cousin of the Lightning Whelk.' },
  { emoji: '🐚', name: 'Atlantic Auger', rarity: 'common', desc: 'Long, narrow, screw-shaped shell with a pointed tip. Usually tan or cream with brown specks. Easy to spot on the sand between the tide lines.' },
  { emoji: '🦋', name: 'Coquina', rarity: 'common', desc: 'Tiny wedge-shaped clams in dozens of colors — lavender, pink, yellow, orange. They live by the millions in the wet sand of the surf zone.' },
  { emoji: '🐚', name: 'Turkey Wing', rarity: 'common', desc: 'Brown and white ribbed ark shell with wing-like shape. Often found in clusters near jetties and rocky areas. Sturdy and easy to find whole.' },
  { emoji: '✨', name: 'Jingle Shell', rarity: 'common', desc: 'Translucent, papery shells in gold, silver, and orange tones. Found attached to other shells. They literally jingle when they pile up — perfect windchime material.' },
  { emoji: '🐚', name: 'Scotch Bonnet', rarity: 'rare', desc: "North Carolina's state shell but found here too — a beautiful round shell with spiral brown squares. One of the most prized finds on the Alabama coast." },
];

const SEASONS = [
  { name: 'Spring', rating: '★★★★☆', note: 'Good — post-winter storms leave fresh shells. Crowds are low and competition is light.' },
  { name: 'Summer', rating: '★★★☆☆', note: 'Calmer seas mean fewer fresh arrivals, but very good finds after summer storms. More competition from other shellers.' },
  { name: 'Fall', rating: '★★★★★', note: 'Best season. Gulf storms and hurricanes push extraordinary shells ashore. Off-peak crowds. The serious shellers\' favourite.' },
  { name: 'Winter', rating: '★★★★★', note: 'Excellent. Cold fronts churn the Gulf, bringing up deep-water shells. Almost no competition. Dress warm and hit the beach at first light.' },
];

const SHELL_TIPS = [
  'Low tide is prime time — the receding water exposes shells trapped in the wet sand. Check tide charts the night before.',
  'Go at dawn or just after a storm. Shells wash in overnight; by 9 AM the beach is well-picked over in summer.',
  "Look in the wrack line — the dark ribbon of seaweed and debris at the high-tide mark. That's where the best shells concentrate.",
  "Shuffle your feet in the shallows rather than walking normally. The vibration sends live animals down, and you'll feel shells underfoot.",
  'A green sand dollar is alive — put it back in the water immediately. White ones are safe to keep.',
  'Bring a mesh bag or bucket. A wet shell looks much richer in color than it will when dry — so manage expectations.',
  "The Phoenix V beach access puts you on a stretch of Orange Beach with relatively little foot traffic compared to Gulf State Park's main beach — a hidden advantage.",
  'After a tropical system or strong cold front, the entire character of the beach changes. Prime shelling windows last 12–24 hours before the waves calm down.',
];

export default function LocalGuide() {
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('restaurants');

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
        {data?.date_note && <p className="guide-date-note">{data.date_note}</p>}
      </div>

      {/* Today's Event */}
      <div className={`guide-event-card${loading ? ' guide-skeleton' : ''}`}>
        <div className="guide-event-badge">
          <Calendar size={13} />
          {loading ? 'Loading…' : (EVENT_LABEL[data?.event.type ?? ''] ?? 'Happening Now')}
        </div>
        <h3 className="guide-event-title">{loading ? ' ' : data!.event.title}</h3>
        <p className="guide-event-desc">{loading ? ' ' : data!.event.description}</p>
      </div>

      {/* Tabs */}
      <div className="guide-tabs">
        <button className={`guide-tab${tab === 'restaurants' ? ' active' : ''}`} onClick={() => setTab('restaurants')}>
          <UtensilsCrossed size={15} /> Restaurants
        </button>
        <button className={`guide-tab${tab === 'activities' ? ' active' : ''}`} onClick={() => setTab('activities')}>
          <Waves size={15} /> Activities
        </button>
        <button className={`guide-tab${tab === 'highlights' ? ' active' : ''}`} onClick={() => setTab('highlights')}>
          <MapPin size={15} /> Guest Tips
        </button>
        <button className={`guide-tab${tab === 'shells' ? ' active' : ''}`} onClick={() => setTab('shells')}>
          <Shell size={15} /> Sea Shells
        </button>
      </div>

      {/* Restaurants */}
      {tab === 'restaurants' && (
        <div className="guide-list">
          {(loading ? Array(10).fill(null) : (data?.restaurants ?? [])).map((r, i) => (
            <div key={i} className={`guide-list-item${loading ? ' guide-skeleton' : ''}`}>
              <div className="guide-item-num">{i + 1}</div>
              <div className="guide-item-body">
                <div className="guide-item-title">{loading ? ' ' : r.name}</div>
                <div className="guide-item-meta">
                  {!loading && <><span className="guide-tag">{r.type}</span><span className="guide-tag-light">{r.vibe}</span></>}
                </div>
                {!loading && <div className="guide-item-pick">Try: <strong>{r.must_try}</strong></div>}
                <p className="guide-item-note">{loading ? ' ' : r.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activities */}
      {tab === 'activities' && (
        <div className="guide-list">
          {(loading ? Array(10).fill(null) : (data?.activities ?? [])).map((a, i) => (
            <div key={i} className={`guide-list-item${loading ? ' guide-skeleton' : ''}`}>
              <div className="guide-item-num">{i + 1}</div>
              <div className="guide-item-body">
                <div className="guide-item-title">{loading ? ' ' : a.title}</div>
                {!loading && <div className="guide-item-meta"><span className="guide-tag">{a.duration}</span></div>}
                {!loading && <div className="guide-item-pick">Tip: <strong>{a.tip}</strong></div>}
                <p className="guide-item-note">{loading ? ' ' : a.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guest Tips / Highlights */}
      {tab === 'highlights' && (
        <div className="guide-list">
          {(loading ? Array(10).fill(null) : (data?.highlights ?? [])).map((h, i) => (
            <div key={i} className={`guide-list-item${loading ? ' guide-skeleton' : ''}`}>
              <div className="guide-item-num">{i + 1}</div>
              <div className="guide-item-body">
                <div className="guide-item-title">{loading ? ' ' : h.title}</div>
                <p className="guide-item-note">{loading ? ' ' : h.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sea Shells */}
      {tab === 'shells' && (
        <>
          <div className="shells-intro">
            <p>
              <strong>Shelling is one of Orange Beach's best-kept morning rituals.</strong> The Alabama Gulf Coast sits at the eastern end of a long arc of barrier islands — the same geography that funnels Gulf currents and washes extraordinary shells onto these beaches year after year. The <strong>Lightning Whelk</strong>, Alabama's official state shell, is the crown jewel, but dozens of species wash ashore regularly. Best of all, it costs nothing and no equipment is required.
            </p>
          </div>

          <div className="shells-season-strip">
            {SEASONS.map(s => (
              <div key={s.name} className="shell-season-card">
                <div className="shell-season-name">{s.name}</div>
                <div className="shell-season-rating">{s.rating}</div>
                <div className="shell-season-note">{s.note}</div>
              </div>
            ))}
          </div>

          <div className="shells-grid">
            {SHELLS.map(s => (
              <div key={s.name} className="shell-card">
                <div className="shell-emoji">{s.emoji}</div>
                <div className="shell-name">{s.name}</div>
                <span className={`shell-rarity ${s.rarity}`}>{s.rarity}</span>
                <p className="shell-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="shells-tips">
            <h4>How to shell like a local</h4>
            <ul className="shells-tips-list">
              {SHELL_TIPS.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
