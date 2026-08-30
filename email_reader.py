"""
Parse Airbnb / VRBO booking confirmation emails via IMAP.
Searches [Gmail]/All Mail so Promotions-tab emails are included.
"""
import imaplib
import email
import re
from email.header import decode_header
from config import settings

_GMAIL_FOLDERS = ['[Gmail]/All Mail', 'INBOX']

_AIRBNB_SENDERS = ['automated@airbnb.com', 'airbnb.com', 'express@airbnb.com']
_VRBO_SENDERS   = ['noreply@reviews.homeaway.com', 'reservations@vrbo.com', 'vrbo.com', 'homeaway.com']


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


def _extract_parts(msg) -> tuple[str, str]:
    """Return (plain_text, raw_html) from an email message."""
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
            text = payload.decode(charset, errors='replace')
            if msg.get_content_type() == 'text/html':
                html = text
            else:
                plain = text
    return plain, html


def _stripped(html: str) -> str:
    """Strip HTML tags, collapse whitespace."""
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


def _parse_airbnb(plain: str, html: str, subject: str) -> dict | None:
    # Search all available text including raw HTML (confirmation code appears there too)
    all_text = '\n'.join([subject, plain, _stripped(html), html])

    # Airbnb confirmation codes: HM... or HA... followed by 6-14 alphanumerics
    code = _first([
        r'Confirmation code[:\s]+([A-Z0-9]{6,16})',
        r'confirmation code[:\s]+([A-Z0-9]{6,16})',
        r'Booking code[:\s]+([A-Z0-9]{6,16})',
        # Raw code pattern anywhere in the email (Airbnb uses HM prefix)
        r'\b(HM[A-Z0-9]{6,12})\b',
        r'\b(HA[A-Z0-9]{6,12})\b',
        r'\b(HB[A-Z0-9]{6,12})\b',
    ], all_text)

    if not code:
        print(f'  Airbnb: could not find confirmation code in: {subject[:80]}')
        return None

    name = _first([
        # Subject-line patterns: "John D. has just booked"
        r'([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)\s+(?:has just booked|is planning|has booked|booked your)',
        # Body patterns
        r'reservation from\s+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
        r'booked by\s+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
        r'Guest[:\s]+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)',
        # After "Guest information" section (HTML stripped to spaces)
        r'Guest information\s+([A-Z][a-zA-Z\-]+(?:\s[A-Z][a-zA-Z\.\-]+)+)\s',
        # Looser: capitalized words before "Phone" or "Member"
        r'([A-Z][a-zA-Z\-]+\s+[A-Z][a-zA-Z\.\-]+)\s+(?:Phone|Member since|Joined)',
    ], all_text)

    phone = _first([
        r'Phone[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
        r'Mobile[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
        r'Tel[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})',
    ], all_text)

    return {'confirmation_code': code, 'name': name, 'phone': phone, 'email': ''}


def _parse_vrbo(plain: str, html: str, subject: str) -> dict | None:
    all_text = '\n'.join([subject, plain, _stripped(html)])

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

    return {'confirmation_code': code, 'name': name, 'phone': phone, 'email': email_val}


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


def _fetch_from_sender(m: imaplib.IMAP4_SSL, sender: str, limit: int = 300) -> list[tuple[str, str, str]]:
    """Return (subject, plain, html) tuples for emails matching sender."""
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
                    plain, html = _extract_parts(msg)
                    results.append((subj, plain, html))
                except Exception:
                    continue
            return results
        except Exception as e:
            print(f'  {folder}: error — {e}')
            continue
    return []


def fetch_ota_guest_info(debug: bool = False) -> list[dict]:
    """
    Scan inbox for Airbnb/VRBO booking emails and extract guest info.
    Returns list of {platform, confirmation_code, name, phone, email} dicts.
    """
    m = _connect()
    if not m:
        return []

    results: list[dict] = []
    seen_codes: set[str] = set()

    try:
        # Airbnb — try each known sender address
        airbnb_msgs: list[tuple[str,str,str]] = []
        for sender in _AIRBNB_SENDERS:
            msgs = _fetch_from_sender(m, sender)
            airbnb_msgs.extend(msgs)
            if msgs:
                break  # stop at first sender that has mail

        for subj, plain, html in airbnb_msgs:
            info = _parse_airbnb(plain, html, subj)
            if not info:
                continue
            code = info['confirmation_code']
            if code in seen_codes:
                continue
            seen_codes.add(code)
            info['platform'] = 'airbnb'
            if debug:
                info['_subject'] = subj
                info['_sample'] = (plain or _stripped(html))[:400]
            results.append(info)

        print(f'  Airbnb: parsed {sum(1 for r in results if r.get("platform")=="airbnb")} reservations')

        # VRBO
        for sender in _VRBO_SENDERS:
            vrbo_msgs = _fetch_from_sender(m, sender)
            if not vrbo_msgs:
                continue
            for subj, plain, html in vrbo_msgs:
                info = _parse_vrbo(plain, html, subj)
                if not info:
                    continue
                code = info['confirmation_code']
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                info['platform'] = 'vrbo'
                if debug:
                    info['_subject'] = subj
                    info['_sample'] = (plain or _stripped(html))[:400]
                results.append(info)
            break

    except Exception as e:
        print(f'Email reader: error — {e}')
    finally:
        try:
            m.logout()
        except Exception:
            pass

    print(f'Email reader: {len(results)} total parsed')
    return results
