// src/utils/firebaseErrorHandler.js
// Centralized Firebase error handling and recovery

/**
 * Handle IndexedDB errors gracefully
 * These errors often occur in:
 * - Private browsing mode
 * - When storage quota is exceeded
 * - When browser security settings block IndexedDB
 */
export function handleIndexedDBError(error) {
  console.warn('IndexedDB Error:', error);
  
  // Check if it's the "Database is closing/hidden" error
  if (error.message?.includes('Database is closing') || 
      error.message?.includes('hidden')) {
    console.log('ℹ️ IndexedDB unavailable - this is common in private browsing mode');
    console.log('ℹ️ User sessions will still work but may not persist after refresh');
    return {
      handled: true,
      userMessage: null, // Don't show error to user
      shouldRetry: false
    };
  }
  
  return {
    handled: false,
    userMessage: 'Storage error - your session may not persist',
    shouldRetry: false
  };
}

/**
 * Handle COOP (Cross-Origin-Opener-Policy) errors
 * These occur with popup windows for OAuth
 */
export function handleCOOPError(error) {
  console.warn('COOP Error:', error);
  
  if (error.message?.includes('Cross-Origin-Opener-Policy')) {
    console.log('ℹ️ COOP warning detected - this is expected with OAuth popups');
    console.log('ℹ️ The authentication should still work correctly');
    return {
      handled: true,
      userMessage: null, // Don't show error to user
      shouldRetry: false
    };
  }
  
  return {
    handled: false,
    userMessage: null,
    shouldRetry: false
  };
}

/**
 * Handle network errors
 */
export function handleNetworkError(error) {
  if (error.code === 'auth/network-request-failed') {
    return {
      handled: true,
      userMessage: 'Network error - please check your connection',
      shouldRetry: true
    };
  }
  
  return {
    handled: false,
    userMessage: null,
    shouldRetry: false
  };
}

/**
 * Main error handler for Firebase errors
 */
export function handleFirebaseError(error, context = 'Firebase operation') {
  console.error(`[${context}]`, error);
  
  // Try each handler
  const handlers = [
    handleIndexedDBError,
    handleCOOPError,
    handleNetworkError
  ];
  
  for (const handler of handlers) {
    const result = handler(error);
    if (result.handled) {
      return result;
    }
  }
  
  // Default handling for unhandled errors
  return {
    handled: true,
    userMessage: error.message || 'An error occurred',
    shouldRetry: false
  };
}

/**
 * Suppress expected console warnings
 * Call this once on app initialization
 */
export function suppressExpectedWarnings() {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // List of warning patterns to suppress
  const suppressPatterns = [
    /Database is closing/,
    /Cross-Origin-Opener-Policy.*window\.closed/,
    /Cross-Origin-Opener-Policy.*window\.close/,
  ];
  
  // Override console.warn
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Check if this warning should be suppressed
    const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message));
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };
  
  // Override console.error for specific Firebase errors
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Check if this is an expected error
    const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message));
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    } else {
      // Log as info instead
      console.info('ℹ️ [Suppressed expected error]:', message);
    }
  };
  
  console.log('✅ Firebase error suppression initialized');
}

/**
 * Check if browser environment supports IndexedDB properly
 */
export async function checkIndexedDBSupport() {
  if (!window.indexedDB) {
    console.warn('IndexedDB not supported in this browser');
    return false;
  }
  
  try {
    // Try to open a test database
    const testDB = 'test-indexeddb-support';
    const request = window.indexedDB.open(testDB, 1);
    
    return await new Promise((resolve) => {
      request.onsuccess = () => {
        window.indexedDB.deleteDatabase(testDB);
        console.log('✅ IndexedDB is available');
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.warn('⚠️ IndexedDB test failed:', event);
        resolve(false);
      };
      
      request.onblocked = () => {
        console.warn('⚠️ IndexedDB is blocked');
        resolve(false);
      };
    });
  } catch (error) {
    console.warn('⚠️ IndexedDB check failed:', error);
    return false;
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error) {
  const errorCode = error.code || '';
  
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/network-request-failed': 'Network error - check your connection',
    'auth/too-many-requests': 'Too many attempts - please try again later',
    'auth/popup-blocked': 'Popup was blocked - please allow popups for this site',
    'auth/popup-closed-by-user': 'Sign-in cancelled',
    'auth/cancelled-popup-request': 'Another sign-in popup is already open',
  };
  
  return errorMessages[errorCode] || error.message?.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '') || 'An error occurred';
}

export default {
  handleFirebaseError,
  handleIndexedDBError,
  handleCOOPError,
  handleNetworkError,
  suppressExpectedWarnings,
  checkIndexedDBSupport,
  getUserFriendlyErrorMessage
};
