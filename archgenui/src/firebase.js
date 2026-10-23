// src/firebase.js — Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDHs_z7xc066iNme7VdQyt4baYhSbRgSr0",
  authDomain: "archgen-3d.firebaseapp.com",
  databaseURL: "https://archgen-3d-default-rtdb.firebaseio.com",
  projectId: "archgen-3d",
  storageBucket: "archgen-3d.firebasestorage.app",
  messagingSenderId: "1093489266030",
  appId: "1:1093489266030:web:7447e95ef82ec509fd857f",
  measurementId: "G-5FL82TWFXC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure Google Provider with additional settings
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Handle persistence with fallback for IndexedDB errors
const initializeAuthPersistence = async () => {
  try {
    // Try to use local persistence (IndexedDB)
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Firebase: Using local persistence (IndexedDB)');
  } catch (error) {
    console.warn('⚠️ Firebase: IndexedDB not available, trying session storage:', error.message);
    
    try {
      // Fallback to session persistence
      await setPersistence(auth, browserSessionPersistence);
      console.log('✅ Firebase: Using session persistence');
    } catch (sessionError) {
      console.warn('⚠️ Firebase: Session storage not available, using in-memory:', sessionError.message);
      
      try {
        // Final fallback to in-memory (no persistence)
        await setPersistence(auth, inMemoryPersistence);
        console.log('ℹ️ Firebase: Using in-memory persistence (no persistence across refreshes)');
      } catch (memoryError) {
        console.error('❌ Firebase: All persistence methods failed:', memoryError);
      }
    }
  }
};

// Initialize persistence on load
initializeAuthPersistence().catch(err => {
  console.error('Failed to initialize Firebase auth persistence:', err);
});

// Database initialization
const database = getDatabase(app);

export { auth, googleProvider, database };
export default app;
