"""
Parse Airbnb / VRBO booking confirmation emails via IMAP.
Uses the same smtp_user / smtp_password configured for outbound email.
Gmail: searches [Gmail]/All Mail so Promotions-tab emails are included.
"""
import imaplib
import email
import re
from email.header import decode_header
from config import settings

# Gmail folders to try in order (All Mail catches Promotions tab)
_GMAIL_FOLDERS = ['[Gmail]/All Mail', 'INBOX', '"[Gmail]/All Mail"']


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
    """Return plain-text body; fall back to HTML with tags replaced by spaces."""
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

    if plain.strip():
        return plain
    # Strip tags — replace with space so adjacent words don't merge
    text = re.sub(r'<[^>]+>', ' ', html)
    # Collapse runs of whitespace to single space but keep newlines
    text = re.sub(r'[ \t]+', ' ', text)
    return text


def _first(patterns: list[str], text: str, flags: int = re.I | re.S) -> str:
    for pat in patterns:
        m = re.search(pat, text, flags)
        if m:
            v = m.group(1).strip()
            if v:
                return v
    return ''


def _parse_airbnb(body: str, subject: str) -> dict | None:
    combined = subject + '\n' + body

    # Confirmation code: letters+digits, e.g. HM3XY7ABCD, HMXXXXXXXXX
    code = _first([
        r'Confirmation code[:\s]+([A-Z0-9]{6,16})',
        r'Booking code[:\s]+([A-Z0-9]{6,16})',
        r'confirmation code[:\s]+([A-Z0-9]{6,16})',
        r'\b(HM[A-Z0-9]{6,12})\b',
        r'\b(HA[A-Z0-9]{6,12})\b',
    ], combined)
    if not code:
        return None

    name = _first([
        r'reservation from ([A-Z][a-zA-Z\-]+(?: [A-Z][a-zA-Z\-]+)+)',
        r'booked by ([A-Z][a-zA-Z\-]+(?: [A-Z][a-zA-Z\-]+)+)',
        # After "Guest information" section header
        r'Guest information\s+([A-Z][a-zA-Z\-]+(?: [A-Z][a-zA-Z\-]+)+)\s',
        r'Guest:\s*([A-Z][a-zA-Z\-]+(?: [A-Z][a-zA-Z\-]+)+)',
        r'guest\s+([A-Z][a-zA-Z\-]+(?: [A-Z][a-zA-Z\-]+)+)\s+(?:has|is)',
    ], combined)

    phone = _first([
        r'Phone[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
        r'Mobile[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
        r'Tel[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
    ], combined)

    return {'confirmation_code': code, 'name': name, 'phone': phone, 'email': ''}


def _parse_vrbo(body: str, subject: str) -> dict | None:
    combined = subject + '\n' + body

    code = _first([
        r'Confirmation[#\s:]+([A-Z0-9]{6,16})',
        r'Reservation[#\s:]+([A-Z0-9]{6,16})',
        r'#([A-Z0-9]{6,16})',
    ], combined)
    if not code:
        return None

    name = _first([
        r'Guest Name[:\s]+([A-Z][a-zA-Z\-]+(?: [A-Z][a-zA-Z\-]+)+)',
        r'Guest[:\s]+([A-Z][a-zA-Z\-]+(?: [A-Z][a-zA-Z\-]+)+)',
        r'Booked by[:\s]+([A-Z][a-zA-Z\-]+(?: [A-Z][a-zA-Z\-]+)+)',
    ], combined)

    phone = _first([
        r'(?:Phone|Telephone|Tel|Mobile)[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
    ], combined)

    email_val = _first([
        r'Email[:\s]+([\w.+\-]+@[\w.\-]+\.\w{2,})',
    ], combined)

    return {'confirmation_code': code, 'name': name, 'phone': phone, 'email': email_val}


def _connect() -> imaplib.IMAP4_SSL | None:
    if not settings.smtp_user or not settings.smtp_password:
        print('Email reader: SMTP_USER or SMTP_PASSWORD not set, skipping')
        return None
    try:
        m = imaplib.IMAP4_SSL('imap.gmail.com', 993)
        m.login(settings.smtp_user, settings.smtp_password)
        print(f'Email reader: IMAP connected as {settings.smtp_user}')
        return m
    except Exception as e:
        print(f'Email reader: IMAP connect failed — {e}')
        return None


def _search_folder(m: imaplib.IMAP4_SSL, folder: str, sender: str, limit: int = 200) -> list[tuple[str, str]]:
    """Return (subject, body) pairs from folder matching sender domain."""
    try:
        status, _ = m.select(folder, readonly=True)
        if status != 'OK':
            return []
        _, data = m.search(None, f'FROM "{sender}"')
        nums = (data[0].split() or [])
        print(f'  {folder}: {len(nums)} emails from {sender}')
        results = []
        for num in nums[-limit:]:
            try:
                _, raw = m.fetch(num, '(RFC822)')
                if not raw or not raw[0]:
                    continue
                msg = email.message_from_bytes(raw[0][1])
                subject = _decode_str(msg.get('Subject', ''))
                body = _body(msg)
                results.append((subject, body))
            except Exception:
                continue
        return results
    except Exception as e:
        print(f'  {folder}: search error — {e}')
        return []


_SOURCES = [
    # (sender_domain, parser_fn, platform)
    ('airbnb.com',   _parse_airbnb, 'airbnb'),
    ('vrbo.com',     _parse_vrbo,   'vrbo'),
    ('homeaway.com', _parse_vrbo,   'vrbo'),
]


def fetch_ota_guest_info(debug: bool = False) -> list[dict]:
    """
    Connect to Gmail IMAP, parse booking emails, return guest info dicts.
    If debug=True, also returns raw sample text for diagnosis.
    """
    m = _connect()
    if not m:
        return []

    results: list[dict] = []
    seen_codes: set[str] = set()

    try:
        for sender, parser, platform in _SOURCES:
            msgs: list[tuple[str, str]] = []

            # Try All Mail first (catches Gmail Promotions/Social tabs)
            for folder in _GMAIL_FOLDERS:
                found = _search_folder(m, folder, sender, 200)
                if found:
                    msgs = found
                    break

            if not msgs:
                print(f'  No emails found from {sender}')
                continue

            parsed_count = 0
            for subject, body in msgs:
                info = parser(body, subject)
                if not info:
                    continue
                code = info['confirmation_code']
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                info['platform'] = platform
                if debug:
                    # Attach first 500 chars of body for inspection
                    info['_sample'] = (subject + '\n' + body)[:500]
                results.append(info)
                parsed_count += 1

            print(f'  {sender}: parsed {parsed_count} booking emails')

    except Exception as e:
        print(f'Email reader: unexpected error — {e}')
    finally:
        try:
            m.logout()
        except Exception:
            pass

    print(f'Email reader: total {len(results)} parsed across all platforms')
    return results
