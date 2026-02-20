import { describe, it, expect, vi } from 'vitest';
import { logError, logWarn } from './logger';

describe('logger', () => {
  describe('logError', () => {
    it('logs error with context prefix', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      logError('TestContext', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[RTO Games] TestContext:', error);
      consoleErrorSpy.mockRestore();
    });

    it('handles non-Error objects', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorMessage = 'String error';

      logError('TestContext', errorMessage);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[RTO Games] TestContext:', errorMessage);
      consoleErrorSpy.mockRestore();
    });

    it('includes context in all error logs', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const contexts = ['Firebase', 'GameService', 'PlayerService'];

      contexts.forEach((context) => {
        logError(context, new Error('test'));
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      contexts.forEach((context) => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining(`[RTO Games] ${context}:`),
          expect.any(Error),
        );
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('logWarn', () => {
    it('logs warning with context and message', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logWarn('TestContext', 'This is a warning');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[RTO Games] TestContext: This is a warning',
      );
      consoleWarnSpy.mockRestore();
    });

    it('formats warning message correctly', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logWarn('Lobby', 'Player joined with invalid name');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[RTO Games] Lobby: Player joined with invalid name',
      );
      consoleWarnSpy.mockRestore();
    });
  });
});
