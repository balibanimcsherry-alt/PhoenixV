import { useParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import NotFound from './NotFound';
import { BLOG_POSTS } from './blogContent';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = BLOG_POSTS.find(p => p.slug === slug);
  if (!post) return <NotFound />;

  return <>
    <SEOMeta
      title={`${post.title} | Coastal Haven Orange Beach`}
      description={post.excerpt}
      canonical={`/blog/${post.slug}`}
      schema={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        author: { '@type': 'Organization', name: 'Coastal Haven', url: 'https://orangebeachstay.com' },
        publisher: { '@type': 'Organization', name: 'Coastal Haven', url: 'https://orangebeachstay.com' },
        url: `https://orangebeachstay.com/blog/${post.slug}`,
        image: `https://orangebeachstay.com${post.image || '/images/coast.jpg'}`,
      }}
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <a href="/blog">Blog</a> <span>›</span> <span>{post.title}</span>
        </nav>
        <div className="eyebrow dark">{post.category.toUpperCase()}</div>
        <h1>{post.title}</h1>
        <p className="blog-meta">Updated {post.date} · Coastal Haven</p>
      </section>

      <section className="section blog-post-section">
        <article className="blog-post-body" dangerouslySetInnerHTML={{ __html: post.content }} />

        <aside className="blog-post-cta">
          <h2>Planning a trip to Orange Beach?</h2>
          <p>Stay at Coastal Haven — a Gulf-front 3-bedroom condo at Phoenix V with direct beach access, indoor pool, and stunning Gulf views.</p>
          <a className="btn" href="/book">Check Availability</a>
          <a className="btn light" href="/orange-beach-condo" style={{ marginTop: 12, display: 'block', textAlign: 'center', color: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 999, padding: '14px 24px', fontWeight: 700 }}>View the Condo</a>
        </aside>
      </section>
    </main>
    <Footer />
  </>;
}
