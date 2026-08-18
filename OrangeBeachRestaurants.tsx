import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

const RESTAURANTS = [
  {
    category: 'Seafood',
    items: [
      { name: 'The Gulf', desc: 'The top seafood destination in Orange Beach. On the marina — oysters, Gulf-fresh fish, crab, and an excellent cocktail program. Outdoor seating with waterfront views. Expect a wait at dinner.' },
      { name: "Fisher's at Orange Beach Marina", desc: 'Upstairs from The Gulf — more upscale, perfect for a nicer dinner. Elevated Gulf Coast seafood with marina views.' },
    ],
  },
  {
    category: 'Family Dining',
    items: [
      { name: "LuLu's", desc: "Jimmy Buffett's sister's restaurant on the Intracoastal Waterway — sandy floors, live music, kids' games on the lawn, great food, and a chaotic good energy. One of the most popular spots in Orange Beach. Plan for a wait." },
      { name: 'Wolf Bay Lodge', desc: 'Casual family spot known for seafood and Southern comfort food. A solid local choice away from the tourist-heavy waterfront.' },
    ],
  },
  {
    category: 'Waterfront / Date Night',
    items: [
      { name: 'Cobalt the Restaurant', desc: 'At The Wharf — upscale waterfront dining with Gulf-view terrace seating. Good for a special evening meal. Reservations recommended.' },
      { name: 'Ginny Lane Bar & Grill', desc: 'Great waterfront views, solid Gulf Coast menu, and a livelier bar scene. On the water and consistent.' },
    ],
  },
  {
    category: 'Casual & Quick',
    items: [
      { name: 'Tacky Jacks', desc: 'Open-air casual spot on the water. Grouper sandwiches, burgers, and cold drinks. The kind of place you pull into still wearing sandy shoes.' },
      { name: 'Live Bait', desc: 'On the Perdido Pass — fish sandwiches, cold beer, and a laid-back Gulf Coast vibe. Good for lunch after a beach morning.' },
    ],
  },
];

export default function OrangeBeachRestaurants() {
  return <>
    <SEOMeta
      title="Best Restaurants in Orange Beach Alabama | Dining Guide"
      description="The best restaurants in Orange Beach, Alabama — seafood, family dining, waterfront spots, and local favorites near Phoenix V on the Alabama Gulf Coast."
      canonical="/orange-beach-restaurants"
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <a href="/orange-beach-guide">Orange Beach Guide</a> <span>›</span> <span>Restaurants</span>
        </nav>
        <div className="eyebrow dark">ORANGE BEACH DINING</div>
        <h1>Best Restaurants in Orange Beach</h1>
        <p>Gulf-fresh seafood, family favorites, waterfront dining, and local spots worth finding — near Phoenix V on the Alabama Gulf Coast.</p>
      </section>

      {RESTAURANTS.map(({ category, items }) => (
        <section key={category} className="section">
          <div className="eyebrow dark">{category.toUpperCase()}</div>
          <h2>{category}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginTop: 24 }}>
            {items.map(({ name, desc }) => (
              <article key={name} className="amenity-category-card">
                <h3>{name}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{desc}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="section sand">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2>Practical dining tips</h2>
          <ul style={{ lineHeight: 2.2, color: 'var(--muted)' }}>
            <li>Most popular spots have hour-long waits during peak summer evenings. Arrive before 6pm or after 8pm.</li>
            <li>Stock the Coastal Haven kitchen at Publix on Canal Road for breakfasts and lunches — you'll save significantly.</li>
            <li>The marina area (Orange Beach Marina off Canal Road) has the best concentration of quality seafood restaurants.</li>
            <li>LuLu's is worth going to once regardless of the wait — it's a Gulf Coast experience, not just a meal.</li>
            <li>Check OpenTable or Resy for reservations at upscale spots like Fisher's and Cobalt to avoid waiting.</li>
          </ul>
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <a className="btn" href="/book">Book Coastal Haven</a>
            <a className="btn light" href="/things-to-do-orange-beach" style={{ marginLeft: 12, color: 'var(--teal)', border: '1px solid var(--teal)' }}>Things To Do</a>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
