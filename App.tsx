import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './Home';
import Book from './Book';
import Admin from './Admin';
import Flights from './Flights';
import WeatherTheme from './WeatherTheme';
import FAQ from './FAQ';
import About from './About';
import Contact from './Contact';
import Reviews from './Reviews';
import Amenities from './Amenities';
import PhoenixV from './PhoenixV';
import OrangeBeachCondo from './OrangeBeachCondo';
import OrangeBeachGuide from './OrangeBeachGuide';
import ThingsToDo from './ThingsToDo';
import OrangeBeachRestaurants from './OrangeBeachRestaurants';
import Gallery from './Gallery';
import OrangeBeachBeaches from './OrangeBeachBeaches';
import FamilyActivities from './FamilyActivities';
import CancellationPolicy from './CancellationPolicy';
import HouseRules from './HouseRules';
import Blog from './Blog';
import BlogPost from './BlogPost';
import NotFound from './NotFound';
import BackgroundMusic from './BackgroundMusic';
import OceanAvatar from './OceanAvatar';
import { trackPageView } from './analytics';

function RouteTracker() {
  const loc = useLocation();
  useEffect(() => { trackPageView(); }, [loc.pathname]);
  return null;
}

export default function App() {
  return <>
    <WeatherTheme />
    <RouteTracker />
    <BackgroundMusic />
    <OceanAvatar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book" element={<Book />} />
      <Route path="/availability" element={<Book />} />
      <Route path="/flights" element={<Flights />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/amenities" element={<Amenities />} />
      <Route path="/phoenix-v-orange-beach" element={<PhoenixV />} />
      <Route path="/orange-beach-condo" element={<OrangeBeachCondo />} />
      <Route path="/orange-beach-guide" element={<OrangeBeachGuide />} />
      <Route path="/things-to-do-orange-beach" element={<ThingsToDo />} />
      <Route path="/orange-beach-restaurants" element={<OrangeBeachRestaurants />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/orange-beach-beaches" element={<OrangeBeachBeaches />} />
      <Route path="/family-activities-orange-beach" element={<FamilyActivities />} />
      <Route path="/cancellation-policy" element={<CancellationPolicy />} />
      <Route path="/house-rules" element={<HouseRules />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>;
}
