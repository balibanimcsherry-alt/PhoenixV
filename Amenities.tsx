import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import { PROPERTY } from './property';

const AMENITY_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Phoenix V Amenities | Coastal Haven Orange Beach',
  description: 'Full amenity details for Coastal Haven at Phoenix V — pools, beach access, fitness center, and more.',
  mainEntity: {
    '@type': 'VacationRental',
    name: 'Coastal Haven at Phoenix V',
    amenityFeature: PROPERTY.amenities
      .filter(a => a.category !== 'Policy')
      .map(a => ({ '@type': 'LocationFeatureSpecification', name: a.name, value: true })),
  },
};

const grouped = PROPERTY.amenities.reduce<Record<string, string[]>>((acc, a) => {
  (acc[a.category] = acc[a.category] || []).push(a.name);
  return acc;
}, {});

const CATEGORY_LABELS: Record<string, string> = {
  Beach: 'Beach Access',
  Pool: 'Pools & Water',
  Family: 'Family Amenities',
  Active: 'Sports & Fitness',
  Outdoor: 'Outdoor Spaces',
  Unit: 'In-Unit Features',
  Building: 'Building',
  Booking: 'Check-In',
};

export default function Amenities() {
  return <>
    <SEOMeta
      title="Phoenix V Amenities | Pools, Beach Access & More | Coastal Haven"
      description="Coastal Haven at Phoenix V offers direct beach access, indoor heated pool, outdoor pools, hot tub, splash pad, fitness center, tennis, and more in Orange Beach, Alabama."
      canonical="/amenities"
      schema={AMENITY_SCHEMA}
    />
    <Header />
    <main>
      <section className="page-hero">
        <img src="/images/coast.jpg" alt="Orange Beach Gulf Coast at Phoenix V" className="hero-img-base" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <nav aria-label="Breadcrumb" className="breadcrumb breadcrumb-light">
            <a href="/">Home</a> <span>›</span> <span>Amenities</span>
          </nav>
          <div className="eyebrow">PHOENIX V · ORANGE BEACH</div>
          <h1>Resort Amenities</h1>
          <p>Everything you need for the perfect family beach vacation — without leaving the property.</p>
          <a className="btn" href="/book">Check Availability</a>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">RESORT HIGHLIGHTS</div>
            <h2>Phoenix V has it all.</h2>
          </div>
          <p>From direct Gulf access to a heated indoor pool, Phoenix V is designed for families who want to relax without renting a car every hour.</p>
        </div>
        <div className="amenity-feature-grid">
          <article>
            <h3>Direct beach access</h3>
            <p>Phoenix V sits directly on the Gulf of Mexico. Walk from the lobby to the sand in under a minute. Beach chairs and umbrellas are available for rental on the beach.</p>
          </article>
          <article>
            <h3>Indoor heated pool</h3>
            <p>The heated indoor pool means swimming year-round, no matter what the weather is doing. Perfect for spring break, fall visits, or any rainy afternoon.</p>
          </article>
          <article>
            <h3>Outdoor pools & hot tub</h3>
            <p>Multiple outdoor pools and hot tubs overlook the Gulf. Nothing beats floating in warm water while looking out over the Gulf of Mexico.</p>
          </article>
          <article>
            <h3>Kids splash pad</h3>
            <p>A dedicated splash pad gives younger children their own water play area separate from the main pools — a huge win for families with toddlers.</p>
          </article>
          <article>
            <h3>Fitness center</h3>
            <p>A full fitness center with cardio equipment and weights means you can keep your routine going. Gulf views from the gym make the session better.</p>
          </article>
          <article>
            <h3>Tennis & racquetball</h3>
            <p>Tennis courts and a racquetball court are available for guests. A great option on afternoons when you want something more active than the beach.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">IN-UNIT FEATURES</div>
            <h2>Coastal Haven — what's inside.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {Object.entries(grouped)
            .filter(([cat]) => cat !== 'Policy')
            .map(([cat, items]) => (
              <div key={cat} className="amenity-category-card">
                <h3>{CATEGORY_LABELS[cat] || cat}</h3>
                <ul>
                  {items.map(item => <li key={item}>✓ {item}</li>)}
                </ul>
              </div>
            ))}
        </div>
      </section>

      <section className="section book-direct">
        <div>
          <div className="eyebrow">READY TO BOOK?</div>
          <h2>Check availability for your dates.</h2>
          <p>Book directly and save on service fees. Instant price quote, no account required.</p>
        </div>
        <a className="btn light" href="/book">Check Availability</a>
      </section>
    </main>
    <Footer />
  </>;
}
