import { useEffect, useState } from 'react';
import { api } from './api';

const PLATFORM_COLOR: Record<string, string> = {
  airbnb: '#FF5A5F',
  vrbo: '#3D5A80',
  booking: '#003580',
  direct: '#0d5f6b',
};
const PLATFORM_LABEL: Record<string, string> = {
  airbnb: 'Airbnb',
  vrbo: 'VRBO',
  booking: 'Booking.com',
  direct: 'Direct',
};

interface Res {
  id: number;
  platform: string;
  checkin: string;
  checkout: string;
  label: string;       // shown in pill
  tooltip: string;     // shown on hover
  resUrl?: string;     // Airbnb reservation link
}

function parseDescription(desc: string): { resUrl?: string; phone4?: string } {
  const urlMatch = desc.match(/Reservation URL:\s*(https?:\/\/\S+)/);
  const phoneMatch = desc.match(/Phone Number \(Last 4 Digits\):\s*(\d+)/);
  return {
    resUrl: urlMatch?.[1],
    phone4: phoneMatch?.[1],
  };
}

function makeLabel(platform: string, summary: string, phone4?: string): string {
  const base = PLATFORM_LABEL[platform] || platform;
  if (phone4) return `${base} ···${phone4}`;
  return base;
}

function datesInRange(checkin: string, checkout: string): string[] {
  const out: string[] = [];
  const cur = new Date(checkin + 'T00:00:00');
  const end = new Date(checkout + 'T00:00:00');
  while (cur < end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function CalendarTab({ token }: { token: string }) {
  const [all, setAll] = useState<Res[]>([]);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    api<any>('/api/pms/reservations?all=1', { headers: { Authorization: `Bearer ${token}` } })
      .then(data => {
        const ota: Res[] = (data.ota || []).map((r: any) => {
          const { resUrl, phone4 } = parseDescription(r.raw_description || '');
          const label = makeLabel(r.platform, r.summary || '', phone4);
          const nights = Math.round((new Date(r.checkout + 'T00:00:00').getTime() - new Date(r.checkin + 'T00:00:00').getTime()) / 86400000);
          const tooltip = [
            `${PLATFORM_LABEL[r.platform] || r.platform}`,
            `${r.checkin} → ${r.checkout} (${nights} nights)`,
            phone4 ? `Phone: ···${phone4}` : '',
            resUrl ? `View reservation ↗` : '',
          ].filter(Boolean).join('\n');
          return { id: r.id, platform: r.platform, checkin: r.checkin, checkout: r.checkout, label, tooltip, resUrl };
        });
        const direct: Res[] = (data.direct || []).map((b: any) => {
          const nights = Math.round((new Date(b.checkout + 'T00:00:00').getTime() - new Date(b.checkin + 'T00:00:00').getTime()) / 86400000);
          const label = b.guest_name || b.email || 'Direct guest';
          const tooltip = [
            `Direct booking — #CHV-${String(b.id).padStart(4,'0')}`,
            `${b.guest_name || ''}${b.email ? ' · ' + b.email : ''}`,
            `${b.checkin} → ${b.checkout} (${nights} nights)`,
            b.phone ? `Phone: ${b.phone}` : '',
            `Total: $${b.total?.toFixed(0)}`,
          ].filter(Boolean).join('\n');
          return { id: -b.id, platform: 'direct', checkin: b.checkin, checkout: b.checkout, label, tooltip };
        });
        setAll([...ota, ...direct]);
      })
      .catch(() => {});
  }, [token]);

  // Build day → reservations map
  const dayMap: Record<string, Res[]> = {};
  for (const res of all) {
    for (const d of datesInRange(res.checkin, res.checkout)) {
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(res);
    }
  }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);

  const prev = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const next = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);

  return (
    <div>
      <h1>Calendar</h1>
      <p className="sub">All blocked dates — Airbnb, VRBO, Booking.com, and direct bookings. Hover a pill for details.</p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(PLATFORM_LABEL).map(([k, label]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: PLATFORM_COLOR[k] }} />
            <span>{label}</span>
          </div>
        ))}
        <div style={{ fontSize: 13, color: '#888', marginLeft: 'auto' }}>
          {all.length} reservations · Guest names not provided by OTAs
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn light" style={{ padding: '6px 14px', fontSize: 16 }} onClick={prev}>‹</button>
        <h2 style={{ margin: 0, minWidth: 200, textAlign: 'center' }}>{MONTHS[month]} {year}</h2>
        <button className="btn light" style={{ padding: '6px 14px', fontSize: 16 }} onClick={next}>›</button>
        <button className="btn light" style={{ padding: '6px 12px', fontSize: 13, marginLeft: 8 }}
          onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}>
          Today
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {DOWS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 12, fontWeight: 700,
            color: '#666', padding: '6px 0', letterSpacing: '0.05em',
          }}>{d}</div>
        ))}

        {cells.map((day, i) => {
          if (!day) return (
            <div key={`empty-${i}`} style={{ minHeight: 90, background: '#f9f9f7', borderRadius: 6 }} />
          );

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const reses = dayMap[dateStr] || [];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;

          return (
            <div key={dateStr} style={{
              minHeight: 90,
              background: isToday ? '#e6f4f6' : isPast ? '#fafaf8' : '#fff',
              borderRadius: 6,
              border: isToday ? '2px solid #0d5f6b' : '1px solid #eee',
              padding: '5px 5px 4px',
              opacity: isPast && reses.length === 0 ? 0.45 : 1,
            }}>
              <div style={{
                fontSize: 13, fontWeight: isToday ? 700 : 400,
                color: isToday ? '#0d5f6b' : isPast ? '#aaa' : '#222',
                marginBottom: 3,
              }}>{day}</div>

              {reses.slice(0, 3).map((r, ri) => (
                r.resUrl ? (
                  <a
                    key={ri}
                    href={r.resUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={r.tooltip}
                    style={{
                      display: 'block',
                      background: PLATFORM_COLOR[r.platform] || '#888',
                      color: '#fff',
                      fontSize: 10,
                      borderRadius: 3,
                      padding: '2px 5px',
                      marginBottom: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.4',
                      textDecoration: 'none',
                    }}
                  >
                    {r.label}
                  </a>
                ) : (
                  <div
                    key={ri}
                    title={r.tooltip}
                    style={{
                      background: PLATFORM_COLOR[r.platform] || '#888',
                      color: '#fff',
                      fontSize: 10,
                      borderRadius: 3,
                      padding: '2px 5px',
                      marginBottom: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'default',
                      lineHeight: '1.4',
                    }}
                  >
                    {r.label}
                  </div>
                )
              ))}
              {reses.length > 3 && (
                <div style={{ fontSize: 9, color: '#999', paddingLeft: 2 }}>+{reses.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note about OTA limitations */}
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#f5f5f3', borderRadius: 8, fontSize: 12, color: '#666' }}>
        <strong>Note:</strong> Airbnb and VRBO iCal feeds don't include guest names — this is an OTA privacy policy.
        Airbnb pills show the last 4 digits of the guest's phone and link directly to the reservation in your Airbnb host portal.
        For full guest details, check your Airbnb/VRBO host apps.
      </div>
    </div>
  );
}
