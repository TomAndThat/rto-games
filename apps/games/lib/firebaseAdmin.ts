import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Initialise the Firebase Admin SDK singleton.
 * Safe to call multiple times — returns immediately if already initialised.
 *
 * Emulator mode: set FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST
 * in .env.local — the Admin SDK picks these up automatically.
 *
 * Production: set FIREBASE_SERVICE_ACCOUNT_KEY to a base64-encoded
 * service account JSON string.
 */
function initAdmin(): void {
  if (getApps().length > 0) return;

  const isEmulator =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-rto-games';

  if (isEmulator) {
    initializeApp({ projectId });
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required in production',
    );
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountKey, 'base64').toString('utf-8'),
  ) as ServiceAccount;

  initializeApp({ credential: cert(serviceAccount) });
}

initAdmin();

export const adminAuth = getAuth();
export const adminDb = getFirestore();
