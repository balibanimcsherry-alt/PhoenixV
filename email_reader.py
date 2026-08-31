"""
Parse Airbnb / VRBO booking confirmation emails via IMAP.
Searches INBOX (Gmail Promotions tab emails appear there via search).
"""
import imaplib
import email
import re
from email.header import decode_header
from datetime import datetime, date as date_t
from config import settings

_GMAIL_FOLDERS  = ['"[Gmail]/All Mail"', 'INBOX']
_AIRBNB_SENDERS = ['automated@airbnb.com']
_VRBO_SENDERS   = ['sender@messages.homeaway.com', 'reservations@vrbo.com']

_MONTH_MAP = {
    'jan':1,'feb':2,'mar':3,'apr':4,'may':5,'jun':6,
    'jul':7,'aug':8,'sep':9,'oct':10,'nov':11,'dec':12,
    'january':1,'february':2,'march':3,'april':4,'june':6,
    'july':7,'august':8,'september':9,'october':10,'november':11,'december':12,
}


# ── helpers ──────────────────────────────────────────────────────────────────

def _decode_str(s) -> str:
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


def _to_iso(month_str: str, day: int, year: int) -> str | None:
    m = _MONTH_MAP.get(month_str.lower().strip())
    if not m:
        return None
    try:
        return date_t(year, m, day).isoformat()
    except Exception:
        return None


def _dates_from_subject(subject: str, email_date: str = '') -> tuple[str, str]:
    """
    Parse dates from email subject lines.
    Handles:
      Airbnb pending: 'for Jun 18 - 22, 2025'        -> checkin + checkout
      Airbnb pending: 'for Jul 31 - Aug 5, 2026'     -> checkin + checkout
      Airbnb confirm: '... arrives Jul 30'            -> checkin only
      VRBO: 'from Name: Jun 26 - Jun 29, 2025'       -> checkin + checkout
      VRBO: 'Jul 2, 2026 - Jul 5, 2026'              -> checkin + checkout
    """
    # Normalise Unicode dashes and spaces
    s = subject
    for ch in ['–', '—', '‒']:
        s = s.replace(ch, '-')
    for ch in [' ', ' ', ' ']:
        s = s.replace(ch, ' ')

    # VRBO: "Month D - Month D, YYYY" (both months explicit, comma before year)
    m = re.search(
        r'([A-Za-z]+)\s+(\d{1,2})[,]?\s*[-]+\s*([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})',
        s
    )
    if m:
        mon1, d1, mon2, d2, yr = m.group(1), int(m.group(2)), m.group(3), int(m.group(4)), int(m.group(5))
        checkin  = _to_iso(mon1, d1, yr)
        checkout = _to_iso(mon2, d2, yr)
        if checkin and checkout:
            return checkin, checkout

    # Airbnb pending: "for Month D1 - [Month2] D2, YYYY"
    m2 = re.search(
        r'for\s+([A-Za-z]+)\s+(\d{1,2})\s*[-]+\s*(?:([A-Za-z]+)\s+)?(\d{1,2}),?\s+(\d{4})',
        s
    )
    if m2:
        mon1, d1, mon2, d2, yr = m2.group(1), int(m2.group(2)), m2.group(3), int(m2.group(4)), int(m2.group(5))
        checkin  = _to_iso(mon1, d1, yr)
        checkout = _to_iso(mon2 if mon2 else mon1, d2, yr)
        if checkin and checkout:
            return checkin, checkout

    # Airbnb confirmed: "arrives Month D"
    m3 = re.search(r'arrives\s+([A-Za-z]+)\s+(\d{1,2})', s)
    if m3:
        mon, day = m3.group(1), int(m3.group(2))
        yr = datetime.now().year
        if email_date:
            ym = re.search(r'(\d{4})', email_date)
            if ym:
                yr = int(ym.group(1))
        checkin = _to_iso(mon, day, yr) or _to_iso(mon, day, yr + 1)
        if checkin:
            return checkin, ''

    return '', ''

def _dates_from_body(text: str, email_date: str = '') -> tuple[str, str]:
    """
    Extract check-in / check-out from email body text.
    Handles:
      "Sep 4 – Sep 7, 2025"   (full range with year)
      "Sep 4 – 7, 2025"       (same month, with year)
      "Check-out: Sep 7, 2025"
      "Departs Sep 7"
    Returns (checkin, checkout) — either or both may be empty.
    """
    yr = datetime.now().year
    if email_date:
        ym = re.search(r'(\d{4})', email_date)
        if ym:
            yr = int(ym.group(1))

    s = text
    for ch in ['–', '—', '‒']:
        s = s.replace(ch, '-')

    # Full range "Month D - [Month] D, YYYY"
    m = re.search(
        r'([A-Za-z]+)\s+(\d{1,2})\s*-+\s*(?:([A-Za-z]+)\s+)?(\d{1,2}),?\s+(\d{4})',
        s
    )
    if m:
        mon1, d1 = m.group(1), int(m.group(2))
        mon2, d2, y = m.group(3) or m.group(1), int(m.group(4)), int(m.group(5))
        ci = _to_iso(mon1, d1, y)
        co = _to_iso(mon2, d2, y)
        if ci and co:
            return ci, co

    # "Check-out" / "Checkout" / "Departs" label
    checkout = ''
    for pat in [
        r'Check.?out[:\s]+([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})?',
        r'Depart(?:s|ure)?[:\s]+([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})?',
    ]:
        m2 = re.search(pat, s, re.I)
        if m2:
            y2 = int(m2.group(3)) if m2.group(3) else yr
            checkout = _to_iso(m2.group(1), int(m2.group(2)), y2) or ''
            break

    return '', checkout


def _name_from_subject(subject: str) -> str:
    """Extract guest name from 'Reservation confirmed - Name arrives Month D'."""
    m = re.search(r'Reservation confirmed\s*[-–—]\s*(.+?)\s+arrives\s+[A-Za-z]+\s+\d', subject)
    if m:
        return m.group(1).strip()
    return ''


def _name_from_body(plain: str, html: str) -> str:
    """Search body text for guest name patterns (case-sensitive to avoid false positives)."""
    stripped = _stripped(html)
    # Try plain first, then stripped HTML
    for text in [plain, stripped]:
        for pat in [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z\.]+)+)\s+(?:has just booked|is planning|has booked|booked your)',
            r'reservation from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z\.]+)+)',
            r'Booked by[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z\.]+)+)',
            r'Guest(?:\s+Name)?[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z\.]+)+)',
            r'([A-Z][a-z]+\s+[A-Z][a-z\.]+)\s+(?:Member since|Joined)',
        ]:
            match = re.search(pat, text)
            if match:
                candidate = match.group(1).strip()
                # Filter obvious false positives
                if candidate.lower() not in ('service fee', 'view reservation', 'get directions'):
                    return candidate
    return ''


# ── parsers ──────────────────────────────────────────────────────────────────

def _parse_airbnb(plain: str, html: str, subject: str, email_date: str = "") -> dict | None:
    stripped = _stripped(html)
    all_text = plain + '\n' + stripped

    # Confirmation code — search subject first, then body
    code = ''
    for src in [subject, all_text]:
        for pat in [
            r'Confirmation code[:\s]+([A-Z0-9]{6,16})',
            r'\b(HM[A-Z0-9]{6,12})\b',
            r'\b(HA[A-Z0-9]{6,12})\b',
        ]:
            m = re.search(pat, src, re.I)
            if m:
                code = m.group(1).strip().upper()
                break
        if code:
            break
    if not code:
        return None

    # Name: subject is most reliable for confirmed reservations
    name = _name_from_subject(subject) or _name_from_body(plain, html)

    # Dates: body first when it has an explicit year in a full range (most reliable),
    # otherwise fall back to subject which only infers year from email_date.
    checkin, checkout = _dates_from_subject(subject, email_date)
    body_ci, body_co = _dates_from_body(all_text, email_date)
    if body_ci and body_co:
        # Body has full explicit range — trust it over subject's inferred year
        checkin, checkout = body_ci, body_co
    elif body_co and not checkout:
        checkout = body_co
    elif body_ci and not checkin:
        checkin = body_ci

    # Phone — Airbnb sometimes includes it in newer confirmation emails
    phone = ''
    pm = re.search(r'(?:Phone|Mobile|Tel)[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})', all_text, re.I)
    if pm:
        phone = re.sub(r'[^\d\+]', '', pm.group(1)).strip()

    return {
        'platform': 'airbnb',
        'confirmation_code': code,
        'name': name,
        'phone': phone,
        'email': '',
        'checkin':  checkin,
        'checkout': checkout,
    }


def _parse_vrbo(plain: str, html: str, subject: str, email_date: str = "") -> dict | None:
    # Skip payment, payout, cancellation, and non-reservation emails
    if re.search(r'payment|payout|receipt|review|rate your|how was|canceled|cancelled', subject, re.I):
        return None

    # Code from subject: "HA-XXXXXX" or "Vrbo #NNNNNNN"
    code = ''
    m = re.search(r'\b(HA-[A-Z0-9]{4,10})\b', subject, re.I)
    if m:
        code = m.group(1).upper()
    else:
        m = re.search(r'Vrbo\s*#(\d{4,12})', subject, re.I)
        if m:
            code = m.group(1)

    # Name from subject: "from Guest Name:" or "Booking from Guest Name:"
    name = ''
    nm = re.search(r'(?:Booking|Reservation|Instant Booking)\s+from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[:\-]', subject, re.I)
    if nm:
        name = nm.group(1).strip()

    # Dates from subject
    checkin, checkout = _dates_from_subject(subject, email_date)

    # If no code from subject, try body (strict patterns only)
    if not code:
        stripped = _stripped(html)
        all_text = plain + '\n' + stripped
        for pat in [
            r'\b(HA-[A-Z0-9]{4,10})\b',
            r'Reservation\s+ID\s*[:\s]+([A-Z0-9\-]{6,20})',
            r'Confirmation\s+(?:number|code|#)[:\s]+([A-Z0-9\-]{6,20})',
        ]:
            bm = re.search(pat, all_text, re.I)
            if bm:
                code = bm.group(1).strip().upper()
                break

    if not code:
        return None

    # Name from body if not in subject
    if not name:
        name = _name_from_body(plain, html)

    stripped = _stripped(html)
    all_text = plain + '\n' + stripped

    phone = ''
    pm = re.search(r'(?:Phone|Telephone|Tel|Mobile)[:\s]+([\+\d][\d\s\(\)\-\.]{6,20})', all_text, re.I)
    if pm:
        phone = pm.group(1).strip()

    email_val = ''
    em = re.search(r'Email[:\s]+([\w.+\-]+@[\w.\-]+\.\w{2,})', all_text, re.I)
    if em:
        email_val = em.group(1).strip()

    return {
        'platform': 'vrbo',
        'confirmation_code': code,
        'name': name,
        'phone': phone,
        'email': email_val,
        'checkin':  checkin,
        'checkout': checkout,
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


def _fetch_from_sender(m: imaplib.IMAP4_SSL, sender: str, limit: int = 500) -> list[tuple[str, str, str, str]]:
    """Return list of (subject, plain, html, date) for emails from sender."""
    for folder in _GMAIL_FOLDERS:
        try:
            typ, _ = m.select(folder, readonly=True)
            if typ != 'OK':
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
                    plain, html, dt = _extract_parts(msg)
                    results.append((subj, plain, html, dt))
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
        for sender in _AIRBNB_SENDERS:
            msgs = _fetch_from_sender(m, sender)
            if not msgs:
                continue
            for subj, plain, html, dt in msgs:
                info = _parse_airbnb(plain, html, subj, dt)
                if not info or info['confirmation_code'] in seen:
                    continue
                seen.add(info['confirmation_code'])
                info['subject']        = subj
                info['email_received'] = dt
                records.append(info)
            print(f'  Airbnb total: {len(records)}')
            break

        vrbo_before = len(records)
        for sender in _VRBO_SENDERS:
            msgs = _fetch_from_sender(m, sender)
            if not msgs:
                continue
            for subj, plain, html, dt in msgs:
                info = _parse_vrbo(plain, html, subj, dt)
                if not info or info['confirmation_code'] in seen:
                    continue
                seen.add(info['confirmation_code'])
                info['subject']        = subj
                info['email_received'] = dt
                records.append(info)
            print(f'  VRBO added: {len(records) - vrbo_before}')
            break

    except Exception as e:
        print(f'Email reader: error — {e}')
    finally:
        try:
            m.logout()
        except Exception:
            pass

    records.sort(key=lambda r: r.get('checkin', ''), reverse=True)
    print(f'Email reader: {len(records)} total guest records')
    return records


def fetch_ota_guest_info(debug: bool = False) -> list[dict]:
    """Compatibility wrapper used by the DB-update flow."""
    return fetch_all_guest_records()
