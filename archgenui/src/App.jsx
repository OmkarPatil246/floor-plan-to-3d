// src/App.jsx — Multi-page routing shell
import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ARVRPage from './pages/ARVRPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import AIParsePage from './pages/AIParsePage';
import ProfilePage from './pages/ProfilePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ar-vr" element={<ARVRPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/ai-parse" element={
          <ProtectedRoute><AIParsePage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;
