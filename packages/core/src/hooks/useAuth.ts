'use client';

import { useState, useEffect } from 'react';

import { onAuthStateChange, signInAnonymously } from '../services/authService';
import { logError } from '../utils/logger';

interface AuthState {
  uid: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Manages anonymous Firebase authentication.
 * Automatically signs in anonymously if no session exists.
 * The auth state persists between page reloads via Firebase's internal storage.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    uid: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        setState({
          uid: user.uid,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        // No existing session — sign in anonymously
        try {
          await signInAnonymously();
          // onAuthStateChanged will fire again with the new user
        } catch (error) {
          logError('useAuth: anonymous sign-in failed', error);
          setState({ uid: null, isLoading: false, isAuthenticated: false });
        }
      }
    });

    return unsubscribe;
  }, []);

  return state;
}
