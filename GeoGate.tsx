import { useEffect, useState } from 'react';

const GEO_CACHE_KEY = 'geo_v1';
const GEO_DISMISS_KEY = 'geo_dismissed_v1';
const CACHE_TTL = 24 * 60 * 60 * 1000;

function flagEmoji(code: string) {
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

const QUIPS: Record<string, string> = {
  GB: "You've crossed the Atlantic to find an Alabama beach condo. Respectable dedication. Mind the humidity — it's nothing like Blackpool. ☂️",
  CA: "You're so close! Cross one border and you'd practically be here. The Gulf is significantly warmer than Lake Ontario, we promise. 🍁",
  AU: "You traveled from the land of incredible beaches to check out ours. We're genuinely flattered. Fair warning: our wildlife is much less terrifying. 🦘",
  DE: "German precision meets Gulf Coast hospitality. You'll appreciate that check-in is exactly at 4:00 PM. Nicht eine Minute früher. 🥨",
  FR: "We've also got excellent seafood and an appreciation for the slow life. We think you'd approve of the sunset views. 🥖",
  MX: "The Gulf connects us — our warm water is basically your warm water! Neighbors through the sea. 🌮",
  JP: "Finding a tiny beach condo in Alabama from Japan takes serious Google skills. The Gulf sunsets are absolutely worth the trip. 🗻",
  IN: "India to Orange Beach, Alabama — that's an epic journey. You clearly have an excellent eye for Gulf Coast real estate. 🌶️",
  BR: "From the beaches of Brazil to the beaches of Alabama? We respect the comparison. Different vibes, same love for the ocean. 🏖️",
  NL: "From windmills to sea breezes — different scenery, same love for flat coastlines and a cold drink. 🌷",
  IT: "We can't compete with the Mediterranean, but our Gulf shrimp might change your mind. Benvenuto! 🍝",
  ES: "The Gulf Coast has its own kind of siesta energy. Sun, seafood, and no agenda. You'd fit right in. 🥘",
  KR: "K-pop found Orange Beach! We're honored. The Gulf is not quite Jeju Island, but we do our best. 🎵",
  ZA: "From the Cape to the Gulf Coast — two very different oceans, same love for a beautiful view. 🦁",
  NZ: "All the way from the bottom of the world? We hope the trip is worth it. Spoiler: it is. 🥝",
  SG: "From the Lion City to Lion Country? Orange Beach welcomes you. We also love seafood — just a different kind. 🦁",
  PH: "The Philippines to Alabama — now that's a beach upgrade quest. The Gulf says welcome! 🌺",
};

const DEFAULT_QUIP = "You've found a cozy Gulf Coast condo all the way from your corner of the world. Excellent taste, no passport required for browsing. 🌍";

interface GeoData {
  code: string;
  name: string;
  ts: number;
}

export default function GeoGate() {
  const [country, setCountry] = useState<{ code: string; name: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(GEO_DISMISS_KEY)) return;

    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (raw) {
      try {
        const cached: GeoData = JSON.parse(raw);
        if (Date.now() - cached.ts < CACHE_TTL) {
          if (cached.code !== 'US') { setCountry({ code: cached.code, name: cached.name }); setVisible(true); }
          return;
        }
      } catch { /* stale / corrupt cache */ }
    }

    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        const code = (d.country_code || 'US') as string;
        const name = (d.country_name || 'your country') as string;
        localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ code, name, ts: Date.now() }));
        if (code !== 'US') { setCountry({ code, name }); setVisible(true); }
      })
      .catch(() => { /* fail open — no banner on API error */ });
  }, []);

  function dismiss() {
    sessionStorage.setItem(GEO_DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible || !country) return null;

  const flag = flagEmoji(country.code);
  const quip = QUIPS[country.code] ?? DEFAULT_QUIP;

  return (
    <div className="geo-backdrop" onClick={dismiss}>
      <div className="geo-card" onClick={e => e.stopPropagation()}>
        <div className="geo-flag-big">{flag}</div>
        <div className="geo-eyebrow">INTERNATIONAL VISITOR DETECTED</div>
        <h2 className="geo-title">Well, look who drifted in from {country.name}! {flag}</h2>
        <p className="geo-body">
          This little slice of Gulf Coast paradise — Coastal Haven at Phoenix V, Orange Beach, Alabama —
          is mainly built for US beach-goers. But the Gulf's got enough warm water and sunshine for everybody.
        </p>
        <p className="geo-quip">{quip}</p>
        <p className="geo-body" style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
          You're more than welcome to look around. We won't make you eat boiled peanuts if you don't want to.
          <em> (They're actually incredible though.)</em>
        </p>
        <button className="btn geo-btn" onClick={dismiss}>
          I'll take my chances 🦀
        </button>
        <button className="geo-dismiss-small" onClick={dismiss}>
          Got it, let me in
        </button>
      </div>
    </div>
  );
}
