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
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadBlocked().then(setBlockedSet); }, []);

  // Fetch prices for the two visible months
  useEffect(() => {
    const months = [month, addMonths(month, 1)];
    Promise.all(
      months.map(m =>
        api<{ prices: { date: string; direct_price: number }[] }>(
          `/api/pricing/calendar?year=${m.getFullYear()}&month=${m.getMonth() + 1}`
        ).catch(() => ({ prices: [] }))
      )
    ).then(results => {
      const map: Record<string, number> = {};
      for (const r of results) for (const p of r.prices) map[p.date] = p.direct_price;
      setPriceMap(map);
    });
  }, [month]);

  useLayoutEffect(() => {
    if (!open || inline || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopoverPos({ top: rect.bottom + window.scrollY + 10, left: rect.left + window.scrollX });
  }, [open, inline]);

  useEffect(() => {
    if (inline || !open) return;
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      const portal = document.getElementById('rdp-portal');
      if (triggerRef.current && !triggerRef.current.contains(t) && portal && !portal.contains(t))
        setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [inline, open]);

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
    // Only set checkout when it's a real range (different day)
    const validTo = to && from && to.getTime() !== from.getTime() ? to : undefined;
    onCheckout(validTo ? format(validTo, 'yyyy-MM-dd') : '');
    if (from && validTo && !inline) setOpen(false);
  };

  const label = checkin && checkout
    ? `${format(parseISO(checkin), 'MMM d')} – ${format(parseISO(checkout), 'MMM d')}`
    : checkin ? `${format(parseISO(checkin), 'MMM d')} → pick checkout`
    : 'Select dates';

  // Custom day button that shows nightly price below the date number
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const PricedDayButton = useCallback(({ day, modifiers, children, ...buttonProps }: any) => {
    const ds = format(day.date, 'yyyy-MM-dd');
    const price = priceMap[ds];
    return (
      <button {...buttonProps}>
        {children ?? day.date.getDate()}
        {price && !modifiers.disabled && !modifiers.outside && (
          <span className="rdp-day-price">${Math.round(price)}</span>
        )}
      </button>
    );
  }, [priceMap]);

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
        <div id="rdp-portal" className="rdp-popover" style={{ top: popoverPos.top, left: popoverPos.left }}>
          {picker}
        </div>,
        document.body
      )}
    </div>
  );
}
