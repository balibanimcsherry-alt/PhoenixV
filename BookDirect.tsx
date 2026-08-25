import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import BookingBar from './BookingBar';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What does it mean to book a vacation rental direct?',
      acceptedAnswer: { '@type': 'Answer', text: 'Booking direct means reserving Coastal Haven through the owner\'s website (orangebeachstay.com) instead of through a platform like Airbnb or VRBO. You get the same unit, the same owner, and a lower price because you skip the 10–15% platform service fee.' },
    },
    {
      '@type': 'Question',
      name: 'How much do I save booking Coastal Haven direct vs. Airbnb?',
      acceptedAnswer: { '@type': 'Answer', text: 'Direct booking rates are set approximately 10% below comparable Airbnb pricing when the discount is enabled by the owner. For a 7-night summer stay averaging $400/night, that\'s a $280 savings versus Airbnb.' },
    },
    {
      '@type': 'Question',
      name: 'Is it safe to book a vacation rental directly from the owner?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Direct booking through orangebeachstay.com uses secure Stripe payment processing. Your payment is protected the same way it would be on any major platform. The property is verified, the owner is reachable directly, and all booking terms are clearly stated before checkout.' },
    },
    {
      '@type': 'Question',
      name: 'What payment methods are accepted for direct bookings?',
      acceptedAnswer: { '@type': 'Answer', text: 'All major credit and debit cards are accepted through Stripe\'s secure checkout. Payment is processed at booking and held until after your check-in date.' },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel a direct booking?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. The direct booking cancellation policy allows a full refund if cancelled at least 30 days before check-in. Cancellations within 30 days may be partially or fully non-refundable. Full policy details are shown during checkout.' },
    },
  ],
};

export default function BookDirect() {
  return <>
    <SEOMeta
      title="Book Coastal Haven Direct — No Airbnb Fees | Orange Beach Condo"
      description="Book Coastal Haven at Phoenix V directly with the owner and save up to 10% vs. Airbnb or VRBO. No service fees, same unit, better price. Simple and secure online booking."
      canonical="/book-direct-orange-beach"
      schema={schema}
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>Book Direct</span>
        </nav>
        <div className="eyebrow dark">NO PLATFORM FEES</div>
        <h1>Book Coastal Haven Direct and Save</h1>
        <p style={{ maxWidth: 620, margin: '16px auto 0', fontSize: 18, color: 'var(--muted)', lineHeight: 1.7 }}>
          Skip the Airbnb and VRBO service fees. Book directly with the owner at the same unit for a lower price — with the same secure online booking experience.
        </p>
        <div style={{ marginTop: 28, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a className="btn" href="/book">Check Availability & Book Direct</a>
          <a className="btn light" href="/orange-beach-condo">View the Condo</a>
        </div>
      </section>

      <BookingBar />

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">WHY BOOK DIRECT</div>
            <h2>How Much Do You Actually Save?</h2>
          </div>
          <p>Platform service fees add up fast — especially on longer Gulf Coast stays.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 32 }}>
          <div className="amenity-category-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
            <h3>7-Night Summer Stay</h3>
            <p style={{ color: 'var(--muted)' }}>~$400/night nightly rate</p>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Airbnb total (with 14% fee)</span>
                <strong style={{ color: '#c9534f' }}>~$3,192</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Direct booking total</span>
                <strong style={{ color: '#28704e' }}>~$2,800</strong>
              </div>
              <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700, color: '#28704e' }}>Save ~$392</div>
            </div>
          </div>

          <div className="amenity-category-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
            <h3>5-Night Shoulder Season</h3>
            <p style={{ color: 'var(--muted)' }}>~$280/night nightly rate</p>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Airbnb total (with 14% fee)</span>
                <strong style={{ color: '#c9534f' }}>~$1,596</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Direct booking total</span>
                <strong style={{ color: '#28704e' }}>~$1,400</strong>
              </div>
              <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700, color: '#28704e' }}>Save ~$196</div>
            </div>
          </div>

          <div className="amenity-category-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
            <h3>3-Night Weekend</h3>
            <p style={{ color: 'var(--muted)' }}>~$250/night nightly rate</p>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>Airbnb total (with 14% fee)</span>
                <strong style={{ color: '#c9534f' }}>~$855</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Direct booking total</span>
                <strong style={{ color: '#28704e' }}>~$750</strong>
              </div>
              <div style={{ marginTop: 12, fontSize: 22, fontWeight: 700, color: '#28704e' }}>Save ~$105</div>
            </div>
          </div>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
          Estimates based on approximate nightly rates and a 14% Airbnb guest service fee. Direct booking discount is approximately 10% off the base nightly rate when enabled by the owner. Exact totals, taxes, and fees shown at checkout.
        </p>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">WHAT YOU GET</div>
            <h2>Direct Booking vs. Airbnb — What's the Same, What's Better</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 32 }}>
          <div>
            <h3>Same as Airbnb</h3>
            <ul style={{ lineHeight: 2 }}>
              <li>Exact same unit — Coastal Haven Unit 1408 at Phoenix V</li>
              <li>Same check-in/check-out times</li>
              <li>Same cleaning standards</li>
              <li>Same cancellation policy terms</li>
              <li>Secure online payment (Stripe)</li>
              <li>Instant booking confirmation</li>
            </ul>
          </div>
          <div>
            <h3>Better with Direct</h3>
            <ul style={{ lineHeight: 2 }}>
              <li><strong>Lower price</strong> — no platform service fee</li>
              <li><strong>Direct owner contact</strong> — message the owner anytime</li>
              <li><strong>Flexible questions</strong> — get answers faster</li>
              <li><strong>No algorithm changes</strong> — your booking is with the owner</li>
              <li><strong>More dates visible</strong> — see availability not listed on OTAs</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">HOW IT WORKS</div>
            <h2>How to Book Coastal Haven Direct — 3 Steps</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 32 }}>
          <div className="amenity-category-card">
            <div style={{ fontSize: 32, marginBottom: 12 }}>1️⃣</div>
            <h3>Pick Your Dates</h3>
            <p>Use the booking calendar to select your check-in and check-out dates. Available dates appear immediately with nightly pricing shown on the calendar.</p>
          </div>
          <div className="amenity-category-card">
            <div style={{ fontSize: 32, marginBottom: 12 }}>2️⃣</div>
            <h3>Review & Confirm</h3>
            <p>See the full price breakdown — nightly rate, cleaning fee, and taxes — before entering payment. No hidden fees revealed at the last step.</p>
          </div>
          <div className="amenity-category-card">
            <div style={{ fontSize: 32, marginBottom: 12 }}>3️⃣</div>
            <h3>Get Instant Confirmation</h3>
            <p>Your booking is confirmed immediately. You'll receive a confirmation email with check-in instructions and the owner's contact information.</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <a className="btn" href="/book">Book Direct Now — Check Availability</a>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">THE UNIT</div>
            <h2>Coastal Haven at Phoenix V — What You're Booking</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <p>Coastal Haven is a 3-bedroom, 2-bathroom Gulf-front condo on the 14th floor of Phoenix V in Orange Beach, Alabama. It sleeps up to 10 guests across a king primary suite, a queen second bedroom, and twin bunk bedroom.</p>
            <p style={{ marginTop: 16 }}>The open-plan living and dining area looks directly over the Gulf. The south-facing balcony has unobstructed water views from every chair. The fully equipped kitchen means you can cook most meals and save significantly on food costs.</p>
            <ul style={{ marginTop: 16, lineHeight: 2 }}>
              <li>3 bedrooms · 2 baths · 14th floor</li>
              <li>Sleeps up to 10 guests</li>
              <li>Direct beach access · Indoor heated pool</li>
              <li>Outdoor pools · Hot tub · Fitness center</li>
              <li>Fully equipped kitchen · In-unit washer/dryer</li>
              <li>Self check-in · Fast Wi-Fi</li>
            </ul>
          </div>
          <img src="/images/living-ocean.jpg" alt="Gulf-front living room at Coastal Haven, Orange Beach condo" style={{ borderRadius: 20, width: '100%', objectFit: 'cover', height: 420 }} />
        </div>
      </section>

      <section className="section faq">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">COMMON QUESTIONS</div>
            <h2>Frequently Asked Questions About Direct Booking</h2>
          </div>
        </div>
        {[
          ['What does "book direct" mean?', 'It means reserving Coastal Haven through the owner\'s website instead of through Airbnb or VRBO. You get the same unit at a lower price because you skip the platform\'s 10–15% service fee.'],
          ['Is it safe to book directly from the owner?', 'Yes. All payments are processed through Stripe, the same payment infrastructure used by Amazon, Airbnb, and most major booking platforms. Your card data is never stored on our servers.'],
          ['How much do I save vs. Airbnb?', 'Direct booking rates are approximately 10% below comparable Airbnb pricing when the direct discount is active. For a summer week averaging $400/night, you save roughly $280–$400 vs. the Airbnb total with service fees.'],
          ['What is the cancellation policy for direct bookings?', 'Full refund for cancellations made at least 30 days before check-in. Cancellations within 30 days may be partially or fully non-refundable. The exact policy is displayed before you confirm payment.'],
          ['Can I book the same unit on Airbnb instead?', 'Coastal Haven is also listed on Airbnb and VRBO. However, direct booking on this site costs less because you skip the guest service fee those platforms charge. The unit, owner, and experience are identical.'],
          ['What if I have a problem during my stay?', 'When you book direct, you have the owner\'s contact information from day one — no going through a platform support queue. Issues are handled directly and quickly.'],
        ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </section>

      <section className="section book-direct">
        <div>
          <div className="eyebrow">READY TO BOOK</div>
          <h2>Reserve Coastal Haven — Book Direct and Save</h2>
          <p>Check availability for your dates, see the full price breakdown, and confirm your booking in minutes — no account required.</p>
        </div>
        <a className="btn light" href="/book">Check Availability</a>
      </section>
    </main>
    <Footer />
  </>;
}
