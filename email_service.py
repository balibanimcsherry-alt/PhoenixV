import smtplib, ssl as _ssl, logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from config import settings

log = logging.getLogger(__name__)

# ── Unsplash beach/Gulf images (reliable CDN) ────────────────────────────────
IMG_HERO_TEAL    = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&h=300&fit=crop&q=80'
IMG_HERO_SUNSET  = 'https://images.unsplash.com/photo-1476673160081-cf065607f449?w=640&h=300&fit=crop&q=80'
IMG_HERO_ARRIVAL = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=640&h=300&fit=crop&q=80'
IMG_HERO_REVIEW  = 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=640&h=300&fit=crop&q=80'
IMG_WAVE_BG      = 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=640&h=120&fit=crop&q=60'

PROPERTY_NAME = 'Coastal Haven at Phoenix V'
PROPERTY_ADDR = '24400 Perdido Beach Blvd, Orange Beach, AL 36561'
PROPERTY_URL  = 'https://orangebeachstay.com'
SUPPORT_EMAIL = 'voiceorchatbot@gmail.com'

# ── Shared CSS ───────────────────────────────────────────────────────────────
_CSS = """
body,table,td,p,a,li{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0;mso-table-rspace:0}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
body{margin:0;padding:0;background:#e8f4f5}
.wrapper{background:#e8f4f5;padding:28px 0}
.shell{max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 40px rgba(13,95,107,.15)}
/* Hero */
.hero{position:relative;font-size:0;line-height:0}
.hero img{width:100%;display:block;max-height:300px;object-fit:cover}
.hero-overlay{background:linear-gradient(180deg,rgba(5,30,40,.18) 0%,rgba(5,30,40,.70) 100%)}
.hero-text{padding:0 36px 32px;color:#fff;margin-top:-80px;position:relative}
.hero-eyebrow{font-size:11px;letter-spacing:2.5px;font-weight:700;text-transform:uppercase;opacity:.85;margin-bottom:6px}
.hero-title{font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;line-height:1.2;margin:0;text-shadow:0 2px 12px rgba(0,0,0,.35)}
.hero-sub{font-size:14px;opacity:.88;margin:8px 0 0}
/* Body */
.body{padding:36px 40px}
.greeting{font-size:17px;line-height:1.75;color:#1a3c3f;margin:0 0 24px}
/* Ref box */
.ref-box{background:linear-gradient(135deg,#e8f5f7,#d4eef2);border:1px solid #b0dce4;border-radius:12px;padding:18px 24px;text-align:center;margin:0 0 28px}
.ref-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a8a90;margin-bottom:6px}
.ref-number{font-family:Georgia,serif;font-size:26px;font-weight:700;color:#0d5f6b;letter-spacing:1px}
/* Date band */
.date-band{border-radius:12px;overflow:hidden;border:1px solid #c8e4e8;margin:0 0 28px}
.date-cell{padding:20px 24px;text-align:center;background:#f0fafc}
.date-divider{width:1px;background:#c8e4e8}
.date-label{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#5a8a90;margin-bottom:6px}
.date-value{font-family:Georgia,serif;font-size:17px;font-weight:700;color:#0d2e33;line-height:1.3}
.date-note{font-size:12px;color:#7aabb0;margin-top:4px}
/* Detail rows */
.detail-table{width:100%;border-radius:12px;overflow:hidden;border:1px solid #ddeef0;margin:0 0 28px;border-collapse:collapse}
.detail-row td{padding:12px 20px;font-size:14px;border-bottom:1px solid #eaf3f4}
.detail-row td:first-child{color:#5a8a90;white-space:nowrap;width:38%}
.detail-row td:last-child{font-weight:600;color:#1a3c3f}
.detail-total td{background:#e8f5f7}
.detail-total td:first-child{font-weight:700;color:#1a3c3f}
.detail-total td:last-child{font-size:20px;font-weight:800;color:#0d5f6b}
/* Info box */
.info-box{border-radius:12px;padding:22px 26px;margin:0 0 24px}
.info-box-teal{background:#e8f5f7;border-left:4px solid #0d5f6b}
.info-box-sand{background:#fdf6ee;border-left:4px solid #d9a14e}
.info-box-green{background:#edf7f0;border-left:4px solid #28a745}
.info-box h3{font-size:14px;font-weight:700;color:#0d5f6b;margin:0 0 12px;text-transform:uppercase;letter-spacing:.8px}
.info-box-sand h3{color:#9a6200}
.info-box-green h3{color:#1a6630}
.info-box ul{margin:0;padding-left:18px}
.info-box li{font-size:14px;color:#2a4a4e;line-height:2;padding-left:4px}
/* Highlight stat */
.stat-grid{margin:0 0 28px}
.stat-cell{text-align:center;padding:18px 10px;background:#f0fafc;border-radius:10px}
.stat-value{font-family:Georgia,serif;font-size:28px;font-weight:700;color:#0d5f6b;line-height:1}
.stat-label{font-size:11px;color:#7aabb0;text-transform:uppercase;letter-spacing:1px;margin-top:5px}
/* CTA */
.cta{text-align:center;margin:28px 0 8px}
.cta-btn{display:inline-block;background:linear-gradient(135deg,#0d5f6b,#0a4a55);color:#ffffff!important;text-decoration:none;padding:16px 44px;border-radius:999px;font-size:15px;font-weight:700;letter-spacing:.3px;box-shadow:0 6px 20px rgba(13,95,107,.35)}
/* Wave divider */
.wave-div{width:100%;height:6px;background:linear-gradient(90deg,#6dcdd6,#0d5f6b,#d9a14e,#6dcdd6);border-radius:0}
/* Section band */
.section-band{background:linear-gradient(135deg,#0d5f6b 0%,#0a4a55 100%);padding:28px 40px;color:#fff}
.section-band h2{font-family:Georgia,serif;font-size:20px;margin:0 0 16px;font-weight:700}
.band-item{display:flex;gap:12px;margin:0 0 10px;font-size:14px;align-items:flex-start}
.band-icon{font-size:16px;flex-shrink:0;margin-top:1px}
/* Footer */
.footer{background:#0d2e33;padding:30px 40px;text-align:center}
.footer-logo{font-family:Georgia,serif;font-size:18px;font-weight:700;color:#6dcdd6;margin:0 0 8px}
.footer-addr{font-size:12px;color:#7aabb0;line-height:1.8;margin:0 0 14px}
.footer-links{margin:0 0 14px}
.footer-links a{color:#3db8c4;font-size:12px;text-decoration:none;margin:0 8px}
.footer-legal{font-size:11px;color:#4a6e72}
/* Watermark wave bg – subtle, below hero in content band */
.wave-bg{background-color:#f5fbfc;background-image:url('""" + IMG_WAVE_BG + """');background-size:cover;background-position:center;background-repeat:no-repeat}
.wave-bg-inner{background:rgba(245,251,252,.93);padding:24px 40px}
@media only screen and (max-width:480px){
  .body{padding:24px 20px!important}
  .hero-text{padding:0 20px 24px!important}
  .section-band{padding:22px 20px!important}
  .footer{padding:24px 20px!important}
  .date-cell{padding:14px!important}
  .wave-bg-inner{padding:20px!important}
}
"""

def _shell(hero_img: str, hero_gradient: str, eyebrow: str, title: str, subtitle: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>{title}</title>
<style>{_CSS}</style>
</head>
<body>
<div class="wrapper">
<table class="shell" width="100%" cellpadding="0" cellspacing="0" role="presentation">

  <!-- HERO -->
  <tr><td class="hero" style="padding:0">
    <img src="{hero_img}" alt="Orange Beach, Gulf of Mexico" width="640" style="width:100%;display:block;max-height:300px;object-fit:cover">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:{hero_gradient};margin-top:-6px">
      <tr><td class="hero-text">
        <div class="hero-eyebrow">Coastal Haven · Orange Beach, AL</div>
        <div class="hero-title">{title}</div>
        <div class="hero-sub">{subtitle}</div>
      </td></tr>
    </table>
  </td></tr>

  <!-- WAVE ACCENT -->
  <tr><td class="wave-div"></td></tr>

  <!-- BODY -->
  <tr><td class="body">{body_html}</td></tr>

  <!-- FOOTER -->
  <tr><td class="footer">
    <div class="footer-logo">🌊 {PROPERTY_NAME}</div>
    <div class="footer-addr">{PROPERTY_ADDR}<br>Gulf of Mexico · White Sand · 14th Floor Views</div>
    <div class="footer-links">
      <a href="{PROPERTY_URL}">Book Direct</a> ·
      <a href="mailto:{SUPPORT_EMAIL}">Contact Us</a> ·
      <a href="{PROPERTY_URL}/#faq">FAQ</a>
    </div>
    <div class="footer-legal">© 2025 Coastal Haven. This is a transactional email related to your reservation.</div>
  </td></tr>

</table>
</div>
</body>
</html>"""

# ── Transport ────────────────────────────────────────────────────────────────
def _send(to_email: str, subject: str, html: str, text: str = '') -> bool:
    if not settings.smtp_user or not settings.smtp_password:
        log.warning('SMTP not configured — skipping email to %s', to_email)
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f'{settings.from_name} <{settings.from_email or settings.smtp_user}>'
        msg['To'] = to_email
        if text:
            msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=_ssl.create_default_context()) as s:
                s.login(settings.smtp_user, settings.smtp_password)
                s.sendmail(settings.smtp_user, to_email, msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
                s.ehlo(); s.starttls()
                s.login(settings.smtp_user, settings.smtp_password)
                s.sendmail(settings.smtp_user, to_email, msg.as_string())
        log.info('Email sent to %s: %s', to_email, subject)
        return True
    except Exception as e:
        log.error('Email failed to %s: %s', to_email, e)
        return False

def _fmt(d: str) -> str:
    for fmt in ('%Y-%m-%d',):
        try:
            return datetime.strptime(d, fmt).strftime('%A, %B %-d, %Y')
        except:
            try: return datetime.strptime(d, fmt).strftime('%A, %B %d, %Y')
            except: pass
    return d

# ════════════════════════════════════════════════════════════════════════════
# TEMPLATE 1 — BOOKING CONFIRMATION
# ════════════════════════════════════════════════════════════════════════════
def send_booking_confirmation(booking: dict) -> bool:
    to = booking.get('email', '')
    if not to: return False
    from datetime import date as _date
    try:
        nights = (_date.fromisoformat(booking['checkout']) - _date.fromisoformat(booking['checkin'])).days
    except: nights = 0
    ref   = f"#CHV-{str(booking['id']).zfill(4)}"
    name  = booking.get('guest_name') or 'Guest'
    first = name.split()[0]
    ci    = _fmt(booking['checkin'])
    co    = _fmt(booking['checkout'])
    total = f"${booking['total']:.2f}"
    guests = booking.get('guests', 1)

    body = f"""
<p class="greeting">Hi {first} 👋<br>
Your stay at <strong>{PROPERTY_NAME}</strong> is confirmed and payment has been processed.
We can't wait to welcome you to the Gulf Coast!</p>

<div class="ref-box">
  <div class="ref-label">Booking Reference</div>
  <div class="ref-number">{ref}</div>
</div>

<!-- Dates -->
<table class="date-band" width="100%" cellpadding="0" cellspacing="0">
<tr>
  <td class="date-cell" width="45%">
    <div class="date-label">Check-in</div>
    <div class="date-value">{ci}</div>
    <div class="date-note">After 4:00 PM</div>
  </td>
  <td class="date-divider" width="1"></td>
  <td class="date-cell" width="45%">
    <div class="date-label">Check-out</div>
    <div class="date-value">{co}</div>
    <div class="date-note">By 10:00 AM</div>
  </td>
</tr>
</table>

<!-- Details -->
<table class="detail-table" width="100%" cellpadding="0" cellspacing="0">
<tr class="detail-row"><td>Property</td><td>{PROPERTY_NAME}</td></tr>
<tr class="detail-row"><td>Location</td><td>14th Floor · Gulf Front</td></tr>
<tr class="detail-row"><td>Nights</td><td>{nights} nights</td></tr>
<tr class="detail-row"><td>Guests</td><td>{guests}</td></tr>
<tr class="detail-row"><td>Guest name</td><td>{name}</td></tr>
<tr class="detail-row detail-total"><td>Total charged</td><td>{total}</td></tr>
</table>

<!-- Wave-bg section: What's next -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-radius:12px;overflow:hidden;border:1px solid #c8e4e8">
<tr><td class="wave-bg"><div class="wave-bg-inner">
  <div class="info-box info-box-teal" style="margin:0">
    <h3>📋 Before you arrive</h3>
    <ul>
      <li>Door code &amp; full check-in instructions sent <strong>48 hours before</strong> arrival</li>
      <li>Covered parking included — no reservation needed</li>
      <li>Pool, hot tub &amp; direct Gulf beach access available 24/7</li>
      <li>Full kitchen stocked with starter supplies for your first night</li>
    </ul>
  </div>
</div></td></tr>
</table>

<div class="info-box info-box-sand">
  <h3>🚫 Cancellation policy</h3>
  <ul>
    <li>Full refund if cancelled <strong>30+ days</strong> before check-in</li>
    <li>50% refund if cancelled <strong>14–30 days</strong> before check-in</li>
    <li>Non-refundable inside <strong>14 days</strong> of check-in</li>
  </ul>
</div>

<div class="cta">
  <a class="cta-btn" href="{PROPERTY_URL}">View Booking Details</a>
</div>
<p style="text-align:center;font-size:13px;color:#7aabb0;margin-top:16px">
  Questions? Reply to this email or write to <a href="mailto:{SUPPORT_EMAIL}" style="color:#0d5f6b">{SUPPORT_EMAIL}</a>
</p>"""

    html = _shell(IMG_HERO_TEAL,
        'linear-gradient(180deg,rgba(5,30,40,.15) 0%,rgba(5,50,60,.72) 100%)',
        'Booking Confirmed ✓', 'Your Gulf Coast getaway is set!',
        f'{nights} nights · {booking["checkin"]} → {booking["checkout"]}', body)

    text = f"""Booking Confirmed — {ref}
Hi {first}, your reservation at {PROPERTY_NAME} is confirmed.
Check-in: {ci} (after 4 PM) | Check-out: {co} (by 10 AM)
Nights: {nights} | Guests: {guests} | Total: {total}
Door code sent 48h before arrival. Questions? {SUPPORT_EMAIL}"""

    return _send(to, f'Booking Confirmed {ref} — {PROPERTY_NAME}', html, text)


# ════════════════════════════════════════════════════════════════════════════
# TEMPLATE 2 — PRE-ARRIVAL (48h before check-in)
# ════════════════════════════════════════════════════════════════════════════
def send_pre_arrival(booking: dict, door_code: str = '', wifi_name: str = '', wifi_pass: str = '') -> bool:
    to = booking.get('email', '')
    if not to: return False
    name  = booking.get('guest_name') or 'Guest'
    first = name.split()[0]
    ci    = _fmt(booking['checkin'])
    ref   = f"#CHV-{str(booking['id']).zfill(4)}"

    door_section = f"""
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-radius:12px;overflow:hidden;border:1px solid #b0dce4">
<tr><td class="wave-bg"><div class="wave-bg-inner">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="width:33%;text-align:center;padding:18px 10px;background:rgba(13,95,107,.08);border-radius:10px">
      <div style="font-size:26px;margin-bottom:6px">🔑</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a8a90;margin-bottom:4px">Door Code</div>
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0d5f6b;letter-spacing:3px">{door_code or '—'}</div>
    </td>
    <td width="12"></td>
    <td style="width:33%;text-align:center;padding:18px 10px;background:rgba(13,95,107,.08);border-radius:10px">
      <div style="font-size:26px;margin-bottom:6px">📶</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a8a90;margin-bottom:4px">WiFi Network</div>
      <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#0d5f6b">{wifi_name or '—'}</div>
    </td>
    <td width="12"></td>
    <td style="width:33%;text-align:center;padding:18px 10px;background:rgba(13,95,107,.08);border-radius:10px">
      <div style="font-size:26px;margin-bottom:6px">🔐</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a8a90;margin-bottom:4px">WiFi Password</div>
      <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#0d5f6b">{wifi_pass or '—'}</div>
    </td>
  </tr>
  </table>
</div></td></tr>
</table>""" if door_code or wifi_name else ''

    body = f"""
<p class="greeting">Hi {first}, your Gulf Coast escape is <strong>tomorrow!</strong> 🌊<br>
Here are everything you need to walk right in and start relaxing.</p>

<div class="ref-box">
  <div class="ref-label">Your reservation</div>
  <div class="ref-number">{ref} · {ci}</div>
</div>

{door_section}

<div class="info-box info-box-teal">
  <h3>🏠 Check-in steps</h3>
  <ul>
    <li>Check-in is after <strong>4:00 PM</strong></li>
    <li>Park in the covered garage — look for the reserved spot marked 1408</li>
    <li>Take the elevator to the <strong>14th floor</strong>, unit <strong>1408</strong></li>
    <li>Enter your door code on the keypad — no physical key needed</li>
    <li>The welcome binder on the kitchen counter has everything you need</li>
  </ul>
</div>

<div class="info-box info-box-sand">
  <h3>🌅 What to expect at the property</h3>
  <ul>
    <li>Gulf-front balcony with panoramic ocean views — best sunrise spot on the coast</li>
    <li>Heated pool &amp; hot tub open 7 AM – 10 PM</li>
    <li>Private beach access via the boardwalk at the east end of the building</li>
    <li>Beach chairs &amp; umbrella in the unit's storage closet</li>
    <li>Full kitchen with starter supplies (coffee, paper towels, trash bags)</li>
  </ul>
</div>

<div class="info-box info-box-green">
  <h3>📞 Emergency contacts</h3>
  <ul>
    <li>Owner/Host: <a href="mailto:{SUPPORT_EMAIL}" style="color:#1a6630">{SUPPORT_EMAIL}</a></li>
    <li>Building security: Available at the front desk 24/7</li>
    <li>Maintenance urgent: Reply to this email</li>
  </ul>
</div>

<div class="cta">
  <a class="cta-btn" href="{PROPERTY_URL}">View Full Property Guide</a>
</div>
<p style="text-align:center;font-size:13px;color:#7aabb0;margin-top:16px">
  Safe travels! We're excited to have you. Any questions — just reply to this email.
</p>"""

    html = _shell(IMG_HERO_ARRIVAL,
        'linear-gradient(180deg,rgba(5,20,50,.10) 0%,rgba(5,35,80,.68) 100%)',
        "You're Almost Here!", 'Check-in details for your Gulf Coast stay',
        f'Arriving tomorrow · {ci} · Unit 1408', body)

    text = f"""See you tomorrow! — {ref}
Hi {first}, your check-in is tomorrow ({ci}).
Door code: {door_code or 'see welcome email'}
WiFi: {wifi_name or '—'} / {wifi_pass or '—'}
Check-in after 4 PM, 14th floor unit 1408. Questions? {SUPPORT_EMAIL}"""

    return _send(to, f"You're checking in tomorrow — {PROPERTY_NAME}", html, text)


# ════════════════════════════════════════════════════════════════════════════
# TEMPLATE 3 — CHECKOUT REMINDER (day before checkout)
# ════════════════════════════════════════════════════════════════════════════
def send_checkout_reminder(booking: dict) -> bool:
    to = booking.get('email', '')
    if not to: return False
    name  = booking.get('guest_name') or 'Guest'
    first = name.split()[0]
    co    = _fmt(booking['checkout'])
    ref   = f"#CHV-{str(booking['id']).zfill(4)}"

    body = f"""
<p class="greeting">Hi {first}, hope you've had an incredible time on the Gulf! 🌊<br>
Just a friendly reminder that check-out is <strong>tomorrow by 10:00 AM</strong>.</p>

<div class="ref-box">
  <div class="ref-label">Check-out</div>
  <div class="ref-number">{co} · By 10:00 AM</div>
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-radius:12px;overflow:hidden;border:1px solid #b0dce4">
<tr><td class="wave-bg"><div class="wave-bg-inner">
  <div class="info-box info-box-teal" style="margin:0">
    <h3>✅ Check-out checklist</h3>
    <ul>
      <li>Strip the beds &amp; leave linens in the laundry room</li>
      <li>Run the dishwasher with any dirty dishes</li>
      <li>Take out all trash to the hallway bin</li>
      <li>Return beach chairs &amp; umbrella to the storage closet</li>
      <li>Close &amp; lock all windows and the balcony door</li>
      <li>The door will lock automatically — no need to return a key</li>
    </ul>
  </div>
</div></td></tr>
</table>

<div class="info-box info-box-sand">
  <h3>🏖️ Squeeze in one last sunrise</h3>
  <ul>
    <li>Sunrise on the 14th-floor balcony is worth setting an early alarm</li>
    <li>The beach is at its most peaceful before 8 AM</li>
    <li>Perdido Pass is a short 10-min drive if you want a final dolphin-watch</li>
  </ul>
</div>

<div class="cta">
  <a class="cta-btn" href="{PROPERTY_URL}/#book">Book Your Next Stay</a>
</div>
<p style="text-align:center;font-size:13px;color:#7aabb0;margin-top:16px">
  Need a late checkout? Reply to this email and we'll do our best to accommodate you.
</p>"""

    html = _shell(IMG_HERO_SUNSET,
        'linear-gradient(180deg,rgba(80,30,5,.12) 0%,rgba(60,20,5,.65) 100%)',
        'Check-out Tomorrow', 'Thanks for staying with us — see you next time!',
        f'Check-out by 10:00 AM · {co}', body)

    text = f"""Check-out reminder — {ref}
Hi {first}, checkout is tomorrow ({co}) by 10:00 AM.
Checklist: strip beds, run dishwasher, take out trash, close windows, lock balcony door.
Need a late checkout? Email us at {SUPPORT_EMAIL}"""

    return _send(to, f'Check-out tomorrow by 10 AM — {PROPERTY_NAME}', html, text)


# ════════════════════════════════════════════════════════════════════════════
# TEMPLATE 4 — POST-STAY REVIEW REQUEST
# ════════════════════════════════════════════════════════════════════════════
def send_review_request(booking: dict) -> bool:
    to = booking.get('email', '')
    if not to: return False
    name  = booking.get('guest_name') or 'Guest'
    first = name.split()[0]
    ref   = f"#CHV-{str(booking['id']).zfill(4)}"

    body = f"""
<p class="greeting">Hi {first}, we hope your stay at <strong>{PROPERTY_NAME}</strong> left you feeling rested, salty-haired, and sun-kissed. 🌅<br><br>
If you have a moment, we'd love to hear about your experience.</p>

<!-- Review stats display -->
<table width="100%" cellpadding="0" cellspacing="0" class="stat-grid" style="margin:0 0 28px">
<tr>
  <td class="stat-cell" style="text-align:center;padding:20px 10px;background:#f0fafc;border-radius:10px">
    <div class="stat-value">4.96</div>
    <div class="stat-label">Avg Rating</div>
  </td>
  <td width="14"></td>
  <td class="stat-cell" style="text-align:center;padding:20px 10px;background:#f0fafc;border-radius:10px">
    <div class="stat-value" style="font-size:22px">★★★★★</div>
    <div class="stat-label">5-Star Reviews</div>
  </td>
  <td width="14"></td>
  <td class="stat-cell" style="text-align:center;padding:20px 10px;background:#f0fafc;border-radius:10px">
    <div class="stat-value">14th</div>
    <div class="stat-label">Floor Views</div>
  </td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-radius:12px;overflow:hidden;border:1px solid #b0dce4">
<tr><td class="wave-bg"><div class="wave-bg-inner">
  <p style="font-size:14px;color:#2a4a4e;margin:0 0 16px;font-style:italic">
    "Reviews help future guests make informed decisions and help us keep making the experience better.
    Your honest feedback — whether 5 stars or suggestions — means everything to us."
  </p>
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="width:48%;text-align:center">
      <a href="https://www.airbnb.com/users/reviews" style="display:block;background:#FF5A5F;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;font-size:14px">
        ⭐ Review on Airbnb
      </a>
    </td>
    <td width="12"></td>
    <td style="width:48%;text-align:center">
      <a href="https://www.vrbo.com" style="display:block;background:#3D5A80;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;font-size:14px">
        ⭐ Review on VRBO
      </a>
    </td>
  </tr>
  </table>
</div></td></tr>
</table>

<div class="info-box info-box-teal">
  <h3>🔄 Already planning your next visit?</h3>
  <ul>
    <li>Book direct at <a href="{PROPERTY_URL}" style="color:#0d5f6b">{PROPERTY_URL}</a> and save <strong>10%</strong> vs OTAs</li>
    <li>Use code <strong>RETURN10</strong> for an extra 10% off as a returning guest</li>
    <li>Peak season books fast — lock in your dates before they go</li>
  </ul>
</div>

<div class="cta">
  <a class="cta-btn" href="{PROPERTY_URL}/#book">Book Your Return Stay →</a>
</div>

<p style="text-align:center;font-size:13px;color:#7aabb0;margin-top:16px">
  Something wasn't perfect? Please reach out directly at
  <a href="mailto:{SUPPORT_EMAIL}" style="color:#0d5f6b">{SUPPORT_EMAIL}</a> before leaving a review — we want to make it right.
</p>"""

    html = _shell(IMG_HERO_REVIEW,
        'linear-gradient(180deg,rgba(80,40,5,.10) 0%,rgba(50,20,5,.62) 100%)',
        'Thanks for Staying!', 'We hope the Gulf treated you well 🌊',
        f'Booking {ref} · We\'d love your review', body)

    text = f"""Thanks for staying with us — {ref}
Hi {first}, we hope you had an amazing time at {PROPERTY_NAME}!
If you have a moment, a review means the world to us.
Airbnb: https://www.airbnb.com/users/reviews
Coming back? Use code RETURN10 for 10% off at {PROPERTY_URL}
Any issues? Email us at {SUPPORT_EMAIL} before leaving a review."""

    return _send(to, f'How was your stay? — {PROPERTY_NAME}', html, text)


# ════════════════════════════════════════════════════════════════════════════
# OWNER NOTIFICATION (internal)
# ════════════════════════════════════════════════════════════════════════════
def send_owner_notification(booking: dict) -> bool:
    owner = settings.smtp_user
    if not owner: return False
    from datetime import date as _date
    try: nights = (_date.fromisoformat(booking['checkout']) - _date.fromisoformat(booking['checkin'])).days
    except: nights = 0
    ref = f"#CHV-{str(booking['id']).zfill(4)}"

    body = f"""
<p class="greeting">New direct booking just came in! 🎉</p>
<div class="ref-box">
  <div class="ref-label">Booking Reference</div>
  <div class="ref-number">{ref}</div>
</div>
<table class="detail-table" width="100%" cellpadding="0" cellspacing="0">
<tr class="detail-row"><td>Guest</td><td>{booking.get('guest_name','—')}</td></tr>
<tr class="detail-row"><td>Email</td><td><a href="mailto:{booking.get('email','')}" style="color:#0d5f6b">{booking.get('email','—')}</a></td></tr>
<tr class="detail-row"><td>Phone</td><td>{booking.get('phone','—')}</td></tr>
<tr class="detail-row"><td>Check-in</td><td>{booking['checkin']}</td></tr>
<tr class="detail-row"><td>Check-out</td><td>{booking['checkout']}</td></tr>
<tr class="detail-row"><td>Nights</td><td>{nights}</td></tr>
<tr class="detail-row"><td>Guests</td><td>{booking.get('guests','—')}</td></tr>
<tr class="detail-row detail-total"><td>Total</td><td>${booking['total']:.2f}</td></tr>
</table>
<p style="font-size:13px;color:#7aabb0;text-align:center">Paid via Stripe. Check your admin dashboard for full details.</p>"""

    html = _shell(IMG_HERO_TEAL,
        'linear-gradient(180deg,rgba(5,30,40,.15) 0%,rgba(5,50,60,.72) 100%)',
        f'New Booking {ref}', f'${booking["total"]:.0f} · {booking["checkin"]} → {booking["checkout"]}',
        f'{booking.get("guest_name","Guest")} · {nights} nights', body)

    return _send(owner, f'New booking {ref} — ${booking["total"]:.0f} — {booking["checkin"]}', html)


# ════════════════════════════════════════════════════════════════════════════
# OTA RESERVATION NOTIFICATION (owner — new iCal reservation found)
# ════════════════════════════════════════════════════════════════════════════
_PLATFORM_COLOR = {'airbnb': '#FF5A5F', 'vrbo': '#3D5A80', 'booking': '#003580'}
_PLATFORM_LABEL = {'airbnb': 'Airbnb', 'vrbo': 'VRBO', 'booking': 'Booking.com'}

def send_ota_reservation_notification(reservation: dict) -> bool:
    owner = settings.smtp_user
    if not owner: return False
    from datetime import date as _date
    platform = reservation.get('platform', 'ota')
    plabel   = _PLATFORM_LABEL.get(platform, platform.title())
    pcolor   = _PLATFORM_COLOR.get(platform, '#0d5f6b')
    guest    = reservation.get('guest_name') or 'Guest'
    checkin  = reservation.get('checkin', '')
    checkout = reservation.get('checkout', '')
    try:
        nights = (_date.fromisoformat(checkout) - _date.fromisoformat(checkin)).days
    except:
        nights = 0

    body = f"""
<p class="greeting">New reservation via <strong style="color:{pcolor}">{plabel}</strong> — synced from iCal. 📅</p>

<div class="ref-box" style="background:linear-gradient(135deg,{pcolor}18,{pcolor}08);border-color:{pcolor}40">
  <div class="ref-label" style="color:{pcolor}">Platform</div>
  <div class="ref-number" style="color:{pcolor}">{plabel}</div>
</div>

<table class="detail-table" width="100%" cellpadding="0" cellspacing="0">
<tr class="detail-row"><td>Guest</td><td>{guest}</td></tr>
<tr class="detail-row"><td>Check-in</td><td><strong>{checkin}</strong></td></tr>
<tr class="detail-row"><td>Check-out</td><td><strong>{checkout}</strong></td></tr>
<tr class="detail-row detail-total"><td>Nights</td><td>{nights}</td></tr>
</table>

<div class="cta">
  <a class="cta-btn" href="{PROPERTY_URL}/admin">View in Admin Dashboard</a>
</div>
<p style="text-align:center;font-size:12px;color:#aaa;margin-top:12px">
  Guest messages are only available in the {plabel} host app.
</p>"""

    html = _shell(IMG_HERO_TEAL,
        f'linear-gradient(180deg,{pcolor}28 0%,{pcolor}88 100%)',
        f'New {plabel} Reservation',
        f'{guest} · {checkin} → {checkout}',
        f'{nights} night{"s" if nights != 1 else ""} · synced from iCal',
        body)

    return _send(owner,
        f'New {plabel} reservation — {guest} · {checkin}',
        html,
        f'New {plabel} reservation: {guest}, {checkin} → {checkout} ({nights} nights). View at {PROPERTY_URL}/admin')


# ════════════════════════════════════════════════════════════════════════════
# PREVIEW helpers (return raw HTML, no send)
# ════════════════════════════════════════════════════════════════════════════
def preview_booking_confirmation() -> str:
    dummy = {'id': 1001, 'email': 'guest@example.com', 'guest_name': 'Sarah & Michael',
             'checkin': '2025-09-12', 'checkout': '2025-09-19', 'guests': 4, 'total': 2847.50}
    from datetime import date as _d
    nights = (_d.fromisoformat(dummy['checkout']) - _d.fromisoformat(dummy['checkin'])).days
    ref = f"#CHV-{str(dummy['id']).zfill(4)}"
    # reuse the logic inline
    booking = dummy
    name = booking.get('guest_name', 'Guest'); first = name.split()[0]
    ci = _fmt(booking['checkin']); co = _fmt(booking['checkout'])
    total = f"${booking['total']:.2f}"; guests = booking.get('guests', 1)
    body = f"""
<p class="greeting">Hi {first} 👋<br>Your stay at <strong>{PROPERTY_NAME}</strong> is confirmed and payment has been processed. We can't wait to welcome you to the Gulf Coast!</p>
<div class="ref-box"><div class="ref-label">Booking Reference</div><div class="ref-number">{ref}</div></div>
<table class="date-band" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td class="date-cell" width="45%"><div class="date-label">Check-in</div><div class="date-value">{ci}</div><div class="date-note">After 4:00 PM</div></td>
  <td class="date-divider" width="1"></td>
  <td class="date-cell" width="45%"><div class="date-label">Check-out</div><div class="date-value">{co}</div><div class="date-note">By 10:00 AM</div></td>
</tr></table>
<table class="detail-table" width="100%" cellpadding="0" cellspacing="0">
<tr class="detail-row"><td>Property</td><td>{PROPERTY_NAME}</td></tr>
<tr class="detail-row"><td>Location</td><td>14th Floor · Gulf Front</td></tr>
<tr class="detail-row"><td>Nights</td><td>{nights} nights</td></tr>
<tr class="detail-row"><td>Guests</td><td>{guests}</td></tr>
<tr class="detail-row"><td>Guest name</td><td>{name}</td></tr>
<tr class="detail-row detail-total"><td>Total charged</td><td>{total}</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-radius:12px;overflow:hidden;border:1px solid #c8e4e8"><tr><td class="wave-bg"><div class="wave-bg-inner">
  <div class="info-box info-box-teal" style="margin:0"><h3>📋 Before you arrive</h3><ul>
    <li>Door code &amp; full check-in instructions sent <strong>48 hours before</strong> arrival</li>
    <li>Covered parking included — no reservation needed</li>
    <li>Pool, hot tub &amp; direct Gulf beach access available 24/7</li>
    <li>Full kitchen stocked with starter supplies for your first night</li>
  </ul></div>
</div></td></tr></table>
<div class="info-box info-box-sand"><h3>🚫 Cancellation policy</h3><ul>
  <li>Full refund if cancelled <strong>30+ days</strong> before check-in</li>
  <li>50% refund if cancelled <strong>14–30 days</strong> before check-in</li>
  <li>Non-refundable inside <strong>14 days</strong> of check-in</li>
</ul></div>
<div class="cta"><a class="cta-btn" href="{PROPERTY_URL}">View Booking Details</a></div>"""
    return _shell(IMG_HERO_TEAL, 'linear-gradient(180deg,rgba(5,30,40,.15) 0%,rgba(5,50,60,.72) 100%)',
        'Booking Confirmed ✓', 'Your Gulf Coast getaway is set!', f'{nights} nights · {booking["checkin"]} → {booking["checkout"]}', body)

def preview_pre_arrival() -> str:
    dummy = {'id': 1001, 'email': '', 'guest_name': 'Sarah & Michael', 'checkin': '2025-09-12', 'checkout': '2025-09-19', 'guests': 4, 'total': 2847.50}
    return _build_pre_arrival_html(dummy, door_code='4782#', wifi_name='PhoenixV_1408', wifi_pass='OrangeBeach2025')

def _build_pre_arrival_html(booking: dict, door_code='', wifi_name='', wifi_pass='') -> str:
    name = booking.get('guest_name', 'Guest'); first = name.split()[0]
    ci = _fmt(booking['checkin']); ref = f"#CHV-{str(booking['id']).zfill(4)}"
    door_section = f"""<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-radius:12px;overflow:hidden;border:1px solid #b0dce4"><tr><td class="wave-bg"><div class="wave-bg-inner">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="width:33%;text-align:center;padding:18px 10px;background:rgba(13,95,107,.08);border-radius:10px">
      <div style="font-size:26px;margin-bottom:6px">🔑</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a8a90;margin-bottom:4px">Door Code</div>
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0d5f6b;letter-spacing:3px">{door_code}</div>
    </td>
    <td width="12"></td>
    <td style="width:33%;text-align:center;padding:18px 10px;background:rgba(13,95,107,.08);border-radius:10px">
      <div style="font-size:26px;margin-bottom:6px">📶</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a8a90;margin-bottom:4px">WiFi Network</div>
      <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#0d5f6b">{wifi_name}</div>
    </td>
    <td width="12"></td>
    <td style="width:33%;text-align:center;padding:18px 10px;background:rgba(13,95,107,.08);border-radius:10px">
      <div style="font-size:26px;margin-bottom:6px">🔐</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a8a90;margin-bottom:4px">WiFi Password</div>
      <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#0d5f6b">{wifi_pass}</div>
    </td>
  </tr></table>
</div></td></tr></table>""" if door_code else ''
    body = f"""<p class="greeting">Hi {first}, your Gulf Coast escape is <strong>tomorrow!</strong> 🌊<br>Here's everything you need to walk right in and start relaxing.</p>
<div class="ref-box"><div class="ref-label">Your reservation</div><div class="ref-number">{ref} · {ci}</div></div>
{door_section}
<div class="info-box info-box-teal"><h3>🏠 Check-in steps</h3><ul>
  <li>Check-in is after <strong>4:00 PM</strong></li>
  <li>Park in the covered garage — reserved spot marked 1408</li>
  <li>Take the elevator to the <strong>14th floor</strong>, unit <strong>1408</strong></li>
  <li>Enter your door code on the keypad — no physical key needed</li>
  <li>Welcome binder on the kitchen counter has everything you need</li>
</ul></div>
<div class="info-box info-box-sand"><h3>🌅 What awaits you</h3><ul>
  <li>Gulf-front balcony with panoramic ocean views</li>
  <li>Heated pool &amp; hot tub open 7 AM – 10 PM</li>
  <li>Private beach access via east boardwalk</li>
  <li>Beach chairs &amp; umbrella in the storage closet</li>
</ul></div>
<div class="cta"><a class="cta-btn" href="{PROPERTY_URL}">View Full Property Guide</a></div>"""
    return _shell(IMG_HERO_ARRIVAL, 'linear-gradient(180deg,rgba(5,20,50,.10) 0%,rgba(5,35,80,.68) 100%)',
        "You're Almost Here!", 'Check-in details for your Gulf Coast stay', f'Arriving tomorrow · {ci} · Unit 1408', body)

def preview_checkout_reminder() -> str:
    dummy = {'id': 1001, 'email': '', 'guest_name': 'Sarah & Michael', 'checkin': '2025-09-12', 'checkout': '2025-09-19', 'guests': 4, 'total': 2847.50}
    name = dummy['guest_name']; first = name.split()[0]; co = _fmt(dummy['checkout']); ref = f"#CHV-{str(dummy['id']).zfill(4)}"
    body = f"""<p class="greeting">Hi {first}, hope you've had an incredible time on the Gulf! 🌊<br>Just a friendly reminder that check-out is <strong>tomorrow by 10:00 AM</strong>.</p>
<div class="ref-box"><div class="ref-label">Check-out</div><div class="ref-number">{co} · By 10:00 AM</div></div>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-radius:12px;overflow:hidden;border:1px solid #b0dce4"><tr><td class="wave-bg"><div class="wave-bg-inner">
  <div class="info-box info-box-teal" style="margin:0"><h3>✅ Check-out checklist</h3><ul>
    <li>Strip the beds &amp; leave linens in the laundry room</li>
    <li>Run the dishwasher with any dirty dishes</li>
    <li>Take out all trash to the hallway bin</li>
    <li>Return beach chairs &amp; umbrella to the storage closet</li>
    <li>Close &amp; lock all windows and the balcony door</li>
    <li>The door will lock automatically — no need to return a key</li>
  </ul></div>
</div></td></tr></table>
<div class="info-box info-box-sand"><h3>🏖️ Squeeze in one last sunrise</h3><ul>
  <li>Sunrise on the 14th-floor balcony is worth setting an early alarm</li>
  <li>The beach is at its most peaceful before 8 AM</li>
</ul></div>
<div class="cta"><a class="cta-btn" href="{PROPERTY_URL}/#book">Book Your Next Stay</a></div>"""
    return _shell(IMG_HERO_SUNSET, 'linear-gradient(180deg,rgba(80,30,5,.12) 0%,rgba(60,20,5,.65) 100%)',
        'Check-out Tomorrow', 'Thanks for staying — see you next time!', f'Check-out by 10:00 AM · {co}', body)

def preview_review_request() -> str:
    dummy = {'id': 1001, 'email': '', 'guest_name': 'Sarah & Michael', 'checkin': '2025-09-12', 'checkout': '2025-09-19'}
    name = dummy['guest_name']; first = name.split()[0]; ref = f"#CHV-{str(dummy['id']).zfill(4)}"
    body = f"""<p class="greeting">Hi {first}, we hope your stay left you feeling rested, salty-haired, and sun-kissed. 🌅<br><br>If you have a moment, we'd love to hear about your experience.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px"><tr>
  <td style="text-align:center;padding:20px 10px;background:#f0fafc;border-radius:10px"><div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#0d5f6b">4.96</div><div style="font-size:11px;color:#7aabb0;text-transform:uppercase;letter-spacing:1px;margin-top:5px">Avg Rating</div></td>
  <td width="14"></td>
  <td style="text-align:center;padding:20px 10px;background:#f0fafc;border-radius:10px"><div style="font-size:22px;color:#f5a623">★★★★★</div><div style="font-size:11px;color:#7aabb0;text-transform:uppercase;letter-spacing:1px;margin-top:5px">5-Star Reviews</div></td>
  <td width="14"></td>
  <td style="text-align:center;padding:20px 10px;background:#f0fafc;border-radius:10px"><div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#0d5f6b">14th</div><div style="font-size:11px;color:#7aabb0;text-transform:uppercase;letter-spacing:1px;margin-top:5px">Floor Views</div></td>
</tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-radius:12px;overflow:hidden;border:1px solid #b0dce4"><tr><td class="wave-bg"><div class="wave-bg-inner">
  <p style="font-size:14px;color:#2a4a4e;margin:0 0 16px;font-style:italic">"Your honest feedback helps future guests and helps us keep improving. It means everything to us."</p>
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="width:48%;text-align:center"><a href="#" style="display:block;background:#FF5A5F;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;font-size:14px">⭐ Review on Airbnb</a></td>
    <td width="12"></td>
    <td style="width:48%;text-align:center"><a href="#" style="display:block;background:#3D5A80;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;font-size:14px">⭐ Review on VRBO</a></td>
  </tr></table>
</div></td></tr></table>
<div class="info-box info-box-teal"><h3>🔄 Coming back?</h3><ul>
  <li>Book direct at <a href="{PROPERTY_URL}" style="color:#0d5f6b">{PROPERTY_URL}</a> and save <strong>10%</strong></li>
  <li>Use code <strong>RETURN10</strong> as a returning guest</li>
</ul></div>
<div class="cta"><a class="cta-btn" href="{PROPERTY_URL}/#book">Book Your Return Stay →</a></div>"""
    return _shell(IMG_HERO_REVIEW, 'linear-gradient(180deg,rgba(80,40,5,.10) 0%,rgba(50,20,5,.62) 100%)',
        'Thanks for Staying!', 'We hope the Gulf treated you well 🌊', f'Booking {ref} · We\'d love your review', body)
