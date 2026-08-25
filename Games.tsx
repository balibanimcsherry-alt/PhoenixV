import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Trivia questions ────────────────────────────────────────────────────────────
const TRIVIA: { q: string; opts: string[]; ans: number }[] = [
  { q: 'The famous Flora-Bama Mullet Toss has competitors throw a dead mullet fish across which state line?', opts: ['Alabama–Georgia', 'Alabama–Florida', 'Florida–Mississippi', 'Mississippi–Louisiana'], ans: 1 },
  { q: 'Orange Beach, Alabama sits directly on which body of water?', opts: ['Mobile Bay', 'Perdido Bay', 'The Gulf of Mexico', 'Choctawhatchee Bay'], ans: 2 },
  { q: 'The Gulf Coast roadside snack — peanuts slow-cooked in salty water — is called:', opts: ['Roasted peanuts', 'Boiled peanuts', 'Spiced peanuts', 'Shell peanuts'], ans: 1 },
  { q: 'Gulf State Park, one of the best parks on the coast, is located next to:', opts: ['Orange Beach', 'Gulf Shores', 'Foley', 'Fairhope'], ans: 1 },
  { q: 'Destin, Florida\'s famous nickname is:', opts: ['The Redneck Riviera', 'World\'s Luckiest Fishing Village', 'The Emerald City', 'The Sand Capital'], ans: 1 },
  { q: 'The Hangout Music Festival is held on the beach of which Alabama city?', opts: ['Orange Beach', 'Gulf Shores', 'Mobile', 'Daphne'], ans: 1 },
  { q: 'Which offshore sport fish is the most popular target from Orange Beach charters?', opts: ['Tarpon', 'Mahi-mahi', 'Red Snapper', 'King Mackerel'], ans: 2 },
  { q: 'Perdido Key is a barrier island shared between Alabama and which state?', opts: ['Mississippi', 'Georgia', 'Florida', 'Louisiana'], ans: 2 },
  { q: 'The National Shrimp Festival is held each October in which Gulf Coast city?', opts: ['Biloxi', 'Pensacola', 'Gulf Shores', 'Pascagoula'], ans: 2 },
  { q: 'A "hushpuppy" at a Gulf fish fry is:', opts: ['A dog breed', 'A brand of shoe', 'A fried cornmeal ball', 'A spicy sauce'], ans: 2 },
  { q: 'Biloxi, Mississippi\'s coast is largely known for:', opts: ['Shrimp processing', 'Casino gaming', 'Shipbuilding', 'Oil refining'], ans: 1 },
  { q: 'What water bird is most iconic on the Alabama and Florida Gulf Coast?', opts: ['Flamingo', 'Brown Pelican', 'Whooping Crane', 'Roseate Spoonbill'], ans: 1 },
  { q: 'The backyard toss game played at every Gulf Coast cookout — beanbags and holes in a board — is called:', opts: ['Bocce', 'Cornhole', 'Ladder Ball', 'Horseshoes'], ans: 1 },
  { q: 'What spiced Gulf Coast seafood boil combines shrimp, corn, sausage, and potatoes?', opts: ['Cajun Pot', 'Gulf Roast', 'Low Country Boil', 'Shore Supper'], ans: 2 },
  { q: 'What sea creature do guests most commonly spot from the Phoenix V balcony in Orange Beach?', opts: ['Sea otters', 'Manatees', 'Bottlenose dolphins', 'Manta rays'], ans: 2 },
];

// ── Bingo pool ───────────────────────────────────────────────────────────────────
const BINGO_POOL = [
  'Pelican', 'Dolphin', 'Sand Dollar', 'Red Snapper', 'Sunset',
  'Boiled Peanuts', 'Sweet Tea', 'Cornhole', 'Firefly', 'Live Oak',
  'Spanish Moss', 'Blue Crab', 'Shrimp Boat', 'Oyster Bar', 'Cast Net',
  'Fishing Pier', 'Gulf Breeze', 'Low Tide', 'Flip Flops', 'Pickup Truck',
  'Back Bay', 'Crawfish', 'Hush Puppies', 'Porch Swing', 'Pontoon Boat',
  'Mullet', 'Firepit', 'Sea Turtle', 'Hammock', 'Lightning Bug',
  'Catfish', 'Front Porch', 'Iced Tea', 'Mockingbird', 'Magnolia Tree',
  'Bayou', 'Alligator', 'Watermelon', 'Fishing Rod', 'Cobia',
  'Palmetto', 'Cypress Tree', 'Seagull', 'Flounder', 'Charter Boat',
  'Fresh Catch', 'Beach Bonfire', 'Trawler', 'Rocking Chair', 'Screen Door',
];

// ── TRIVIA GAME ─────────────────────────────────────────────────────────────────
function TriviaGame({ onBack }: { onBack(): void }) {
  type Phase = 'setup' | 'play' | 'reveal' | 'done';
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(2);
  const [rawNames, setRawNames] = useState(['', '', '', '', '', '']);
  const [players, setPlayers] = useState<{ name: string; score: number }[]>([]);
  const [qs] = useState(() => shuffle(TRIVIA).slice(0, 10));
  const [qi, setQi] = useState(0);
  const [pi, setPi] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [time, setTime] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const piRef = useRef(0);

  piRef.current = pi;

  function advance(optIdx: number) {
    clearInterval(timerRef.current!);
    setChosen(optIdx);
    const correct = optIdx === qs[qi].ans;
    const curPi = piRef.current;
    setPlayers(prev => {
      const next = [...prev];
      if (correct) next[curPi] = { ...next[curPi], score: next[curPi].score + 1 };
      return next;
    });
    setPhase('reveal');
  }

  useEffect(() => {
    if (phase !== 'play') return;
    setTime(15);
    clearInterval(timerRef.current!);
    timerRef.current = setInterval(() => {
      setTime(t => {
        if (t <= 1) { clearInterval(timerRef.current!); advance(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase, qi]);

  function next() {
    setChosen(null);
    const nextQi = qi + 1;
    const nextPi = (pi + 1) % players.length;
    if (nextQi >= qs.length) { setPhase('done'); return; }
    setQi(nextQi);
    setPi(nextPi);
    setPhase('play');
  }

  if (phase === 'setup') return (
    <div className="game-shell">
      <button className="game-back" onClick={onBack}>← Back to Games</button>
      <div className="game-setup">
        <div className="game-icon-big">🎯</div>
        <h2>Gulf Trivia Showdown</h2>
        <p>10 questions about Gulf Coast food, fish, towns, and traditions. Players take turns — highest score wins.</p>
        <div className="game-player-count">
          <label>How many players?</label>
          <div className="count-btns">
            {[2, 3, 4, 5, 6].map(n => (
              <button key={n} className={count === n ? 'count-btn active' : 'count-btn'} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </div>
        <div className="game-names">
          {Array.from({ length: count }).map((_, i) => (
            <input key={i} className="game-name-input" placeholder={`Player ${i + 1} name`} value={rawNames[i]}
              onChange={e => setRawNames(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} />
          ))}
        </div>
        <button className="btn" onClick={() => {
          const ps = rawNames.slice(0, count).map((n, i) => ({ name: n.trim() || `Player ${i + 1}`, score: 0 }));
          setPlayers(ps);
          setPi(0);
          setQi(0);
          setPhase('play');
        }}>Start Game 🎯</button>
      </div>
    </div>
  );

  if (phase === 'done') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="game-shell">
        <div className="game-result">
          <div className="game-icon-big">🏆</div>
          <h2>{sorted[0].name} Wins!</h2>
          <p className="result-sub">{sorted[0].score} out of {qs.length} correct</p>
          <div className="score-board">
            {sorted.map((p, i) => (
              <div key={p.name} className="score-row">
                <span className="score-rank">{['🥇', '🥈', '🥉', '4th', '5th', '6th'][i]}</span>
                <span className="score-name">{p.name}</span>
                <span className="score-pts">{p.score} pts</span>
              </div>
            ))}
          </div>
          <div className="game-actions">
            <button className="btn" onClick={() => { setPhase('setup'); setQi(0); setPi(0); setChosen(null); }}>Play Again</button>
            <button className="btn light-teal" onClick={onBack}>All Games</button>
          </div>
        </div>
      </div>
    );
  }

  const q = qs[qi];

  return (
    <div className="game-shell">
      <div className="trivia-game">
        <div className="trivia-header">
          <span className="trivia-who">🎯 {players[pi]?.name}&rsquo;s turn</span>
          <span className="trivia-progress">Q {qi + 1} / {qs.length}</span>
          {phase === 'play' && <span className={`trivia-timer ${time <= 5 ? 'urgent' : ''}`}>{time}s</span>}
        </div>
        <div className="trivia-scores">
          {players.map((p, i) => (
            <div key={p.name} className={`score-chip ${i === pi ? 'active' : ''}`}>
              <span>{p.name}</span><strong>{p.score}</strong>
            </div>
          ))}
        </div>
        <div className="trivia-q">{q.q}</div>
        <div className="trivia-opts">
          {q.opts.map((opt, i) => {
            let cls = 'trivia-opt';
            if (phase === 'reveal') {
              if (i === q.ans) cls += ' correct';
              else if (i === chosen) cls += ' wrong';
            }
            return (
              <button key={i} className={cls} onClick={() => phase === 'play' && advance(i)} disabled={phase === 'reveal'}>
                <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>
        {phase === 'reveal' && (
          <div className="trivia-feedback">
            <p>{chosen === q.ans ? '✅ Correct! +1 point' : chosen === -1 ? '⏱ Time\'s up!' : '❌ Wrong!'}</p>
            <button className="btn" onClick={next}>{qi + 1 < qs.length ? 'Next Question →' : 'See Results'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CRAB RACE ───────────────────────────────────────────────────────────────────
const CRAB_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#e67e22'];
const CRAB_LABELS = ['Red Crab', 'Blue Crab', 'Green Crab', 'Gold Crab'];

function CrabRace({ onBack }: { onBack(): void }) {
  type Phase = 'setup' | 'countdown' | 'race' | 'done';
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(2);
  const [rawNames, setRawNames] = useState(['', '', '', '']);
  const [players, setPlayers] = useState<{ name: string; color: string }[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [raceTime, setRaceTime] = useState(15);
  const [taps, setTaps] = useState([0, 0, 0, 0]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('setup');
  phaseRef.current = phase;

  useEffect(() => () => { clearInterval(timerRef.current!); clearInterval(cdRef.current!); }, []);

  function startCountdown() {
    const ps = rawNames.slice(0, count).map((n, i) => ({ name: n.trim() || CRAB_LABELS[i], color: CRAB_COLORS[i] }));
    setPlayers(ps);
    setTaps([0, 0, 0, 0]);
    setCountdown(3);
    setPhase('countdown');
    cdRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(cdRef.current!);
          // start race after countdown hits 0
          setRaceTime(15);
          setPhase('race');
          timerRef.current = setInterval(() => {
            setRaceTime(t => {
              if (t <= 1) { clearInterval(timerRef.current!); setPhase('done'); return 0; }
              return t - 1;
            });
          }, 1000);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function tap(idx: number) {
    if (phaseRef.current !== 'race') return;
    setTaps(prev => { const n = [...prev]; n[idx]++; return n; });
  }

  function handleTouch(idx: number, e: React.TouchEvent) {
    e.preventDefault();
    tap(idx);
  }

  const maxTaps = Math.max(...taps, 1);

  if (phase === 'setup') return (
    <div className="game-shell">
      <button className="game-back" onClick={onBack}>← Back to Games</button>
      <div className="game-setup">
        <div className="game-icon-big">🦀</div>
        <h2>Crab Derby</h2>
        <p>Tap your button as fast as you can for 15 seconds. The crab with the most taps scuttles to the Gulf first!</p>
        <div className="game-player-count">
          <label>How many crabs?</label>
          <div className="count-btns">
            {[2, 3, 4].map(n => <button key={n} className={count === n ? 'count-btn active' : 'count-btn'} onClick={() => setCount(n)}>{n}</button>)}
          </div>
        </div>
        <div className="game-names">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="crab-name-row">
              <span style={{ color: CRAB_COLORS[i], fontSize: 22 }}>🦀</span>
              <input className="game-name-input" placeholder={CRAB_LABELS[i]} value={rawNames[i]}
                onChange={e => setRawNames(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} />
            </div>
          ))}
        </div>
        <button className="btn" onClick={startCountdown}>Start Race 🦀</button>
      </div>
    </div>
  );

  if (phase === 'countdown') return (
    <div className="game-shell">
      <div className="crab-countdown">
        <p>Get your tapping finger ready…</p>
        <div className="countdown-num">{countdown || 'GO!'}</div>
      </div>
    </div>
  );

  if (phase === 'done') {
    const results = players.map((p, i) => ({ ...p, taps: taps[i] })).sort((a, b) => b.taps - a.taps);
    return (
      <div className="game-shell">
        <div className="game-result">
          <div className="game-icon-big">🦀</div>
          <h2>{results[0].name} Wins!</h2>
          <p className="result-sub">{results[0].taps} taps in 15 seconds</p>
          <div className="score-board">
            {results.map((p, i) => (
              <div key={p.name} className="score-row">
                <span className="score-rank">{['🥇', '🥈', '🥉', '4th'][i]}</span>
                <span className="score-name">{p.name}</span>
                <span className="score-pts">{p.taps} taps</span>
              </div>
            ))}
          </div>
          <div className="game-actions">
            <button className="btn" onClick={() => { setTaps([0, 0, 0, 0]); setPhase('setup'); }}>Race Again</button>
            <button className="btn light-teal" onClick={onBack}>All Games</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-shell crab-race-active">
      <div className="crab-timer">{raceTime}s — TAP TAP TAP!</div>
      <div className="crab-track">
        {players.map((p, i) => {
          const pct = (taps[i] / maxTaps) * 85;
          return (
            <div key={i} className="crab-lane">
              <span className="crab-lane-label">{p.name}</span>
              <div className="crab-lane-bar">
                <span className="crab-mover" style={{ left: `${pct}%` }}>🦀</span>
              </div>
              <span className="crab-lane-finish">🌊</span>
            </div>
          );
        })}
      </div>
      <div className={`crab-tap-grid count-${count}`}>
        {players.map((p, i) => (
          <button key={i} className="crab-tap-btn" style={{ background: p.color }}
            onClick={() => tap(i)}
            onTouchStart={e => handleTouch(i, e)}>
            <span>🦀</span>
            <strong>{p.name}</strong>
            <span className="tap-count">{taps[i]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MULLET TOSS ─────────────────────────────────────────────────────────────────
function MulletToss({ onBack }: { onBack(): void }) {
  type Phase = 'setup' | 'toss' | 'done';
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(2);
  const [rawNames, setRawNames] = useState(['', '', '', '']);
  const [players, setPlayers] = useState<{ name: string; throws: number[]; best: number }[]>([]);
  const [pi, setPi] = useState(0);
  const [throwNum, setThrowNum] = useState(1);
  const [power, setPower] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lastDist, setLastDist] = useState<number | null>(null);
  const [flying, setFlying] = useState(false);
  const powerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dirRef = useRef(1);
  const powerStateRef = useRef(0);

  useEffect(() => () => clearInterval(powerRef.current!), []);

  function startMeter() {
    setPower(0);
    setLocked(false);
    setLastDist(null);
    setFlying(false);
    dirRef.current = 1;
    powerStateRef.current = 0;
    clearInterval(powerRef.current!);
    powerRef.current = setInterval(() => {
      powerStateRef.current += dirRef.current * 2.5;
      if (powerStateRef.current >= 100) { dirRef.current = -1; powerStateRef.current = 100; }
      if (powerStateRef.current <= 0) { dirRef.current = 1; powerStateRef.current = 0; }
      setPower(powerStateRef.current);
    }, 30);
  }

  function lockPower() {
    if (locked) return;
    clearInterval(powerRef.current!);
    setLocked(true);
    const dist = Math.round(powerStateRef.current * 0.62 + Math.random() * 14);
    setFlying(true);
    setTimeout(() => {
      setFlying(false);
      setLastDist(dist);
      setPi(curPi => {
        setPlayers(prev => {
          const next = [...prev];
          next[curPi] = { ...next[curPi], throws: [...next[curPi].throws, dist], best: Math.max(next[curPi].best, dist) };
          return next;
        });
        return curPi;
      });
    }, 1300);
  }

  function nextTurn() {
    const isLastThrow = throwNum === 3;
    const isLastPlayer = pi === players.length - 1;
    if (isLastThrow && isLastPlayer) { setPhase('done'); return; }
    if (isLastThrow) {
      setPi(p => p + 1);
      setThrowNum(1);
    } else {
      setThrowNum(t => t + 1);
    }
    setTimeout(startMeter, 50);
  }

  if (phase === 'setup') return (
    <div className="game-shell">
      <button className="game-back" onClick={onBack}>← Back to Games</button>
      <div className="game-setup">
        <div className="game-icon-big">🐟</div>
        <h2>Mullet Toss</h2>
        <p>Flora-Bama style. Stop the power meter at peak power and toss your mullet as far as you can. 3 throws each — longest toss wins.</p>
        <div className="game-player-count">
          <label>How many players?</label>
          <div className="count-btns">
            {[1, 2, 3, 4].map(n => <button key={n} className={count === n ? 'count-btn active' : 'count-btn'} onClick={() => setCount(n)}>{n}</button>)}
          </div>
        </div>
        <div className="game-names">
          {Array.from({ length: count }).map((_, i) => (
            <input key={i} className="game-name-input" placeholder={`Player ${i + 1} name`} value={rawNames[i]}
              onChange={e => setRawNames(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} />
          ))}
        </div>
        <button className="btn" onClick={() => {
          const ps = rawNames.slice(0, count).map((n, i) => ({ name: n.trim() || `Player ${i + 1}`, throws: [], best: 0 }));
          setPlayers(ps);
          setPi(0);
          setThrowNum(1);
          setPhase('toss');
          setTimeout(startMeter, 100);
        }}>Start Tossin' 🐟</button>
      </div>
    </div>
  );

  if (phase === 'done') {
    const sorted = [...players].sort((a, b) => b.best - a.best);
    return (
      <div className="game-shell">
        <div className="game-result">
          <div className="game-icon-big">🏆</div>
          <h2>{sorted[0].name} Wins!</h2>
          <p className="result-sub">Best toss: {sorted[0].best} ft</p>
          <div className="score-board">
            {sorted.map((p, i) => (
              <div key={p.name} className="score-row">
                <span className="score-rank">{['🥇', '🥈', '🥉', '4th'][i]}</span>
                <span className="score-name">{p.name}</span>
                <span className="score-pts">{p.best} ft</span>
              </div>
            ))}
          </div>
          <div className="mullet-all-throws">
            {players.map(p => (
              <div key={p.name} className="mullet-throw-row">
                <strong>{p.name}:</strong> {p.throws.map(t => `${t} ft`).join(' · ')}
              </div>
            ))}
          </div>
          <div className="game-actions">
            <button className="btn" onClick={() => {
              setPlayers(prev => prev.map(p => ({ ...p, throws: [], best: 0 })));
              setPi(0); setThrowNum(1);
              setPhase('toss');
              setTimeout(startMeter, 100);
            }}>Toss Again</button>
            <button className="btn light-teal" onClick={onBack}>All Games</button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = players[pi];
  const meterColor = power > 70 ? '#27ae60' : power > 35 ? '#e67e22' : '#c0392b';

  return (
    <div className="game-shell">
      <div className="mullet-game">
        <div className="trivia-header">
          <span className="trivia-who">🐟 {currentPlayer?.name} — Throw {throwNum} of 3</span>
        </div>
        <div className="trivia-scores">
          {players.map((p, i) => (
            <div key={p.name} className={`score-chip ${i === pi ? 'active' : ''}`}>
              <span>{p.name}</span><strong>{p.best > 0 ? `${p.best} ft` : '–'}</strong>
            </div>
          ))}
        </div>
        <div className="mullet-meter-wrap">
          <div className="mullet-meter-label">POWER</div>
          <div className="mullet-meter">
            <div className="mullet-meter-fill" style={{ width: `${power}%`, background: meterColor }} />
          </div>
          <div className="mullet-power-pct">{Math.round(power)}%</div>
        </div>
        <div className="mullet-field">
          <div className={`mullet-fish ${flying ? 'flying' : ''}`}
            style={{ '--mdist': `${Math.min(power * 0.82, 82)}%` } as React.CSSProperties}>🐟</div>
          <div className="mullet-ground">🌊 Gulf of Mexico</div>
        </div>
        {!locked && (
          <button className="btn mullet-throw-btn" onClick={lockPower}>TOSS! 🐟</button>
        )}
        {locked && flying && <p className="mullet-flying-txt">🐟 Flying…</p>}
        {locked && !flying && lastDist !== null && (
          <div className="mullet-result">
            <p className="mullet-dist">{lastDist} feet!</p>
            <button className="btn" onClick={nextTurn}>
              {throwNum === 3 && pi === players.length - 1 ? 'See Final Results' : throwNum < 3 ? 'Next Throw →' : `${players[pi + 1]?.name}'s Turn →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── GULF BINGO ──────────────────────────────────────────────────────────────────
function makeBingoCard(): (string | null)[] {
  const pool = shuffle(BINGO_POOL).slice(0, 24);
  return [...pool.slice(0, 12), null, ...pool.slice(12)];
}

function checkBingo(marked: boolean[]): boolean {
  const lines = [
    [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
    [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
    [0,6,12,18,24],[4,8,12,16,20],
  ];
  return lines.some(line => line.every(i => marked[i]));
}

function GulfBingo({ onBack }: { onBack(): void }) {
  type Phase = 'setup' | 'play' | 'bingo';
  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(2);
  const [rawNames, setRawNames] = useState(['', '', '', '', '', '', '', '']);
  const [cards, setCards] = useState<(string | null)[][]>([]);
  const [marked, setMarked] = useState<boolean[][]>([]);
  const [called, setCalled] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [activeCard, setActiveCard] = useState(0);
  const [winner, setWinner] = useState('');

  function startGame() {
    const newCards = Array.from({ length: count }, makeBingoCard);
    setCards(newCards);
    setMarked(newCards.map(card => card.map(sq => sq === null)));
    setCalled([]);
    setRemaining(shuffle([...BINGO_POOL]));
    setActiveCard(0);
    setWinner('');
    setPhase('play');
  }

  function callNext() {
    if (remaining.length === 0) return;
    const [next, ...rest] = remaining;
    setCalled(prev => [next, ...prev]);
    setRemaining(rest);
  }

  function toggleSquare(cardIdx: number, sqIdx: number) {
    if (cards[cardIdx][sqIdx] === null) return;
    setMarked(prev => {
      const next = prev.map(row => [...row]);
      next[cardIdx][sqIdx] = !next[cardIdx][sqIdx];
      if (next[cardIdx][sqIdx] && checkBingo(next[cardIdx])) {
        setWinner(rawNames[cardIdx].trim() || `Player ${cardIdx + 1}`);
        setPhase('bingo');
      }
      return next;
    });
  }

  if (phase === 'setup') return (
    <div className="game-shell">
      <button className="game-back" onClick={onBack}>← Back to Games</button>
      <div className="game-setup">
        <div className="game-icon-big">🎱</div>
        <h2>Gulf Coast Bingo</h2>
        <p>Everyone gets a card full of Gulf Coast words. Press "Call Next" to draw — first player to get five in a row hollers "Bingo!"</p>
        <div className="game-player-count">
          <label>How many players?</label>
          <div className="count-btns">
            {[2, 3, 4, 5, 6, 7, 8].map(n => <button key={n} className={count === n ? 'count-btn active' : 'count-btn'} onClick={() => setCount(n)}>{n}</button>)}
          </div>
        </div>
        <div className="game-names">
          {Array.from({ length: count }).map((_, i) => (
            <input key={i} className="game-name-input" placeholder={`Player ${i + 1} name`} value={rawNames[i]}
              onChange={e => setRawNames(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} />
          ))}
        </div>
        <button className="btn" onClick={startGame}>Deal Cards 🎱</button>
      </div>
    </div>
  );

  if (phase === 'bingo') return (
    <div className="game-shell">
      <div className="game-result">
        <div className="game-icon-big">🎉</div>
        <h2>BINGO! {winner} wins!</h2>
        <div className="game-actions">
          <button className="btn" onClick={startGame}>New Game</button>
          <button className="btn light-teal" onClick={onBack}>All Games</button>
        </div>
      </div>
    </div>
  );

  const currentCard = cards[activeCard];
  const currentMarked = marked[activeCard];

  return (
    <div className="game-shell">
      <div className="bingo-game">
        <div className="bingo-caller-row">
          <button className="game-back" style={{ margin: 0 }} onClick={onBack}>← Games</button>
          <div className="bingo-call-box">
            {called[0]
              ? <><div className="bingo-latest">{called[0]}</div><div className="bingo-call-label">Current Call</div></>
              : <div className="bingo-call-label">Press to start calling</div>
            }
          </div>
          <button className="btn" onClick={callNext} disabled={remaining.length === 0}>
            {remaining.length > 0 ? 'Call Next 🎱' : 'All called!'}
          </button>
        </div>
        {called.length > 1 && (
          <div className="bingo-called-list">
            <strong>Called ({called.length}):</strong> {called.slice(1).join(' · ')}
          </div>
        )}
        <div className="bingo-card-tabs">
          {Array.from({ length: count }).map((_, i) => (
            <button key={i} className={activeCard === i ? 'bingo-tab active' : 'bingo-tab'} onClick={() => setActiveCard(i)}>
              {rawNames[i].trim() || `Player ${i + 1}`}
            </button>
          ))}
        </div>
        <div className="bingo-card">
          {['B', 'I', 'N', 'G', 'O'].map(l => <div key={l} className="bingo-hdr">{l}</div>)}
          {currentCard?.map((sq, i) => (
            <button key={i} className={`bingo-sq ${currentMarked[i] ? 'marked' : ''} ${sq === null ? 'free' : ''}`}
              onClick={() => toggleSquare(activeCard, i)}>
              {sq === null ? '⭐ FREE' : sq}
            </button>
          ))}
        </div>
        <p className="bingo-hint">Tap your squares to mark them. Switch tabs to check other players' cards.</p>
      </div>
    </div>
  );
}

// ── GAME MENU ────────────────────────────────────────────────────────────────────
const GAMES = [
  { id: 'trivia', icon: '🎯', name: 'Gulf Trivia Showdown', desc: 'Test your Gulf Coast knowledge — seafood, fish, towns, and local legends. Players take turns answering.', players: '2–6 players' },
  { id: 'crab', icon: '🦀', name: 'Crab Derby', desc: 'Tap your button as fast as you can for 15 seconds. The crab with the most taps scuttles to the Gulf first.', players: '2–4 players' },
  { id: 'mullet', icon: '🐟', name: 'Mullet Toss', desc: 'Flora-Bama style. Stop the power meter at just the right moment and toss your mullet for max distance.', players: '1–4 players' },
  { id: 'bingo', icon: '🎱', name: 'Gulf Coast Bingo', desc: 'Gulf-themed bingo for the whole crew. Call out words, mark your card, and be the first to holler Bingo!', players: '2–8 players' },
];

export default function Games() {
  const [game, setGame] = useState<string | null>(null);
  const back = () => setGame(null);

  return <>
    <SEOMeta
      title="Gulf Coast Games | Coastal Haven Orange Beach"
      description="Play Gulf Coast multiplayer games at Coastal Haven. Gulf Trivia, Crab Derby, Mullet Toss, and Gulf Bingo — fun for the whole family in Orange Beach."
      canonical="/games"
      noindex
    />
    <Header />
    <main>
      {!game && <>
        <section className="page-hero-sand" style={{ padding: '80px 7vw 60px' }}>
          <div className="eyebrow dark">GAME NIGHT</div>
          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(32px,4vw,56px)', margin: '12px 0' }}>Gulf Coast Game Night</h1>
          <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 620 }}>Get the crew together. No phones needed, no internet required — just pick a game and start playing right here on the balcony.</p>
        </section>
        <section className="section">
          <div className="games-grid">
            {GAMES.map(g => (
              <button key={g.id} className="game-card" onClick={() => setGame(g.id)}>
                <div className="game-card-icon">{g.icon}</div>
                <div className="game-card-players">{g.players}</div>
                <h3>{g.name}</h3>
                <p>{g.desc}</p>
                <span className="btn btn-small" style={{ pointerEvents: 'none' }}>Play →</span>
              </button>
            ))}
          </div>
        </section>
      </>}
      {game === 'trivia' && <TriviaGame onBack={back} />}
      {game === 'crab' && <CrabRace onBack={back} />}
      {game === 'mullet' && <MulletToss onBack={back} />}
      {game === 'bingo' && <GulfBingo onBack={back} />}
    </main>
    <Footer />
  </>;
}
