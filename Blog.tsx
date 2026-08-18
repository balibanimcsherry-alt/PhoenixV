import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import { BLOG_POSTS } from './blogContent';

export default function Blog() {
  return <>
    <SEOMeta
      title="Orange Beach Alabama Blog | Travel Tips & Local Guides"
      description="Travel guides, tips, and local knowledge about Orange Beach, Alabama — from the owners of Coastal Haven at Phoenix V."
      canonical="/blog"
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>Blog</span>
        </nav>
        <div className="eyebrow dark">ORANGE BEACH GUIDES</div>
        <h1>Orange Beach Travel Blog</h1>
        <p>Local knowledge, trip-planning tips, and insider guides to Orange Beach, Alabama — from the owners of Coastal Haven.</p>
      </section>

      <section className="section">
        <div className="blog-grid">
          {BLOG_POSTS.map(post => (
            <article key={post.slug} className="blog-card">
              <a href={`/blog/${post.slug}`}>
                <div className="blog-card-eyebrow">{post.category}</div>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <span className="blog-read-more">Read more →</span>
              </a>
            </article>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <h2>Planning a trip to Orange Beach?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Check availability at Coastal Haven — a Gulf-front 3-bedroom condo at Phoenix V.</p>
          <a className="btn" href="/book">Check Availability</a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
