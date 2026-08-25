import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import BookingBar from './BookingBar';

export default function SpringBreak() {
  return <>
    <SEOMeta
      title="Orange Beach Spring Break Condo Rental | Coastal Haven at Phoenix V"
      description="Book Coastal Haven for spring break in Orange Beach, Alabama. 3-bedroom Gulf-front condo at Phoenix V — sleeps 10, indoor heated pool, direct beach access. Book direct and save."
      canonical="/orange-beach-spring-break"
      schema={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Orange Beach Spring Break Condo Rental',
        description: 'Book Coastal Haven at Phoenix V for spring break in Orange Beach, Alabama. 3-bedroom Gulf-front condo sleeping up to 10 guests with indoor heated pool and direct beach access.',
        url: 'https://orangebeachstay.com/orange-beach-spring-break',
      }}
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>Spring Break</span>
        </nav>
        <div className="eyebrow dark">MARCH & APRIL</div>
        <h1>Orange Beach Spring Break Condo Rental</h1>
        <p style={{ maxWidth: 600, margin: '16px auto 0', fontSize: 18, color: 'var(--muted)', lineHeight: 1.7 }}>
          A 3-bedroom Gulf-front condo at Phoenix V — direct beach access, indoor heated pool, and space for up to 10 guests. Book direct and save.
        </p>
        <div style={{ marginTop: 28, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn" href="/book">Check Spring Break Availability</a>
          <a className="btn light" href="/orange-beach-condo">View the Condo</a>
        </div>
      </section>

      <BookingBar />

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">WHY ORANGE BEACH</div>
            <h2>Why Families Choose Orange Beach for Spring Break</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginTop: 32 }}>
          <div>
            <p>Orange Beach, Alabama sits directly on the Gulf of Mexico with some of the clearest, warmest Gulf water on the Atlantic Coast in spring. The beaches are wide, the water is turquoise, and the crowds are meaningfully smaller than Florida's most famous spring break destinations.</p>
            <p style={{ marginTop: 16 }}>Spring break weeks in March and April fall just before peak summer season — Gulf water is in the mid-to-upper 60s°F (passable for warm-weather swimmers, excellent for kids). The beaches are far less crowded than July. Most major restaurants and activities are fully open. And prices are lower than summer.</p>
            <p style={{ marginTop: 16 }}>Phoenix V's indoor heated pool makes Coastal Haven particularly well-suited for spring — even on cooler or overcast days, there's always somewhere to swim. The splash pad is open year-round for younger kids.</p>
          </div>
          <img src="/images/coast.jpg" alt="Orange Beach Alabama Gulf Coast shoreline in spring" style={{ borderRadius: 20, width: '100%', objectFit: 'cover', height: 380 }} />
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">SPRING BREAK WEATHER</div>
            <h2>What to Expect in March and April in Orange Beach</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 32 }}>
          <div className="amenity-category-card">
            <h3>March in Orange Beach</h3>
            <ul style={{ lineHeight: 2, color: 'var(--muted)' }}>
              <li>Air temps: highs 65–72°F</li>
              <li>Gulf water: 62–66°F</li>
              <li>Crowds: moderate (Spring Break weeks)</li>
              <li>Sunsets: increasingly late</li>
              <li>Indoor pool: open &amp; heated year-round</li>
            </ul>
          </div>
          <div className="amenity-category-card">
            <h3>April in Orange Beach</h3>
            <ul style={{ lineHeight: 2, color: 'var(--muted)' }}>
              <li>Air temps: highs 72–80°F</li>
              <li>Gulf water: 66–72°F</li>
              <li>Crowds: lighter than March peak</li>
              <li>Fishing season: opening</li>
              <li>Gulf State Park: best wildflower season</li>
            </ul>
          </div>
          <div className="amenity-category-card">
            <h3>Spring Break Packing Tips</h3>
            <ul style={{ lineHeight: 2, color: 'var(--muted)' }}>
              <li>Light jacket for evenings</li>
              <li>Wetsuit or rash guard for Gulf swimming</li>
              <li>Reef-safe sunscreen</li>
              <li>Beach towels (extras provided in the unit)</li>
              <li>Sand toys for younger kids</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">THE CONDO</div>
            <h2>Coastal Haven — Spring Break for Families and Groups</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 32 }}>
          <div className="amenity-category-card">
            <h3>Sleeping 10 Guests</h3>
            <ul>
              <li>Primary suite — king bed</li>
              <li>Bedroom 2 — queen bed</li>
              <li>Bedroom 3 — two twin beds</li>
              <li>Sleeper sofa in living room</li>
            </ul>
          </div>
          <div className="amenity-category-card">
            <h3>Year-Round Pools</h3>
            <ul>
              <li>Indoor heated pool — open all spring</li>
              <li>Outdoor beachfront pool (seasonal)</li>
              <li>Kids splash pad — open year-round</li>
              <li>Gulf-view hot tub</li>
            </ul>
          </div>
          <div className="amenity-category-card">
            <h3>Beach Access</h3>
            <ul>
              <li>Direct beach access from Phoenix V</li>
              <li>Outdoor showers at beach level</li>
              <li>14th floor Gulf-view balcony</li>
              <li>Gulf State Park — 2 miles east</li>
            </ul>
          </div>
          <div className="amenity-category-card">
            <h3>Kitchen &amp; Staying In</h3>
            <ul>
              <li>Full kitchen — cook breakfast &amp; lunch</li>
              <li>Dining table seats everyone</li>
              <li>In-unit washer &amp; dryer</li>
              <li>Smart TV for movie nights</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">SPRING BREAK ACTIVITIES</div>
            <h2>What's Open and Fun in Orange Beach in Spring</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 32 }}>
          <div>
            <h3>On the Water</h3>
            <ul style={{ lineHeight: 2 }}>
              <li><strong>Dolphin cruises</strong> — multiple daily departures from Orange Beach Marina</li>
              <li><strong>Parasailing</strong> — operators set up at Phoenix V beach in spring</li>
              <li><strong>Kayaking</strong> — back bay kayak rentals available March–November</li>
              <li><strong>Snorkeling</strong> — Gulf visibility improves as water warms through April</li>
            </ul>
          </div>
          <div>
            <h3>On Land</h3>
            <ul style={{ lineHeight: 2 }}>
              <li><strong>Gulf State Park</strong> — bike trails, nature center, sea turtle exhibits</li>
              <li><strong>The Wharf</strong> — observation wheel, mini-golf, family restaurants</li>
              <li><strong>Orange Beach Sportsplex</strong> — open year-round for rainy days</li>
              <li><strong>LuLu's Orange Beach</strong> — waterfront dining, family-friendly</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">BOOK NOW</div>
            <h2>Spring Break Weeks Fill Fast — Check Availability Now</h2>
          </div>
          <p>Spring break weeks book out months in advance. If your dates are open, book directly and save vs. Airbnb service fees.</p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a className="btn" href="/book" style={{ display: 'inline-block', marginBottom: 16 }}>Check Spring Break Availability</a>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No account needed · Instant confirmation · Book direct and save ~10% vs. Airbnb</p>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">SPRING BREAK FAQ</div>
            <h2>Common Questions About Spring Break at Orange Beach</h2>
          </div>
        </div>
        <div className="faq" style={{ maxWidth: 'none' }}>
          {[
            ['How far in advance should I book spring break at Orange Beach?', 'Spring break weeks — especially late March through mid-April — typically book 4–6 months in advance. If you\'re planning a March or April trip, booking by October or November gives you the best selection of dates.'],
            ['Is the beach swimmable in March at Orange Beach?', 'Technically yes, but the Gulf water in March is typically 62–66°F, which is cold for most casual swimmers. Many families use the indoor heated pool at Phoenix V for actual swimming in March and treat the beach as a walk and relaxation space. By late April, water warms to the low 70s.'],
            ['What is the minimum stay during spring break at Coastal Haven?', 'Spring break weeks typically require a 7-night minimum stay. Contact us about shorter minimum stays for non-peak spring break weeks.'],
            ['Is Orange Beach crowded during spring break?', 'Orange Beach is meaningfully quieter than major Florida spring break destinations. Gulf Shores is busier than Orange Beach during spring break weeks. The resort at Phoenix V sees full occupancy during peak spring break weeks but the beach in front of the building is never as crowded as Florida destinations.'],
            ['Are restaurants open in March and April in Orange Beach?', 'Yes. Most major restaurants are open year-round. LuLu\'s, Fisher\'s at Orange Beach Marina, The Wharf, and most local seafood spots are fully open in spring.'],
          ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
