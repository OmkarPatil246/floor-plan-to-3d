import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

const COMPAT_DATA = [
  { platform: 'iOS Safari (AR)', ar: '✓', vr: '—', notes: 'ARKit Quick Look' },
  { platform: 'Android Chrome (AR)', ar: '✓', vr: '—', notes: 'ARCore Scene Viewer' },
  { platform: 'Meta Quest 2 / 3', ar: '✓', vr: '✓', notes: 'Full 6DOF' },
  { platform: 'HTC Vive / Vive Pro', ar: '—', vr: '✓', notes: 'SteamVR' },
  { platform: 'Desktop Browser', ar: '—', vr: '—', notes: '3D Viewer only' },
];

const CheckIcon = () => (
  <svg viewBox="0 0 10 10" fill="none">
    <path d="M2 5l2.5 2.5L8 3" stroke="#3FD0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function ARVRViewer() {
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
    <section ref={sectionRef} className="dark-section" id="ar-vr">
      <div className="dark-section__header reveal">
        <span className="caption dark-section__label">AR / VR Viewer</span>
        <h2 className="heading-section dark-section__title">
          Step inside your floor plan.
        </h2>
        <p className="body-large dark-section__subtitle">
          From phone screen to headset — experience your model at every scale.
        </p>
      </div>

      {/* AR vs VR split cards */}
      <div className="arvr__grid">
        <div className="arvr__card reveal">
          <span className="arvr__card-badge arvr__card-badge--ar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Augmented Reality
          </span>
          <h3 className="arvr__card-title">See it in your room.</h3>
          <p className="arvr__card-desc">
            Point your phone camera at any flat surface — your 3D house model appears at real-world scale, anchored to the floor. Walk around it, peer through windows, check dimensions against your actual space.
          </p>
          <ul className="arvr__feature-list">
            {AR_FEATURES.map((f, i) => (
              <li key={i} className="arvr__feature-item">
                <span className="arvr__feature-check"><CheckIcon /></span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="arvr__card reveal">
          <span className="arvr__card-badge arvr__card-badge--vr">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="4" width="12" height="7" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1"/>
              <circle cx="9" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1"/>
            </svg>
            Virtual Reality
          </span>
          <h3 className="arvr__card-title">Walk through it.</h3>
          <p className="arvr__card-desc">
            Put on a headset and step inside. Full six-degrees-of-freedom tracking lets you walk room to room, look up at ceilings, crouch to check fixtures — experience the space as if it were already built.
          </p>
          <ul className="arvr__feature-list">
            {VR_FEATURES.map((f, i) => (
              <li key={i} className="arvr__feature-item">
                <span className="arvr__feature-check"><CheckIcon /></span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Compatibility table */}
      <div className="arvr__compat reveal">
        <div className="arvr__compat-title">Platform Compatibility</div>
        <table className="compat-table">
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
                <td style={{ color: 'var(--heading-light)', fontWeight: 500 }}>{row.platform}</td>
                <td className={row.ar === '✓' ? 'check' : ''}>{row.ar}</td>
                <td className={row.vr === '✓' ? 'check' : ''}>{row.vr}</td>
                <td>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
