// src/pages/AboutPage.jsx — Redesigned About page (white, professional SaaS)
// Hero with blueprint grid + wireframe SVG, Problem/Solution, How It Works,
// Tech badges, Values cards, CTA band
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

/* ── SVG Icons (inline, 2px stroke, consistent) ────────────── */
const ICONS = {
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  aiParse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <path d="M7 8h2M7 11h4" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  arrow: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ── Problem items ─────────────────────────────────────────── */
const PROBLEMS = [
  'Requires specialized CAD software and training',
  'Days to weeks for a single 3D model',
  'Expensive outsourcing for non-technical teams',
  'No easy way to share or present in real-time',
];

const SOLUTIONS = [
  'Upload any floor plan image — no software needed',
  'AI detects walls, rooms, doors, and dimensions',
  'Interactive 3D model ready in seconds, not days',
  'Share via link — explore in browser, AR, or VR',
];

/* ── Steps data ────────────────────────────────────────────── */
const STEPS = [
  { icon: ICONS.upload, num: '01', title: 'Upload', desc: 'Drop any floor plan — a photo, scan, sketch, or CAD export.' },
  { icon: ICONS.aiParse, num: '02', title: 'AI Parsing', desc: 'Our AI detects walls, rooms, openings, and extracts real-world dimensions.' },
  { icon: ICONS.layers, num: '03', title: '3D Generation', desc: 'Walls, floors, and textures render into a Three.js-powered 3D model.' },
  { icon: ICONS.eye, num: '04', title: 'Explore in AR/VR', desc: 'Walk through your model in browser, place it in your room via AR, or enter in VR.' },
];

/* ── Tech badges ───────────────────────────────────────────── */
const TECH_BADGES = [
  'Three.js', 'WebXR AR/VR', 'AI Floor Plan Parsing',
  'Real-Time Collaboration', 'Computer Vision', 'Python / Celery Backend',
];

/* ── Values ────────────────────────────────────────────────── */
const VALUES = [
  {
    icon: ICONS.check,
    title: 'Accuracy',
    desc: '97% wall-detection accuracy with engineering-grade dimension extraction. Every room, door, and window is precisely mapped.',
  },
  {
    icon: ICONS.bolt,
    title: 'Speed',
    desc: 'From upload to explorable 3D model in under 60 seconds. What used to take days now happens while you wait.',
  },
  {
    icon: ICONS.users,
    title: 'Accessibility',
    desc: 'No CAD expertise required. If you can upload a photo, you can create a 3D home model. Architecture for everyone.',
  },
];

export default function AboutPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    const section = pageRef.current;
    if (!section) return;
    const items = section.querySelectorAll('.reveal');
    items.forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.6, delay: i * 0.06,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el, start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  }, []);

  return (
    <div ref={pageRef} className="page-shell page-shell--light">

      {/* ═══════════ HERO ═══════════ */}
      <section className="about-hero-section">
        {/* Blueprint grid pattern */}
        <div className="about-hero-section__grid" aria-hidden="true" />

        {/* Wireframe house SVG (decorative) */}
        <svg className="about-hero-section__wireframe" viewBox="0 0 480 360" fill="none" aria-hidden="true">
          <rect x="60" y="140" width="360" height="180" stroke="currentColor" strokeWidth="1.5" />
          <polyline points="40,140 240,30 440,140" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="220" y1="140" x2="220" y2="320" stroke="currentColor" strokeWidth="1" />
          <line x1="220" y1="240" x2="220" y2="280" stroke="#FAFBFC" strokeWidth="3" />
          <rect x="100" y="190" width="60" height="40" stroke="currentColor" strokeWidth="1" />
          <line x1="130" y1="190" x2="130" y2="230" stroke="currentColor" strokeWidth="0.75" />
          <rect x="300" y="190" width="60" height="40" stroke="currentColor" strokeWidth="1" />
          <line x1="330" y1="190" x2="330" y2="230" stroke="currentColor" strokeWidth="0.75" />
          <line x1="60" y1="140" x2="20" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="420" y1="140" x2="460" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="60" y1="320" x2="20" y2="280" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="420" y1="320" x2="460" y2="280" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
        </svg>

        <div className="about-hero-section__inner">
          <span className="about-label-sm reveal">About ArchGen 3D</span>
          <h1 className="about-heading-xl reveal">
            Floor plans to real&nbsp;3D&nbsp;homes.<br />
            Under 60&nbsp;seconds. No&nbsp;CAD&nbsp;needed.
          </h1>
          <p className="about-body-lg reveal">
            ArchGen 3D uses artificial intelligence to instantly convert any floor plan — a sketch,
            scan, or CAD export — into an interactive, browser-based 3D model you can walk through,
            share, and explore in AR.
          </p>
        </div>
      </section>

      {/* ═══════════ PROBLEM → SOLUTION ═══════════ */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-section-header reveal">
            <span className="about-label-sm">The Problem → Our Solution</span>
            <h2 className="about-heading-lg">A smarter way to visualize space.</h2>
          </div>

          <div className="about-ps-grid">
            {/* Problem */}
            <div className="about-ps-col about-ps-col--problem reveal">
              <div className="about-ps-icon">{ICONS.x}</div>
              <h3 className="about-heading-md">Traditional CAD Workflow</h3>
              <div className="about-ps-list">
                {PROBLEMS.map((p, i) => (
                  <div key={i} className="about-ps-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#DC2626" strokeWidth="1.5"/><line x1="6" y1="6" x2="10" y2="10" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="6" x2="6" y2="10" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution */}
            <div className="about-ps-col reveal">
              <div className="about-ps-icon">{ICONS.check}</div>
              <h3 className="about-heading-md">ArchGen 3D</h3>
              <div className="about-ps-list">
                {SOLUTIONS.map((s, i) => (
                  <div key={i} className="about-ps-item">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#059669" strokeWidth="1.5"/><path d="M5.5 8l2 2 3-3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="about-section about-section--alt">
        <div className="about-container">
          <div className="about-section-header reveal">
            <span className="about-label-sm">How It Works</span>
            <h2 className="about-heading-lg">Four steps. One click.</h2>
          </div>

          <div className="about-steps">
            {STEPS.map((step, i) => (
              <div key={i} className={`about-step reveal ${i > 0 ? `about-reveal-delay-${i}` : ''}`}>
                <div className="about-step__icon">{step.icon}</div>
                <span className="about-step__num">{step.num}</span>
                <h3 className="about-step__title">{step.title}</h3>
                <p className="about-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TECH BADGES ═══════════ */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-section-header reveal">
            <span className="about-label-sm">Technology</span>
            <h2 className="about-heading-lg">Built with modern tools.</h2>
          </div>
          <div className="about-tech-strip reveal">
            {TECH_BADGES.map((badge, i) => (
              <span key={i} className="about-tech-badge">{badge}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ VALUES ═══════════ */}
      <section className="about-section about-section--alt">
        <div className="about-container">
          <div className="about-section-header reveal">
            <span className="about-label-sm">Our Approach</span>
            <h2 className="about-heading-lg">Why teams trust ArchGen 3D.</h2>
          </div>

          <div className="about-values-grid">
            {VALUES.map((v, i) => (
              <div key={i} className={`about-value-card reveal ${i > 0 ? `about-reveal-delay-${i}` : ''}`}>
                <div className="about-value-card__icon">{v.icon}</div>
                <h3 className="about-value-card__title">{v.title}</h3>
                <p className="about-value-card__desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BAND ═══════════ */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-cta-band reveal">
            <h2 className="about-heading-lg">Ready to see your floor plan in 3D?</h2>
            <p className="about-cta-band__sub">
              Upload a floor plan and get an interactive 3D model in seconds — completely free.
            </p>
            <div className="about-cta-band__actions">
              <Link to="/" className="btn-primary">
                Get Started {ICONS.arrow}
              </Link>
              <Link to="/contact" className="about-btn-secondary">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
