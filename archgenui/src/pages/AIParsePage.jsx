// src/pages/AIParsePage.jsx — Redirect to Backend AI Parser
import { useEffect } from 'react';

export default function AIParsePage() {
  useEffect(() => {
    // Redirect to the backend AI parser on localhost:8080
    window.location.href = 'http://localhost:8080';
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#F4F5F7',
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        animation: 'spin 1s linear infinite',
        width: '50px',
        height: '50px',
        border: '4px solid #E5E7EB',
        borderTop: '4px solid #1E3A5F',
        borderRadius: '50%',
        marginBottom: '20px'
      }}></div>
      <h2 style={{ color: '#111827', marginBottom: '10px' }}>Redirecting to AI Floor Plan Parser...</h2>
      <p style={{ color: '#6B7280' }}>Taking you to the 3D viewer interface</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
