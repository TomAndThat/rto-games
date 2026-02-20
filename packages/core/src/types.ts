import type { Timestamp } from 'firebase/firestore';

/**
 * Game lifecycle status values.
 */
export const GameStatus = {
  Lobby: 'lobby',
  Playing: 'playing',
  Finished: 'finished',
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

/**
 * Player entry within the players map of a game document.
 * Core fields are required; game-specific fields (e.g. profilePictureUrl)
 * are preserved via Zod passthrough and the index signature.
 */
export interface GamePlayer {
  username: string;
  joinedAt: Timestamp;
  isHost: boolean;
  [key: string]: unknown;
}

/**
 * Game document stored in the `games` collection.
 */
export interface GameDocument {
  gameCode: string;
  gameType: string;
  hostUid: string;
  status: GameStatus;
  minPlayers: number;
  maxPlayers: number;
  createdAt: Timestamp;
  players: Record<string, GamePlayer>;
}

/**
 * Game code lookup document stored in the `gameCodeLookup` collection.
 */
export interface GameCodeLookupDocument {
  gameId: string;
  createdAt: Timestamp;
}

/**
 * Player document stored in the `players` collection.
 * Per-game data is namespaced under the `games` map.
 */
export interface PlayerDocument {
  games: Record<string, Record<string, unknown>>;
  lastActive: Timestamp;
}

/**
 * A required pre-lobby step that must be satisfied before a player can enter the lobby.
 * Games provide an array of these to define their specific requirements.
 */
export interface GameRequiredStep {
  /** Unique key identifying this requirement (e.g. 'username', 'profilePicture') */
  key: string;
  /** Returns true if the step is satisfied for the given player data */
  validator: (playerGameData: Record<string, unknown> | undefined) => boolean;
}

/**
 * Configuration object provided by each game to the core pre-lobby system.
 */
export interface GameConfig {
  gameType: string;
  /** Firestore collection in which game documents for this game are stored. */
  collectionName: string;
  minPlayers: number;
  maxPlayers: number;
  requiredSteps: GameRequiredStep[];
}

/**
 * Result of creating a new game.
 */
export interface CreateGameResult {
  gameId: string;
  gameCode: string;
}

/**
 * Callbacks for game document real-time subscription.
 */
export interface GameSubscriptionCallbacks {
  onData: (game: GameDocument) => void;
  /** Called when the game document is deleted from Firestore. */
  onDeleted: () => void;
  onError: (error: Error) => void;
}
