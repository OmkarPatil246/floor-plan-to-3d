// src/components/Footer.jsx — Premium footer with golden ratio layout
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Top section — golden ratio split */}
        <div className="footer__top">
          {/* Brand column (larger — φ proportion) */}
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/logo.png" alt="ArchGen 3D Logo" className="footer__logo-img" />
              <span className="footer__logo-text">
                <span className="footer__logo-arch">ARCHGEN</span>
                <span className="footer__logo-3d">3D</span>
              </span>
            </div>
            <p className="footer__desc">
              Transform any 2D floor plan into an interactive 3D model — powered by AI, viewable in AR & VR.
            </p>
            <div className="footer__socials">
              <a href="#" aria-label="Twitter" className="footer__social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.5v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="footer__social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="#" aria-label="GitHub" className="footer__social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="footer__social-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="footer__links-grid">
            <div className="footer__col">
              <h4 className="footer__col-title">Product</h4>
              <ul className="footer__col-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/ar-vr">AR / VR</Link></li>
                <li><Link to="/ai-parse">AI Parser</Link></li>
                <li><a href="#">Documentation</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Company</h4>
              <ul className="footer__col-links">
                <li><Link to="/about">About</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Legal</h4>
              <ul className="footer__col-links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer__divider" />

        {/* Bottom bar */}
        <div className="footer__bottom">
          <span className="footer__copy">
            © {year} ArchGen 3D. All rights reserved.
          </span>
          <span className="footer__made-with">
            Made with
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ margin: '0 4px' }}>
              <path d="M7 12.5s-5.5-3.5-5.5-7A2.75 2.75 0 017 3.5a2.75 2.75 0 015.5 2c0 3.5-5.5 7-5.5 7z" fill="#ff6b6b" stroke="#ff6b6b" strokeWidth="0.5"/>
            </svg>
            in India
          </span>
        </div>
      </div>
    </footer>
  );
}
