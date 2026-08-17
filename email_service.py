import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

from .config import settings

log = logging.getLogger(__name__)


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
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
            s.ehlo()
            s.starttls()
            s.login(settings.smtp_user, settings.smtp_password)
            s.sendmail(settings.smtp_user, to_email, msg.as_string())
        log.info('Email sent to %s: %s', to_email, subject)
        return True
    except Exception as e:
        log.error('Email failed to %s: %s', to_email, e)
        return False


def _fmt_date(d: str) -> str:
    try:
        return datetime.strptime(d, '%Y-%m-%d').strftime('%A, %B %-d, %Y')
    except Exception:
        try:
            return datetime.strptime(d, '%Y-%m-%d').strftime('%A, %B %d, %Y')
        except Exception:
            return d


def send_booking_confirmation(booking: dict) -> bool:
    to = booking.get('email', '')
    if not to:
        return False

    nights = 0
    try:
        from datetime import date
        ci = date.fromisoformat(booking['checkin'])
        co = date.fromisoformat(booking['checkout'])
        nights = (co - ci).days
    except Exception:
        pass

    ref = f"#CHV-{str(booking['id']).zfill(4)}"
    name = booking.get('guest_name') or 'Guest'
    first = name.split()[0]
    checkin_fmt = _fmt_date(booking['checkin'])
    checkout_fmt = _fmt_date(booking['checkout'])
    total = f"${booking['total']:.2f}"
    guests = booking.get('guests', 1)

    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{{margin:0;padding:0;background:#f6f2e9;font-family:'Helvetica Neue',Arial,sans-serif;color:#18373a}}
  .wrap{{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}}
  .header{{background:linear-gradient(135deg,#0d5f6b,#174b50);padding:40px 40px 32px;text-align:center;color:white}}
  .header h1{{margin:0;font-size:28px;font-weight:700;letter-spacing:-.5px}}
  .header p{{margin:8px 0 0;opacity:.85;font-size:15px}}
  .check{{width:60px;height:60px;background:rgba(255,255,255,.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px}}
  .body{{padding:36px 40px}}
  .ref{{background:#f0f8f6;border:1px solid #c8e6e2;border-radius:10px;padding:14px 20px;margin-bottom:28px;text-align:center}}
  .ref span{{font-size:12px;color:#6c7775;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px}}
  .ref strong{{font-size:22px;color:#0d5f6b;font-weight:800}}
  .dates{{display:flex;gap:0;border:1px solid #e0e8e6;border-radius:12px;overflow:hidden;margin:24px 0}}
  .date-box{{flex:1;padding:18px 20px;text-align:center}}
  .date-box:first-child{{border-right:1px solid #e0e8e6}}
  .date-box .label{{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6c7775;margin-bottom:6px}}
  .date-box .value{{font-size:15px;font-weight:700;color:#18373a;line-height:1.3}}
  .date-box .note{{font-size:12px;color:#6c7775;margin-top:4px}}
  .details{{border:1px solid #e0e8e6;border-radius:12px;overflow:hidden;margin:24px 0}}
  .detail-row{{display:flex;justify-content:space-between;padding:13px 20px;border-bottom:1px solid #e0e8e6;font-size:14px}}
  .detail-row:last-child{{border-bottom:none}}
  .detail-row .label{{color:#6c7775}}
  .detail-row .value{{font-weight:600;color:#18373a}}
  .detail-row.total{{background:#f0f8f6}}
  .detail-row.total .label{{font-weight:700;color:#18373a}}
  .detail-row.total .value{{font-size:18px;font-weight:800;color:#0d5f6b}}
  .info-box{{background:#f9fbfa;border-radius:12px;padding:20px 24px;margin:24px 0}}
  .info-box h3{{margin:0 0 12px;font-size:15px;color:#0d5f6b}}
  .info-box ul{{margin:0;padding-left:20px;line-height:2}}
  .info-box li{{font-size:14px;color:#5a6866}}
  .cta{{text-align:center;margin:28px 0 8px}}
  .btn{{display:inline-block;background:#0d5f6b;color:white;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;font-size:15px}}
  .footer{{background:#f6f2e9;padding:24px 40px;text-align:center;font-size:12px;color:#6c7775;line-height:1.8}}
  .footer a{{color:#0d5f6b}}
  @media(max-width:480px){{
    .body{{padding:24px 20px}}
    .header{{padding:28px 20px}}
    .dates{{flex-direction:column}}
    .date-box:first-child{{border-right:none;border-bottom:1px solid #e0e8e6}}
  }}
</style>
</head>
<body>
<div style="padding:24px 16px;background:#f6f2e9">
<div class="wrap">
  <div class="header">
    <div class="check">✓</div>
    <h1>Booking Confirmed!</h1>
    <p>You're all set, {first}. See you at the beach!</p>
  </div>

  <div class="body">
    <div class="ref">
      <span>Booking reference</span>
      <strong>{ref}</strong>
    </div>

    <p style="font-size:15px;line-height:1.7;margin:0 0 20px">
      Hi {first}, your reservation at <strong>Coastal Haven at Phoenix V</strong> is confirmed and paid.
      Here's everything you need to know about your upcoming stay.
    </p>

    <div class="dates">
      <div class="date-box">
        <div class="label">Check-in</div>
        <div class="value">{checkin_fmt}</div>
        <div class="note">After 4:00 PM</div>
      </div>
      <div class="date-box">
        <div class="label">Check-out</div>
        <div class="value">{checkout_fmt}</div>
        <div class="note">By 10:00 AM</div>
      </div>
    </div>

    <div class="details">
      <div class="detail-row">
        <span class="label">Property</span>
        <span class="value">Coastal Haven at Phoenix V</span>
      </div>
      <div class="detail-row">
        <span class="label">Address</span>
        <span class="value">Unit 1506, 26802 Perdido Beach Blvd<br>Orange Beach, AL 36561</span>
      </div>
      <div class="detail-row">
        <span class="label">Nights</span>
        <span class="value">{nights}</span>
      </div>
      <div class="detail-row">
        <span class="label">Guests</span>
        <span class="value">{guests}</span>
      </div>
      <div class="detail-row">
        <span class="label">Guest name</span>
        <span class="value">{name}</span>
      </div>
      <div class="detail-row total">
        <span class="label">Total charged</span>
        <span class="value">{total}</span>
      </div>
    </div>

    <div class="info-box">
      <h3>📋 Before you arrive</h3>
      <ul>
        <li>Door code and full check-in instructions will be sent <strong>48 hours before arrival</strong>.</li>
        <li>One covered parking space is included — no reservation needed.</li>
        <li>Pool, hot tub, and direct beach access are available 24/7.</li>
        <li>Full kitchen is stocked with basic supplies for your first night.</li>
      </ul>
    </div>

    <div class="info-box">
      <h3>🚫 Cancellation policy</h3>
      <ul>
        <li>Full refund if cancelled <strong>30+ days</strong> before check-in.</li>
        <li>50% refund if cancelled <strong>14–30 days</strong> before check-in.</li>
        <li>Non-refundable inside <strong>14 days</strong> of check-in.</li>
      </ul>
    </div>

    <div class="cta">
      <a class="btn" href="https://coastalhaven.com/book?success=1&booking_id={booking['id']}">View booking details</a>
    </div>

    <p style="font-size:13px;color:#6c7775;text-align:center;margin-top:20px">
      Questions? Reply to this email or contact us at
      <a href="mailto:voiceorchatbot@gmail.com" style="color:#0d5f6b">voiceorchatbot@gmail.com</a>
    </p>
  </div>

  <div class="footer">
    <strong>Coastal Haven at Phoenix V</strong><br>
    26802 Perdido Beach Blvd, Unit 1506 · Orange Beach, AL 36561<br>
    <a href="mailto:voiceorchatbot@gmail.com">voiceorchatbot@gmail.com</a>
    <br><br>
    <span style="font-size:11px">You're receiving this because you made a booking on our website. This is a transactional email.</span>
  </div>
</div>
</div>
</body>
</html>
"""

    text = f"""
Booking Confirmed — {ref}

Hi {first},

Your reservation at Coastal Haven at Phoenix V is confirmed!

Check-in:  {checkin_fmt} (after 4:00 PM)
Check-out: {checkout_fmt} (by 10:00 AM)
Nights:    {nights}
Guests:    {guests}
Total:     {total}

Property: Unit 1506, 26802 Perdido Beach Blvd, Orange Beach, AL 36561

BEFORE YOU ARRIVE:
- Door code and check-in instructions sent 48 hrs before arrival
- Covered parking included (one space)
- Pool, hot tub, beach access available 24/7

CANCELLATION POLICY:
- Full refund: 30+ days before check-in
- 50% refund: 14-30 days before check-in
- Non-refundable: inside 14 days

Questions? Reply to this email or contact voiceorchatbot@gmail.com

Coastal Haven at Phoenix V
"""

    subject = f'Booking Confirmed {ref} — Coastal Haven, Orange Beach'
    return _send(to, subject, html, text)


def send_owner_notification(booking: dict) -> bool:
    owner = settings.smtp_user
    if not owner:
        return False

    ref = f"#CHV-{str(booking['id']).zfill(4)}"
    nights = 0
    try:
        from datetime import date
        ci = date.fromisoformat(booking['checkin'])
        co = date.fromisoformat(booking['checkout'])
        nights = (co - ci).days
    except Exception:
        pass

    html = f"""
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #ddd;border-radius:12px;overflow:hidden">
  <div style="background:#0d5f6b;color:white;padding:20px 24px">
    <h2 style="margin:0">New Booking {ref}</h2>
  </div>
  <div style="padding:24px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#666">Guest</td><td style="font-weight:600">{booking.get('guest_name','—')}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Email</td><td><a href="mailto:{booking.get('email','')}">{booking.get('email','—')}</a></td></tr>
      <tr><td style="padding:8px 0;color:#666">Phone</td><td>{booking.get('phone','—')}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Address</td><td>{booking.get('address','—')}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Check-in</td><td>{booking['checkin']}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Check-out</td><td>{booking['checkout']}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Nights</td><td>{nights}</td></tr>
      <tr><td style="padding:8px 0;color:#666">Guests</td><td>{booking.get('guests','—')}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-weight:700">Total</td><td style="font-size:18px;font-weight:800;color:#0d5f6b">${booking['total']:.2f}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:#888">Paid via Stripe — check your dashboard for confirmation.</p>
  </div>
</div>
"""
    return _send(owner, f'New booking {ref} — ${booking["total"]:.0f} — {booking["checkin"]}', html)
