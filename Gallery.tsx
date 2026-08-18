import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import PhotoGallery from './PhotoGallery';
import { PROPERTY } from './property';

export default function Gallery() {
  return <>
    <SEOMeta
      title="Photo Gallery | Coastal Haven at Phoenix V | Orange Beach Condo"
      description="Browse 55 photos of Coastal Haven — a 3-bedroom Gulf-front condo at Phoenix V in Orange Beach, Alabama. See every room, the balcony view, and resort amenities."
      canonical="/gallery"
      schema={{
        '@context': 'https://schema.org',
        '@type': 'ImageGallery',
        name: 'Coastal Haven Photo Gallery',
        description: '55 photos of Coastal Haven at Phoenix V, Orange Beach, Alabama',
        url: `${PROPERTY.domain}/gallery`,
        author: { '@type': 'Organization', name: PROPERTY.name, url: PROPERTY.domain },
      }}
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>Gallery</span>
        </nav>
        <div className="eyebrow dark">COASTAL HAVEN · PHOENIX V</div>
        <h1>55 Photos — Every Room, Every View</h1>
        <p>Click any photo to open full screen. Use arrow keys to navigate. Click again to zoom.</p>
      </section>

      <section className="section gallery-section" style={{ paddingTop: 0 }}>
        <PhotoGallery />
      </section>

      <section className="section book-direct">
        <div>
          <div className="eyebrow">READY TO BOOK?</div>
          <h2>Check your dates.</h2>
          <p>3 bedrooms, 2 baths, up to 10 guests — Gulf-front on the 14th floor at Phoenix V.</p>
        </div>
        <a className="btn light" href="/book">Check Availability</a>
      </section>
    </main>
    <Footer />
  </>;
}
