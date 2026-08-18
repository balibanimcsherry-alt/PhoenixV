import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

export default function CancellationPolicy() {
  return <>
    <SEOMeta
      title="Cancellation Policy | Coastal Haven at Phoenix V"
      description="Cancellation and refund policy for Coastal Haven — a Gulf-front vacation rental at Phoenix V in Orange Beach, Alabama. Full refund up to 30 days before arrival."
      canonical="/cancellation-policy"
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>Cancellation Policy</span>
        </nav>
        <div className="eyebrow dark">COASTAL HAVEN · PHOENIX V</div>
        <h1>Cancellation Policy</h1>
        <p>Last updated: August 2025</p>
      </section>

      <section className="section" style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Refund tiers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 48 }}>
          {[
            { window: '30+ days before check-in', refund: '100% refund', color: '#28704e', bg: '#edfaf3', label: 'Full refund' },
            { window: '14–30 days before check-in', refund: '50% refund', color: '#b97a00', bg: '#fff9ed', label: 'Partial refund' },
            { window: 'Less than 14 days before check-in', refund: 'No refund', color: '#b94040', bg: '#fff0f0', label: 'Non-refundable' },
          ].map(tier => (
            <div key={tier.label} style={{ background: tier.bg, border: `1.5px solid ${tier.color}30`, borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tier.color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{tier.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: tier.color, marginBottom: 8 }}>{tier.refund}</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{tier.window}</div>
            </div>
          ))}
        </div>

        <h2>How cancellations work</h2>
        <p>All cancellation requests must be submitted in writing — by message through the booking platform or by contacting us through the <a href="/contact">contact page</a>. Verbal requests are not accepted. The cancellation date is the date we receive your written request, not the date of your stay.</p>
        <p>Refunds are processed to the original payment method. Processing time is typically 5–10 business days depending on your bank or card issuer, and is outside our control once initiated.</p>

        <h2>Refund timeline in detail</h2>
        <ul>
          <li><strong>More than 30 days before check-in:</strong> Full refund of all amounts paid, including any cleaning fee and taxes collected. Stripe's processing fee (approximately 2.9% + 30¢) may be retained if it cannot be recovered from the payment processor — we will notify you if this applies.</li>
          <li><strong>14 to 30 days before check-in:</strong> 50% of the total reservation amount refunded. The cleaning fee and taxes are refunded in full within this window.</li>
          <li><strong>Less than 14 days before check-in:</strong> No refund. The full reservation amount is retained. This includes cases where you shorten your stay after check-in.</li>
        </ul>

        <h2>Date changes and modifications</h2>
        <p>Date changes are accommodated when the new dates are available and when requested at least 14 days before the original check-in. Date changes within 14 days of check-in are treated as a cancellation of the original reservation and a new booking — the cancellation policy applies to the original booking.</p>
        <p>Shortening a stay after check-in (checking out early) does not result in a refund for unused nights.</p>

        <h2>No-shows</h2>
        <p>A no-show — arriving more than 24 hours after your scheduled check-in date without prior notice — is treated as a non-refundable cancellation. If you are delayed, please notify us as soon as possible.</p>

        <h2>Travel disruptions</h2>
        <p>We strongly recommend purchasing travel insurance to cover unexpected events including illness, weather delays, flight cancellations, and family emergencies. Our cancellation policy applies regardless of the reason for cancellation. Travel insurance is available from providers including Allianz, Travel Guard, and Squaremouth — compare policies before booking.</p>

        <h2>Severe weather and evacuation orders</h2>
        <p>If a mandatory government evacuation order is issued for Orange Beach, Alabama covering your check-in or stay dates, we will issue a full credit toward a future stay of equal or greater value. Credits are valid for 12 months from the original check-in date. Cash refunds under mandatory evacuation are evaluated case by case.</p>
        <p>Voluntary evacuations, tropical storm watches, or hurricane watches that do not result in a mandatory evacuation order do not qualify for refunds or credits outside the standard cancellation window.</p>

        <h2>Booking platform cancellations</h2>
        <p>If you booked through Airbnb or another platform, the cancellation policy of that platform governs your booking. The policy above applies only to reservations made directly through this website (orangebeachstay.com). To confirm which policy applies to your booking, check your original reservation confirmation.</p>

        <h2>How to cancel</h2>
        <ol>
          <li>Go to the <a href="/contact">Contact page</a> and submit a cancellation request, including your booking reference number (format: CHV-XXXX).</li>
          <li>You will receive written confirmation of the cancellation and the refund amount within 24 hours on business days.</li>
          <li>Refunds are initiated within 2 business days of the confirmed cancellation. Allow 5–10 additional business days for the funds to appear in your account.</li>
        </ol>

        <h2>Questions</h2>
        <p>If you have questions about this policy before or after booking, use the <a href="/contact">contact page</a> or the chat widget on this site. We aim to respond within a few hours during business hours (Central Time).</p>

        <div style={{ background: 'var(--sand)', borderRadius: 16, padding: 28, marginTop: 40 }}>
          <h3 style={{ marginTop: 0, color: 'var(--teal)' }}>Quick summary</h3>
          <ul style={{ margin: 0 }}>
            <li><strong>30+ days out:</strong> Full refund — cancel with confidence.</li>
            <li><strong>14–30 days out:</strong> 50% refund — partial recovery.</li>
            <li><strong>Inside 14 days:</strong> No refund — consider travel insurance.</li>
            <li><strong>Date changes:</strong> Free with 14+ days notice and availability.</li>
            <li><strong>Mandatory evacuation:</strong> Full credit toward a future stay.</li>
          </ul>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/faq" className="btn light">FAQ</a>
          <a href="/contact" className="btn light">Contact Us</a>
          <a href="/book" className="btn">Check Availability</a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
