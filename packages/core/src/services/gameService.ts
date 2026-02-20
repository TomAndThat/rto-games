import { doc, getDoc, onSnapshot } from 'firebase/firestore';

import { getFirebaseDb } from '../firebase/config';
import { gameDocumentSchema, gameCodeLookupSchema } from '../schemas/gameSchema';
import { logError } from '../utils/logger';
import type { GameDocument, GameSubscriptionCallbacks } from '../types';

/**
 * Look up a game document ID by its 6-character game code.
 * Returns null if no active game exists with that code.
 */
export async function lookupGameByCode(
  gameCode: string,
  collectionName: string,
): Promise<string | null> {
  const db = getFirebaseDb();
  const lookupRef = doc(
    db,
    `${collectionName}_code_lookup`,
    gameCode.toUpperCase(),
  );
  const snapshot = await getDoc(lookupRef);

  if (!snapshot.exists()) return null;

  try {
    const parsed = gameCodeLookupSchema.parse(snapshot.data());
    return parsed.gameId;
  } catch (error) {
    logError('lookupGameByCode: validation failed', error);
    return null;
  }
}

/**
 * Fetch a game document by its ID.
 * Returns null if the game does not exist.
 */
export async function getGameById(
  gameId: string,
  collectionName: string,
): Promise<GameDocument | null> {
  const db = getFirebaseDb();
  const gameRef = doc(db, collectionName, gameId);
  const snapshot = await getDoc(gameRef);

  if (!snapshot.exists()) return null;

  try {
    const game = gameDocumentSchema.parse(snapshot.data()) as GameDocument;
    return game;
  } catch (error) {
    logError('getGameById: validation failed', error);
    return null;
  }
}

/**
 * Subscribe to real-time updates on a game document.
 * Returns an unsubscribe function for cleanup.
 */
export function subscribeToGame(
  gameId: string,
  callbacks: GameSubscriptionCallbacks,
  collectionName: string,
): () => void {
  const db = getFirebaseDb();
  const gameRef = doc(db, collectionName, gameId);

  return onSnapshot(
    gameRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callbacks.onDeleted();
        return;
      }

      try {
        const game = gameDocumentSchema.parse(
          snapshot.data(),
        ) as GameDocument;
        callbacks.onData(game);
      } catch (error) {
        logError('subscribeToGame: validation failed', error);
        callbacks.onError(
          error instanceof Error ? error : new Error('Invalid game data'),
        );
      }
    },
    (error) => {
      logError('subscribeToGame: snapshot error', error);
      callbacks.onError(error);
    },
  );
}
