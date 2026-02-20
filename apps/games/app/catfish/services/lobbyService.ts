import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import {
  GameError,
  GameErrorCode,
  GAME_CODE_CHARS,
  GAME_CODE_LENGTH,
  MAX_CODE_GENERATION_ATTEMPTS,
} from '@rto-games/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < GAME_CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * GAME_CODE_CHARS.length);
    code += GAME_CODE_CHARS[index] ?? 'A';
  }
  return code;
}

// ---------------------------------------------------------------------------
// Player data shape accepted by lobby writes
// ---------------------------------------------------------------------------

/** Validated player fields written to the game document. */
interface LobbyPlayerData {
  username: string;
  profilePictureUrl: string;
}

// ---------------------------------------------------------------------------
// createGame
// ---------------------------------------------------------------------------

export interface CreateGameResult {
  gameId: string;
  gameCode: string;
}

/**
 * Create a new lobby game document and its corresponding code lookup entry.
 * Server-side only — uses the Admin SDK.
 */
export async function createGame(
  db: Firestore,
  hostUid: string,
  gameType: string,
  playerData: LobbyPlayerData,
  options: { minPlayers: number; maxPlayers: number },
  collectionName: string,
): Promise<CreateGameResult> {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const gameCode = generateGameCode();

    try {
      const gameId = await db.runTransaction(async (transaction) => {
        const lookupRef = db
          .collection(`${collectionName}_code_lookup`)
          .doc(gameCode);
        const lookupSnap = await transaction.get(lookupRef);

        if (lookupSnap.exists) {
          throw new GameError(
            'Game code already in use',
            GameErrorCode.CodeGenerationFailed,
          );
        }

        const gameRef = db.collection(collectionName).doc();

        transaction.set(gameRef, {
          gameCode,
          gameType,
          hostUid,
          status: 'lobby',
          minPlayers: options.minPlayers,
          maxPlayers: options.maxPlayers,
          createdAt: FieldValue.serverTimestamp(),
          players: {
            [hostUid]: {
              username: playerData.username,
              profilePictureUrl: playerData.profilePictureUrl,
              joinedAt: Timestamp.now(),
              isHost: true,
            },
          },
        });

        transaction.set(lookupRef, {
          gameId: gameRef.id,
          createdAt: FieldValue.serverTimestamp(),
        });

        return gameRef.id;
      });

      return { gameId, gameCode };
    } catch (error) {
      // Retry only on code collision; propagate everything else
      if (
        error instanceof GameError &&
        error.code === GameErrorCode.CodeGenerationFailed &&
        attempt < MAX_CODE_GENERATION_ATTEMPTS - 1
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new GameError(
    'Failed to generate unique game code',
    GameErrorCode.CodeGenerationFailed,
  );
}

// ---------------------------------------------------------------------------
// joinGame
// ---------------------------------------------------------------------------

export interface JoinGameResult {
  gameId: string;
  gameType: string;
}

/**
 * Add a player to an existing lobby game.
 * Server-side only — uses the Admin SDK.
 */
export async function joinGame(
  db: Firestore,
  gameCode: string,
  uid: string,
  playerData: LobbyPlayerData,
  collectionName: string,
): Promise<JoinGameResult> {
  const lookupRef = db
    .collection(`${collectionName}_code_lookup`)
    .doc(gameCode.toUpperCase());
  const lookupSnap = await lookupRef.get();

  if (!lookupSnap.exists) {
    throw new GameError('Game not found', GameErrorCode.GameNotFound);
  }

  const lookupData = lookupSnap.data() as { gameId: string };
  const gameId = lookupData.gameId;

  let resolvedGameType = '';

  await db.runTransaction(async (transaction) => {
    const gameRef = db.collection(collectionName).doc(gameId);
    const gameSnap = await transaction.get(gameRef);

    if (!gameSnap.exists) {
      throw new GameError('Game no longer exists', GameErrorCode.GameNotFound);
    }

    const game = gameSnap.data() as {
      status: string;
      gameType: string;
      players: Record<string, unknown>;
      maxPlayers: number;
    };

    resolvedGameType = game.gameType;

    if (game.status !== 'lobby') {
      throw new GameError(
        'This game has already started',
        GameErrorCode.GameAlreadyStarted,
      );
    }

    if (game.players[uid] !== undefined) {
      throw new GameError('Already in this game', GameErrorCode.AlreadyInGame);
    }

    const playerCount = Object.keys(game.players).length;
    if (playerCount >= game.maxPlayers) {
      throw new GameError('Game is full', GameErrorCode.GameFull);
    }

    transaction.update(gameRef, {
      [`players.${uid}`]: {
        username: playerData.username,
        profilePictureUrl: playerData.profilePictureUrl,
        joinedAt: Timestamp.now(),
        isHost: false,
      },
    });
  });

  return { gameId, gameType: resolvedGameType };
}

// ---------------------------------------------------------------------------
// removePlayer
// ---------------------------------------------------------------------------

export interface RemovePlayerResult {
  gameDeleted: boolean;
  gameType: string;
  affectedUids: string[];
}

/**
 * Remove a player from a game.
 * Only the host or the player themselves may request removal.
 * Removing the host deletes the entire game and its lookup entry.
 * Server-side only — uses the Admin SDK.
 */
export async function removePlayer(
  db: Firestore,
  gameId: string,
  targetUid: string,
  requestingUid: string,
  collectionName: string,
): Promise<RemovePlayerResult> {
  return db.runTransaction(async (transaction) => {
    const gameRef = db.collection(collectionName).doc(gameId);
    const gameSnap = await transaction.get(gameRef);

    if (!gameSnap.exists) {
      throw new GameError('Game not found', GameErrorCode.GameNotFound);
    }

    const game = gameSnap.data() as {
      hostUid: string;
      gameCode: string;
      gameType: string;
      players: Record<string, unknown>;
    };

    // Authorisation: only the host or the targeted player may remove
    if (requestingUid !== game.hostUid && requestingUid !== targetUid) {
      throw new GameError(
        'Not authorised to remove this player',
        GameErrorCode.NotAuthorised,
      );
    }

    // Removing the host deletes the entire game
    if (targetUid === game.hostUid) {
      const lookupRef = db
        .collection(`${collectionName}_code_lookup`)
        .doc(game.gameCode);
      transaction.delete(gameRef);
      transaction.delete(lookupRef);
      return {
        gameDeleted: true,
        gameType: game.gameType,
        affectedUids: Object.keys(game.players),
      };
    }

    transaction.update(gameRef, {
      [`players.${targetUid}`]: FieldValue.delete(),
    });

    return {
      gameDeleted: false,
      gameType: game.gameType,
      affectedUids: [targetUid],
    };
  });
}
