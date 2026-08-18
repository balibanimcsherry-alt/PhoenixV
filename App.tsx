import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './Home';
import Book from './Book';
import Admin from './Admin';
import Flights from './Flights';
import WeatherTheme from './WeatherTheme';
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
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book" element={<Book />} />
      <Route path="/flights" element={<Flights />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  </>;
}
