import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

interface FirebaseAdminConfig {
  useEmulator: boolean;
}

let db: Firestore | null = null;

/**
 * Initialise Firebase Admin SDK for use in scripts.
 * Connects to emulator when useEmulator is true, otherwise uses production credentials.
 */
export function initializeFirebaseAdmin(
  config: FirebaseAdminConfig = { useEmulator: false }
): Firestore {
  if (db) return db;

  if (getApps().length === 0) {
    if (config.useEmulator) {
      // For emulator, initialise with demo project ID
      initializeApp({
        projectId: 'demo-rto-games',
      });
    } else {
      // For production, use service account credentials
      // Expects GOOGLE_APPLICATION_CREDENTIALS env var to point to service account JSON
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error(
          'GOOGLE_APPLICATION_CREDENTIALS environment variable must be set for production'
        );
      }
      initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      });
    }
  }

  db = getFirestore();

  if (config.useEmulator) {
    // Connect to Firestore emulator
    db.settings({
      host: '127.0.0.1:8080',
      ssl: false,
    });
  }

  return db;
}
