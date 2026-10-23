// src/components/Navbar.jsx — Refactored for React Router with auth-aware links
import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'AR / VR', to: '/ar-vr' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const AUTH_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'AR / VR', to: '/ar-vr' },
  { label: 'AI Parse', to: '/ai-parse' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  const [hasScrolled, setHasScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navRef = useRef(null);
  const dropdownRef = useRef(null);

  const links = user ? AUTH_LINKS : PUBLIC_LINKS;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setHasScrolled(scrollY > 40);

      if (isHomePage) {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
          const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
          setIsPastHero(scrollY + 100 > heroBottom);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  // On non-home pages, always use dark glass style
  let navClass = 'navbar';
  if (!isHomePage) {
    navClass += hasScrolled ? ' navbar--dark-glass' : ' navbar--dark-glass';
  } else if (!hasScrolled) {
    navClass += ' navbar--transparent';
  } else if (isPastHero) {
    navClass += ' navbar--dark-glass';
  } else {
    navClass += ' navbar--light-glass';
  }

  const textMode = (!isHomePage || isPastHero) ? 'dark' : 'light';

  // Avatar
  const avatarSrc = userData?.avatar || '';
  const initials = (userData?.fullName || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <nav ref={navRef} className={navClass}>
        <div className="navbar__inner">
          <Link to="/" className={`navbar__brand navbar__brand--${textMode}`}>
            <img src="/logo.png" alt="ArchGen 3D Logo" className="navbar__logo-img" />
            <span className="navbar__logo-text">
              <span className="navbar__logo-arch">ARCHGEN</span>
              <span className="navbar__logo-3d">3D</span>
            </span>
          </Link>

          <ul className="navbar__links">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `navbar__link navbar__link--${textMode}${isActive ? ' navbar__link--active' : ''}`
                  }
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right side: Auth CTA or Profile */}
          {!user ? (
            <Link to="/login" className={`navbar__cta navbar__cta--${textMode}`}>
              Login
            </Link>
          ) : (
            <div className="navbar__profile" ref={dropdownRef}>
              <button
                className="navbar__avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="navbar__avatar-img" />
                ) : (
                  <span className="navbar__avatar-initials">{initials}</span>
                )}
              </button>
              {dropdownOpen && (
                <div className="navbar__dropdown">
                  <div className="navbar__dropdown-header">
                    <span className="navbar__dropdown-name">{userData?.fullName || 'User'}</span>
                    <span className="navbar__dropdown-email">{user?.email}</span>
                  </div>
                  <div className="navbar__dropdown-divider" />
                  <Link to="/profile" className="navbar__dropdown-item">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.31 2.69-5 6-5s6 1.69 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Profile
                  </Link>
                  <button className="navbar__dropdown-item navbar__dropdown-item--logout" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className={`navbar__hamburger navbar__hamburger--${textMode}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile nav overlay */}
      <div
        className={`mobile-nav__overlay ${mobileOpen ? 'mobile-nav__overlay--visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <div className={`mobile-nav ${mobileOpen ? 'mobile-nav--open' : ''}`}>
        <ul className="mobile-nav__links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className="mobile-nav__link" end={link.to === '/'}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mobile-nav__cta">
          {!user ? (
            <Link to="/login" className="btn-primary">Login / Register</Link>
          ) : (
            <>
              <Link to="/profile" className="btn-primary" style={{ marginBottom: 12, display: 'block', textAlign: 'center' }}>Profile</Link>
              <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%' }}>Logout</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
