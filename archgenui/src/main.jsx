import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './App.css';
import { suppressExpectedWarnings, checkIndexedDBSupport } from './utils/firebaseErrorHandler';

// Suppress expected Firebase warnings (COOP, IndexedDB)
suppressExpectedWarnings();

// Check IndexedDB support on startup
checkIndexedDBSupport().then((supported) => {
  if (!supported) {
    console.warn('⚠️ IndexedDB not fully supported - auth may not persist across refreshes');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
