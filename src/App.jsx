import React, { useState } from "react";
import DisplayCarList from "./DisplayCarList";
import MaintenanceCard from "./MaintenanceCard";
import TestDriveForm from "./TestDriveForm";
import "./styles.css";

const maintenanceTips = [
  {
    number: "01",
    icon: "🔧",
    title: "Check your fluids",
    text: "Inspect engine oil, coolant, brake fluid and windshield washer fluid regularly.",
  },
  {
    number: "02",
    icon: "✨",
    title: "Protect the finish",
    text: "Regular washing and waxing helps preserve your car’s paint and resale value.",
  },
  {
    number: "03",
    icon: "🛞",
    title: "Watch the tires",
    text: "Keep tires properly inflated and rotate them every 5,000–8,000 miles.",
  },
];

const navItems = [
  { href: "#inventory", label: "Inventory" },
  { href: "#maintenance", label: "Maintenance" },
  { href: "#contact", label: "Contact" },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [booking, setBooking] = useState(false);

  return (
    <main className="app">
      {/* Navbar */}
      <header className="navbar">
        <div className="container navbar-content">
          <div className="brand">
            <div className="brand-mark">V</div>

            <div>
              <h2>VELOCE</h2>
              <span>MOTORS</span>
            </div>
          </div>

          <nav className="nav-links">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <button className="nav-button" onClick={() => setBooking(true)}>
            Book a Test Drive
          </button>

          <button
            className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile menu — the desktop links and CTA are hidden below 680px */}
        <nav
          id="mobile-nav"
          className={`mobile-nav ${menuOpen ? "is-open" : ""}`}
          hidden={!menuOpen}
        >
          <div className="container mobile-nav-inner">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}

            <button
              className="nav-button mobile-nav-cta"
              onClick={() => {
                setMenuOpen(false);
                setBooking(true);
              }}
            >
              Book a Test Drive
            </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>

        <div className="container hero-content">
          <div className="hero-copy">
            <p className="eyebrow fade-up">Premium automotive collection</p>

            <h1 className="hero-title fade-up delay-one">
              DRIVE
              <br />
              <span>YOUR LEGACY.</span>
            </h1>

            <p className="hero-description fade-up delay-two">
              Discover a refined collection of performance, luxury and
              everyday vehicles designed for people who expect more.
            </p>

            <div className="hero-actions fade-up delay-three">
              <a href="#inventory" className="gold-button">
                Explore Collection
                <span>→</span>
              </a>

              <a href="#maintenance" className="text-button">
                View our care guide
                <span>↗</span>
              </a>
            </div>
          </div>

          <div className="hero-visual fade-in delay-two">
            <div className="hero-ring"></div>

            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=90"
              alt="Luxury sports car"
              className="hero-car-image"
            />

            <div className="hero-image-overlay"></div>

            <div className="hero-floating-card">
              <span className="floating-label">Featured model</span>
              <strong>Porsche 911</strong>
              <small>Performance redefined</small>
            </div>
          </div>
        </div>

        <div className="hero-scroll">
          <span></span>
          Scroll to explore
        </div>
      </section>

      {/* Inventory */}
      <section id="inventory" className="inventory-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Our collection</p>
              <h2>Find your next statement.</h2>
            </div>

            <p className="section-intro">
              Every vehicle is selected for its character, condition and
              ability to make every journey memorable.
            </p>
          </div>

          <DisplayCarList />
        </div>
      </section>

      {/* Maintenance */}
      <section id="maintenance" className="maintenance-section">
        <div className="container">
          <div className="section-heading maintenance-heading">
            <div>
              <p className="eyebrow">Ownership guide</p>
              <h2>Keep it exceptional.</h2>
            </div>

            <p className="section-intro">
              A little attention goes a long way. Follow these simple habits
              to keep your vehicle performing at its best.
            </p>
          </div>

          <div className="maintenance-grid">
            {maintenanceTips.map((tip) => (
              <MaintenanceCard key={tip.number} tip={tip} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="contact-section">
        <div className="container contact-box">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Your next chapter starts here.</h2>
          </div>

          <button className="gold-button" onClick={() => setBooking(true)}>
            Book a test drive
            <span>→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="brand footer-brand">
            <div className="brand-mark">V</div>

            <div>
              <h2>VELOCE</h2>
              <span>MOTORS</span>
            </div>
          </div>

          <p>© 2025 Veloce Motors. Drive something unforgettable.</p>

          <div className="footer-socials">
            <span>Instagram</span>
            <span>Facebook</span>
            <span>LinkedIn</span>
          </div>
        </div>
      </footer>

      {booking && <TestDriveForm onClose={() => setBooking(false)} />}
    </main>
  );
}