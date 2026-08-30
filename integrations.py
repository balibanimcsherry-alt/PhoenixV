from datetime import date, datetime
import re
import httpx
from config import settings


def _parse_ical_date(val: str) -> date:
    val = val.strip()
    if len(val) == 8:
        return datetime.strptime(val, '%Y%m%d').date()
    return datetime.strptime(val[:15], '%Y%m%dT%H%M%S').date()


def _blocked_ranges(ical_text: str) -> list[tuple[date, date]]:
    """Return list of (start, end) exclusive-end blocked ranges from iCal text."""
    ranges = []
    in_event = False
    dtstart = dtend = status = None
    for line in ical_text.splitlines():
        line = line.strip()
        if line == 'BEGIN:VEVENT':
            in_event = True; dtstart = dtend = status = None
        elif line == 'END:VEVENT':
            if in_event and dtstart and dtend and dtend > dtstart and status != 'CANCELLED':
                ranges.append((dtstart, dtend))
            in_event = False
        elif in_event:
            if line.startswith('DTSTART'):
                val = line.split(':', 1)[-1]
                try: dtstart = _parse_ical_date(val)
                except Exception: pass
            elif line.startswith('DTEND'):
                val = line.split(':', 1)[-1]
                try: dtend = _parse_ical_date(val)
                except Exception: pass
            elif line.startswith('STATUS'):
                status = line.split(':', 1)[-1].strip().upper()
    return ranges


async def airbnb_available(checkin: str, checkout: str) -> tuple[bool, str]:
    ci = date.fromisoformat(checkin)
    co = date.fromisoformat(checkout)
    url = settings.airbnb_ical_url
    if not url:
        return True, 'demo availability (Airbnb iCal not configured)'
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(url, follow_redirects=True)
        if r.status_code != 200:
            return True, 'Airbnb iCal fetch failed (fallback: available)'
        blocked = _blocked_ranges(r.text)
    except Exception:
        return True, 'Airbnb iCal unavailable (fallback: available)'
    for start, end in blocked:
        # overlap: block starts before checkout AND block ends after checkin
        if start < co and end > ci:
            return False, 'Airbnb calendar'
    return True, 'Airbnb calendar'


def _parse_ical_events(ical_text: str) -> list[dict]:
    """Parse VEVENT blocks from iCal text with RFC 5545 line unfolding."""
    lines: list[str] = []
    for line in ical_text.splitlines():
        if line.startswith((' ', '\t')) and lines:
            lines[-1] += line[1:]
        else:
            lines.append(line)
    events: list[dict] = []
    in_event = False
    current: dict = {}
    for line in lines:
        raw = line.rstrip('\r')
        if raw == 'BEGIN:VEVENT':
            in_event = True; current = {}
        elif raw == 'END:VEVENT':
            if in_event and current.get('checkin') and current.get('checkout'):
                events.append(current)
            in_event = False
        elif in_event and ':' in raw:
            key_part, _, val = raw.partition(':')
            key = key_part.split(';')[0].upper()
            val = val.replace('\\n', '\n').replace('\\N', '\n').replace('\\,', ',').replace('\\;', ';').replace('\\\\', '\\')
            if key == 'DTSTART':
                try: current['checkin'] = str(_parse_ical_date(val.strip()))
                except: pass
            elif key == 'DTEND':
                try: current['checkout'] = str(_parse_ical_date(val.strip()))
                except: pass
            elif key == 'UID':
                current['uid'] = val.strip()
            elif key == 'SUMMARY':
                current['summary'] = val.strip()
            elif key == 'DESCRIPTION':
                current['raw_description'] = val.strip()
            elif key == 'STATUS':
                current['status'] = val.strip().upper()
    return events


def _extract_guest_info(summary: str, description: str) -> dict:
    """Extract guest name, phone, email from iCal summary/description. Returns dict."""
    name = phone = email = ''
    # Name from summary (e.g. "Reservation - John Doe" or "VRBO - John Doe")
    if ' - ' in summary:
        candidate = summary.rsplit(' - ', 1)[-1].strip()
        if candidate and 'not available' not in candidate.lower() and len(candidate) < 80:
            name = candidate
    if description:
        first = last = ''
        # Handle both literal \n and real newlines (iCal unfolding may vary)
        for ln in description.replace('\\n', '\n').split('\n'):
            ln = ln.strip()
            if ':' not in ln:
                continue
            k, _, v = ln.partition(':')
            k = k.strip().upper(); v = v.strip()
            if not v:
                continue
            if k == 'FIRST NAME':
                first = v
            elif k == 'LAST NAME':
                last = v
            # Airbnb: "Guest: John Doe"  VRBO: "Guest Name: John Doe"
            elif k in ('GUEST', 'GUEST NAME', 'NAME') and not name:
                name = v
            # Airbnb: "Phone: …"  VRBO: "Telephone: …"
            elif k in ('PHONE', 'TELEPHONE', 'TEL', 'MOBILE', 'CELL') and not phone:
                phone = v
            elif k == 'EMAIL' and not email:
                email = v
        if first or last:
            name = f'{first} {last}'.strip()
    return {'name': name, 'phone': phone, 'email': email}

def _extract_guest_name(summary: str, description: str) -> str:
    return _extract_guest_info(summary, description)['name']

# UIDs from these domains appearing in another platform's feed = cross-calendar import
_PLATFORM_UID_DOMAINS = {
    'airbnb':  'airbnb.com',
    'vrbo':    'vrbo.com',
    'booking': 'booking.com',
}

# Exact-match (lowercased) summaries that are NEVER real guest bookings
_BLOCK_SUMMARIES = {
    'not available', 'blocked', 'hold', 'owner block', 'owner hold',
    'maintenance', 'unavailable', 'closed', 'turnover',
    # NOTE: platform names ('airbnb', 'vrbo', 'booking.com') intentionally excluded —
    # cross-platform detection is handled by _PLATFORM_TOKENS with p != platform guard.
    # Including them here caused same-platform events (e.g. Airbnb summary "Airbnb")
    # to be deleted every sync and re-inserted as "new", triggering bulk notifications.
}

# Tokens that, when found in another platform's summary, indicate a cross-import
_PLATFORM_TOKENS: dict[str, set[str]] = {
    'airbnb':  {'airbnb'},
    'vrbo':    {'vrbo', 'homeaway'},
    'booking': {'booking.com'},
}

def _is_cross_calendar_block(platform: str, uid: str, summary: str) -> bool:
    """True when an event in this platform's feed originated from another platform."""
    u = uid.lower()
    s = summary.lower().strip()

    # Our own export reflected back into an OTA feed
    if 'coastalhaven' in u:
        return True

    # UID contains another platform's domain (e.g. airbnb.com UID inside VRBO feed)
    for p, domain in _PLATFORM_UID_DOMAINS.items():
        if p != platform and domain in u:
            return True

    # Summary is a known block/hold word (never a real booking)
    if s in _BLOCK_SUMMARIES:
        return True

    # Summary contains a competing platform's name
    # e.g. "Airbnb (HM123)" appearing in VRBO's feed
    for p, tokens in _PLATFORM_TOKENS.items():
        if p != platform:
            for token in tokens:
                if token in s:
                    return True

    return False


async def sync_platform_ical(platform: str, url: str) -> list[dict]:
    """Fetch and parse iCal from an OTA URL. Returns list of event dicts."""
    if not url:
        return []
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(url, follow_redirects=True)
        if r.status_code != 200:
            return []
        return _parse_ical_events(r.text)
    except Exception:
        return []


async def pricelabs_nightly_rate(checkin: str, checkout: str) -> tuple[float, str]:
    if not settings.pricelabs_api_key or not settings.pricelabs_listing_id:
        month = date.fromisoformat(checkin).month
        base = 365 if month in (5, 6, 7, 8) else 285 if month in (3, 4, 9, 10) else 225
        return float(base), 'demo seasonal rate (PriceLabs credentials not configured)'
    headers = {'X-API-Key': settings.pricelabs_api_key, 'Content-Type': 'application/json'}
    payload = {'listings': [{'id': settings.pricelabs_listing_id, 'pms': settings.pricelabs_pms, 'start_date': checkin, 'end_date': checkout}]}
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post('https://api.pricelabs.co/v1/listing_prices', headers=headers, json=payload)
        if r.status_code >= 400:
            return 300.0, 'PriceLabs fallback'
        results = r.json()
        daily = (results[0].get('data') or []) if isinstance(results, list) and results else []
        nums = [float(x['price']) for x in daily if x.get('price', 0) > 0]
        return (sum(nums) / len(nums) if nums else 300.0), 'PriceLabs'
