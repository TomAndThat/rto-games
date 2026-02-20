import { describe, it, expect } from 'vitest';
import { GameError, GameErrorCode } from './errors';

describe('GameError', () => {
  it('creates error with message and code', () => {
    const error = new GameError('Game not found', GameErrorCode.GameNotFound);

    expect(error.message).toBe('Game not found');
    expect(error.code).toBe('GAME_NOT_FOUND');
    expect(error.name).toBe('GameError');
  });

  it('is instanceof Error', () => {
    const error = new GameError('Test error', GameErrorCode.NotAuthorised);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GameError);
  });

  it('preserves stack trace', () => {
    const error = new GameError('Test error', GameErrorCode.GameFull);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('GameError');
  });

  describe('error codes', () => {
    it('provides all expected error codes', () => {
      expect(GameErrorCode.GameNotFound).toBe('GAME_NOT_FOUND');
      expect(GameErrorCode.GameAlreadyStarted).toBe('GAME_ALREADY_STARTED');
      expect(GameErrorCode.AlreadyInGame).toBe('ALREADY_IN_GAME');
      expect(GameErrorCode.NotAuthorised).toBe('NOT_AUTHORISED');
      expect(GameErrorCode.GameFull).toBe('GAME_FULL');
      expect(GameErrorCode.CodeGenerationFailed).toBe('CODE_GENERATION_FAILED');
      expect(GameErrorCode.AuthRequired).toBe('AUTH_REQUIRED');
      expect(GameErrorCode.GameDeleted).toBe('GAME_DELETED');
    });

    it('can be used to create specific errors', () => {
      const notAuthorisedError = new GameError(
        'User not authorised to perform this action',
        GameErrorCode.NotAuthorised,
      );
      const gameFullError = new GameError(
        'Cannot join: game is full',
        GameErrorCode.GameFull,
      );

      expect(notAuthorisedError.code).toBe('NOT_AUTHORISED');
      expect(gameFullError.code).toBe('GAME_FULL');
    });
  });

  describe('error handling patterns', () => {
    it('can be caught and inspected', () => {
      try {
        throw new GameError('Game already started', GameErrorCode.GameAlreadyStarted);
      } catch (error) {
        expect(error).toBeInstanceOf(GameError);
        if (error instanceof GameError) {
          expect(error.code).toBe('GAME_ALREADY_STARTED');
          expect(error.message).toBe('Game already started');
        }
      }
    });

    it('allows code-based error handling', () => {
      const error = new GameError('Auth required', GameErrorCode.AuthRequired);

      // Simulate downstream error handling
      const getUserMessage = (err: GameError): string => {
        switch (err.code) {
          case GameErrorCode.AuthRequired:
            return 'Please sign in to continue';
          case GameErrorCode.GameFull:
            return 'This game is full';
          default:
            return 'Something went wrong';
        }
      };

      expect(getUserMessage(error)).toBe('Please sign in to continue');
    });
  });
});
