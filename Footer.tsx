export default function Footer() {
  return (
    <footer className="site-footer-main">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.svg" alt="Coastal Haven" />
          <p>A Gulf-front family condo at Phoenix V in Orange Beach, Alabama. Book direct with the owner.</p>
          <a href="mailto:stay@orangebeachstay.com" className="footer-email">stay@orangebeachstay.com</a>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <nav aria-label="Explore">
            <a href="/orange-beach-condo">The Condo</a>
            <a href="/amenities">Amenities</a>
            <a href="/gallery">Gallery</a>
            <a href="/reviews">Reviews</a>
            <a href="/phoenix-v-orange-beach">Phoenix V</a>
          </nav>
        </div>

        <div className="footer-col">
          <h4>Plan Your Stay</h4>
          <nav aria-label="Plan your stay">
            <a href="/availability">Check Availability</a>
            <a href="/book">Book Direct</a>
            <a href="/orange-beach-guide">Orange Beach Guide</a>
            <a href="/things-to-do-orange-beach">Things To Do</a>
            <a href="/orange-beach-restaurants">Restaurants</a>
            <a href="/faq">FAQ</a>
          </nav>
        </div>

        <div className="footer-col">
          <h4>Information</h4>
          <nav aria-label="Information">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/blog">Blog</a>
            <a href="/house-rules">House Rules</a>
            <a href="/cancellation-policy">Cancellation Policy</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Coastal Haven · Phoenix V Unit 1408 · Orange Beach, Alabama</p>
        <p className="footer-disclaimer">Exact unit address provided to confirmed guests only.</p>
      </div>
    </footer>
  );
}
