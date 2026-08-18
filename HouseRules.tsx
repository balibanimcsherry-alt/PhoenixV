import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

const RULES = [
  {
    category: 'Check-in & Check-out',
    icon: '🕓',
    items: [
      'Check-in begins at 4:00 PM Central Time. Early check-in is not guaranteed and must be arranged in advance.',
      'Check-out is by 10:00 AM Central Time. Late check-out is not guaranteed and must be arranged in advance.',
      'The primary renter must be at least 25 years old and present for the duration of the stay.',
      'Door code and check-in instructions are sent 48 hours before your arrival date.',
    ],
  },
  {
    category: 'Guests & Occupancy',
    icon: '👥',
    items: [
      'Maximum occupancy is 10 guests. This includes children of all ages.',
      'Only registered guests may stay overnight. Day visitors are permitted but must not exceed the total occupancy limit at any time.',
      'The name and contact information of the primary guest must be accurate at the time of booking.',
    ],
  },
  {
    category: 'Noise & Neighbors',
    icon: '🔇',
    items: [
      'Quiet hours are 10:00 PM to 8:00 AM. During quiet hours, noise must not be audible from neighboring units.',
      'Parties, events, and gatherings beyond the registered guest count are strictly prohibited.',
      'Music and TV volume must be kept at a reasonable level at all times — including during the day.',
      'Phoenix V is a residential building. Please be courteous to neighbors in the hallways, elevator, and shared spaces.',
    ],
  },
  {
    category: 'Smoking',
    icon: '🚭',
    items: [
      'Smoking of any kind — including cigarettes, cigars, vaping, and marijuana — is strictly prohibited inside the unit.',
      'Smoking on the balcony is not permitted, as smoke enters neighboring units and the building hallways.',
      'A deep-cleaning fee of $500 will be charged if evidence of smoking inside the unit is found.',
      'Designated smoking areas, if any, are on the ground level per Phoenix V HOA rules.',
    ],
  },
  {
    category: 'Pets',
    icon: '🐾',
    items: [
      'No pets of any kind are permitted. This is a Phoenix V HOA rule that applies to all rental units in the building.',
      'Bringing an undisclosed pet may result in immediate termination of the stay without refund and an additional cleaning fee.',
      'Service animals with proper documentation may be accommodated — contact us before booking.',
    ],
  },
  {
    category: 'The Unit',
    icon: '🏠',
    items: [
      'Treat the unit and its contents with care. Report any damage or maintenance issues promptly.',
      'Do not rearrange or remove furniture from the unit. Balcony furniture must remain on the balcony.',
      'Do not remove linens, towels, or kitchen items from the unit.',
      'The balcony is for relaxation. Do not hang towels, laundry, or other items over the railing.',
      'Do not prop open the unit door or the building entry doors.',
    ],
  },
  {
    category: 'Kitchen & Cooking',
    icon: '🍳',
    items: [
      'The kitchen is fully equipped for cooking. Please clean up after use — dishes, counters, and appliances.',
      'Do not leave the stove or oven unattended while in use.',
      'Dispose of food waste in the kitchen trash. Do not leave food out, as it can attract insects.',
      'Trash bags and basic cleaning supplies are provided. Additional supplies are available at nearby stores.',
    ],
  },
  {
    category: 'Parking',
    icon: '🚗',
    items: [
      'Phoenix V requires a paid parking pass. The current rate is $55 per vehicle, with a maximum of 2 vehicles per reservation.',
      'Parking passes must be obtained through the building office upon arrival. Instructions are included in the check-in information.',
      'Vehicles without a valid pass may be towed at the owner\'s expense.',
      'Oversized vehicles, RVs, and trailers are not permitted in the parking structure.',
    ],
  },
  {
    category: 'Pool, Beach & Amenities',
    icon: '🏊',
    items: [
      'All Phoenix V amenities (pools, hot tub, fitness center, tennis courts) are shared with other building residents and guests.',
      'Follow all posted rules at each amenity. Pool hours are set by Phoenix V management.',
      'No glass containers in the pool area or on the beach.',
      'Beach access is directly through the building. Use the outdoor showers to rinse sand before re-entering.',
      'Life jackets are recommended for young children around the pools.',
    ],
  },
  {
    category: 'Trash & Recycling',
    icon: '♻️',
    items: [
      'Trash chutes are located in the hallway on each floor. Use the designated bags provided.',
      'Do not leave trash bags in the hallway or on the balcony.',
      'Recycling bins are available on the ground floor.',
      'On your departure day, please bag all trash and place it in the hallway chute before leaving.',
    ],
  },
  {
    category: 'Security & Safety',
    icon: '🔒',
    items: [
      'Lock the unit door every time you leave, including for short trips to the pool or beach.',
      'Do not share the door code with anyone outside your registered guest group.',
      'In case of emergency, call 911. The property address is 24400 Perdido Beach Blvd, Orange Beach, AL 36561, Unit 1408.',
      'Familiarize yourself with the nearest fire exit on your floor upon arrival.',
      'A basic first-aid kit is provided in the unit. Location is noted in the welcome guide.',
    ],
  },
  {
    category: 'Departure',
    icon: '🧹',
    items: [
      'Check-out is by 10:00 AM. A late check-out fee applies if the unit is not vacated on time.',
      'Please load and start the dishwasher before leaving.',
      'Remove all personal belongings. The property is not responsible for items left behind (we will make a reasonable effort to return them if found).',
      'Leave the thermostat set to 74°F on departure.',
      'No need to strip beds or do laundry — the cleaning team handles this.',
    ],
  },
];

export default function HouseRules() {
  return <>
    <SEOMeta
      title="House Rules | Coastal Haven at Phoenix V Orange Beach"
      description="House rules for Coastal Haven at Phoenix V in Orange Beach, Alabama. Occupancy limits, quiet hours, no pets, no smoking, parking, and check-in/check-out policies."
      canonical="/house-rules"
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>House Rules</span>
        </nav>
        <div className="eyebrow dark">COASTAL HAVEN · PHOENIX V</div>
        <h1>House Rules</h1>
        <p>Please read before your stay. These rules protect the property, your neighbors, and your security deposit.</p>
      </section>

      <section className="section" style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: 'var(--sand)', borderRadius: 16, padding: '20px 28px', marginBottom: 40, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {[
            ['Check-in', '4:00 PM CT'],
            ['Check-out', '10:00 AM CT'],
            ['Max guests', '10'],
            ['Min age to book', '25'],
            ['Pets', 'Not allowed'],
            ['Smoking', 'Not allowed'],
            ['Parties', 'Not allowed'],
            ['Quiet hours', '10 PM – 8 AM'],
          ].map(([label, value]) => (
            <div key={label} style={{ minWidth: 120 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        {RULES.map(section => (
          <div key={section.category} style={{ marginBottom: 40 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.15rem', color: 'var(--ink)', borderBottom: '2px solid var(--sand)', paddingBottom: 10 }}>
              <span>{section.icon}</span> {section.category}
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items.map(item => (
                <li key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.65, color: '#4a5f5e' }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{ background: '#fff8f0', border: '1.5px solid #f0c070', borderRadius: 16, padding: 24, marginTop: 16 }}>
          <h3 style={{ marginTop: 0, color: '#b97a00' }}>Violations</h3>
          <p style={{ margin: 0, color: '#555', lineHeight: 1.7 }}>
            Violations of these rules — including unauthorized pets, smoking inside, or exceeding occupancy — may result in
            immediate termination of the stay without refund, forfeiture of the security deposit, and/or additional charges
            to cover damages or cleaning. We ask all guests to be respectful of the property and the building community.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/cancellation-policy" className="btn light">Cancellation Policy</a>
          <a href="/faq" className="btn light">FAQ</a>
          <a href="/book" className="btn">Check Availability</a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
