import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startGame, StartGameError, StartGameErrorCode } from './startGame';

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => 'server-timestamp'),
    delete: vi.fn(() => 'field-delete-sentinel'),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PromptDoc {
  id: string;
  data: () => { text: string; isActive: boolean };
}

function makePromptDocs(count: number, prefix = 'prompt'): PromptDoc[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    data: () => ({ text: `Prompt ${i}`, isActive: true }),
  }));
}

function makeQueryResult(docs: PromptDoc[]) {
  return { docs };
}

function makeGameRef(data?: Record<string, unknown>, exists = true) {
  return {
    get: vi.fn().mockResolvedValue({ exists, data: () => data }),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

function makeQueryChain(docs: PromptDoc[]) {
  const queryRef = {
    where: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(makeQueryResult(docs)),
  };
  return queryRef;
}

/**
 * Build a mock Firestore Admin db for startGame tests.
 * `promptCounts` controls how many active prompts each collection returns.
 */
function makeStartGameDb(opts: {
  gameExists?: boolean;
  gameData?: Record<string, unknown>;
  textPromptCount?: number;
  imagePromptCount?: number;
  votingPromptCount?: number;
}) {
  const {
    gameExists = true,
    gameData,
    textPromptCount = 20,
    imagePromptCount = 20,
    votingPromptCount = 5,
  } = opts;

  const gameRef = {
    get: vi.fn().mockResolvedValue({ exists: gameExists, data: () => gameData }),
    update: vi.fn().mockResolvedValue(undefined),
  };

  const db = {
    collection: vi.fn().mockImplementation((name: string) => {
      if (name === 'catfish') {
        return {
          doc: vi.fn().mockReturnValue(gameRef),
        };
      }
      if (name === 'textPrompts') {
        return makeQueryChain(makePromptDocs(textPromptCount, 'text'));
      }
      if (name === 'imagePrompts') {
        return makeQueryChain(makePromptDocs(imagePromptCount, 'image'));
      }
      if (name === 'votingPrompts') {
        return makeQueryChain(makePromptDocs(votingPromptCount, 'voting'));
      }
      return { doc: vi.fn(), where: vi.fn().mockReturnThis(), get: vi.fn().mockResolvedValue({ docs: [] }) };
    }),
    gameRef,
  };

  return db;
}

function makeValidGameData(
  playerCount = 3,
  overrides?: Partial<Record<string, unknown>>,
) {
  const players: Record<string, unknown> = {};
  for (let i = 0; i < playerCount; i++) {
    players[`uid-player-${i}`] = { username: `Player ${i}`, isHost: i === 0 };
  }
  return {
    hostUid: 'uid-player-0',
    status: 'lobby',
    minPlayers: 3,
    players,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// StartGameError
// ---------------------------------------------------------------------------

describe('StartGameError', () => {
  it('creates an error with message and code', () => {
    const error = new StartGameError('Not host', StartGameErrorCode.NotHost);
    expect(error.message).toBe('Not host');
    expect(error.code).toBe(StartGameErrorCode.NotHost);
    expect(error.name).toBe('StartGameError');
    expect(error).toBeInstanceOf(Error);
  });

  it('provides all expected error codes', () => {
    expect(StartGameErrorCode.GameNotFound).toBe('GAME_NOT_FOUND');
    expect(StartGameErrorCode.NotHost).toBe('NOT_HOST');
    expect(StartGameErrorCode.GameAlreadyStarted).toBe('GAME_ALREADY_STARTED');
    expect(StartGameErrorCode.InsufficientPlayers).toBe('INSUFFICIENT_PLAYERS');
    expect(StartGameErrorCode.InsufficientPrompts).toBe('INSUFFICIENT_PROMPTS');
  });
});

// ---------------------------------------------------------------------------
// startGame — validation
// ---------------------------------------------------------------------------

describe('startGame', () => {
  it('throws GameNotFound when the game document does not exist', async () => {
    const db = makeStartGameDb({ gameExists: false });

    const error = await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    ).catch((e) => e as StartGameError);

    expect(error).toBeInstanceOf(StartGameError);
    expect(error.code).toBe(StartGameErrorCode.GameNotFound);
  });

  it('throws NotHost when the requesting user is not the host', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(3, { hostUid: 'uid-player-0' }),
    });

    const error = await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-1', // not the host
    ).catch((e) => e as StartGameError);

    expect(error.code).toBe(StartGameErrorCode.NotHost);
  });

  it('throws GameAlreadyStarted when status is not lobby', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(3, { status: 'playing' }),
    });

    const error = await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    ).catch((e) => e as StartGameError);

    expect(error.code).toBe(StartGameErrorCode.GameAlreadyStarted);
  });

  it('throws InsufficientPlayers when player count is below minimum', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(2), // 2 players, min is 3
    });

    const error = await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    ).catch((e) => e as StartGameError);

    expect(error.code).toBe(StartGameErrorCode.InsufficientPlayers);
  });

  it('throws InsufficientPrompts when there are not enough text prompts', async () => {
    // 3 players * 2 rounds = 6 text prompts needed; provide only 2
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(3),
      textPromptCount: 2,
      imagePromptCount: 20,
      votingPromptCount: 5,
    });

    const error = await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    ).catch((e) => e as StartGameError);

    expect(error.code).toBe(StartGameErrorCode.InsufficientPrompts);
  });

  it('throws InsufficientPrompts when there are not enough image prompts', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(3),
      textPromptCount: 20,
      imagePromptCount: 2, // insufficient
      votingPromptCount: 5,
    });

    const error = await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    ).catch((e) => e as StartGameError);

    expect(error.code).toBe(StartGameErrorCode.InsufficientPrompts);
  });

  it('throws InsufficientPrompts when there are no voting prompts', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(3),
      textPromptCount: 20,
      imagePromptCount: 20,
      votingPromptCount: 0, // none
    });

    const error = await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    ).catch((e) => e as StartGameError);

    expect(error.code).toBe(StartGameErrorCode.InsufficientPrompts);
  });

  it('resolves without error when all conditions are met', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(3),
      textPromptCount: 20,
      imagePromptCount: 20,
      votingPromptCount: 5,
    });

    await expect(
      startGame(
        db as unknown as Parameters<typeof startGame>[0],
        'game-123',
        'uid-player-0',
      ),
    ).resolves.toBeUndefined();
  });

  it('calls gameRef.update with status playing and phases array', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(3),
      textPromptCount: 20,
      imagePromptCount: 20,
      votingPromptCount: 5,
    });

    await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    );

    const updateCall = vi.mocked(db.gameRef.update).mock.calls[0];
    expect(updateCall).toBeDefined();
    const updateData = updateCall![0] as Record<string, unknown>;
    expect(updateData['status']).toBe('playing');
    expect(Array.isArray(updateData['phases'])).toBe(true);
    expect((updateData['phases'] as unknown[]).length).toBe(9); // 4 prompt + 4 voting + 1 results
    expect(updateData['currentPhaseIndex']).toBe(0);
  });

  it('initialises player scores to 0 in the update', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(3),
      textPromptCount: 20,
      imagePromptCount: 20,
      votingPromptCount: 5,
    });

    await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    );

    const updateCall = vi.mocked(db.gameRef.update).mock.calls[0];
    const updateData = updateCall![0] as Record<string, unknown>;

    // Each player should have a score initialised at 0
    for (let i = 0; i < 3; i++) {
      expect(updateData[`players.uid-player-${i}.score`]).toBe(0);
    }
  });

  it('builds 9 phases total (4 prompt + 4 voting + 1 results)', async () => {
    const db = makeStartGameDb({
      gameExists: true,
      gameData: makeValidGameData(4), // 4 players
      textPromptCount: 30,
      imagePromptCount: 30,
      votingPromptCount: 5,
    });

    await startGame(
      db as unknown as Parameters<typeof startGame>[0],
      'game-123',
      'uid-player-0',
    );

    const updateData = vi.mocked(db.gameRef.update).mock.calls[0]![0] as Record<string, unknown>;
    const phases = updateData['phases'] as unknown[];
    expect(phases).toHaveLength(9);
  });
});
