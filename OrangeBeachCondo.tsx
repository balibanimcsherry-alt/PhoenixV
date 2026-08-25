import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import { PROPERTY } from './property';
import BookingBar from './BookingBar';

export default function OrangeBeachCondo() {
  return <>
    <SEOMeta
      title="3-Bedroom Orange Beach Condo for Rent | Gulf-Front, Sleeps 10 | Coastal Haven"
      description="Coastal Haven is a beachfront 3-bedroom, 2-bath condo on the 14th floor of Phoenix V in Orange Beach, Alabama. Gulf views, direct beach access, indoor pool. Sleeps 10. Book direct and save."
      canonical="/orange-beach-condo"
      schema={{
        '@context': 'https://schema.org',
        '@type': 'VacationRental',
        name: 'Coastal Haven at Phoenix V',
        description: PROPERTY.description,
        url: 'https://orangebeachstay.com/orange-beach-condo',
        image: PROPERTY.images.map(i => `https://orangebeachstay.com${i.src}`),
        numberOfBedrooms: PROPERTY.bedrooms,
        numberOfBathroomsTotal: PROPERTY.bathrooms,
        occupancy: { '@type': 'QuantitativeValue', maxValue: PROPERTY.maxGuests },
        address: {
          '@type': 'PostalAddress',
          streetAddress: PROPERTY.address.street,
          addressLocality: PROPERTY.address.city,
          addressRegion: PROPERTY.address.state,
          postalCode: PROPERTY.address.zip,
          addressCountry: PROPERTY.address.country,
        },
        checkinTime: '16:00',
        checkoutTime: '10:00',
      }}
    />
    <Header />
    <main>
      <section className="page-hero">
        <img src="/images/living-ocean.jpg" alt="3-bedroom Gulf-front condo at Phoenix V Orange Beach Alabama" className="hero-img-base" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <nav aria-label="Breadcrumb" className="breadcrumb breadcrumb-light">
            <a href="/">Home</a> <span>›</span> <span>The Condo</span>
          </nav>
          <div className="eyebrow">ORANGE BEACH, ALABAMA</div>
          <h1>3-Bedroom Gulf-Front Condo — Orange Beach, Alabama</h1>
          <p>Coastal Haven at Phoenix V — 14th floor, direct beach access, and an unobstructed view of the Gulf of Mexico. Sleeps up to 10 guests.</p>
          <div className="hero-pills">
            <span>{PROPERTY.bedrooms} Bedrooms</span>
            <span>{PROPERTY.bathrooms} Baths</span>
            <span>Up to {PROPERTY.maxGuests} Guests</span>
            <span>14th Floor</span>
            <span>Gulf Front</span>
          </div>
          <a className="btn" href="/book" style={{ marginTop: 24, display: 'inline-flex' }}>Check Availability</a>
        </div>
        <BookingBar />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">THE UNIT</div>
            <h2>What's inside Coastal Haven.</h2>
          </div>
        </div>
        <div className="split-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', background: 'transparent', minHeight: 'auto', padding: 0 }}>
          <div>
            <p>
              Coastal Haven occupies Unit 1408 at Phoenix V — a spacious 3-bedroom, 2-bathroom condominium
              on the 14th floor with a south-facing balcony that looks directly over the Gulf of Mexico.
              The unit accommodates up to {PROPERTY.maxGuests} guests comfortably across 3 bedrooms and {PROPERTY.beds} beds.
            </p>
            <p>
              The open living and dining area keeps families connected without cramped quarters.
              The fully equipped kitchen has everything needed for cooking family meals — no need to eat
              out for every breakfast. An in-unit washer and dryer means you can pack lighter and handle
              sandy towels without leaving the building.
            </p>
            <p>
              The primary suite opens directly to the balcony, giving the master bedroom its own access
              to fresh Gulf air and an unobstructed water view. Wake up to the Gulf every morning.
            </p>
          </div>
          <img src="/images/master.jpg" alt="Primary suite at Coastal Haven with direct balcony access" style={{ borderRadius: 20, width: '100%', objectFit: 'cover', height: 400 }} />
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">ROOMS</div>
            <h2>Bedroom layout.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <div className="amenity-category-card">
            <h3>Primary Suite</h3>
            <ul>
              <li>King bed</li>
              <li>Direct balcony access</li>
              <li>Gulf views</li>
              <li>En-suite bathroom</li>
            </ul>
          </div>
          <div className="amenity-category-card">
            <h3>Guest Bedroom 2</h3>
            <ul>
              <li>Queen bed</li>
              <li>Closet storage</li>
              <li>Shared hallway bath</li>
            </ul>
          </div>
          <div className="amenity-category-card">
            <h3>Guest Bedroom 3</h3>
            <ul>
              <li>Two twin beds</li>
              <li>Ideal for kids</li>
              <li>Closet storage</li>
            </ul>
          </div>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
          Bed configuration may vary. Contact us if you need exact details for your group.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">KITCHEN & LIVING</div>
            <h2>Cook, eat, relax.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <h3>Fully equipped kitchen</h3>
            <p>Full-size refrigerator, stove, oven, microwave, dishwasher, coffee maker, blender, and a complete set of cookware, dishes, utensils, and glassware. Stock up at the nearby Publix and cook most meals at the condo to save significantly on food costs.</p>
          </div>
          <div>
            <h3>Dining & living area</h3>
            <p>Open floor plan dining and living area with enough seating for the whole group. The living room has a Smart TV for evening wind-down after beach days. The balcony is the natural gathering spot — six chairs, Gulf breeze, and one of the best views on the Alabama coast.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
          <img src="/images/kitchen.jpg" alt="Fully equipped kitchen at Coastal Haven" style={{ borderRadius: 14, width: '100%', height: 260, objectFit: 'cover' }} />
          <img src="/images/dining.jpg" alt="Dining area at Coastal Haven Orange Beach condo" style={{ borderRadius: 14, width: '100%', height: 260, objectFit: 'cover' }} />
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">POLICIES</div>
            <h2>Good to know before you book.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          <div className="amenity-category-card">
            <h3>Check-in / Check-out</h3>
            <p style={{ color: 'var(--muted)' }}>Check-in after <strong>{PROPERTY.checkInTime}</strong><br />Check-out by <strong>{PROPERTY.checkOutTime}</strong></p>
          </div>
          <div className="amenity-category-card">
            <h3>Cancellation</h3>
            <p style={{ color: 'var(--muted)' }}>{PROPERTY.policies.cancellation}</p>
          </div>
          <div className="amenity-category-card">
            <h3>Pets & Smoking</h3>
            <p style={{ color: 'var(--muted)' }}>No pets. No smoking anywhere in the unit or on the balcony. Phoenix V HOA rules.</p>
          </div>
          <div className="amenity-category-card">
            <h3>Parking</h3>
            <p style={{ color: 'var(--muted)' }}>{PROPERTY.policies.parkingNotes}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">FREQUENTLY ASKED</div>
            <h2>Quick answers.</h2>
          </div>
        </div>
        <div className="faq" style={{ maxWidth: 'none' }}>
          {PROPERTY.faqs.slice(0, 6).map(({ q, a }) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
        <p style={{ marginTop: 20 }}><a href="/faq">See all frequently asked questions →</a></p>
      </section>

      <section className="section book-direct">
        <div>
          <div className="eyebrow">BOOK DIRECT</div>
          <h2>Reserve Coastal Haven for your family.</h2>
          <p>Check availability for your dates and get an instant price quote. Book direct and save on service fees.</p>
        </div>
        <a className="btn light" href="/book">Check Availability</a>
      </section>
    </main>
    <Footer />
  </>;
}
