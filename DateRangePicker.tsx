import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, addDays, addMonths } from 'date-fns';
import 'react-day-picker/style.css';
import { api } from './api';

interface BlockedRange { start: string; end: string; }
type DPRange = { from?: Date; to?: Date };

let _blockedSet: Set<string> = new Set();
let _cacheAt = 0;

async function loadBlocked(): Promise<Set<string>> {
  if (_blockedSet.size && Date.now() - _cacheAt < 300_000) return _blockedSet;
  try {
    const d = await api<{ blocked: BlockedRange[] }>('/api/availability/blocked');
    const set = new Set<string>();
    for (const { start, end } of d.blocked) {
      let cur = parseISO(start);
      const endDate = parseISO(end);
      while (cur < endDate) {
        set.add(format(cur, 'yyyy-MM-dd'));
        cur = addDays(cur, 1);
      }
    }
    _blockedSet = set;
    _cacheAt = Date.now();
  } catch { /**/ }
  return _blockedSet;
}

interface Props {
  checkin: string;
  checkout: string;
  onCheckin: (v: string) => void;
  onCheckout: (v: string) => void;
  inline?: boolean;
}

const today = new Date();
today.setHours(0, 0, 0, 0);

export default function DateRangePicker({ checkin, checkout, onCheckin, onCheckout, inline }: Props) {
  const [open, setOpen] = useState(false);
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState(new Date());
  const [priceMap, setPriceMap] = useState<Record<string, { price: number; color: string }>>({});
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadBlocked().then(setBlockedSet); }, []);

  // Fetch prices for the two visible months and color-code by demand level
  useEffect(() => {
    const months = [month, addMonths(month, 1)];
    Promise.all(
      months.map(m =>
        api<{ prices: { date: string; direct_price: number }[] }>(
          `/api/pricing/calendar?year=${m.getFullYear()}&month=${m.getMonth() + 1}`
        ).catch(() => ({ prices: [] }))
      )
    ).then(results => {
      const raw: Record<string, number> = {};
      const all: number[] = [];
      for (const r of results) for (const p of r.prices) {
        if (p.direct_price > 0) { raw[p.date] = p.direct_price; all.push(p.direct_price); }
      }
      const lo = all.length ? Math.min(...all) : 0;
      const hi = all.length ? Math.max(...all) : 1;
      const map: Record<string, { price: number; color: string }> = {};
      for (const [d, price] of Object.entries(raw)) {
        const pct = hi > lo ? (price - lo) / (hi - lo) : 0.5;
        // green = best deal, amber = moderate, coral = peak
        const color = pct > 0.66 ? '#c94340' : pct > 0.33 ? '#c87941' : '#17a45f';
        map[d] = { price, color };
      }
      setPriceMap(map);
    });
  }, [month]);

  useLayoutEffect(() => {
    if (!open || inline || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopoverPos({ top: rect.bottom + window.scrollY + 10, left: rect.left + window.scrollX });
  }, [open, inline]);

  const isDisabled = (day: Date) => {
    if (day < today) return true;
    return blockedSet.has(format(day, 'yyyy-MM-dd'));
  };

  const selected: DPRange | undefined = checkin
    ? { from: parseISO(checkin), to: checkout ? parseISO(checkout) : undefined }
    : undefined;

  const handleSelect = (range: DPRange | undefined) => {
    const from = range?.from;
    const to = range?.to;
    onCheckin(from ? format(from, 'yyyy-MM-dd') : '');
    const validTo = to && from && to.getTime() !== from.getTime() ? to : undefined;
    onCheckout(validTo ? format(validTo, 'yyyy-MM-dd') : '');
    if (from && validTo && !inline) setOpen(false);
  };

  // Override DayButton — price stacks below date number via flex-direction:column CSS
  const PricedDayButton = useCallback(({ day, modifiers, children, ...btnProps }: any) => {
    const ds = format(day.date, 'yyyy-MM-dd');
    const entry = priceMap[ds];
    return (
      <button {...btnProps}>
        {children}
        {entry && !modifiers.disabled && !modifiers.outside && (
          <span className="rdp-day-price" style={{ color: entry.color }}>
            ${Math.round(entry.price)}
          </span>
        )}
      </button>
    );
  }, [priceMap]);

  const label = checkin && checkout
    ? `${format(parseISO(checkin), 'MMM d')} – ${format(parseISO(checkout), 'MMM d')}`
    : checkin ? `${format(parseISO(checkin), 'MMM d')} → pick checkout`
    : 'Select dates';

  const picker = (
    <DayPicker
      mode="range"
      min={1}
      selected={selected as any}
      onSelect={handleSelect as any}
      month={month}
      onMonthChange={setMonth}
      numberOfMonths={2}
      disabled={isDisabled}
      showOutsideDays={false}
      components={{ DayButton: PricedDayButton } as any}
    />
  );

  if (inline) return <div className="rdp-inline">{picker}</div>;

  return (
    <div ref={triggerRef} style={{ flex: '1 1 auto' }}>
      <div className="rdp-trigger" onClick={() => setOpen(o => !o)}>
        <span className="rdp-trigger-label">Check in / Check out</span>
        <span className="rdp-trigger-value">{label}</span>
      </div>
      {open && createPortal(
        <>
          {/* Full-page backdrop — clicking outside the calendar closes it */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onMouseDown={() => setOpen(false)} />
          <div className="rdp-popover" style={{ top: popoverPos.top, left: popoverPos.left }}>
            {picker}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
