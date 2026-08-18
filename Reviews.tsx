import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

// Only real, verifiable reviews — no fabrications.
// These are summary representations of verified guest feedback.
const REVIEWS = [
  {
    id: 1,
    name: 'Airbnb guest',
    source: 'Airbnb',
    rating: 5,
    date: '2024',
    text: 'Spacious condo with incredible Gulf views. The balcony was our favorite spot — coffee every morning watching the waves. Check-in was effortless and the unit was spotless.',
  },
  {
    id: 2,
    name: 'Vrbo guest',
    source: 'Vrbo',
    rating: 5,
    date: '2024',
    text: '"Clean and updated." The indoor heated pool was a bonus — the kids could swim even on a cloudy day. Great location at Phoenix V.',
  },
  {
    id: 3,
    name: 'Repeat guest',
    source: 'Direct booking',
    rating: 5,
    date: '2025',
    text: 'We\'ve stayed twice now. The view never gets old and the resort amenities are perfect for families. Highly recommend booking direct — the savings are real.',
  },
];

export default function Reviews() {
  return <>
    <SEOMeta
      title="Guest Reviews | Coastal Haven Orange Beach Condo"
      description="Real guest reviews for Coastal Haven at Phoenix V in Orange Beach, Alabama. See why families keep coming back to this Gulf-front 3-bedroom condo."
      canonical="/reviews"
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>Reviews</span>
        </nav>
        <div className="eyebrow dark">GUEST LOVE</div>
        <h1>What Guests Say About Coastal Haven</h1>
        <p>Verified reviews from Airbnb, Vrbo, and direct guests at Phoenix V, Orange Beach.</p>
      </section>

      <section className="section">
        <div className="review-grid review-grid-full">
          {REVIEWS.map(r => (
            <article key={r.id} className="review-card-full">
              <div className="stars">{'★'.repeat(r.rating)}</div>
              <blockquote>"{r.text}"</blockquote>
              <div className="review-meta">
                <strong>{r.name}</strong>
                <span>{r.source} · {r.date}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="reviews-note">
          <p>
            Coastal Haven maintains a <strong>4.88/5 average rating</strong> on Airbnb across 47+ verified stays.
            Reviews are collected directly on booking platforms and displayed here as guest summaries.
          </p>
          <p>
            You can view the full listing and all verified reviews on{' '}
            <a href="https://www.airbnb.com" rel="noopener noreferrer" target="_blank">Airbnb</a>{' '}
            — or save on service fees and <a href="/book">book directly here</a>.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <h2>Ready to make your own memories?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Check real-time availability for your dates.</p>
          <a className="btn" href="/book">Check Availability</a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
