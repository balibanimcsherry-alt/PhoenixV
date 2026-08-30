"""
Parse Airbnb / VRBO booking confirmation emails via IMAP to extract guest details.
Uses the same smtp_user / smtp_password already configured for outbound email.
"""
import imaplib
import email
import re
from email.header import decode_header
from config import settings


def _decode_str(s: str | None) -> str:
    if not s:
        return ''
    parts = decode_header(s)
    out = []
    for part, enc in parts:
        if isinstance(part, bytes):
            out.append(part.decode(enc or 'utf-8', errors='replace'))
        else:
            out.append(str(part))
    return ''.join(out)


def _body(msg) -> str:
    """Return plain-text body, falling back to HTML with tags stripped."""
    plain = ''
    html = ''
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            payload = part.get_payload(decode=True)
            if not payload:
                continue
            charset = part.get_content_charset() or 'utf-8'
            decoded = payload.decode(charset, errors='replace')
            if ct == 'text/plain':
                plain += decoded
            elif ct == 'text/html':
                html += decoded
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or 'utf-8'
            plain = payload.decode(charset, errors='replace')

    if plain:
        return plain
    # Strip HTML tags as last resort
    return re.sub(r'<[^>]+>', ' ', html)


def _first(patterns: list[str], text: str, flags: int = re.I) -> str:
    for pat in patterns:
        m = re.search(pat, text, flags)
        if m:
            return m.group(1).strip()
    return ''


def _parse_airbnb(body: str, subject: str) -> dict | None:
    # Confirmation code: letters+digits, commonly starts with HM / HA / etc.
    code = _first([
        r'Confirmation code[:\s]+([A-Z0-9]{6,14})',
        r'Booking code[:\s]+([A-Z0-9]{6,14})',
        r'\b([A-Z]{2}[A-Z0-9]{6,12})\b',     # e.g. HM3XY7ABCD
    ], body + ' ' + subject)
    if not code:
        return None

    name = _first([
        r'New reservation from ([A-Z][a-z]+(?: [A-Z][a-z]+)+)',
        r'(?:^|\n)Guest[:\s]+([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)+)',
        r'booked by ([A-Z][a-z]+(?: [A-Z][a-z]+)+)',
    ], body)

    phone = _first([
        r'(?:Phone|Mobile|Tel)[:\s]+([\+\d][\d\s\(\)\-\.]{6,18})',
    ], body)

    return {'confirmation_code': code, 'name': name, 'phone': phone, 'email': ''}


def _parse_vrbo(body: str, subject: str) -> dict | None:
    code = _first([
        r'(?:Confirmation|Reservation)[#\s:]+(\w{6,16})',
        r'#(\d{6,12})',
    ], body + ' ' + subject)
    if not code:
        return None

    name = _first([
        r'(?:Guest Name|Guest)[:\s]+([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)+)',
        r'Booked by[:\s]+([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)+)',
    ], body)

    phone = _first([
        r'(?:Phone|Telephone|Tel|Mobile)[:\s]+([\+\d][\d\s\(\)\-\.]{6,18})',
    ], body)

    email_val = _first([
        r'(?:Email)[:\s]+([\w.+-]+@[\w.-]+\.\w+)',
    ], body)

    return {'confirmation_code': code, 'name': name, 'phone': phone, 'email': email_val}


def _connect() -> imaplib.IMAP4_SSL | None:
    if not settings.smtp_user or not settings.smtp_password:
        return None
    try:
        m = imaplib.IMAP4_SSL('imap.gmail.com', 993)
        m.login(settings.smtp_user, settings.smtp_password)
        return m
    except Exception as e:
        print(f'IMAP connect error: {e}')
        return None


def _fetch_msgs(m: imaplib.IMAP4_SSL, sender: str, limit: int = 200) -> list[tuple[str, str]]:
    """Return list of (subject, body) for emails from sender domain."""
    try:
        _, data = m.search(None, f'FROM "{sender}"')
        nums = (data[0].split() or [])[-limit:]
        results = []
        for num in nums:
            _, raw = m.fetch(num, '(RFC822)')
            if not raw or not raw[0]:
                continue
            msg = email.message_from_bytes(raw[0][1])
            subject = _decode_str(msg.get('Subject', ''))
            body = _body(msg)
            results.append((subject, body))
        return results
    except Exception as e:
        print(f'IMAP fetch error for {sender}: {e}')
        return []


def fetch_ota_guest_info() -> list[dict]:
    """
    Connect to Gmail, search for Airbnb/VRBO booking emails, parse guest info.
    Returns list of dicts: {platform, confirmation_code, name, phone, email}
    """
    m = _connect()
    if not m:
        return []

    results = []
    seen_codes: set[str] = set()

    try:
        m.select('INBOX')

        for sender in ['automated@airbnb.com', 'airbnb.com']:
            for subject, body in _fetch_msgs(m, sender):
                info = _parse_airbnb(body, subject)
                if info and info['confirmation_code'] not in seen_codes:
                    seen_codes.add(info['confirmation_code'])
                    info['platform'] = 'airbnb'
                    results.append(info)

        for sender in ['reservations@vrbo.com', 'vrbo.com', 'homeaway.com']:
            for subject, body in _fetch_msgs(m, sender):
                info = _parse_vrbo(body, subject)
                if info and info['confirmation_code'] not in seen_codes:
                    seen_codes.add(info['confirmation_code'])
                    info['platform'] = 'vrbo'
                    results.append(info)

    except Exception as e:
        print(f'IMAP search error: {e}')
    finally:
        try:
            m.logout()
        except Exception:
            pass

    print(f'Email reader: found {len(results)} booking emails')
    return results
