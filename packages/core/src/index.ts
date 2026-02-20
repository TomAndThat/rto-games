// ---- Types ----
export type {
  GamePlayer,
  GameDocument,
  GameCodeLookupDocument,
  PlayerDocument,
  GameRequiredStep,
  GameConfig,
  GameSubscriptionCallbacks,
} from './types';
export { GameStatus } from './types';

// ---- Constants ----
export {
  COLLECTIONS,
  GAME_CODE_CHARS,
  GAME_CODE_LENGTH,
  MAX_CODE_GENERATION_ATTEMPTS,
} from './constants';

// ---- Utilities ----
export { GameError, GameErrorCode, logError, logWarn } from './utils';

// ---- Firebase ----
export {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from './firebase';

// ---- Services ----
export {
  signInAnonymously,
  onAuthStateChange,
  getCurrentUser,
  getPlayerDocument,
  getPlayerGameData,
  setPlayerGameField,
  setPlayerCurrentGame,
  clearPlayerCurrentGame,
  lookupGameByCode,
  getGameById,
  subscribeToGame,
  uploadProfilePicture,
} from './services';

// ---- Schemas (re-exported for game-level validation if needed) ----
export {
  playerDocumentSchema,
  gameDocumentSchema,
  gamePlayerSchema,
  gameCodeLookupSchema,
} from './schemas';

// ---- Pre-lobby orchestration ----
export { getIncompleteStep } from './pre-lobby';

// ---- React hooks ----
export { useAuth } from './hooks/useAuth';
export { usePlayer } from './hooks/usePlayer';
export { useGame } from './hooks/useGame';
