import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

export default function About() {
  return <>
    <SEOMeta
      title="About Coastal Haven | Orange Beach Condo Direct Booking"
      description="Coastal Haven is a privately owned 3-bedroom Gulf-front condo at Phoenix V in Orange Beach, Alabama. Learn about the property and why guests love booking direct."
      canonical="/about"
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>About</span>
        </nav>
        <div className="eyebrow dark">THE STORY BEHIND THE CONDO</div>
        <h1>About Coastal Haven</h1>
        <p>A Gulf-front condo in Orange Beach, Alabama — privately owned and carefully maintained.</p>
      </section>

      <section className="section split-section">
        <div className="split-copy">
          <div className="eyebrow dark">COASTAL HAVEN</div>
          <h2>A genuine family beach home.</h2>
          <p>
            Coastal Haven is a privately owned 3-bedroom, 2-bathroom condominium on the 14th floor
            of Phoenix V at 24400 Perdido Beach Blvd in Orange Beach, Alabama. The unit faces
            directly south over the Gulf of Mexico, with an unobstructed balcony view that stretches
            as far as you can see.
          </p>
          <p>
            Phoenix V is a well-maintained full-service beachfront resort with direct Gulf access,
            a heated indoor pool, outdoor pools, a hot tub, splash pad, fitness center, tennis,
            and covered parking. The resort's family-oriented design makes it a natural choice
            for multi-generational trips.
          </p>
          <p>
            Coastal Haven is listed on Airbnb and Vrbo, but guests who book directly on this
            website skip the OTA service fees. The booking process is the same — secure checkout,
            instant confirmation when available, and direct communication with the owner.
          </p>
        </div>
        <img src="/images/living-ocean.jpg" alt="Oceanfront living room at Coastal Haven, Orange Beach Alabama" />
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">WHY BOOK DIRECT</div>
            <h2>The advantages of booking with us.</h2>
          </div>
        </div>
        <div className="amenity-feature-grid">
          <article>
            <h3>No OTA service fees</h3>
            <p>When you book directly, you avoid the marketplace service fees Airbnb and Vrbo add on top of the base rate. That savings goes to you.</p>
          </article>
          <article>
            <h3>Direct communication</h3>
            <p>Questions before you book? Message the owner directly. After booking, you communicate without going through a platform.</p>
          </article>
          <article>
            <h3>Transparent pricing</h3>
            <p>Nightly rate, cleaning fee, and taxes are shown clearly before you commit. No hidden charges at the last step.</p>
          </article>
          <article>
            <h3>Secure checkout</h3>
            <p>Direct bookings use Stripe, the same payment processor used by major travel brands. Card data never touches our servers.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow dark">THE PROPERTY</div>
            <h2>What's in the unit.</h2>
          </div>
        </div>
        <div className="amenity-feature-grid">
          <article>
            <h3>Bedrooms & sleeping</h3>
            <p>3 bedrooms with 4 beds total, sleeping up to 10 guests. The primary suite opens directly to the Gulf-facing balcony.</p>
          </article>
          <article>
            <h3>Kitchen & dining</h3>
            <p>Fully equipped kitchen with a full appliance suite, cookware, dishes, and seating for the whole family. No need to eat out every meal.</p>
          </article>
          <article>
            <h3>Living spaces</h3>
            <p>An open living room keeps the group together without feeling crowded. Gulf views from the main living area and primary suite.</p>
          </article>
          <article>
            <h3>In-unit conveniences</h3>
            <p>Full-size washer and dryer, fast Wi-Fi, and a Smart TV mean you don't have to pack everything — or stay offline.</p>
          </article>
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a className="btn" href="/book">Check Availability</a>
          <a className="btn light" href="/orange-beach-condo" style={{ marginLeft: 12 }}>Full Property Details</a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
