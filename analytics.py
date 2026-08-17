import json
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from collections import defaultdict
import httpx

_LOG = Path(__file__).parent / 'analytics.jsonl'
_geo_cache: dict[str, dict] = {}

async def _geolocate(ip: str) -> dict:
    if ip in _geo_cache:
        return _geo_cache[ip]
    if ip in ('127.0.0.1', '::1', 'testclient'):
        return {'country': 'Local', 'city': 'Local', 'region': '', 'lat': None, 'lon': None}
    try:
        async with httpx.AsyncClient(timeout=4) as c:
            r = await c.get(f'http://ip-api.com/json/{ip}?fields=country,city,regionName,lat,lon,isp,query')
        d = r.json()
        result = {'country': d.get('country', ''), 'city': d.get('city', ''), 'region': d.get('regionName', ''), 'lat': d.get('lat'), 'lon': d.get('lon'), 'isp': d.get('isp', '')}
    except Exception:
        result = {'country': '', 'city': '', 'region': '', 'lat': None, 'lon': None, 'isp': ''}
    _geo_cache[ip] = result
    return result

def _parse_ua(ua: str) -> dict:
    ua = ua or ''
    if any(m in ua for m in ('iPhone', 'Android')) and 'iPad' not in ua:
        device = 'mobile'
    elif 'iPad' in ua or 'Tablet' in ua:
        device = 'tablet'
    else:
        device = 'desktop'
    for b, label in (('Edg/', 'Edge'), ('OPR/', 'Opera'), ('Chrome/', 'Chrome'), ('Firefox/', 'Firefox'), ('Safari/', 'Safari')):
        if b in ua:
            browser = label; break
    else:
        browser = 'Other'
    if 'Windows' in ua:
        os_name = 'Windows'
    elif 'Macintosh' in ua:
        os_name = 'Mac'
    elif 'Linux' in ua:
        os_name = 'Linux'
    elif 'Android' in ua:
        os_name = 'Android'
    elif 'iPhone' in ua or 'iPad' in ua:
        os_name = 'iOS'
    else:
        os_name = 'Other'
    return {'device': device, 'browser': browser, 'os': os_name}

async def log_event(event: str, ip: str, ua: str, referrer: str, path: str, session_id: str, props: dict | None = None):
    geo = await _geolocate(ip)
    parsed = _parse_ua(ua)
    record = {
        'id': str(uuid.uuid4()),
        'ts': datetime.now(timezone.utc).isoformat(),
        'session_id': session_id or '',
        'event': event,
        'path': path,
        'ip': ip,
        **geo,
        **parsed,
        'referrer': referrer or '',
        'props': props or {},
    }
    with open(_LOG, 'a', encoding='utf-8') as f:
        f.write(json.dumps(record) + '\n')

def read_events(limit: int = 50000) -> list[dict]:
    if not _LOG.exists():
        return []
    lines = _LOG.read_text(encoding='utf-8').strip().splitlines()
    return [json.loads(l) for l in lines[-limit:] if l.strip()]

def aggregate(days: int = 30) -> dict:
    events = read_events()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    events = [e for e in events if e.get('ts', '') >= cutoff]

    daily: dict[str, int] = defaultdict(int)
    unique_sessions: set[str] = set()
    countries: dict[str, int] = defaultdict(int)
    cities: dict[str, int] = defaultdict(int)
    devices: dict[str, int] = defaultdict(int)
    browsers: dict[str, int] = defaultdict(int)
    os_counts: dict[str, int] = defaultdict(int)
    referrers: dict[str, int] = defaultdict(int)
    event_counts: dict[str, int] = defaultdict(int)
    hourly: dict[int, int] = defaultdict(int)

    for e in events:
        day = e['ts'][:10]
        daily[day] += 1
        sid = e.get('session_id', '')
        if sid:
            unique_sessions.add(sid)
        c = e.get('country', '')
        if c and c != 'Local':
            countries[c] += 1
        city = e.get('city', '')
        if city and city != 'Local':
            cities[city] += 1
        dev = e.get('device', '')
        if dev:
            devices[dev] += 1
        br = e.get('browser', '')
        if br:
            browsers[br] += 1
        os_ = e.get('os', '')
        if os_:
            os_counts[os_] += 1
        ref = e.get('referrer', '')
        if ref:
            try:
                domain = ref.split('/')[2]
                if 'localhost' not in domain:
                    referrers[domain] += 1
            except Exception:
                pass
        event_counts[e.get('event', 'unknown')] += 1
        try:
            hour = int(e['ts'][11:13])
            hourly[hour] += 1
        except Exception:
            pass

    daily_series = []
    for i in range(days - 1, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d')
        daily_series.append({'date': d, 'views': daily.get(d, 0)})

    hourly_series = [{'hour': h, 'events': hourly.get(h, 0)} for h in range(24)]

    funnel = {
        'Visitors': len(unique_sessions),
        'Date Search': event_counts.get('date_search', 0),
        'Quote Requested': event_counts.get('quote_requested', 0),
        'Checkout Started': event_counts.get('checkout_started', 0),
        'Booking Confirmed': event_counts.get('booking_confirmed', 0),
    }

    return {
        'total_events': len(events),
        'unique_sessions': len(unique_sessions),
        'funnel': [{'step': k, 'count': v} for k, v in funnel.items()],
        'daily': daily_series,
        'hourly': hourly_series,
        'countries': [{'name': k, 'count': v} for k, v in sorted(countries.items(), key=lambda x: -x[1])[:15]],
        'cities': [{'name': k, 'count': v} for k, v in sorted(cities.items(), key=lambda x: -x[1])[:10]],
        'devices': [{'name': k, 'count': v} for k, v in devices.items()],
        'browsers': [{'name': k, 'count': v} for k, v in sorted(browsers.items(), key=lambda x: -x[1])[:8]],
        'os': [{'name': k, 'count': v} for k, v in sorted(os_counts.items(), key=lambda x: -x[1])],
        'referrers': [{'name': k, 'count': v} for k, v in sorted(referrers.items(), key=lambda x: -x[1])[:10]],
        'event_counts': dict(event_counts),
        'recent': list(reversed(events[-50:])),
    }
