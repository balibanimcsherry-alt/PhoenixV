import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

export default function PhoenixV() {
  return <>
    <SEOMeta
      title="Phoenix V Orange Beach | Condo Resort Guide | Coastal Haven Unit 1408"
      description="Everything you need to know about Phoenix V resort in Orange Beach, Alabama — location, amenities, pools, beach access, and why Coastal Haven Unit 1408 is an exceptional choice."
      canonical="/phoenix-v-orange-beach"
      schema={{
        '@context': 'https://schema.org',
        '@type': 'LodgingBusiness',
        name: 'Phoenix V',
        description: 'Beachfront condominium resort at 24400 Perdido Beach Blvd in Orange Beach, Alabama. Direct Gulf access, indoor heated pool, outdoor pools, fitness center, and family amenities.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '24400 Perdido Beach Blvd',
          addressLocality: 'Orange Beach',
          addressRegion: 'AL',
          postalCode: '36561',
          addressCountry: 'US',
        },
        geo: { '@type': 'GeoCoordinates', latitude: 30.2937, longitude: -87.6077 },
        url: 'https://orangebeachstay.com/phoenix-v-orange-beach',
        amenityFeature: [
          { '@type': 'LocationFeatureSpecification', name: 'Indoor heated pool', value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Outdoor beachfront pool', value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Hot tub', value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Direct beach access', value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Fitness center', value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Tennis courts', value: true },
        ],
      }}
    />
    <Header />
    <main>
      <section className="page-hero">
        <img src="/images/balcony.jpg" alt="Gulf-front view from Phoenix V in Orange Beach, Alabama" className="hero-img-base" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <nav aria-label="Breadcrumb" className="breadcrumb breadcrumb-light">
            <a href="/">Home</a> <span>›</span> <span>Phoenix V</span>
          </nav>
          <div className="eyebrow">24400 PERDIDO BEACH BLVD · ORANGE BEACH, AL</div>
          <h1>Phoenix V Resort</h1>
          <p>A premier beachfront condominium complex on the Alabama Gulf Coast — direct Gulf access, full resort amenities, and a front-row seat to the Gulf of Mexico.</p>
          <div className="hero-pills">
            <span>Direct beach access</span>
            <span>Indoor heated pool</span>
            <span>Family resort</span>
            <span>Gulf-front</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <a className="btn" href="/book">Check Availability</a>
            <a className="btn light" href="/orange-beach-condo" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.3)' }}>View the Condo</a>
          </div>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">ABOUT THE RESORT</div>
            <h2>What is Phoenix V?</h2>
          </div>
        </div>
        <div className="split-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', background: 'transparent', minHeight: 'auto', padding: 0 }}>
          <div>
            <p>
              Phoenix V is a full-service beachfront condominium resort at 24400 Perdido Beach Blvd in Orange Beach,
              Alabama. The complex sits directly on the Gulf of Mexico with immediate access to the sugar-white sand
              beach that makes this stretch of the Alabama Gulf Coast famous.
            </p>
            <p>
              The building features a mix of privately owned condominiums — some occupied by owners year-round and
              others available for short-term rental. The result is a well-maintained, owner-invested building rather
              than a motel-style property.
            </p>
            <p>
              Phoenix V's location on Perdido Beach Blvd puts it approximately 9 miles east of Gulf Shores, in the
              quieter and more residential stretch of Orange Beach — close enough to restaurants and activities, but
              removed from the busiest tourist corridors.
            </p>
          </div>
          <img
            src="/images/living-ocean.jpg"
            alt="Oceanfront view from a Phoenix V condo in Orange Beach"
            style={{ borderRadius: 20, boxShadow: '0 20px 50px rgba(19,52,55,.15)' }}
          />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">RESORT AMENITIES</div>
            <h2>Everything families need in one place.</h2>
          </div>
          <p>The amenity package at Phoenix V is one of the reasons guests return year after year.</p>
        </div>
        <div className="amenity-feature-grid">
          <article>
            <h3>Gulf-front beach access</h3>
            <p>Direct access to a private stretch of Gulf-front beach. No crossing roads or parking lots — just the beach, steps from the building entrance.</p>
          </article>
          <article>
            <h3>Indoor heated pool</h3>
            <p>Phoenix V's heated indoor pool stays open year-round, making it one of the few resorts in Orange Beach where swimming never has to stop. Ideal for spring break, fall, and winter stays.</p>
          </article>
          <article>
            <h3>Outdoor Gulf-view pools</h3>
            <p>Multiple outdoor pools overlooking the Gulf of Mexico. Nothing beats drifting on a float while watching waves roll in. Hot tubs available for evening relaxation.</p>
          </article>
          <article>
            <h3>Kids splash pad</h3>
            <p>A dedicated children's splash pad gives younger kids their own play area. Let the little ones run through the water features while everyone else relaxes.</p>
          </article>
          <article>
            <h3>Fitness center</h3>
            <p>A well-equipped fitness center with cardio machines and free weights, available for all guests. Better views from this gym than most you'll find back home.</p>
          </article>
          <article>
            <h3>Tennis & sports courts</h3>
            <p>Tennis courts and a racquetball court round out the active amenity options. Great for families who want to stay moving on beach vacation.</p>
          </article>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a className="btn light" href="/amenities" style={{ color: 'var(--teal)', border: '1px solid var(--teal)' }}>See All Amenities</a>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">UNIT 1408 — COASTAL HAVEN</div>
            <h2>Why choose Unit 1408?</h2>
          </div>
        </div>
        <div className="amenity-feature-grid">
          <article>
            <h3>14th-floor Gulf views</h3>
            <p>Height makes a difference. The 14th floor puts you above the pool deck noise and below the mechanical floors — with an unobstructed view of the Gulf in both directions.</p>
          </article>
          <article>
            <h3>South-facing balcony</h3>
            <p>The private balcony faces directly south over the water. Morning coffee, afternoon reading, evening sunsets — all with an open Gulf horizon.</p>
          </article>
          <article>
            <h3>3 bedrooms for families</h3>
            <p>With 3 bedrooms and sleeping for up to 10, Coastal Haven is designed for the whole family. The open layout keeps everyone together without cramped common spaces.</p>
          </article>
          <article>
            <h3>Thoughtfully maintained</h3>
            <p>As a privately owned unit, Coastal Haven is maintained to a higher standard than many rental condos. Guests consistently note the cleanliness and care of the space.</p>
          </article>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          <a className="btn" href="/book">Check Availability</a>
          <a className="btn light" href="/gallery" style={{ color: 'var(--teal)', border: '1px solid var(--teal)' }}>See Photos</a>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">LOCATION</div>
            <h2>Where is Phoenix V?</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
          <div>
            <p><strong>Address:</strong> 24400 Perdido Beach Blvd, Orange Beach, AL 36561</p>
            <ul style={{ lineHeight: 2.1, color: 'var(--muted)' }}>
              <li>Approximately 9 miles east of Gulf Shores</li>
              <li>Approximately 45 minutes from Pensacola International Airport (PNS)</li>
              <li>Gulf State Park: 2 miles east (beach, fishing pier, bike trails)</li>
              <li>The Wharf entertainment complex: 6 miles west</li>
              <li>Flora-Bama Lounge: 8 miles east at the state line</li>
            </ul>
            <p style={{ marginTop: 16 }}>
              Need help planning what to do nearby?{' '}
              <a href="/orange-beach-guide">See our Orange Beach guide →</a>
            </p>
          </div>
          <div className="map-wrap" style={{ height: 320, margin: 0 }}>
            <iframe
              title="Phoenix V location map"
              src="https://maps.google.com/maps?q=24400+Perdido+Beach+Blvd+Orange+Beach+AL+36561&t=k&z=15&output=embed"
              className="map-iframe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section className="section book-direct">
        <div>
          <div className="eyebrow">BOOK COASTAL HAVEN DIRECT</div>
          <h2>Stay at Phoenix V Unit 1408.</h2>
          <p>Book directly with the owner and save on service fees. Instant price quote, transparent pricing.</p>
        </div>
        <a className="btn light" href="/book">Check Availability</a>
      </section>
    </main>
    <Footer />
  </>;
}
