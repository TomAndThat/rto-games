/**
 * Error codes used by the core game services.
 * Games should map these to user-facing messages (in British English).
 */
export const GameErrorCode = {
  GameNotFound: 'GAME_NOT_FOUND',
  GameAlreadyStarted: 'GAME_ALREADY_STARTED',
  AlreadyInGame: 'ALREADY_IN_GAME',
  NotAuthorised: 'NOT_AUTHORISED',
  GameFull: 'GAME_FULL',
  CodeGenerationFailed: 'CODE_GENERATION_FAILED',
  AuthRequired: 'AUTH_REQUIRED',
  GameDeleted: 'GAME_DELETED',
} as const;
export type GameErrorCode = (typeof GameErrorCode)[keyof typeof GameErrorCode];

/**
 * Structured error thrown by core game services.
 * Includes a machine-readable code for downstream error handling.
 */
export class GameError extends Error {
  public readonly code: GameErrorCode;

  constructor(message: string, code: GameErrorCode) {
    super(message);
    this.name = 'GameError';
    this.code = code;
  }
}
