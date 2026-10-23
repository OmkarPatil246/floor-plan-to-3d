import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 300;
const FRAME_PATH = (i) => `/frames2/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`;

// Scroll stages — shorter text, positioned at bottom so background stays visible
const STAGES = [
  {
    start: 0, end: 0.15, align: 'center', position: 'bottom',
    headline: 'Any floor plan. Understood instantly.',
    subtitle: 'Upload a sketch, scan, or CAD file.',
    showScrollIndicator: true,
  },
  {
    start: 0.15, end: 0.40, align: 'left', position: 'bottom',
    headline: 'Walls & openings — detected automatically.',
    stats: [
      { value: '97%', label: 'wall accuracy' },
      { value: '92%', label: 'door & window recall' },
    ],
  },
  {
    start: 0.40, end: 0.70, align: 'right', position: 'bottom',
    headline: 'Real-world scale, extracted automatically.',
    subtitle: 'OCR reads dimensions — accurate to 2 cm.',
  },
  {
    start: 0.70, end: 0.90, align: 'center', position: 'bottom',
    headline: 'A complete 3D-ready model. In seconds.',
  },
  {
    start: 0.90, end: 1.0, align: 'center', position: 'center',
    headline: 'See your blueprint become a house.',
    isCTA: true,
  },
];

function getStageOpacity(progress, stageStart, stageEnd) {
  const duration = stageEnd - stageStart;
  const fadeZone = Math.min(0.04, duration * 0.25);

  if (progress < stageStart || progress > stageEnd) return 0;

  const fadeInEnd = stageStart + fadeZone;
  const fadeOutStart = stageEnd - fadeZone;

  if (progress < fadeInEnd) {
    return (progress - stageStart) / fadeZone;
  }
  if (progress > fadeOutStart) {
    return (stageEnd - progress) / fadeZone;
  }
  return 1;
}

export default function Hero() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const frameObjRef = useRef({ frame: 0 });
  const progressRef = useRef(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [stageOpacities, setStageOpacities] = useState(STAGES.map(() => 0));
  const [endOverlayOpacity, setEndOverlayOpacity] = useState(0);
  const [scrollIndicatorOpacity, setScrollIndicatorOpacity] = useState(1);

  // Draw a frame to canvas
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const frameIndex = Math.min(Math.round(frameObjRef.current.frame), TOTAL_FRAMES - 1);
    const img = imagesRef.current[frameIndex];

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Cover-fit the image
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = canvas.width / canvas.height;
      let drawW, drawH, drawX, drawY;

      if (canvasRatio > imgRatio) {
        drawW = canvas.width;
        drawH = canvas.width / imgRatio;
        drawX = 0;
        drawY = (canvas.height - drawH) / 2;
      } else {
        drawH = canvas.height;
        drawW = canvas.height * imgRatio;
        drawX = (canvas.width - drawW) / 2;
        drawY = 0;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
  }, []);

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0;
    const images = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = () => {
        loadedCount++;
        setLoadProgress(loadedCount / TOTAL_FRAMES);
        if (i === 0) renderFrame();
      };
      images.push(img);
    }

    imagesRef.current = images;
  }, [renderFrame]);

  // Setup canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderFrame();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [renderFrame]);

  // GSAP ScrollTrigger for frame sequence
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const tween = gsap.to(frameObjRef.current, {
      frame: TOTAL_FRAMES - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current = p;

          // Render canvas frame
          renderFrame();

          // Update stage opacities
          const newOpacities = STAGES.map((stage) =>
            getStageOpacity(p, stage.start, stage.end)
          );
          setStageOpacities(newOpacities);

          // White overlay for final transition (93-100%) — matches white theme
          if (p > 0.93) {
            setEndOverlayOpacity(Math.min((p - 0.93) / 0.07, 1));
          } else {
            setEndOverlayOpacity(0);
          }

          // Hide scroll indicator after 5% scroll
          setScrollIndicatorOpacity(p < 0.05 ? 1 - p / 0.05 : 0);
        },
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [renderFrame]);

  return (
    <section ref={sectionRef} className="hero-section" id="overview">
      <div className="hero-sticky">
        {/* Canvas */}
        <canvas ref={canvasRef} className="hero-canvas" />

        {/* End-of-scroll white overlay */}
        <div
          className="hero-dark-overlay"
          style={{ opacity: endOverlayOpacity }}
        />

        {/* Loading bar */}
        {loadProgress < 1 && (
          <div className="hero-loader">
            <div
              className="hero-loader__bar"
              style={{ width: `${loadProgress * 100}%` }}
            />
          </div>
        )}

        {/* Text overlays — positioned at bottom to keep background visible */}
        <div className="hero-overlays">
          {STAGES.map((stage, i) => {
            const opacity = stageOpacities[i];
            const translateY = (1 - Math.min(opacity * 2, 1)) * 20;

            let alignClass = 'hero-stage--center';
            if (stage.align === 'left') alignClass = 'hero-stage--left';
            if (stage.align === 'right') alignClass = 'hero-stage--right';

            const positionClass = stage.position === 'bottom' ? 'hero-stage--bottom' : '';

            return (
              <div
                key={i}
                className={`hero-stage ${alignClass} ${positionClass} ${opacity > 0.01 ? 'hero-stage--visible' : ''}`}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                }}
              >
                <div className="hero-stage__glass">
                  <h1 className="hero-stage__headline heading-display">
                    {stage.headline}
                  </h1>

                {stage.subtitle && (
                  <p className="hero-stage__subtitle body-large">
                    {stage.subtitle}
                  </p>
                )}

                {stage.stats && (
                  <div className="hero-stage__stat">
                    {stage.stats.map((stat, j) => (
                      <span key={j}>
                        {j > 0 && <span className="dot" style={{ display: 'inline-block', margin: '0 12px' }}>·</span>}
                        <span className="accent">{stat.value}</span>{' '}
                        <span style={{ color: 'var(--body-hero)' }}>
                          {stat.label}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {stage.isCTA && (
                  <div className="hero-stage__actions">
                    <a href="#cta" className="btn-primary">
                      Generate My 3D Model
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                    <a href="#" className="btn-ghost" style={{ color: 'var(--body-hero)', borderBottomColor: 'rgba(26,35,51,0.2)' }}>
                      Watch a 60-second demo
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <polygon points="5,3 11,7 5,11" fill="currentColor"/>
                      </svg>
                    </a>
                  </div>
                )}
                </div>{/* close .hero-stage__glass */}
              </div>
            );
          })}
        </div>

        {/* Scroll indicator */}
        <div
          className="scroll-indicator"
          style={{ opacity: scrollIndicatorOpacity }}
        >
          <span className="scroll-indicator__text">Scroll to explore</span>
          <div className="scroll-indicator__line" />
        </div>
      </div>
    </section>
  );
}
