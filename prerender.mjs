// prerender.mjs — Per-route static HTML generation for SEO
// Injects correct title, description, and canonical into dist/index.html for each route.
// Google sees real metadata on the first crawl without waiting for JavaScript to execute.
// Run automatically after vite build via the "postbuild" npm script.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[prerender] dist/index.html not found — run vite build first');
  process.exit(1);
}

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

function inject(html, { title, description, canonical, ogImage }) {
  const img = ogImage || 'https://orangebeachstay.com/images/balcony.jpg';
  const esc = s => s.replace(/"/g, '&quot;');
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,  `$1${esc(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/,  `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${esc(description)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/,  `$1${img}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/,  `$1${canonical}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/,  `$1${canonical}$2`);
}

const PAGES = [
  {
    route: '/orange-beach-condo',
    title: '3-Bedroom Orange Beach Condo for Rent | Gulf-Front, Sleeps 10 | Coastal Haven',
    description: 'Coastal Haven is a beachfront 3-bedroom, 2-bath condo on the 14th floor of Phoenix V in Orange Beach, Alabama. Gulf views, direct beach access, indoor pool. Sleeps 10. Book direct and save.',
    canonical: 'https://orangebeachstay.com/orange-beach-condo',
  },
  {
    route: '/phoenix-v-orange-beach',
    title: 'Phoenix V Orange Beach | Beachfront Resort Guide | Coastal Haven Unit 1408',
    description: 'Everything you need to know about Phoenix V resort in Orange Beach, Alabama — location, amenities, pools, beach access, and why Coastal Haven Unit 1408 is an exceptional choice.',
    canonical: 'https://orangebeachstay.com/phoenix-v-orange-beach',
  },
  {
    route: '/amenities',
    title: 'Phoenix V Amenities | Pools, Beach Access & More | Coastal Haven',
    description: 'Coastal Haven at Phoenix V offers direct beach access, indoor heated pool, outdoor pools, hot tub, splash pad, fitness center, tennis, and more in Orange Beach, Alabama.',
    canonical: 'https://orangebeachstay.com/amenities',
  },
  {
    route: '/gallery',
    title: 'Photo Gallery | Coastal Haven at Phoenix V | Orange Beach Condo',
    description: 'Browse 55 photos of Coastal Haven — a 3-bedroom Gulf-front condo at Phoenix V in Orange Beach, Alabama. See every room, the balcony view, and resort amenities.',
    canonical: 'https://orangebeachstay.com/gallery',
  },
  {
    route: '/faq',
    title: 'Coastal Haven FAQ | Orange Beach Condo Questions Answered',
    description: 'Answers to common questions about staying at Coastal Haven at Phoenix V in Orange Beach, Alabama — check-in, pools, parking, pets, booking, and more.',
    canonical: 'https://orangebeachstay.com/faq',
  },
  {
    route: '/reviews',
    title: 'Guest Reviews | Coastal Haven Orange Beach Condo | Verified Stays',
    description: 'Read verified guest reviews of Coastal Haven at Phoenix V in Orange Beach, Alabama. 4.9-star average across Airbnb and VRBO. Book direct and get the same great experience.',
    canonical: 'https://orangebeachstay.com/reviews',
  },
  {
    route: '/about',
    title: 'About Coastal Haven | Orange Beach Condo Direct Booking',
    description: 'Coastal Haven is a privately owned 3-bedroom Gulf-front condo at Phoenix V in Orange Beach, Alabama. Learn about the property and why guests love booking direct.',
    canonical: 'https://orangebeachstay.com/about',
  },
  {
    route: '/contact',
    title: 'Contact Coastal Haven | Orange Beach Vacation Rental',
    description: 'Contact the owner of Coastal Haven at Phoenix V in Orange Beach, Alabama. Ask questions about the condo or inquire about availability.',
    canonical: 'https://orangebeachstay.com/contact',
  },
  {
    route: '/orange-beach-guide',
    title: 'Orange Beach Alabama Visitor Guide — Best Beaches, Restaurants & Activities',
    description: 'The complete insider guide to Orange Beach, Alabama — beaches, restaurants, things to do, fishing, dolphin cruises, and practical travel tips from a local property owner.',
    canonical: 'https://orangebeachstay.com/orange-beach-guide',
  },
  {
    route: '/things-to-do-orange-beach',
    title: 'Best Things to Do in Orange Beach, Alabama (2026 Guide)',
    description: 'The top things to do in Orange Beach, Alabama for families and couples — dolphin cruises, Gulf State Park, fishing, water sports, The Wharf, and more.',
    canonical: 'https://orangebeachstay.com/things-to-do-orange-beach',
  },
  {
    route: '/orange-beach-restaurants',
    title: 'Best Restaurants in Orange Beach Alabama | Local Dining Guide',
    description: 'The best restaurants in Orange Beach, Alabama — seafood, family dining, waterfront spots, and local favorites near Phoenix V on the Alabama Gulf Coast.',
    canonical: 'https://orangebeachstay.com/orange-beach-restaurants',
  },
  {
    route: '/orange-beach-beaches',
    title: 'Orange Beach Alabama Beaches — Complete Guide to the Best Gulf Beaches',
    description: 'The best beaches near Phoenix V in Orange Beach, Alabama — from the resort\'s private beachfront to Gulf State Park. A practical guide for families staying at Coastal Haven.',
    canonical: 'https://orangebeachstay.com/orange-beach-beaches',
  },
  {
    route: '/family-activities-orange-beach',
    title: 'Family Activities in Orange Beach Alabama | Fun for Kids & Adults',
    description: 'The best family activities in Orange Beach, AL — dolphin cruises, Gulf State Park, The Wharf, parasailing, and more. A practical guide for families staying near Phoenix V.',
    canonical: 'https://orangebeachstay.com/family-activities-orange-beach',
  },
  {
    route: '/cancellation-policy',
    title: 'Cancellation Policy | Coastal Haven at Phoenix V Orange Beach',
    description: 'Cancellation and refund policy for Coastal Haven — a Gulf-front vacation rental at Phoenix V in Orange Beach, Alabama. Full refund up to 30 days before arrival.',
    canonical: 'https://orangebeachstay.com/cancellation-policy',
  },
  {
    route: '/house-rules',
    title: 'House Rules | Coastal Haven at Phoenix V Orange Beach',
    description: 'House rules for Coastal Haven at Phoenix V in Orange Beach, Alabama. Occupancy limits, quiet hours, no pets, no smoking, parking, and check-in/check-out policies.',
    canonical: 'https://orangebeachstay.com/house-rules',
  },
  {
    route: '/blog',
    title: 'Orange Beach Alabama Blog | Travel Tips & Local Guides',
    description: 'Travel guides, tips, and local knowledge about Orange Beach, Alabama — from the owners of Coastal Haven at Phoenix V.',
    canonical: 'https://orangebeachstay.com/blog',
  },
  {
    route: '/blog/best-things-to-do-orange-beach-with-kids',
    title: 'Best Things To Do in Orange Beach With Kids | Coastal Haven',
    description: 'Orange Beach is one of the best family beach destinations on the Gulf Coast. Here are the activities families love most, from dolphin cruises to Gulf State Park.',
    canonical: 'https://orangebeachstay.com/blog/best-things-to-do-orange-beach-with-kids',
  },
  {
    route: '/blog/orange-beach-vs-gulf-shores',
    title: 'Orange Beach vs Gulf Shores: Which Is Better for Families? | Coastal Haven',
    description: 'Both are on the Alabama Gulf Coast, but Orange Beach and Gulf Shores have real differences. Here is an honest comparison to help you decide which is right for your family.',
    canonical: 'https://orangebeachstay.com/blog/orange-beach-vs-gulf-shores',
  },
  {
    route: '/blog/best-time-to-visit-orange-beach',
    title: 'Best Time to Visit Orange Beach Alabama — Month-by-Month Guide | Coastal Haven',
    description: 'Peak season, shoulder season, and off-season compared — when to go based on weather, crowds, and what you want from an Orange Beach trip.',
    canonical: 'https://orangebeachstay.com/blog/best-time-to-visit-orange-beach',
  },
  {
    route: '/blog/what-to-pack-orange-beach-vacation',
    title: 'Orange Beach Packing List: What to Bring (and What Not To) | Coastal Haven',
    description: 'A practical packing list for an Orange Beach, Alabama vacation — organized by what you actually need and what the condo already provides.',
    canonical: 'https://orangebeachstay.com/blog/what-to-pack-orange-beach-vacation',
  },
  {
    route: '/blog/phoenix-v-resort-guide',
    title: 'Phoenix V Orange Beach Review: Amenities, Location & Booking Tips | Coastal Haven',
    description: 'A complete guide to Phoenix V resort in Orange Beach, Alabama — amenities, location, pools, beach access, and what it\'s like to stay there.',
    canonical: 'https://orangebeachstay.com/blog/phoenix-v-resort-guide',
  },
  {
    route: '/book-direct-orange-beach',
    title: 'Book Coastal Haven Direct — No Airbnb Fees | Orange Beach Condo',
    description: 'Book Coastal Haven at Phoenix V directly with the owner and save up to 10% vs. Airbnb or VRBO. No service fees, same unit, better price. Simple and secure online booking.',
    canonical: 'https://orangebeachstay.com/book-direct-orange-beach',
  },
  {
    route: '/orange-beach-spring-break',
    title: 'Orange Beach Spring Break Condo Rental | Coastal Haven at Phoenix V',
    description: 'Book Coastal Haven for spring break in Orange Beach, Alabama. 3-bedroom Gulf-front condo at Phoenix V — sleeps 10, indoor heated pool, direct beach access. Book direct and save.',
    canonical: 'https://orangebeachstay.com/orange-beach-spring-break',
  },
];

let count = 0;
for (const page of PAGES) {
  const outDir = path.join(distDir, page.route.slice(1));
  fs.mkdirSync(outDir, { recursive: true });
  const html = inject(baseHtml, page);
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  count++;
  console.log(`[prerender] ✓ ${page.route}`);
}

console.log(`[prerender] Generated ${count} pages`);
