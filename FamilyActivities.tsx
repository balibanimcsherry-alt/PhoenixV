import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import { PROPERTY } from './property';

const ACTIVITIES = [
  {
    category: 'On the Water',
    items: [
      {
        name: 'Dolphin Cruises',
        description: 'The 90-minute dolphin sighting tours out of the Orange Beach Marina are a hit with kids of all ages. Wild dolphin sightings are nearly guaranteed. Book morning or afternoon departures — reserve early in June, July, and August.',
        age: 'All ages',
        tip: 'Book early in the trip so you have backup days if weather cancels.',
      },
      {
        name: 'Parasailing',
        description: 'Operators set up directly on the beach near Phoenix V. Tandem rides let parents and kids go up together. 400 feet above the Gulf is a perspective families remember for years.',
        age: 'Most operators: 6+ and 40+ lbs',
        tip: 'Go earlier in the day when Gulf winds are calmer.',
      },
      {
        name: 'Kayaking & Paddleboarding',
        description: 'The calm back bays and bayous behind the island are perfect for kayaking with kids. Multiple rental outfitters are nearby. Paddleboarding on the Gulf is also popular from the resort beach.',
        age: 'Kayaking: 5+, Paddleboarding: 8+',
        tip: 'Back bay kayaking is calmer and better for younger kids than Gulf paddleboarding.',
      },
      {
        name: 'Fishing Charters',
        description: 'Half-day and full-day fishing charters operate from the Orange Beach Marina. Bottom fishing and inshore trips are appropriate for families with kids. The 1,540-foot pier at Gulf State Park is free and great for beginners.',
        age: 'All ages (pier fishing); 6+ (charters)',
        tip: 'Pack motion sickness medication — Gulf charters can get rough.',
      },
    ],
  },
  {
    category: 'At the Resort',
    items: [
      {
        name: 'Phoenix V Splash Pad & Pools',
        description: 'Kids get their own splash pad while the rest of the family enjoys the outdoor pools and Gulf-view hot tub. The indoor heated pool is open year-round — perfect for rainy days or cooler months.',
        age: 'All ages',
        tip: 'Indoor pool is a great backup when afternoon storms roll in during summer.',
      },
      {
        name: 'Beach Chair & Umbrella Rentals',
        description: 'Vendors on the resort beach rent chairs and umbrellas daily. No need to haul gear — set up in minutes and you\'re ready. The beach in front of Phoenix V is less crowded than the main public strips.',
        age: 'All ages',
        tip: 'Reserve early in the morning during peak summer weeks.',
      },
    ],
  },
  {
    category: 'Nearby Attractions',
    items: [
      {
        name: 'Gulf State Park',
        distance: '2 miles east',
        description: 'The nature center has live sea turtle exhibits that kids love. 28 miles of paved trails are perfect for a morning bike ride (bike rentals at the park entrance). The fishing pier and pristine park beach round out a full-day option.',
        age: 'All ages',
        tip: 'Rent bikes at the park entrance for a 2-hour morning ride before the beach gets hot.',
      },
      {
        name: 'The Wharf',
        distance: '6 miles west',
        description: 'The family fallback for afternoon activities. An observation wheel, mini-golf, arcade, multiple family restaurants, and a waterfront amphitheater with summer concerts. Good for a half-day, especially when afternoon rain appears.',
        age: 'All ages',
        tip: 'Perfect for the "we need to get off the beach" afternoon — happens every trip.',
      },
      {
        name: 'Alabama Gulf Coast Zoo',
        distance: 'About 10 miles west in Gulf Shores',
        description: 'A smaller zoo with a hands-on experience many families prefer over large zoos. Kids can get close to the animals. Worth a half-morning, especially for younger children.',
        age: 'Best for under 12',
        tip: 'Check hours ahead — the zoo can close early on hot summer days.',
      },
      {
        name: 'Waterville USA',
        distance: 'About 10 miles west in Gulf Shores',
        description: 'A water park and amusement park in Gulf Shores. Multiple water slides, a wave pool, and rides. A solid choice for older kids who want thrills beyond the beach.',
        age: 'Best for 5+',
        tip: 'Pick a day early in the week — weekends and Fridays are significantly more crowded.',
      },
    ],
  },
];

export default function FamilyActivities() {
  return <>
    <SEOMeta
      title="Family Activities in Orange Beach, Alabama | Near Coastal Haven"
      description="The best family activities in Orange Beach, AL — dolphin cruises, Gulf State Park, The Wharf, parasailing, and more. A practical guide for families staying near Phoenix V."
      canonical="/family-activities-orange-beach"
      schema={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Family Activities in Orange Beach, Alabama',
        description: 'The best family activities near Phoenix V in Orange Beach',
        url: `${PROPERTY.domain}/family-activities-orange-beach`,
        author: { '@type': 'Organization', name: PROPERTY.name, url: PROPERTY.domain },
        publisher: { '@type': 'Organization', name: PROPERTY.name, url: PROPERTY.domain },
      }}
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <a href="/things-to-do-orange-beach">Things To Do</a> <span>›</span> <span>Family Activities</span>
        </nav>
        <div className="eyebrow dark">ORANGE BEACH, ALABAMA</div>
        <h1>Family Activities in Orange Beach</h1>
        <p>Fill an entire week without repeating yourself — from dolphin cruises to Gulf State Park to The Wharf.</p>
      </section>

      <section className="section">
        {ACTIVITIES.map(group => (
          <div key={group.category} style={{ marginBottom: 56 }}>
            <h2 style={{ color: 'var(--teal)', borderBottom: '2px solid var(--sand)', paddingBottom: 12, marginBottom: 24 }}>{group.category}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {group.items.map(item => (
                <article key={item.name} style={{ background: 'var(--white)', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--cloud)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>{item.name}</h3>
                    {'distance' in item && (
                      <span style={{ background: 'var(--sand)', borderRadius: 999, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--ink)' }}>{(item as { distance: string }).distance}</span>
                    )}
                  </div>
                  <p style={{ color: 'var(--ink)', lineHeight: 1.7, marginBottom: 14 }}>{item.description}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--teal)', fontWeight: 600 }}>Ages: {item.age}</span>
                    <span style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>Tip: {item.tip}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="section book-direct">
        <div>
          <div className="eyebrow">STAY IN THE MIDDLE OF IT ALL</div>
          <h2>Book Coastal Haven.</h2>
          <p>Direct beach access, resort pools and splash pad, and 10 minutes from The Wharf — everything your family needs without the car time.</p>
        </div>
        <a className="btn light" href="/book">Check Availability</a>
      </section>
    </main>
    <Footer />
  </>;
}
