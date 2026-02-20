import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { getFirebaseDb } from '../firebase/config';
import { playerDocumentSchema } from '../schemas/playerSchema';
import { COLLECTIONS } from '../constants';
import { logError } from '../utils/logger';

/**
 * Fetch the full player document for a given uid.
 * Returns null if the document does not exist.
 */
export async function getPlayerDocument(
  uid: string,
): Promise<Record<string, Record<string, unknown>> | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, COLLECTIONS.PLAYERS, uid);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  try {
    const parsed = playerDocumentSchema.parse(snapshot.data());
    return parsed.games;
  } catch (error) {
    logError('getPlayerDocument: validation failed', error);
    return null;
  }
}

/**
 * Fetch per-game player data for a given uid and game type.
 * Returns undefined if the player document or game data does not exist.
 */
export async function getPlayerGameData(
  uid: string,
  gameType: string,
): Promise<Record<string, unknown> | undefined> {
  const games = await getPlayerDocument(uid);
  if (!games) return undefined;
  return games[gameType];
}

/**
 * Set a single field within a player's per-game data.
 * Creates the player document if it does not exist.
 */
export async function setPlayerGameField(
  uid: string,
  gameType: string,
  field: string,
  value: unknown,
): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, COLLECTIONS.PLAYERS, uid);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    await setDoc(docRef, {
      games: { [gameType]: { [field]: value } },
      lastActive: serverTimestamp(),
    });
  } else {
    await updateDoc(docRef, {
      [`games.${gameType}.${field}`]: value,
      lastActive: serverTimestamp(),
    });
  }
}

/**
 * Set the current game ID for a player within a specific game type.
 * This tracks which game session the player is currently in, enabling
 * state restoration on page refresh.
 */
export async function setPlayerCurrentGame(
  uid: string,
  gameType: string,
  gameId: string,
): Promise<void> {
  await setPlayerGameField(uid, gameType, 'currentGameId', gameId);
}

/**
 * Clear the current game ID for a player within a specific game type.
 * Called when a player leaves or is removed from a game.
 */
export async function clearPlayerCurrentGame(
  uid: string,
  gameType: string,
): Promise<void> {
  await setPlayerGameField(uid, gameType, 'currentGameId', null);
}
