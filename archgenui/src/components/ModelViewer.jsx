import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    title: 'WASD Navigation',
    desc: 'Walk through your model with familiar keyboard controls — just like a game engine.',
    icon: (
      <svg viewBox="0 0 22 22" fill="none">
        <rect x="1" y="8" width="6" height="6" rx="1" stroke="#3457FF" strokeWidth="1.5"/>
        <rect x="8" y="8" width="6" height="6" rx="1" stroke="#3FD0E0" strokeWidth="1.5"/>
        <rect x="15" y="8" width="6" height="6" rx="1" stroke="#3457FF" strokeWidth="1.5"/>
        <rect x="8" y="1" width="6" height="6" rx="1" stroke="#3457FF" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    title: 'Orbit & Pan Controls',
    desc: 'Smoothly orbit around your model, zoom in on details, or pan across the entire layout.',
    icon: (
      <svg viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#3457FF" strokeWidth="1.5" strokeDasharray="3 3"/>
        <path d="M11 2a9 9 0 010 18" stroke="#3FD0E0" strokeWidth="1.5"/>
        <circle cx="11" cy="11" r="2" fill="#3457FF"/>
      </svg>
    ),
  },
  {
    title: 'First-Person Walk Mode',
    desc: 'Experience your space at human eye-level — perfect for client walkthroughs and presentations.',
    icon: (
      <svg viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="5" r="3" stroke="#3457FF" strokeWidth="1.5"/>
        <path d="M11 8v6M8 20l3-6 3 6M6 14h10" stroke="#3FD0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Dynamic Sunlight & Shadows',
    desc: 'Adjust time of day to see how natural light moves through every room — real-time ray-traced shadows.',
    icon: (
      <svg viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="4" stroke="#3FD0E0" strokeWidth="1.5"/>
        <path d="M11 3v2M11 17v2M3 11h2M17 11h2M5.6 5.6l1.4 1.4M15 15l1.4 1.4M16.4 5.6l-1.4 1.4M7 15l-1.4 1.4" stroke="#3457FF" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function ModelViewer() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const items = section.querySelectorAll('.reveal');
    items.forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 0.7,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  }, []);

  return (
    <section ref={sectionRef} className="dark-section" id="model-viewer">
      <div className="dark-section__header reveal">
        <span className="caption dark-section__label">3D Model Generator + Viewer</span>
        <h2 className="heading-section dark-section__title">
          Your model. Your controls.
        </h2>
        <p className="body-large dark-section__subtitle">
          A browser-based Three.js viewer with full navigation — no downloads, no plugins.
        </p>
      </div>

      <div className="model-viewer__layout">
        {/* Mockup screen */}
        <div className="model-viewer__mockup reveal">
          <div className="model-viewer__screen">
            <div className="model-viewer__grid-bg" />
            <div className="model-viewer__placeholder">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 6L6 16v16l18 10 18-10V16L24 6z" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M6 16l18 10 18-10M24 26v16" stroke="rgba(52,87,255,0.4)" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <span>Interactive 3D Viewer</span>
            </div>
            <div className="model-viewer__controls">
              <span className="model-viewer__control-key">W</span>
              <span className="model-viewer__control-key">A</span>
              <span className="model-viewer__control-key">S</span>
              <span className="model-viewer__control-key">D</span>
              <span className="model-viewer__control-key" style={{ marginLeft: 8 }}>SCROLL</span>
              <span className="model-viewer__control-key">DRAG</span>
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="model-viewer__features">
          {FEATURES.map((f, i) => (
            <div key={i} className="model-viewer__feature reveal">
              <div className="model-viewer__feature-icon">{f.icon}</div>
              <div>
                <div className="model-viewer__feature-title">{f.title}</div>
                <div className="model-viewer__feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
