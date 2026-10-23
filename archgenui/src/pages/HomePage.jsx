// src/pages/HomePage.jsx — Home page (white sections after hero)
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import ModelViewer from '../components/ModelViewer';
import AIParser from '../components/AIParser';
import Footer from '../components/Footer';

function SectionDivider() {
  return (
    <div className="section-divider section-divider--light">
      <div className="section-divider__line" />
      <div className="section-divider__cap section-divider__cap--left" />
      <div className="section-divider__cap section-divider__cap--right" />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <main className="home-sections-light">
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <ModelViewer />
        <SectionDivider />
        <AIParser />
      </main>
      <Footer />
    </>
  );
}
