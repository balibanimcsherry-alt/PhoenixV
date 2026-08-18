import Header from './Header';
import Footer from './Footer';
import SEOMeta from './SEOMeta';

export default function NotFound() {
  return <>
    <SEOMeta
      title="Page Not Found | Coastal Haven Orange Beach"
      description="The page you're looking for doesn't exist. Find what you need at Coastal Haven — Gulf-front condo at Phoenix V in Orange Beach, Alabama."
      noindex
    />
    <Header />
    <main className="not-found-page">
      <div className="not-found-inner">
        <div className="not-found-code">404</div>
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or has moved. Here's where to go:</p>
        <div className="not-found-links">
          <a className="btn" href="/">Home</a>
          <a className="btn light" href="/orange-beach-condo">View the Condo</a>
          <a className="btn light" href="/book">Check Availability</a>
          <a className="btn light" href="/orange-beach-guide">Orange Beach Guide</a>
        </div>
      </div>
    </main>
    <Footer />
  </>;
}
