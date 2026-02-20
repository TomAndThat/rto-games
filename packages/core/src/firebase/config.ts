import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-rto-games',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    'demo-rto-games.firebasestorage.app',
};

const isEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let services: FirebaseServices | undefined;
let emulatorConnected = false;

/**
 * Lazily initialise Firebase services and connect emulators when configured.
 * Safe to call multiple times — returns the cached singleton after first init.
 */
function getServices(): FirebaseServices {
  if (services) return services;

  if (typeof window === 'undefined') {
    throw new Error('Firebase must be initialised on the client');
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  if (isEmulator && !emulatorConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    emulatorConnected = true;
  }

  services = { app, auth, db, storage };
  return services;
}

/** Returns the initialised Firebase app instance. */
export function getFirebaseApp(): FirebaseApp {
  return getServices().app;
}

/** Returns the Firebase Auth instance, connected to the emulator in dev. */
export function getFirebaseAuth(): Auth {
  return getServices().auth;
}

/** Returns the Firestore instance, connected to the emulator in dev. */
export function getFirebaseDb(): Firestore {
  return getServices().db;
}

/** Returns the Firebase Storage instance, connected to the emulator in dev. */
export function getFirebaseStorage(): FirebaseStorage {
  return getServices().storage;
}
