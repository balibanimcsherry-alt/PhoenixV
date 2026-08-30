"""
Parse Airbnb / VRBO booking confirmation emails via IMAP.
Searches [Gmail]/All Mail so Promotions-tab emails are included.
"""
import imaplib
import email
import re
from email.header import decode_header
from datetime import datetime
from config import settings

_GMAIL_FOLDERS  = ['[Gmail]/All Mail', 'INBOX']
_AIRBNB_SENDERS = ['automated@airbnb.com', 'airbnb.com', 'express@airbnb.com']
_VRBO_SENDERS   = ['noreply@reviews.homeaway.com', 'reservations@vrbo.com', 'vrbo.com', 'homeaway.com']


# ── helpers ──────────────────────────────────────────────────────────────────

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


def _extract_parts(msg) -> tuple[str, str, str]:
    """Return (plain_text, raw_html, date_str)."""
    plain = ''
    html  = ''
    date  = _decode_str(msg.get('Date', ''))
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
            text = payload.decode(charset, errors='replace')
            if msg.get_content_type() == 'text/html':
                html = text
            else:
                plain = text
    return plain, html, date


def _stripped(html: str) -> str:
    t = re.sub(r'<[^>]+>', ' ', html)
    t = re.sub(r'[ \t]+', ' ', t)
    return t


def _first(patterns: list[str], text: str, flags: int = re.I | re.S) -> str:
    for pat in patterns:
        m = re.search(pat, text, flags)
        if m:
            v = m.group(1).strip()
            if v:
                return v
    return ''


_MONTH = r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
_DATE_PATTERNS = [
    # Aug 22, 2026  /  August 22, 2026
    rf'{_MONTH}\s+(\d{{1,2}}),?\s+(\d{{4}})',
    # 08/22/2026  or  08-22-2026
    r'(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})',
    # 2026-08-22
    r'(\d{4})-(\d{2})-(\d{2})',
]

def _parse_dates(text: str) -> list[str]:
    """Extract up to 2 ISO dates (check-in, check-out) from text."""
    found = []
    for pat in _DATE_PATTERNS:
        for m in re.finditer(pat, text, re.I):
            g = m.groups()
            try:
                if len(g) == 3:
                    # Could be month-day-year, year-month-day, etc.
                    if len(g[0]) == 4:          # YYYY-MM-DD
                        d = datetime(int(g[0]), int(g[1]), int(g[2]))
                    elif g[0].isalpha() or len(g[0]) > 2:  # Month DD YYYY
                        month_str = m.group(0).split()[0]
                        day = int(g[0]) if g[0].isdigit() else int(g[1])
                        year = int(g[2]) if len(g[2]) == 4 else int(g[1])
                        d = datetime.strptime(f'{month_str[:3]} {day} {year}', '%b %d %Y')
                    else:                        # MM/DD/YYYY
                        d = datetime(int(g[2]), int(g[0]), int(g[1]))
                    iso = d.strftime('%Y-%m-%d')
                    if iso not in found and d.year >= 2020:
                        found.append(iso)
            except Exception:
                continue
        if len(found) >= 2:
            break
    return found[:2]


# ── parsers ──────────────────────────────────────────────────────────────────

def _parse_airbnb(plain: str, html: str, subject: str) -> dict | None:
    stripped = _stripped(html)
    all_text = '\n'.join([subject, plain, stripped])

    code = _first([
        r'Confirmation code[:\s]+([A-Z0-9]{6,16})',
        r'confirmation code[:\s]+([A-Z0-9]{6,16})',
        r'Booking code[:\s]+([A-Z0-9]{6,16})',
        r'\b(HM[A-Z0-9]{6,12})\b',
        r'\b(HA[A-Z0-9]{6,12})\b',
        r'\b(HB[A-Z0-9]{6,12})\b',
    ], all_text)
    if not code:
        return None

    name = _first([
        r'([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)\s+(?:has just booked|is planning|has booked|booked your)',
        r'reservation from\s+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
        r'booked by\s+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
        r'Guest[:\s]+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
        r'Guest information\s+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)\s',
        r'([A-Z][a-zA-Z\-]+\s+[A-Z][a-zA-Z\.\-]+)\s+(?:Phone|Member since|Joined)',
    ], all_text)

    phone = _first([
        r'Phone[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
        r'Mobile[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
    ], all_text)

    dates = _parse_dates(all_text)

    return {
        'platform': 'airbnb',
        'confirmation_code': code,
        'name': name,
        'phone': phone,
        'email': '',
        'checkin':  dates[0] if len(dates) > 0 else '',
        'checkout': dates[1] if len(dates) > 1 else '',
    }


def _parse_vrbo(plain: str, html: str, subject: str) -> dict | None:
    stripped = _stripped(html)
    all_text = '\n'.join([subject, plain, stripped])

    code = _first([
        r'Confirmation[#\s:]+([A-Z0-9]{6,16})',
        r'Reservation[#\s:]+([A-Z0-9]{6,16})',
        r'#([A-Z0-9]{6,16})',
    ], all_text)
    if not code:
        return None

    name = _first([
        r'Guest Name[:\s]+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
        r'Guest[:\s]+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
        r'Booked by[:\s]+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
    ], all_text)

    phone = _first([
        r'(?:Phone|Telephone|Tel|Mobile)[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
    ], all_text)

    email_val = _first([
        r'Email[:\s]+([\w.+\-]+@[\w.\-]+\.\w{2,})',
    ], all_text)

    dates = _parse_dates(all_text)

    return {
        'platform': 'vrbo',
        'confirmation_code': code,
        'name': name,
        'phone': phone,
        'email': email_val,
        'checkin':  dates[0] if len(dates) > 0 else '',
        'checkout': dates[1] if len(dates) > 1 else '',
    }


# ── IMAP connection & fetch ───────────────────────────────────────────────────

def _connect() -> imaplib.IMAP4_SSL | None:
    if not settings.smtp_user or not settings.smtp_password:
        print('Email reader: SMTP_USER or SMTP_PASSWORD not set')
        return None
    try:
        m = imaplib.IMAP4_SSL('imap.gmail.com', 993)
        m.login(settings.smtp_user, settings.smtp_password)
        print(f'Email reader: connected as {settings.smtp_user}')
        return m
    except Exception as e:
        print(f'Email reader: IMAP connect failed — {e}')
        return None


def _fetch_from_sender(m: imaplib.IMAP4_SSL, sender: str, limit: int = 500) -> list[tuple[str,str,str,str]]:
    """Return (subject, plain, html, date) for emails matching sender."""
    for folder in _GMAIL_FOLDERS:
        try:
            status, _ = m.select(folder, readonly=True)
            if status != 'OK':
                continue
            _, data = m.search(None, f'FROM "{sender}"')
            nums = data[0].split() if data and data[0] else []
            if not nums:
                continue
            print(f'  {folder}: {len(nums)} emails from {sender}')
            results = []
            for num in nums[-limit:]:
                try:
                    _, raw = m.fetch(num, '(RFC822)')
                    if not raw or not raw[0]:
                        continue
                    msg = email.message_from_bytes(raw[0][1])
                    subj = _decode_str(msg.get('Subject', ''))
                    plain, html, date = _extract_parts(msg)
                    results.append((subj, plain, html, date))
                except Exception:
                    continue
            return results
        except Exception as e:
            print(f'  {folder}: error — {e}')
    return []


# ── public API ────────────────────────────────────────────────────────────────

def fetch_all_guest_records() -> list[dict]:
    """
    Scan all booking emails and return every guest record found.
    Each record: {platform, confirmation_code, name, phone, email,
                  checkin, checkout, email_received, subject}
    """
    m = _connect()
    if not m:
        return []

    records: list[dict] = []
    seen: set[str] = set()

    try:
        # Airbnb
        for sender in _AIRBNB_SENDERS:
            msgs = _fetch_from_sender(m, sender)
            if not msgs:
                continue
            for subj, plain, html, date in msgs:
                info = _parse_airbnb(plain, html, subj)
                if not info or info['confirmation_code'] in seen:
                    continue
                seen.add(info['confirmation_code'])
                info['subject']        = subj
                info['email_received'] = date
                records.append(info)
            print(f'  Airbnb total so far: {len(records)}')
            break

        # VRBO
        for sender in _VRBO_SENDERS:
            msgs = _fetch_from_sender(m, sender)
            if not msgs:
                continue
            before = len(records)
            for subj, plain, html, date in msgs:
                info = _parse_vrbo(plain, html, subj)
                if not info or info['confirmation_code'] in seen:
                    continue
                seen.add(info['confirmation_code'])
                info['subject']        = subj
                info['email_received'] = date
                records.append(info)
            print(f'  VRBO added: {len(records)-before}')
            break

    except Exception as e:
        print(f'Email reader: error — {e}')
    finally:
        try:
            m.logout()
        except Exception:
            pass

    # Sort by checkin descending
    records.sort(key=lambda r: r.get('checkin',''), reverse=True)
    print(f'Email reader: {len(records)} total guest records extracted')
    return records


def fetch_ota_guest_info(debug: bool = False) -> list[dict]:
    """Compatibility wrapper used by the DB-update flow."""
    return fetch_all_guest_records()
