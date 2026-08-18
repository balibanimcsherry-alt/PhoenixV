import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';
import { PROPERTY } from './property';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PROPERTY.faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function FAQ() {
  return <>
    <SEOMeta
      title="Coastal Haven FAQ | Orange Beach Condo Questions Answered"
      description="Answers to common questions about staying at Coastal Haven at Phoenix V in Orange Beach, Alabama — check-in, pools, parking, pets, booking, and more."
      canonical="/faq"
      schema={faqSchema}
    />
    <Header />
    <main>
      <section className="page-hero page-hero-sand">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <a href="/">Home</a> <span>›</span> <span>FAQ</span>
        </nav>
        <div className="eyebrow dark">GOOD TO KNOW</div>
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know before booking Coastal Haven at Phoenix V in Orange Beach.</p>
      </section>

      <section className="section faq faq-page">
        {PROPERTY.faqs.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}

        <div className="faq-cta">
          <h2>Ready to book?</h2>
          <p>Check real-time availability and get an instant price quote — no account required.</p>
          <a className="btn" href="/book">Check Availability</a>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
