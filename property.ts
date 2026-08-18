// Central property configuration — all UI, structured data, and metadata draws from here.
// Update this file when property details change. Never hardcode in components.

export const PROPERTY = {
  id: 'coastal-haven-phoenix-v-1408',
  slug: 'coastal-haven',
  name: 'Coastal Haven',
  resort: 'Phoenix V',
  unit: '1408',
  tagline: 'Your Gulf-front home in Orange Beach.',
  description:
    'Coastal Haven is a spacious 3-bedroom, 2-bathroom Gulf-front condo on the 14th floor of ' +
    'Phoenix V in Orange Beach, Alabama. With direct beach access, panoramic Gulf views from ' +
    'the private balcony, and a full resort amenity package — including an indoor heated pool, ' +
    'outdoor pools, hot tub, splash pad, and fitness center — an ideal family vacation home ' +
    'on the Alabama Gulf Coast.',

  bedrooms: 3,
  bathrooms: 2,
  maxGuests: 10,
  beds: 4,
  floor: 14,

  checkInTime: '4:00 PM',
  checkOutTime: '10:00 AM',
  minGuestAge: 25,

  address: {
    street: '24400 Perdido Beach Blvd',
    unit: '#1408',
    city: 'Orange Beach',
    state: 'AL',
    zip: '36561',
    country: 'US',
    county: 'Baldwin County',
  },
  coordinates: {
    lat: 30.2937,
    lng: -87.6077,
  },

  contact: {
    email: 'stay@orangebeachstay.com',
  },

  domain: 'https://orangebeachstay.com',

  amenities: [
    { name: 'Direct beach access',      category: 'Beach' },
    { name: 'Beachfront outdoor pool',  category: 'Pool' },
    { name: 'Indoor heated pool',       category: 'Pool' },
    { name: 'Hot tubs & sauna',         category: 'Pool' },
    { name: 'Kids splash pad',          category: 'Family' },
    { name: 'Fitness center',           category: 'Active' },
    { name: 'Tennis courts',            category: 'Active' },
    { name: 'Racquetball court',        category: 'Active' },
    { name: 'BBQ & picnic area',        category: 'Outdoor' },
    { name: 'Private Gulf-view balcony',category: 'Unit' },
    { name: 'Fully equipped kitchen',   category: 'Unit' },
    { name: 'In-unit washer & dryer',   category: 'Unit' },
    { name: 'Fast Wi-Fi',               category: 'Unit' },
    { name: 'Smart TV',                 category: 'Unit' },
    { name: 'Elevator & secured entry', category: 'Building' },
    { name: 'Self check-in',            category: 'Booking' },
    { name: 'No pets',                  category: 'Policy' },
    { name: 'No smoking',               category: 'Policy' },
  ],

  images: [
    { src: '/images/balcony.jpg',       alt: 'Private 14th-floor Gulf-front balcony at Coastal Haven, Phoenix V, Orange Beach AL', category: 'Balcony' },
    { src: '/images/living-ocean.jpg',  alt: 'Bright oceanfront living room with Gulf views at Coastal Haven',                     category: 'Living' },
    { src: '/images/master.jpg',        alt: 'Primary suite with balcony access at Coastal Haven Orange Beach',                     category: 'Bedroom' },
    { src: '/images/guest-room.jpg',    alt: 'Guest bedroom at Coastal Haven, Phoenix V Unit 1408',                                  category: 'Bedroom' },
    { src: '/images/kitchen-dining.jpg',alt: 'Open kitchen and dining area at Coastal Haven condo',                                  category: 'Kitchen' },
    { src: '/images/dining.jpg',        alt: 'Family dining area at Coastal Haven Orange Beach Alabama',                             category: 'Dining' },
    { src: '/images/living.jpg',        alt: 'Spacious coastal living room at Coastal Haven',                                        category: 'Living' },
    { src: '/images/kitchen.jpg',       alt: 'Fully equipped kitchen at Coastal Haven vacation rental',                              category: 'Kitchen' },
    { src: '/images/bath.jpg',          alt: 'Updated bathroom at Coastal Haven Phoenix V',                                          category: 'Bathroom' },
    { src: '/images/coast.jpg',         alt: 'Orange Beach shoreline near Phoenix V, Alabama Gulf Coast',                            category: 'Beach' },
  ],

  policies: {
    cancellation:
      'Full refund up to 30 days before arrival · 50% refund 14–30 days before · Non-refundable inside 14 days.',
    pets: false,
    smoking: false,
    parties: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    parkingNotes: 'Phoenix V requires a paid parking pass ($55/vehicle, max 2 vehicles).',
  },

  faqs: [
    { q: 'What time is check-in?',       a: 'Check-in begins at 4:00 PM Central Time.' },
    { q: 'What time is checkout?',       a: 'Checkout is by 10:00 AM Central Time.' },
    { q: 'Is Coastal Haven beachfront?', a: 'Yes — Phoenix V sits directly on the Gulf of Mexico with direct beach access. Coastal Haven on the 14th floor has an unobstructed Gulf-facing balcony.' },
    { q: 'How many bedrooms and bathrooms?', a: '3 bedrooms and 2 full bathrooms, sleeping up to 10 guests across 4 beds.' },
    { q: 'Is there an indoor pool?',     a: 'Yes. Phoenix V has a heated indoor pool — perfect for cooler months or rainy days.' },
    { q: 'Is parking available?',        a: 'Yes. Phoenix V has a covered parking garage. A parking pass is required ($55/vehicle, typically limited to 2 vehicles per reservation).' },
    { q: 'Are pets allowed?',            a: 'No. Phoenix V HOA rules do not permit pets for this rental.' },
    { q: 'Is there a washer and dryer?', a: 'Yes — the unit has a full-size in-unit washer and dryer.' },
    { q: 'Is Wi-Fi included?',           a: 'Yes. Fast Wi-Fi is included at no extra charge.' },
    { q: 'Is the kitchen fully equipped?', a: 'Yes — the kitchen has a full appliance suite, cookware, dishes, and everything needed for family meals.' },
    { q: 'Do you allow smoking?',        a: 'No smoking anywhere on the property, including the balcony.' },
    { q: 'Are parties allowed?',         a: 'No parties. Quiet hours are 10 PM–8 AM.' },
    { q: 'How old must the primary renter be?', a: 'The primary renter must be at least 25 years old.' },
    { q: 'How far is Phoenix V from Gulf Shores?', a: 'Phoenix V is approximately 9 miles east of Gulf Shores along Perdido Beach Blvd — about a 15-minute drive.' },
    { q: 'How does direct booking work?', a: 'Select your dates, get an instant price quote, and complete secure checkout. Direct bookings typically save compared to OTA platforms because there are no marketplace service fees added on top.' },
    { q: 'What is the cancellation policy?', a: 'Full refund up to 30 days before arrival. 50% refund between 14 and 30 days before. Non-refundable inside 14 days.' },
    { q: 'Can I request early check-in or late checkout?', a: 'Early check-in and late checkout may be available depending on adjacent reservations. Contact the host after booking to ask.' },
  ],
} as const;

export type PropertyAmenity = typeof PROPERTY.amenities[number];
export type PropertyImage = typeof PROPERTY.images[number];
