/**
 * Firestore collection names for platform-level (cross-game) data.
 * Game-specific collection names are provided by each game's own config.
 */
export const COLLECTIONS = {
  PLAYERS: 'players',
} as const;

/** Characters used for game code generation. Excludes I, O, Q, L (and digits) to avoid confusion. */
export const GAME_CODE_CHARS = 'ABCDEFGHJKMNPRSTUVWXYZ';

/** Length of generated game codes. */
export const GAME_CODE_LENGTH = 6;

/** Maximum attempts to generate a unique game code before failing. */
export const MAX_CODE_GENERATION_ATTEMPTS = 5;
