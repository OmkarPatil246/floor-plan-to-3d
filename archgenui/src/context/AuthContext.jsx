// src/context/AuthContext.jsx — Authentication context with Firebase
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, googleProvider, database } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Encode / decode helpers for base64 storage
function encodeData(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decodeData(encoded) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read user profile from Realtime Database
  const fetchUserData = useCallback(async (uid) => {
    try {
      const snapshot = await get(ref(database, `users/${uid}`));
      if (snapshot.exists()) {
        const encoded = snapshot.val();
        const decoded = decodeData(encoded.profile);
        setUserData(decoded);
        return decoded;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      return null;
    }
  }, []);

  // Write user profile to Realtime Database (base64 encoded)
  const saveUserData = useCallback(async (uid, data) => {
    try {
      await set(ref(database, `users/${uid}`), {
        profile: encodeData(data),
        updatedAt: Date.now(),
      });
      setUserData(data);
    } catch (err) {
      console.error('Failed to save user data:', err);
      throw err;
    }
  }, []);

  // Listen for auth state changes with error handling
  useEffect(() => {
    let unsubscribe;
    
    try {
      unsubscribe = onAuthStateChanged(
        auth, 
        async (firebaseUser) => {
          try {
            setUser(firebaseUser);
            if (firebaseUser) {
              await fetchUserData(firebaseUser.uid);
            } else {
              setUserData(null);
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
            // Don't throw - just log and continue
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          // Error callback for auth state listener
          console.error('Auth state change error:', error);
          
          // Handle specific Firebase errors
          if (error.code === 'auth/network-request-failed') {
            console.warn('Network error - will retry on next state change');
          } else if (error.message?.includes('Database is closing')) {
            console.warn('IndexedDB error - auth may not persist across refreshes');
          }
          
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to set up auth listener:', error);
      setLoading(false);
    }
    
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth state:', error);
        }
      }
    };
  }, [fetchUserData]);



  // Register with email/password
  const register = async ({ email, password, fullName, username, mobile, professionalInfo, company, country }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profileData = {
      fullName,
      email,
      username,
      mobile,
      professionalInfo,
      company: company || '',
      country: country || '',
      avatar: '',
      createdAt: Date.now(),
    };
    await saveUserData(cred.user.uid, profileData);
    return cred.user;
  };

  // Login with email/password
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  // Login with Google
  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const existing = await fetchUserData(cred.user.uid);
    if (!existing) {
      const profileData = {
        fullName: cred.user.displayName || '',
        email: cred.user.email || '',
        username: cred.user.email?.split('@')[0] || '',
        mobile: cred.user.phoneNumber || '',
        professionalInfo: '',
        company: '',
        country: '',
        avatar: cred.user.photoURL || '',
        createdAt: Date.now(),
      };
      await saveUserData(cred.user.uid, profileData);
    }
    return cred.user;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  // Forgot password
  const resetPassword = async (email) => {
    const actionCodeSettings = {
      url: window.location.origin + '/auth',
      handleCodeInApp: false,
    };
    console.log('[ArchGen] Sending password reset to:', email);
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('[ArchGen] Password reset email sent successfully');
  };

  // Update password
  const changePassword = async (newPassword) => {
    if (!user) throw new Error('Not logged in');
    await updatePassword(user, newPassword);
  };

  // Update profile data
  const updateUserProfile = async (data) => {
    if (!user) throw new Error('Not logged in');
    const merged = { ...userData, ...data };
    await saveUserData(user.uid, merged);
  };

  const value = {
    user,
    userData,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    changePassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
