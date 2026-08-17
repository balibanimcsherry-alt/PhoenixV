import { Waves, BedDouble, Bath, Users, MapPin, Heart, ShieldCheck, Star, Utensils, Baby, Dumbbell, Flame, Wifi, Car } from 'lucide-react';
import Header from './Header';
import BookingBar from './BookingBar';
import ChatWidget from './ChatWidget';
import WeatherWidget from './WeatherWidget';
import { amenities, gallery, reviews } from './content';

export default function Home(){
  return <div><Header/>
    <main>
      <section className="hero">
        <img src="/images/balcony.jpg" alt="Gulf-front balcony at Coastal Haven" className="hero-img-base"/>
        <div className="hero-shade"/>
        <div className="hero-copy"><div className="eyebrow">PHOENIX V • ORANGE BEACH, ALABAMA</div><h1>Your family’s Gulf-front escape.</h1><p>Wake up above the sugar-white sand in a relaxed 14th-floor coastal condo made for reconnecting, unwinding and making beach memories.</p><div className="hero-pills"><span><BedDouble/>3 bedrooms</span><span><Bath/>2 baths</span><span><Users/>Up to 10 guests</span><span><Waves/>Oceanfront</span></div></div>
<BookingBar/>
      </section>

      <WeatherWidget/>

      <section className="trust-strip"><div><Star/>Guest favorite</div><div><ShieldCheck/>Professionally cleaned</div><div><Heart/>Family focused</div><div><MapPin/>Direct beach access</div></section>

      <section id="stay" className="split-section"><div className="split-copy"><div className="eyebrow dark">COASTAL HAVEN</div><h2>Country-coastal comfort, right on the Gulf.</h2><p>Coastal Haven is a spacious 3-bedroom, 2-bath oceanfront condo at Phoenix V. The primary suite opens to the balcony, the kitchen is ready for family meals, and the open living room keeps everyone together without feeling crowded.</p><div className="stat-grid"><div><strong>14th</strong><span>floor</span></div><div><strong>3</strong><span>bedrooms</span></div><div><strong>4</strong><span>beds</span></div><div><strong>10</strong><span>max guests</span></div></div></div><img src="/images/living-ocean.jpg" alt="Living room with Gulf view"/></section>

      <section id="amenities" className="section sand"><div className="section-head"><div><div className="eyebrow dark">RESORT DAYS, EASY NIGHTS</div><h2>Everything families want in one place.</h2></div><p>Beach time, pool time, quiet mornings and easy dinners — without getting back in the car.</p></div>
        <div className="amenity-feature-grid"><article><Baby/><h3>Made for families</h3><p>Splash pad, shallow play areas and roomy living spaces.</p></article><article><Waves/><h3>Steps from the sand</h3><p>Direct beachfront access and outdoor showers.</p></article><article><Dumbbell/><h3>Stay active</h3><p>Fitness center, tennis, racquetball and sauna.</p></article><article><Flame/><h3>Slow evenings</h3><p>Hot tubs, grills and a private balcony above the Gulf.</p></article></div>
        <div className="amenities-list">{amenities.map(x=><span key={x}>✓ {x}</span>)}</div>
      </section>

      <section id="gallery" className="section"><div className="section-head"><div><div className="eyebrow dark">TAKE A LOOK AROUND</div><h2>Bright, relaxed and unmistakably coastal.</h2></div></div><div className="gallery-grid">{gallery.map(([src,alt],i)=><figure key={src} className={i===0?'wide':''}><img src={src} alt={alt}/><figcaption>{alt}</figcaption></figure>)}</div></section>

      <section className="section book-direct"><div><div className="eyebrow">BOOK DIRECT</div><h2>More beach. Less booking fee.</h2><p>Direct website rates are designed to be about 10% below comparable Airbnb pricing when enabled by the owner. Exact totals, taxes and fees are shown before checkout.</p></div><a className="btn light" href="/book">See your dates</a></section>

      <section id="reviews" className="section"><div className="section-head"><div><div className="eyebrow dark">GUEST LOVE</div><h2>Easy stays make the best memories.</h2></div></div><div className="review-grid">{reviews.map(r=><article key={r.source}><div className="stars">★★★★★</div><blockquote>{r.text}</blockquote><div><strong>{r.source}</strong><span>{r.rating}</span></div></article>)}</div></section>

      <section id="guide" className="section guide"><div className="guide-image"><img src="/images/coast.jpg" alt="Orange Beach coastline"/></div><div className="guide-copy"><div className="eyebrow dark">ORANGE BEACH, ALABAMA</div><h2>Your Gulf Coast days, planned.</h2><p>Walk the beach at sunrise, explore Gulf State Park, book a dolphin cruise, spend an evening at The Wharf, or keep it simple with seafood and sunset close to home.</p><div className="guide-tags"><span><Utensils/>Local seafood</span><span><Waves/>Dolphin cruises</span><span><Car/>The Wharf</span><span><Wifi/>Easy planning</span></div><p className="small-note">Guests receive a more detailed arrival guide after booking. The exact unit address is shared only with confirmed guests.</p></div></section>

      <section className="section webcam-section">
        <div className="section-head"><div><div className="eyebrow dark">LIVE FROM THE BEACH</div><h2>See the Gulf right now.</h2></div><p>Watch the waves live from Perdido Beach Blvd in Orange Beach — just minutes from Coastal Haven.</p></div>
        <div className="webcam-wrap">
          <iframe
            src="https://www.youtube.com/embed/5Ijk8QsR-nw?autoplay=1&mute=1&loop=1&playlist=5Ijk8QsR-nw"
            title="Live Orange Beach Webcam"
            className="webcam-iframe"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      </section>

      <section className="section faq"><div className="section-head"><div><div className="eyebrow dark">GOOD TO KNOW</div><h2>Simple answers before you book.</h2></div></div>{[
        ['What time is check-in and checkout?','Check-in begins at 4:00 PM. Checkout is by 10:00 AM.'],
        ['Is parking included?','Phoenix V requires a paid parking pass. Current listing guidance is $55 per vehicle, typically limited to two vehicles per reservation.'],
        ['Can we bring pets?','No. Phoenix V HOA rules do not allow pets for this rental.'],
        ['Are parties or smoking allowed?','No parties and no smoking. Quiet hours are 10 PM–8 AM.'],
        ['How old do I need to be to book?','The primary renter must be at least 25.'],
        ['Is the condo directly on the beach?','Yes. Phoenix V has direct beach access, and Coastal Haven has an unobstructed Gulf-facing balcony.']
      ].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
      <section className="section map-section">
        <div className="section-head"><div><div className="eyebrow dark">FIND US</div><h2>Phoenix V, Orange Beach.</h2></div><p>26802 Perdido Beach Blvd, Unit 1506 · Orange Beach, AL 36561. Right on the Gulf with direct beach access.</p></div>
        <div className="map-wrap">
          <iframe
            title="Phoenix V location"
            src="https://maps.google.com/maps?q=26802+Perdido+Beach+Blvd+Orange+Beach+AL+36561&t=k&z=15&output=embed"
            className="map-iframe"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </main>
    <footer><img src="/logo.svg"/><p>Coastal Haven • Phoenix V • Orange Beach, Alabama</p><p><a href="mailto:stay@orangebeachstay.com">stay@orangebeachstay.com</a></p><small>© {new Date().getFullYear()} Coastal Haven. Exact address and unit details are provided after confirmed booking.</small></footer>
    <BookingBar floating/><ChatWidget/>
  </div>
}
