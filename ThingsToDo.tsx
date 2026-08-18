import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

export default function ThingsToDo() {
  return <>
    <SEOMeta
      title="Best Things to Do in Orange Beach Alabama | Local Guide"
      description="The best activities in Orange Beach, Alabama — dolphin cruises, deep-sea fishing, Gulf State Park, water sports, The Wharf, restaurants, and family fun on the Alabama Gulf Coast."
      canonical="/things-to-do-orange-beach"
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <a href="/orange-beach-guide">Orange Beach Guide</a> <span>›</span> <span>Things To Do</span>
        </nav>
        <div className="eyebrow dark">ORANGE BEACH, ALABAMA</div>
        <h1>Things To Do in Orange Beach</h1>
        <p>From dolphin cruises to deep-sea fishing to Gulf State Park — the best activities on the Alabama Gulf Coast.</p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">ON THE WATER</div>
            <h2>Water activities.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { title: 'Dolphin Cruises', body: 'Multiple operators run 90-minute dolphin sighting tours out of the Orange Beach Marina and The Wharf. The Gulf dolphins are friendly and close — sightings are nearly guaranteed on most trips. Great for kids. Book in advance during summer.' },
            { title: 'Deep-Sea Fishing', body: 'Orange Beach is one of the premier sport-fishing destinations on the Gulf Coast. Half-day and full-day charters target red snapper, grouper, amberjack, and mahi-mahi. Multiple charter companies operate from the marina.' },
            { title: 'Gulf State Park Pier', body: 'At 1,540 feet, the Gulf State Park pier is one of the longest on the Gulf. Fishing is excellent for cobia, flounder, and king mackerel. Entry fee is minimal. No charter booking needed — bring your own gear or rent on site.' },
            { title: 'Parasailing', body: 'Parasailing operators set up directly on the beach at Phoenix V and several nearby beach access points. Most offer tandem flights for up to two riders — a memorable experience 400 feet above the Gulf.' },
            { title: 'Paddleboard & Kayak', body: 'Calm morning water in the Gulf or in the back bays and bayous is ideal for paddleboarding and kayaking. Rentals are available near Phoenix V and through several waterfront outfitters.' },
            { title: 'Jet Ski Rentals', body: 'Jet ski rentals are available on the beach throughout the summer season. Most rental spots are within walking distance of Phoenix V. Age restrictions apply and a brief orientation is required.' },
          ].map(({ title, body }) => (
            <article key={title} className="amenity-category-card">
              <h3>{title}</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">NATURE & OUTDOORS</div>
            <h2>Gulf State Park.</h2>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 18, lineHeight: 1.9 }}>
            Gulf State Park, 2 miles east of Phoenix V, is one of the best state parks on the Gulf Coast.
            The 6,000-acre park includes 28 miles of paved trails for hiking and biking (rental bikes available),
            a nature center with live sea turtle exhibits, multiple kayak/canoe launch points on brackish back bays,
            freshwater lake fishing, and one of the most pristine stretches of Gulf-front beach in Alabama.
          </p>
          <p style={{ lineHeight: 1.9, color: 'var(--muted)' }}>
            The 1,540-foot fishing pier is accessible from within the park. The park's Hugh S. Branyon Backcountry
            Trail is excellent for morning or evening rides when the beach is crowded. Keep an eye out for
            alligators in the back lake — they are present and occasionally visible from the trail.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">ENTERTAINMENT & SHOPPING</div>
            <h2>The Wharf & beyond.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { title: 'The Wharf', body: 'The main entertainment hub — 6 miles west of Phoenix V on Canal Road. Features an amphitheater with summer concerts, a 112-foot observation wheel, mini-golf, restaurants, bars, a movie theater, and a marina. Good for an evening or a rainy afternoon.' },
            { title: 'Flora-Bama Lounge', body: 'At the Alabama-Florida state line, 8 miles east of Phoenix V. A legendary Gulf Coast institution with live music most nights, an oyster bar, multiple bars, and a rambling, ramshackle character that you cannot replicate. At least one visit is required.' },
            { title: 'Tanger Outlets', body: '15 miles west in Foley, the Tanger Outlets is a full-size outlet mall with 100+ stores. Worth a trip if the group needs a shopping day or if rain keeps you off the beach.' },
            { title: 'OWA Parks & Resort', body: 'In Foley (about 20 minutes west), OWA is a family entertainment complex with an amusement park, mini-golf, go-karts, laser tag, restaurants, and more. Good as a full-day alternative for kids.' },
          ].map(({ title, body }) => (
            <article key={title} className="amenity-category-card">
              <h3>{title}</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section sand">
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="eyebrow dark">STAY AT COASTAL HAVEN</div>
          <h2>The perfect base for Orange Beach exploration.</h2>
          <p style={{ marginBottom: 24 }}>Book Coastal Haven at Phoenix V — Gulf-front, direct beach access, and close to everything on this list.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a className="btn" href="/book">Check Availability</a>
            <a className="btn light" href="/orange-beach-guide" style={{ color: 'var(--teal)', border: '1px solid var(--teal)' }}>Full Orange Beach Guide</a>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
