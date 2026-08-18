import { useCallback, useEffect, useRef, useState } from 'react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const STATE_ABBRS: Record<string, string> = {
  alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',
  colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',
  hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',
  kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',
  michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',
  nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ',
  'new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',
  ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI',
  'south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',
  utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',
  wisconsin:'WI',wyoming:'WY',
};

function toStateAbbr(state: string): string {
  if (!state) return '';
  if (state.length === 2) return state.toUpperCase();
  return STATE_ABBRS[state.toLowerCase()] || state;
}

function formatNominatimAddress(addr: NominatimResult['address']): string {
  const parts: string[] = [];
  const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
  if (street) parts.push(street);
  const city = addr.city || addr.town || addr.village || addr.suburb || '';
  if (city) parts.push(city);
  const st = toStateAbbr(addr.state || '');
  if (st) parts.push(st);
  if (addr.postcode) parts.push(addr.postcode.split('-')[0]);
  return parts.join(', ');
}

function normalizeTyped(raw: string): string {
  return raw
    .trim()
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*/g, ', ')
    .replace(/\b(st|ave|blvd|dr|rd|ln|ct|pl|way|hwy|pkwy|ter|cir)\b\.?/gi, m =>
      m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
    );
}

function validate(v: string): string {
  if (!v.trim()) return '';
  if (!/\d/.test(v)) return 'Include a street number (e.g. 123 Main St, City, AL 36000).';
  if (v.split(',').length < 2) return 'Include city and state separated by commas.';
  return '';
}

export default function AddressInput({ value, onChange, placeholder, id }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const search = useCallback((q: string) => {
    if (q.length < 6) { setSuggestions([]); setOpen(false); return; }
    fetch(
      'https://nominatim.openstreetmap.org/search' +
      `?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5&countrycodes=us`,
      { headers: { 'Accept-Language': 'en-US' } }
    )
      .then(r => r.json())
      .then((res: NominatimResult[]) => {
        const filtered = res.filter(r => r.address?.road && r.address?.house_number);
        setSuggestions(filtered);
        setOpen(filtered.length > 0);
        setActive(-1);
      })
      .catch(() => { setSuggestions([]); setOpen(false); });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setError('');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 380);
  };

  const pick = (result: NominatimResult) => {
    const formatted = formatNominatimAddress(result.address);
    onChange(formatted);
    setSuggestions([]);
    setOpen(false);
    setError('');
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 160);
    if (value.trim()) {
      const normalized = normalizeTyped(value);
      if (normalized !== value) onChange(normalized);
      setError(validate(normalized || value));
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(suggestions[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrap} className="address-input-wrap">
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder || '123 Main St, City, State ZIP'}
        autoComplete="street-address"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
      />
      {error && <p className="address-error" role="alert">{error}</p>}
      {open && suggestions.length > 0 && (
        <ul className="address-suggestions" role="listbox" aria-label="Address suggestions">
          {suggestions.map((s, i) => {
            const label = formatNominatimAddress(s.address) || s.display_name;
            return (
              <li
                key={s.place_id}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'active' : ''}
                onMouseDown={() => pick(s)}
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
