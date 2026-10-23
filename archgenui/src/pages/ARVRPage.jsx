// src/pages/ARVRPage.jsx — Redesigned AR/VR page (white professional SaaS)
// Matching About/Contact design language: white bg, slate-blue accent, clean cards
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

/* ── Data ──────────────────────────────────────────────────── */
const AR_FEATURES = [
  'Phone-camera passthrough overlay',
  'Room-scale placement on any surface',
  'Pinch-to-scale and rotate',
  'Walk around the model physically',
  'Share AR link — no app install',
];

const VR_FEATURES = [
  'Meta Quest 2 / 3 / Pro support',
  'HTC Vive and SteamVR compatible',
  'Teleport + smooth locomotion',
  'Dollhouse / Normal / Giant scale modes',
  'Voice annotations in-headset',
];

const USE_CASES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 3v18" />
      </svg>
    ),
    title: 'Client Presentations',
    desc: 'Walk clients through their future home before a single brick is laid. AR lets them see the model in their actual living room.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
    title: 'Design Reviews',
    desc: 'Spot spatial issues in VR that flat screens miss — ceiling heights, corridor widths, natural light angles all become immediately tangible.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14l-8-4-8 4z" />
      </svg>
    ),
    title: 'Real Estate Marketing',
    desc: 'Give prospective buyers a VR tour of off-plan properties. Increase engagement by 300% compared to static floor plans.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Education & Training',
    desc: 'Architecture students can step inside textbook floor plans. Construction teams can rehearse builds in a virtual twin.',
  },
];

const COMPAT_DATA = [
  { platform: 'iOS Safari (AR)', ar: true, vr: false, notes: 'ARKit Quick Look' },
  { platform: 'Android Chrome (AR)', ar: true, vr: false, notes: 'ARCore Scene Viewer' },
  { platform: 'Meta Quest 2 / 3', ar: true, vr: true, notes: 'Full 6DOF' },
  { platform: 'HTC Vive / Vive Pro', ar: false, vr: true, notes: 'SteamVR' },
  { platform: 'Apple Vision Pro', ar: true, vr: true, notes: 'Spatial Computing' },
  { platform: 'Desktop Browser', ar: false, vr: false, notes: '3D Viewer only' },
];

const STEPS = [
  {
    num: '01',
    title: 'Upload your floor plan',
    desc: 'Drag and drop any floor plan image, PDF, or CAD file. Our AI converts it to a 3D model in seconds.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Choose your experience',
    desc: 'Click "View in AR" to place the model in your real space, or "Enter VR" to step inside with a headset.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="10" rx="3" />
        <circle cx="8" cy="12" r="2" />
        <circle cx="16" cy="12" r="2" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Explore and share',
    desc: 'Walk around, measure spaces, take screenshots. Share an AR link with clients — no app install needed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15,3 21,3 21,9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    ),
  },
];

const FAQ_DATA = [
  {
    q: 'Do I need to install an app for AR?',
    a: 'No. ArchGen AR uses WebXR on Android and ARKit Quick Look on iOS — it works directly from your browser. Just tap the AR button and point your camera.',
  },
  {
    q: 'What VR headsets are supported?',
    a: 'We support Meta Quest 2/3/Pro natively through WebXR, plus any SteamVR-compatible headset (HTC Vive, Valve Index) via desktop browser. Apple Vision Pro support is in beta.',
  },
  {
    q: 'Can multiple people view the same model in VR?',
    a: 'Collaborative VR sessions are on our roadmap. Currently, each user gets their own immersive session, but you can share AR links for simultaneous viewing.',
  },
  {
    q: 'What file formats can I import?',
    a: 'ArchGen accepts floor plan images (JPG, PNG), PDF scans, and our custom CAD XML format. All are converted to 3D models viewable in AR/VR.',
  },
];

/* ── Check / X icons for compat table ──────────────────────── */
const CheckSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="#059669" strokeWidth="1.5" />
    <path d="M5.5 8l2 2 3-3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DashSvg = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="#D1D5DB" strokeWidth="1.5" />
    <line x1="5.5" y1="8" x2="10.5" y2="8" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function ARVRPage() {
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
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
        }
      );
    });
    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  }, []);

  return (
    <div ref={pageRef} className="page-shell page-shell--light">

      {/* ═══════════ HERO ═══════════ */}
      <section className="arvr-hero-section">
        <div className="about-container">
          <span className="about-label-sm reveal">AR / VR Experience</span>
          <h1 className="about-heading-xl reveal" style={{ marginTop: 16, marginBottom: 20 }}>
            Step inside your floor plan.
          </h1>
          <p className="about-body-lg reveal" style={{ maxWidth: 600, margin: '0 auto' }}>
            From phone screen to headset — experience your architectural model at every scale, in every dimension.
          </p>
        </div>
      </section>

      {/* ═══════════ AR vs VR CARDS ═══════════ */}
      <section className="about-section">
        <div className="about-container">
          <div className="arvr-cards-grid">
            {/* AR Card */}
            <div className="arvr-card-v2 reveal">
              <span className="arvr-card-v2__badge arvr-card-v2__badge--ar">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                Augmented Reality
              </span>
              <h3 className="arvr-card-v2__title">See it in your room.</h3>
              <p className="arvr-card-v2__desc">
                Point your phone camera at any flat surface — your 3D house model appears at real-world scale, anchored to the floor. Walk around it, peer through windows, check dimensions against your actual space.
              </p>
              <ul className="arvr-card-v2__list">
                {AR_FEATURES.map((f, i) => (
                  <li key={i} className="arvr-card-v2__item">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* VR Card */}
            <div className="arvr-card-v2 reveal">
              <span className="arvr-card-v2__badge arvr-card-v2__badge--vr">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="4" width="12" height="7" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1" />
                  <circle cx="9" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1" />
                </svg>
                Virtual Reality
              </span>
              <h3 className="arvr-card-v2__title">Walk through it.</h3>
              <p className="arvr-card-v2__desc">
                Put on a headset and step inside. Full six-degrees-of-freedom tracking lets you walk room to room, look up at ceilings, crouch to check fixtures — experience the space as if it were already built.
              </p>
              <ul className="arvr-card-v2__list">
                {VR_FEATURES.map((f, i) => (
                  <li key={i} className="arvr-card-v2__item">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ USE CASES ═══════════ */}
      <section className="about-section about-section--alt">
        <div className="about-container">
          <div className="about-section-header reveal">
            <span className="about-label-sm">Use Cases</span>
            <h2 className="about-heading-lg">Built for every stakeholder.</h2>
          </div>
          <div className="arvr-usecases-grid">
            {USE_CASES.map((uc, i) => (
              <div key={i} className={`about-value-card reveal ${i > 0 ? `about-reveal-delay-${Math.min(i, 3)}` : ''}`}>
                <div className="about-value-card__icon">{uc.icon}</div>
                <h3 className="about-value-card__title">{uc.title}</h3>
                <p className="about-value-card__desc">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ GETTING STARTED STEPS ═══════════ */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-section-header reveal">
            <span className="about-label-sm">Getting Started</span>
            <h2 className="about-heading-lg">Three steps to immersion.</h2>
          </div>
          <div className="arvr-steps-v2">
            {STEPS.map((step, i) => (
              <div key={i} className={`arvr-step-v2 reveal ${i > 0 ? `about-reveal-delay-${i}` : ''}`}>
                <div className="arvr-step-v2__icon">{step.icon}</div>
                <span className="about-step__num">{step.num}</span>
                <h3 className="about-step__title">{step.title}</h3>
                <p className="about-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPATIBILITY TABLE ═══════════ */}
      <section className="about-section about-section--alt">
        <div className="about-container">
          <div className="about-section-header reveal">
            <span className="about-label-sm">Compatibility</span>
            <h2 className="about-heading-lg">Platform support.</h2>
          </div>
          <div className="arvr-compat-v2 reveal">
            <table className="arvr-compat-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>AR</th>
                  <th>VR</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {COMPAT_DATA.map((row, i) => (
                  <tr key={i}>
                    <td className="arvr-compat-table__platform">{row.platform}</td>
                    <td>{row.ar ? <CheckSvg /> : <DashSvg />}</td>
                    <td>{row.vr ? <CheckSvg /> : <DashSvg />}</td>
                    <td className="arvr-compat-table__notes">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-section-header reveal">
            <span className="about-label-sm">FAQ</span>
            <h2 className="about-heading-lg">Common questions.</h2>
          </div>
          <div className="arvr-faq-list">
            {FAQ_DATA.map((item, i) => (
              <div key={i} className="arvr-faq-item reveal">
                <h3 className="arvr-faq-item__q">{item.q}</h3>
                <p className="arvr-faq-item__a">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="about-section about-section--alt">
        <div className="about-container">
          <div className="about-cta-band reveal">
            <h2 className="about-heading-lg">Ready to experience your space?</h2>
            <p className="about-cta-band__sub">
              Upload a floor plan and explore it in AR or VR — right from your browser.
            </p>
            <div className="about-cta-band__actions">
              <Link to="/" className="btn-primary">
                Try It Free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <Link to="/contact" className="about-btn-secondary">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
