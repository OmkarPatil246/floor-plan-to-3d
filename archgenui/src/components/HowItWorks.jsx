import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    num: '01',
    title: 'Upload',
    desc: 'Drag in any floor plan — JPG, PNG, PDF, SVG, or DXF. Even a hand-drawn sketch works.',
    icon: (
      <svg viewBox="0 0 36 36" fill="none">
        <path d="M18 6v16M12 12l6-6 6 6" stroke="#3457FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 22v6a2 2 0 002 2h20a2 2 0 002-2v-6" stroke="#3FD0E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'AI Parses',
    desc: 'ArchGen detects walls, rooms, doors, windows, and dimensions in under 60 seconds.',
    icon: (
      <svg viewBox="0 0 36 36" fill="none">
        <rect x="6" y="6" width="24" height="24" rx="4" stroke="#3457FF" strokeWidth="2"/>
        <path d="M14 14h8M14 18h5" stroke="#3FD0E0" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="25" cy="25" r="5" stroke="#3457FF" strokeWidth="2"/>
        <path d="M28 28l3 3" stroke="#3457FF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: '3D Model Generates',
    desc: 'Walls extrude, floors form, furniture populates — a photorealistic 3D model, built automatically.',
    icon: (
      <svg viewBox="0 0 36 36" fill="none">
        <path d="M18 4L4 12v12l14 8 14-8V12L18 4z" stroke="#3457FF" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M4 12l14 8 14-8M18 20v12" stroke="#3FD0E0" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Explore in AR / VR',
    desc: 'Walk through your model in browser, place it in your room with AR, or enter full immersion in VR.',
    icon: (
      <svg viewBox="0 0 36 36" fill="none">
        <rect x="4" y="12" width="28" height="14" rx="4" stroke="#3457FF" strokeWidth="2"/>
        <circle cx="13" cy="19" r="3" stroke="#3FD0E0" strokeWidth="2"/>
        <circle cx="23" cy="19" r="3" stroke="#3FD0E0" strokeWidth="2"/>
        <path d="M10 12V8M26 12V8" stroke="#3457FF" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function HowItWorks() {
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
    <section ref={sectionRef} className="dark-section" id="how-it-works">
      <div className="dark-section__header reveal">
        <span className="caption dark-section__label">How It Works</span>
        <h2 className="heading-section dark-section__title">
          Four steps. Sixty seconds.
        </h2>
        <p className="body-large dark-section__subtitle">
          From a flat image to a walkable 3D house — the entire pipeline is automated.
        </p>
      </div>

      <div className="how-it-works__grid">
        <div className="how-it-works__connector" />
        {STEPS.map((step, i) => (
          <div key={i} className="how-it-works__step reveal">
            <div className="how-it-works__icon">
              {step.icon}
            </div>
            <span className="how-it-works__number">{step.num}</span>
            <h3 className="heading-card how-it-works__title">{step.title}</h3>
            <p className="how-it-works__desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
