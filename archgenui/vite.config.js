import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    headers: {
      // Fix Firebase Google sign-in COOP/COEP warnings
      // 'same-origin-allow-popups' allows OAuth popups to function properly
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      // Additional headers for better security
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
    // Ensure HTTPS is not forced in development
    https: false,
  },
  build: {
    // Ensure source maps for easier debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  // Configure how modules are optimized
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/database'],
  },
});
