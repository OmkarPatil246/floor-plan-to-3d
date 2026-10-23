import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PIPELINE = [
  { name: 'Pre-processing', desc: 'Image normalization, noise reduction, and contrast enhancement.' },
  { name: 'Scale Detection', desc: 'OCR reads dimension annotations and computes real-world scale factor.' },
  { name: 'Wall Detection', desc: 'CNN-based segmentation identifies all wall segments and junctions.' },
  { name: 'Room Segmentation', desc: 'Flood-fill + graph-cut algorithms partition the plan into discrete rooms.' },
  { name: 'Opening Detection', desc: 'Doors, windows, and archways located via template matching + ML.' },
  { name: 'Room Classification', desc: 'Each room classified by function — bedroom, kitchen, bathroom, etc.' },
];

const ACCURACY_DATA = [
  { metric: 'Wall Detection', precision: '97%', recall: '95%', isHigh: true },
  { metric: 'Room Segmentation', precision: '95%', recall: '93%', isHigh: true },
  { metric: 'Door / Window Detection', precision: '92%', recall: '90%', isHigh: false },
  { metric: 'Scale Extraction', precision: '±2 cm', recall: '—', isHigh: false },
  { metric: 'Room Classification', precision: '89%', recall: '88%', isHigh: false },
];

export default function AIParser() {
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
          delay: i * 0.08,
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
    <section ref={sectionRef} className="dark-section" id="ai-parser">
      <div className="dark-section__header reveal">
        <span className="caption dark-section__label">AI Floor Plan Parser</span>
        <h2 className="heading-section dark-section__title">
          Six-stage detection pipeline.
        </h2>
        <p className="body-large dark-section__subtitle">
          Every line, wall, room, and opening — extracted with engineering-grade precision.
        </p>
      </div>

      <div className="ai-parser__layout">
        {/* Pipeline stages */}
        <div className="ai-parser__pipeline reveal">
          {PIPELINE.map((stage, i) => (
            <div key={i} className="ai-parser__stage">
              <div className="ai-parser__stage-num">{i + 1}</div>
              <div>
                <div className="ai-parser__stage-name">{stage.name}</div>
                <div className="ai-parser__stage-desc">{stage.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Accuracy table */}
        <div className="ai-parser__table-wrapper reveal">
          <div className="ai-parser__table-header">
            <span className="ai-parser__table-title">Detection Accuracy</span>
          </div>
          <table className="accuracy-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Precision</th>
                <th>Recall</th>
              </tr>
            </thead>
            <tbody>
              {ACCURACY_DATA.map((row, i) => (
                <tr key={i}>
                  <td className="metric-name">{row.metric}</td>
                  <td className={`metric-value ${row.isHigh ? 'metric-value--high' : ''}`}>
                    {row.precision}
                  </td>
                  <td className="metric-value">{row.recall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
