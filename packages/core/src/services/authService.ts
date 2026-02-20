import {
  signInAnonymously as firebaseSignInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User, Unsubscribe } from 'firebase/auth';

import { getFirebaseAuth } from '../firebase/config';

/**
 * Sign in the current user anonymously.
 * Firebase auth persists the session automatically.
 */
export async function signInAnonymously(): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await firebaseSignInAnonymously(auth);
  return result.user;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function for cleanup.
 */
export function onAuthStateChange(
  callback: (user: User | null) => void,
): Unsubscribe {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

/** Returns the currently signed-in user, or null. */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}
