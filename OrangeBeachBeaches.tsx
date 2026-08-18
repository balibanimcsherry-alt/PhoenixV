import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import { PROPERTY } from './property';

const BEACHES = [
  {
    name: 'Phoenix V Beach (In Front of the Resort)',
    distance: 'Steps from the lobby',
    description: 'The private beachfront directly in front of Phoenix V is less crowded than the public beach strips. Wide white sand, clear Gulf water, and beach chair and umbrella rentals available from vendors on the sand. The easiest beach day you\'ll have — walk out of the elevator and you\'re there.',
    highlights: ['Direct resort access', 'Beach chair & umbrella rentals', 'Outdoor showers', 'Less crowded than public strips'],
  },
  {
    name: 'Gulf State Park Beach',
    distance: 'About 2 miles east',
    description: 'Gulf State Park\'s Gulf-front beach stretches for more than 2 miles and is one of the most pristine on the Alabama coast. The park setting means fewer vendors and umbrellas — families who want space and a more natural setting prefer it. The 1,540-foot fishing pier is adjacent to the park beach.',
    highlights: ['2+ miles of beach', 'Less commercial than resort strips', 'Near the fishing pier', 'Paved bike trail access'],
  },
  {
    name: 'Orange Beach Public Beach',
    distance: 'About 3–4 miles west',
    description: 'The main public beach access point for Orange Beach has ample parking and full facilities. Gets busy in peak summer but is one of the better-maintained public beach parks on the Gulf Coast. Restrooms, showers, and picnic facilities available.',
    highlights: ['Public parking available', 'Full restroom facilities', 'Picnic areas', 'Lifeguards in summer'],
  },
  {
    name: 'Gulf Shores Public Beach',
    distance: 'About 9–10 miles west',
    description: 'The main Gulf Shores beach strip is the most commercial on the Alabama coast — busiest in summer, but also has the most beach equipment rentals and nearby food options. Worth a visit for a change of scenery, but most families prefer the quieter beaches closer to Phoenix V.',
    highlights: ['Many nearby restaurants', 'Beach equipment rentals', 'High summer activity', 'Close to Gulf Shores Boardwalk area'],
  },
];

export default function OrangeBeachBeaches() {
  return <>
    <SEOMeta
      title="Orange Beach Beaches Guide | Near Coastal Haven at Phoenix V"
      description="The best beaches near Phoenix V in Orange Beach, Alabama — from the resort's private beachfront to Gulf State Park. A practical guide for families staying at Coastal Haven."
      canonical="/orange-beach-beaches"
      schema={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Orange Beach Beaches Guide',
        description: 'The best beaches near Phoenix V in Orange Beach, Alabama',
        url: `${PROPERTY.domain}/orange-beach-beaches`,
        author: { '@type': 'Organization', name: PROPERTY.name, url: PROPERTY.domain },
        publisher: { '@type': 'Organization', name: PROPERTY.name, url: PROPERTY.domain },
      }}
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <a href="/orange-beach-guide">Orange Beach Guide</a> <span>›</span> <span>Beaches</span>
        </nav>
        <div className="eyebrow dark">ORANGE BEACH, ALABAMA</div>
        <h1>Orange Beach Beaches — A Practical Guide</h1>
        <p>Sugar-white sand, clear Gulf water, and multiple beach options within minutes of Phoenix V.</p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">BEACH ACCESS</div>
            <h2>The Gulf is outside your door.</h2>
          </div>
          <p>Staying at Coastal Haven means direct beachfront access. But here are the other beaches worth knowing about during your stay.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 32 }}>
          {BEACHES.map(beach => (
            <article key={beach.name} style={{ background: 'var(--white)', borderRadius: 16, padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--cloud)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: 'var(--ink)', fontSize: '1.2rem' }}>{beach.name}</h3>
                <span style={{ background: 'var(--sand)', color: 'var(--ink)', borderRadius: 999, padding: '4px 14px', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{beach.distance}</span>
              </div>
              <p style={{ color: 'var(--ink)', lineHeight: 1.7, marginBottom: 16 }}>{beach.description}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {beach.highlights.map(h => (
                  <li key={h} style={{ background: 'var(--teal)', color: '#fff', borderRadius: 999, padding: '4px 14px', fontSize: '0.82rem', fontWeight: 600 }}>✓ {h}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">BEACH TIPS</div>
            <h2>Make the most of your beach days.</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 24 }}>
          {[
            ['Sun Protection', 'The sun reflecting off white quartz sand is significantly stronger than most beaches. Pack reef-safe sunscreen and reapply every 90 minutes. Rash guards for kids are worth the extra weight in luggage.'],
            ['Stingrays', 'Shuffle your feet when entering the Gulf — this gives stingrays time to move out of the way. Most stings happen when people step directly onto a resting ray.'],
            ['Beach Gear', 'Phoenix V has outdoor showers. Beach chair and umbrella rentals are available from vendors on the resort beach. Publix on Canal Road (10 min away) sells beach gear at reasonable prices.'],
            ['Water Conditions', 'Check the colored flag system before entering the water. Green = low hazard, Yellow = medium, Red = high, Double Red = water closed. The flag is posted at Phoenix V\'s beach access.'],
          ].map(([title, text]) => (
            <div key={title as string} style={{ background: 'var(--white)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ marginTop: 0, color: 'var(--teal)' }}>{title}</h3>
              <p style={{ margin: 0, color: 'var(--ink)', lineHeight: 1.7 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="/things-to-do-orange-beach" className="btn light">Things To Do</a>
          <a href="/orange-beach-guide" className="btn light">Orange Beach Guide</a>
          <a href="/book" className="btn">Check Availability</a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
