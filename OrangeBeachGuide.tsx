import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

export default function OrangeBeachGuide() {
  return <>
    <SEOMeta
      title="Orange Beach Alabama Guide | Local Tips from Coastal Haven"
      description="The complete insider guide to Orange Beach, Alabama — beaches, restaurants, things to do, fishing, dolphin cruises, and practical travel tips from a local property owner."
      canonical="/orange-beach-guide"
      schema={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Complete Orange Beach Alabama Guide',
        description: 'Insider guide to Orange Beach, Alabama — beaches, restaurants, activities, fishing, and travel tips.',
        author: { '@type': 'Organization', name: 'Coastal Haven' },
        publisher: { '@type': 'Organization', name: 'Coastal Haven', url: 'https://orangebeachstay.com' },
        url: 'https://orangebeachstay.com/orange-beach-guide',
        image: 'https://orangebeachstay.com/images/coast.jpg',
      }}
    />
    <Header />
    <main>
      <section className="page-hero">
        <img src="/images/coast.jpg" alt="Orange Beach Alabama Gulf Coast shoreline" className="hero-img-base" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <nav aria-label="Breadcrumb" className="breadcrumb breadcrumb-light">
            <a href="/">Home</a> <span>›</span> <span>Orange Beach Guide</span>
          </nav>
          <div className="eyebrow">ORANGE BEACH, ALABAMA</div>
          <h1>Your Gulf Coast Guide</h1>
          <p>An insider's guide to Orange Beach — written from the perspective of someone who knows the area well.</p>
        </div>
      </section>

      <section className="section sand">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="eyebrow dark">WELCOME</div>
          <h2>Welcome to Orange Beach, Alabama.</h2>
          <p style={{ fontSize: 18, lineHeight: 1.8, marginBottom: 24 }}>
            Orange Beach sits at the western tip of a narrow barrier island on the Alabama Gulf Coast, about
            45 minutes east of Pensacola, Florida, and 9 miles east of Gulf Shores. The water here is
            remarkably clear — the Gulf Stream pushes warm blue-green water onto white quartz sand beaches
            that rival anything in the Caribbean.
          </p>
          <p style={{ fontSize: 18, lineHeight: 1.8 }}>
            What makes Orange Beach different from more crowded resort destinations is scale. The beaches
            are never crushingly packed, restaurants are genuinely good, and the vibe skews toward family
            vacations rather than spring break chaos. It has grown a lot in the past decade, but it still
            feels like a place where you can actually relax.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">BEACHES</div>
            <h2>The beaches.</h2>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h3>Gulf State Park Beach</h3>
          <p style={{ lineHeight: 1.9, color: 'var(--muted)', marginBottom: 20 }}>
            About 2 miles east of Phoenix V, Gulf State Park Beach is the most beautiful stretch of
            public beach in the area. Less commercial than the main Orange Beach strip, with Gulf State
            Park's dunes, trails, and facilities behind it. The pier here offers excellent fishing.
            Worth the short drive when you want more space.
          </p>
          <h3>Phoenix V Beach (at your doorstep)</h3>
          <p style={{ lineHeight: 1.9, color: 'var(--muted)', marginBottom: 20 }}>
            The stretch of Gulf-front beach directly in front of Phoenix V is private resort beach.
            Chairs and umbrellas are available for rent from vendors on the beach. You walk out the
            lobby door and step directly onto the sand. It's as easy as a beach vacation gets.
          </p>
          <h3>Perdido Key (nearby)</h3>
          <p style={{ lineHeight: 1.9, color: 'var(--muted)' }}>
            Cross the state line into Florida and you'll find Perdido Key — another exceptional stretch
            of white sand with even fewer crowds. Johnson Beach (part of Gulf Islands National Seashore)
            is one of the most pristine in the region and worth visiting at least once.
          </p>
        </div>
        <div style={{ textAlign: 'right', maxWidth: 900, margin: '20px auto 0' }}>
          <a href="/orange-beach-beaches">More about Orange Beach beaches →</a>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">DINING</div>
            <h2>Where to eat.</h2>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h3>Seafood & Gulf-fresh</h3>
          <p style={{ lineHeight: 1.9, color: 'var(--muted)', marginBottom: 20 }}>
            <strong>The Gulf</strong> on the Orange Beach Marina is the gold standard for Gulf-fresh seafood.
            Oysters, shrimp, grouper — prepare yourself for excellent food in a casual waterfront setting.
            Go for lunch to avoid the dinner wait. <strong>Fisher's at Orange Beach Marina</strong> upstairs
            is a step up for a nicer evening meal.
          </p>
          <h3>Family favorites</h3>
          <p style={{ lineHeight: 1.9, color: 'var(--muted)', marginBottom: 20 }}>
            <strong>LuLu's</strong> (owned by Jimmy Buffett's sister) is the definitive family dining experience
            on the Gulf Coast — sandy floors, live music, kids' activities on the lawn, good food, and
            consistently chaotic in the best way. Plan for a wait. It's worth it.
          </p>
          <h3>Quick meals & breakfast</h3>
          <p style={{ lineHeight: 1.9, color: 'var(--muted)' }}>
            Stock the condo kitchen at Publix on Canal Road for breakfasts and easy lunches — you'll save
            significantly versus eating out three times a day. For a beach morning breakfast,
            <strong> Wolf Bay Lodge</strong> does a solid job.
          </p>
        </div>
        <div style={{ textAlign: 'right', maxWidth: 900, margin: '20px auto 0' }}>
          <a href="/orange-beach-restaurants">Full restaurant guide →</a>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">ACTIVITIES</div>
            <h2>Things to do.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          <div className="amenity-category-card">
            <h3>Dolphin cruises</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>Multiple operators run 90-minute dolphin tours out of the Orange Beach Marina and The Wharf. Nearly guaranteed sightings — wild dolphins follow the boats.</p>
          </div>
          <div className="amenity-category-card">
            <h3>Fishing</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>Charter deep-sea fishing for red snapper, grouper, and amberjack. The Gulf State Park Pier is free for guests — great for flounder, speckled trout, and cobia.</p>
          </div>
          <div className="amenity-category-card">
            <h3>Gulf State Park</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>2 miles east of Phoenix V. 28 miles of hiking and biking trails, nature center, canoe/kayak launches, and the Gulf's best beach pier. Also a great place to see wildlife without going far.</p>
          </div>
          <div className="amenity-category-card">
            <h3>The Wharf</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>6 miles west — shopping, restaurants, an observation wheel, a movie theater, mini-golf, and a marina amphitheater with regular concerts. Good for a rainy afternoon or an evening out.</p>
          </div>
          <div className="amenity-category-card">
            <h3>Water sports</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>Parasailing, jet ski rentals, paddleboard, and kayak rentals are available directly on the beach in front of Phoenix V and at several nearby marinas.</p>
          </div>
          <div className="amenity-category-card">
            <h3>Flora-Bama Lounge</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>8 miles east at the Alabama-Florida line — a legendary Gulf Coast landmark. Live music, oyster bar, and a rambling collection of bars and stages. A must-visit at least once.</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', maxWidth: 900, margin: '20px auto 0' }}>
          <a href="/things-to-do-orange-beach">Full things-to-do guide →</a>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">PRACTICAL TIPS</div>
            <h2>Before you arrive.</h2>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            <div className="amenity-category-card">
              <h3>Getting there</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>Pensacola International (PNS) is the closest major airport — about 45 minutes from Phoenix V. Mobile Regional (MOB) is about 90 minutes. Car rental is essentially required.</p>
            </div>
            <div className="amenity-category-card">
              <h3>Best time to visit</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>June–August is peak season — warmest water, most activities open. May and September offer excellent weather with smaller crowds. October–November is underrated for mild temperatures and quiet beaches.</p>
            </div>
            <div className="amenity-category-card">
              <h3>Grocery shopping</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>Publix on Canal Road is the primary grocery store — about 10 minutes from Phoenix V. Stock up on arrival for breakfasts and lunches. Winn-Dixie and Walmart are also in the area.</p>
            </div>
            <div className="amenity-category-card">
              <h3>Beach essentials</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>Reef-safe sunscreen is appreciated. The sun on white quartz sand is intense — stronger than you think. Beach chairs and umbrella rentals are available on the beach in front of Phoenix V.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section book-direct">
        <div>
          <div className="eyebrow">STAY IN ORANGE BEACH</div>
          <h2>Book Coastal Haven at Phoenix V.</h2>
          <p>A Gulf-front 3-bedroom condo — direct beach access, stunning views, and everything you need for a family beach vacation.</p>
        </div>
        <a className="btn light" href="/book">Check Availability</a>
      </section>
    </main>
    <Footer />
  </>;
}
