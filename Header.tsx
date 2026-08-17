import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header(){
  const [open,setOpen]=useState(false);
  return <header className="site-header">
    <Link to="/" className="brand"><img src="/logo.svg" alt="Coastal Haven" /></Link>
    <nav className={open?'nav open':'nav'}>
      <a href="#stay" onClick={()=>setOpen(false)}>The Stay</a>
      <a href="#amenities" onClick={()=>setOpen(false)}>Amenities</a>
      <a href="#gallery" onClick={()=>setOpen(false)}>Gallery</a>
      <a href="#guide" onClick={()=>setOpen(false)}>Local Guide</a>
      <a href="#reviews" onClick={()=>setOpen(false)}>Reviews</a>
      <Link to="/flights" onClick={()=>setOpen(false)}>Flights</Link>
      <Link to="/book" className="btn btn-small" onClick={()=>setOpen(false)}>Check Availability</Link>
    </nav>
    <button className="menu" onClick={()=>setOpen(!open)} aria-label="Menu">{open?<X/>:<Menu/>}</button>
  </header>
}
