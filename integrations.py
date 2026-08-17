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
    dtstart = dtend = None
    for line in ical_text.splitlines():
        line = line.strip()
        if line == 'BEGIN:VEVENT':
            in_event = True; dtstart = dtend = None
        elif line == 'END:VEVENT':
            if in_event and dtstart and dtend and dtend > dtstart:
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


async def pricelabs_nightly_rate(checkin: str, checkout: str) -> tuple[float, str]:
    if not settings.pricelabs_api_key or not settings.pricelabs_listing_id:
        month = date.fromisoformat(checkin).month
        base = 365 if month in (5, 6, 7, 8) else 285 if month in (3, 4, 9, 10) else 225
        return float(base), 'demo seasonal rate (PriceLabs credentials not configured)'
    headers = {'X-API-Key': settings.pricelabs_api_key, 'Content-Type': 'application/json'}
    payload = {'listing_id': settings.pricelabs_listing_id, 'start_date': checkin, 'end_date': checkout}
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post('https://api.pricelabs.co/v1/listing_prices', headers=headers, json=payload)
        if r.status_code >= 400:
            return 300.0, 'PriceLabs fallback'
        data = r.json(); prices = data.get('prices') or data.get('data') or []
        nums = [float(x.get('price', 0)) for x in prices if x.get('price')]
        return (sum(nums) / len(nums) if nums else 300.0), 'PriceLabs'
