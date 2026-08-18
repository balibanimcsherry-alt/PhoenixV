import { useEffect, useMemo, useState } from 'react';

const LAT = 30.2944;
const LON = -87.6065;

type Theme =
  | 'sunny-day'   | 'sunny-night'
  | 'cloudy-day'  | 'cloudy-night'
  | 'rainy-day'   | 'rainy-night'
  | 'stormy-day'  | 'stormy-night'
  | 'foggy-day'   | 'foggy-night'
  | 'snow-day'    | 'snow-night'
  | 'fall-day'    | 'fall-night'
  | 'spring-day'  | 'spring-night';

function classify(code: number, tempF: number, isNight: boolean, month: number): Theme {
  const s = isNight ? 'night' : 'day';
  if (code >= 95)                                 return `stormy-${s}` as Theme;
  if (code >= 71 && code <= 75)                   return `snow-${s}` as Theme;
  if ((code >= 51 && code <= 67) || code >= 80)   return `rainy-${s}` as Theme;
  if (code === 45 || code === 48)                  return `foggy-${s}` as Theme;
  if (tempF < 50)                                  return `snow-${s}` as Theme;
  if (code === 3)                                  return `cloudy-${s}` as Theme;
  // Seasonal (clear/partly cloudy)
  if (month === 10 || month === 11)                return `fall-${s}` as Theme;   // Oct–Nov: leaves falling
  if (month === 9 && tempF < 80)                   return `fall-${s}` as Theme;   // Late-Sep cooling
  if ((month === 3 || month === 4) && tempF < 84)  return `spring-${s}` as Theme; // Mar–Apr: leaves back
  if (month === 5 && tempF < 78)                   return `spring-${s}` as Theme; // Early May
  if (code === 1 || code === 2)                    return `cloudy-${s}` as Theme;
  return `sunny-${s}` as Theme;
}

// Stable seeded pseudo-random (avoids re-shuffle on re-render)
const r = (seed: number) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

function makeDrops(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: r(i * 3.1) * 100,
    delay: r(i * 3.2) * 2,
    dur: 0.28 + r(i * 3.3) * 0.45,
    h: 12 + r(i * 3.4) * 22,
    op: 0.22 + r(i * 3.5) * 0.48,
  }));
}

function makeFlakes(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: r(i * 7.1) * 100,
    delay: r(i * 7.2) * 12,
    dur: 6 + r(i * 7.3) * 9,
    sz: 10 + r(i * 7.4) * 18,
    sway: (r(i * 7.5) - 0.5) * 90,
    char: i % 2 === 0 ? '❄' : '❅',
  }));
}

const LEAF_CHARS = ['🍂', '🍁', '🍃'];
function makeLeaves(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: r(i * 5.1) * 100,
    delay: r(i * 5.2) * 16,
    dur: 8 + r(i * 5.3) * 9,
    sz: 16 + r(i * 5.4) * 20,
    sway: (r(i * 5.5) - 0.5) * 130,
    rot: r(i * 5.6) * 600,
    char: LEAF_CHARS[i % 3],
  }));
}

const PETAL_CHARS = ['🌸', '🌺', '🌼', '✿'];
function makePetals(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: r(i * 11.1) * 100,
    delay: r(i * 11.2) * 14,
    dur: 7 + r(i * 11.3) * 9,
    sz: 12 + r(i * 11.4) * 14,
    sway: (r(i * 11.5) - 0.5) * 100,
    char: PETAL_CHARS[i % 4],
  }));
}

function makeStars(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: r(i * 13.1) * 100,
    y: r(i * 13.2) * 65,
    sz: 1 + r(i * 13.3) * 2.5,
    delay: r(i * 13.4) * 4,
    dur: 1.5 + r(i * 13.5) * 3,
  }));
}

// ── Main export ────────────────────────────────────────────────
export default function WeatherTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${LAT}&longitude=${LON}` +
      '&current=temperature_2m,weather_code' +
      '&daily=sunrise,sunset&forecast_days=1' +
      '&temperature_unit=fahrenheit&timezone=America%2FChicago'
    )
      .then(r => r.json())
      .then(j => {
        const code: number = j.current.weather_code;
        const temp: number = j.current.temperature_2m;
        const sunrise = new Date(j.daily.sunrise[0]);
        const sunset  = new Date(j.daily.sunset[0]);
        const now     = new Date();
        const isNight = now < sunrise || now > sunset;
        const obNow   = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
        const month   = obNow.getMonth() + 1;
        const t = classify(code, temp, isNight, month);
        console.log(`[WeatherTheme] code=${code} temp=${Math.round(temp)}°F night=${isNight} month=${month} → ${t}`);
        setTheme(t);
      })
      .catch(() => {
        const now   = new Date();
        const month = now.getMonth() + 1;
        const h     = now.getHours();
        setTheme(classify(0, 78, h < 6 || h >= 20, month));
      });
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute('data-theme', theme);
    return () => document.documentElement.removeAttribute('data-theme');
  }, [theme]);

  if (!theme) return null;
  return <ThemeOverlay theme={theme} />;
}

// ── Overlay ────────────────────────────────────────────────────
function ThemeOverlay({ theme }: { theme: Theme }) {
  const isRain   = theme === 'rainy-day'  || theme === 'rainy-night';
  const isStorm  = theme === 'stormy-day' || theme === 'stormy-night';
  const isSnow   = theme === 'snow-day'   || theme === 'snow-night';
  const isFall   = theme === 'fall-day'   || theme === 'fall-night';
  const isSpring = theme === 'spring-day' || theme === 'spring-night';
  const isNight  = theme.endsWith('night');
  const showStars = isNight && !isRain && !isStorm && !isSnow;

  const drops  = useMemo(() => makeDrops(isStorm ? 110 : 68), []);
  const flakes = useMemo(() => makeFlakes(40), []);
  const leaves = useMemo(() => makeLeaves(18), []);
  const petals = useMemo(() => makePetals(20), []);
  const stars  = useMemo(() => makeStars(55), []);

  type S = React.CSSProperties & { [k: string]: string | number };

  return (
    <div className={`wt-overlay wt-${theme}`} aria-hidden="true">
      <div className="wt-ambient" />

      {(isRain || isStorm) && drops.map((d, i) => (
        <span key={i} className="wt-drop" style={{
          left: `${d.x}%`, height: `${d.h}px`, opacity: d.op,
          animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`,
        } as S} />
      ))}

      {isSnow && flakes.map((f, i) => (
        <span key={i} className="wt-flake" style={{
          left: `${f.x}%`, fontSize: `${f.sz}px`,
          animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s`,
          '--wt-sway': `${f.sway}px`,
        } as S}>{f.char}</span>
      ))}

      {isFall && leaves.map((l, i) => (
        <span key={i} className="wt-leaf" style={{
          left: `${l.x}%`, fontSize: `${l.sz}px`,
          animationDelay: `${l.delay}s`, animationDuration: `${l.dur}s`,
          '--wt-sway': `${l.sway}px`, '--wt-rot': `${l.rot}deg`,
        } as S}>{l.char}</span>
      ))}

      {isSpring && petals.map((p, i) => (
        <span key={i} className="wt-petal" style={{
          left: `${p.x}%`, fontSize: `${p.sz}px`,
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          '--wt-sway': `${p.sway}px`,
        } as S}>{p.char}</span>
      ))}

      {showStars && stars.map((s, i) => (
        <span key={i} className="wt-star" style={{
          left: `${s.x}%`, top: `${s.y}vh`,
          width: `${s.sz}px`, height: `${s.sz}px`,
          animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s`,
        } as S} />
      ))}

      {isStorm && <div className="wt-lightning" />}
    </div>
  );
}
