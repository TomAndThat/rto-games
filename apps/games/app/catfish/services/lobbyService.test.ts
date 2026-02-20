import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGame, joinGame, removePlayer } from './lobbyService';
import { GameError, GameErrorCode } from '@rto-games/core';

// Mock firebase-admin/firestore at the module level
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => 'server-timestamp'),
    delete: vi.fn(() => 'field-delete-sentinel'),
  },
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1704067200, nanoseconds: 0 })),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MockTransaction {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

interface MockDb {
  collection: ReturnType<typeof vi.fn>;
  runTransaction: ReturnType<typeof vi.fn>;
  transaction: MockTransaction;
}

function makeGameRef(id = 'generated-game-id') {
  return { id, path: `catfish/${id}` };
}

function makeLookupRef(code = 'ABCDEF') {
  return { id: code, path: `catfish_code_lookup/${code}` };
}

function makeTransactionSnapshot(
  exists: boolean,
  data?: Record<string, unknown>,
) {
  return { exists, data: () => data };
}

function makeDb(opts?: {
  lookupExists?: boolean;
  gameData?: Record<string, unknown>;
  transactionReturnsValue?: unknown;
  runTransactionError?: Error;
}): MockDb {
  const transaction: MockTransaction = {
    get: vi.fn().mockResolvedValue(
      makeTransactionSnapshot(opts?.lookupExists ?? false),
    ),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const runTransaction = opts?.runTransactionError
    ? vi.fn().mockRejectedValue(opts.runTransactionError)
    : vi.fn().mockImplementation(async (fn: (t: MockTransaction) => unknown) =>
        fn(transaction),
      );

  const db = {
    collection: vi.fn().mockImplementation((name: string) => ({
      doc: vi.fn().mockImplementation((id?: string) => {
        if (id) return makeLookupRef(id);
        return makeGameRef(); // auto-ID
      }),
    })),
    runTransaction,
    transaction,
  };

  return db as unknown as MockDb;
}

function makeJoinGameDb(opts: {
  lookupExists: boolean;
  lookupData?: { gameId: string };
  gameExists?: boolean;
  gameData?: Record<string, unknown>;
}) {
  const lookupSnap = {
    exists: opts.lookupExists,
    data: () => opts.lookupData,
  };

  // Separate transaction get mock for the game doc
  const transactionGameSnap = makeTransactionSnapshot(
    opts.gameExists ?? true,
    opts.gameData,
  );

  const transaction = {
    get: vi.fn().mockResolvedValue(transactionGameSnap),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const lookupDocRef = {
    get: vi.fn().mockResolvedValue(lookupSnap),
  };

  const gameDocRef = makeGameRef(opts.lookupData?.gameId ?? 'game-123');

  const db = {
    collection: vi.fn().mockImplementation((name: string) => ({
      doc: vi.fn().mockImplementation((id: string) => {
        if (name.endsWith('_code_lookup')) return lookupDocRef;
        return gameDocRef;
      }),
    })),
    runTransaction: vi.fn().mockImplementation(
      async (fn: (t: typeof transaction) => unknown) => fn(transaction),
    ),
    transaction,
  };

  return db as unknown as MockDb;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createGame
// ---------------------------------------------------------------------------

describe('createGame', () => {
  const defaultPlayerData = {
    username: 'Host',
    profilePictureUrl: 'https://example.com/pic.png',
  };

  const defaultOptions = { minPlayers: 3, maxPlayers: 20 };

  it('returns gameId and gameCode on success', async () => {
    const db = makeDb({ lookupExists: false });

    const result = await createGame(
      db as unknown as Parameters<typeof createGame>[0],
      'uid-host',
      'catfish',
      defaultPlayerData,
      defaultOptions,
      'catfish',
    );

    expect(result.gameId).toBe('generated-game-id');
    expect(typeof result.gameCode).toBe('string');
    expect(result.gameCode).toHaveLength(6);
  });

  it('writes the game document and lookup entry in the transaction', async () => {
    const db = makeDb({ lookupExists: false });

    await createGame(
      db as unknown as Parameters<typeof createGame>[0],
      'uid-host',
      'catfish',
      defaultPlayerData,
      defaultOptions,
      'catfish',
    );

    const { transaction } = db;
    expect(vi.mocked(transaction.set)).toHaveBeenCalledTimes(2);
  });

  it('includes host player data in the game document', async () => {
    const db = makeDb({ lookupExists: false });

    await createGame(
      db as unknown as Parameters<typeof createGame>[0],
      'uid-host',
      'catfish',
      { username: 'Alice', profilePictureUrl: 'https://example.com/alice.png' },
      defaultOptions,
      'catfish',
    );

    const { transaction } = db;
    const gameSetCall = vi.mocked(transaction.set).mock.calls[0];
    expect(gameSetCall).toBeDefined();
    const gameDoc = gameSetCall![1] as Record<string, unknown>;
    expect(gameDoc['hostUid']).toBe('uid-host');
    expect(gameDoc['status']).toBe('lobby');
    expect((gameDoc['players'] as Record<string, unknown>)['uid-host']).toBeDefined();
  });

  it('throws CodeGenerationFailed after exhausting all retries on code collision', async () => {
    // Always return lookupExists: true to force retries
    const transaction = {
      get: vi.fn().mockResolvedValue(makeTransactionSnapshot(true)),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const db = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue(makeLookupRef()),
      }),
      runTransaction: vi.fn().mockImplementation(
        async (fn: (t: typeof transaction) => unknown) => fn(transaction),
      ),
      transaction,
    };

    await expect(
      createGame(
        db as unknown as Parameters<typeof createGame>[0],
        'uid-host',
        'catfish',
        defaultPlayerData,
        defaultOptions,
        'catfish',
      ),
    ).rejects.toThrow(GameError);
  });

  it('propagates non-collision errors immediately without retrying', async () => {
    const networkError = new Error('Firestore network error');
    const db = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue(makeLookupRef()),
      }),
      runTransaction: vi.fn().mockRejectedValue(networkError),
    };

    await expect(
      createGame(
        db as unknown as Parameters<typeof createGame>[0],
        'uid-host',
        'catfish',
        defaultPlayerData,
        defaultOptions,
        'catfish',
      ),
    ).rejects.toThrow('Firestore network error');

    // Should not retry — runTransaction called exactly once
    expect(vi.mocked(db.runTransaction)).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// joinGame
// ---------------------------------------------------------------------------

describe('joinGame', () => {
  const playerData = {
    username: 'Player',
    profilePictureUrl: 'https://example.com/pic.png',
  };

  it('throws GameNotFound when no lookup entry exists', async () => {
    const db = makeJoinGameDb({ lookupExists: false });

    await expect(
      joinGame(
        db as unknown as Parameters<typeof joinGame>[0],
        'ABCDEF',
        'uid-player',
        playerData,
        'catfish',
      ),
    ).rejects.toThrow(GameError);

    const error = await joinGame(
      db as unknown as Parameters<typeof joinGame>[0],
      'ABCDEF',
      'uid-player',
      playerData,
      'catfish',
    ).catch((e) => e as GameError);

    expect(error.code).toBe(GameErrorCode.GameNotFound);
  });

  it('throws GameNotFound when game doc no longer exists inside the transaction', async () => {
    const db = makeJoinGameDb({
      lookupExists: true,
      lookupData: { gameId: 'game-123' },
      gameExists: false,
    });

    const error = await joinGame(
      db as unknown as Parameters<typeof joinGame>[0],
      'ABCDEF',
      'uid-player',
      playerData,
      'catfish',
    ).catch((e) => e as GameError);

    expect(error.code).toBe(GameErrorCode.GameNotFound);
  });

  it('throws GameAlreadyStarted when game status is not lobby', async () => {
    const db = makeJoinGameDb({
      lookupExists: true,
      lookupData: { gameId: 'game-123' },
      gameExists: true,
      gameData: {
        status: 'playing',
        gameType: 'catfish',
        players: {},
        maxPlayers: 20,
      },
    });

    const error = await joinGame(
      db as unknown as Parameters<typeof joinGame>[0],
      'ABCDEF',
      'uid-player',
      playerData,
      'catfish',
    ).catch((e) => e as GameError);

    expect(error.code).toBe(GameErrorCode.GameAlreadyStarted);
  });

  it('throws AlreadyInGame when the player is already in the game', async () => {
    const db = makeJoinGameDb({
      lookupExists: true,
      lookupData: { gameId: 'game-123' },
      gameExists: true,
      gameData: {
        status: 'lobby',
        gameType: 'catfish',
        players: { 'uid-player': {} },
        maxPlayers: 20,
      },
    });

    const error = await joinGame(
      db as unknown as Parameters<typeof joinGame>[0],
      'ABCDEF',
      'uid-player',
      playerData,
      'catfish',
    ).catch((e) => e as GameError);

    expect(error.code).toBe(GameErrorCode.AlreadyInGame);
  });

  it('throws GameFull when max players is reached', async () => {
    const db = makeJoinGameDb({
      lookupExists: true,
      lookupData: { gameId: 'game-123' },
      gameExists: true,
      gameData: {
        status: 'lobby',
        gameType: 'catfish',
        players: { p1: {}, p2: {}, p3: {} },
        maxPlayers: 3,
      },
    });

    const error = await joinGame(
      db as unknown as Parameters<typeof joinGame>[0],
      'ABCDEF',
      'uid-player',
      playerData,
      'catfish',
    ).catch((e) => e as GameError);

    expect(error.code).toBe(GameErrorCode.GameFull);
  });

  it('returns gameId and gameType on success', async () => {
    const db = makeJoinGameDb({
      lookupExists: true,
      lookupData: { gameId: 'game-123' },
      gameExists: true,
      gameData: {
        status: 'lobby',
        gameType: 'catfish',
        players: { 'uid-host': {} },
        maxPlayers: 20,
      },
    });

    const result = await joinGame(
      db as unknown as Parameters<typeof joinGame>[0],
      'ABCDEF',
      'uid-player',
      playerData,
      'catfish',
    );

    expect(result.gameId).toBe('game-123');
    expect(result.gameType).toBe('catfish');
  });

  it('uppercases the game code before looking it up', async () => {
    const db = makeJoinGameDb({ lookupExists: false });

    await joinGame(
      db as unknown as Parameters<typeof joinGame>[0],
      'abcdef', // lowercase
      'uid-player',
      playerData,
      'catfish',
    ).catch(() => {}); // ignore the GameNotFound

    expect(vi.mocked(db.collection)).toHaveBeenCalledWith('catfish_code_lookup');

    // The doc should have been called with the uppercased code
    const collectionCalls = vi.mocked(db.collection);
    const lookupCollectionCall = collectionCalls.mock.results[0];
    const docCall = lookupCollectionCall?.value.doc;
    expect(vi.mocked(docCall)).toHaveBeenCalledWith('ABCDEF');
  });
});

// ---------------------------------------------------------------------------
// removePlayer
// ---------------------------------------------------------------------------

function makeRemovePlayerDb(opts: {
  gameExists: boolean;
  gameData?: Record<string, unknown>;
}) {
  const gameSnap = {
    exists: opts.gameExists,
    data: () => opts.gameData,
  };

  const transaction = {
    get: vi.fn().mockResolvedValue(gameSnap),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const gameDocRef = { id: 'game-123', path: 'catfish/game-123' };
  const lookupDocRef = { id: 'ABCDEF', path: 'catfish_code_lookup/ABCDEF' };

  const db = {
    collection: vi.fn().mockImplementation((name: string) => ({
      doc: vi.fn().mockImplementation((id: string) => {
        if (name.endsWith('_code_lookup')) return lookupDocRef;
        return gameDocRef;
      }),
    })),
    runTransaction: vi.fn().mockImplementation(
      async (fn: (t: typeof transaction) => unknown) => fn(transaction),
    ),
    transaction,
  };

  return db as unknown as MockDb;
}

describe('removePlayer', () => {
  const hostUid = 'uid-host';
  const playerUid = 'uid-player';

  function makeGameData(overrides?: Partial<Record<string, unknown>>) {
    return {
      hostUid,
      gameCode: 'ABCDEF',
      gameType: 'catfish',
      players: { [hostUid]: {}, [playerUid]: {} },
      ...overrides,
    };
  }

  it('throws GameNotFound when the game does not exist', async () => {
    const db = makeRemovePlayerDb({ gameExists: false });

    const error = await removePlayer(
      db as unknown as Parameters<typeof removePlayer>[0],
      'game-123',
      playerUid,
      hostUid,
      'catfish',
    ).catch((e) => e as GameError);

    expect(error.code).toBe(GameErrorCode.GameNotFound);
  });

  it('throws NotAuthorised when a non-host tries to remove another player', async () => {
    const db = makeRemovePlayerDb({
      gameExists: true,
      gameData: makeGameData(),
    });

    const error = await removePlayer(
      db as unknown as Parameters<typeof removePlayer>[0],
      'game-123',
      hostUid,      // target: host
      playerUid,    // requesting: non-host player tries to kick host
      'catfish',
    ).catch((e) => e as GameError);

    expect(error.code).toBe(GameErrorCode.NotAuthorised);
  });

  it('deletes the game and lookup when the host removes themselves', async () => {
    const db = makeRemovePlayerDb({
      gameExists: true,
      gameData: makeGameData(),
    });

    const result = await removePlayer(
      db as unknown as Parameters<typeof removePlayer>[0],
      'game-123',
      hostUid,   // target: host
      hostUid,   // requesting: host
      'catfish',
    );

    expect(result.gameDeleted).toBe(true);
    expect(result.affectedUids).toContain(hostUid);
    expect(result.affectedUids).toContain(playerUid);
    expect(vi.mocked(db.transaction.delete)).toHaveBeenCalledTimes(2);
  });

  it('updates the game doc (removes player field) when a non-host player leaves', async () => {
    const db = makeRemovePlayerDb({
      gameExists: true,
      gameData: makeGameData(),
    });

    const result = await removePlayer(
      db as unknown as Parameters<typeof removePlayer>[0],
      'game-123',
      playerUid, // target
      playerUid, // requesting (self-leave)
      'catfish',
    );

    expect(result.gameDeleted).toBe(false);
    expect(result.affectedUids).toEqual([playerUid]);
    expect(vi.mocked(db.transaction.update)).toHaveBeenCalledOnce();
    expect(vi.mocked(db.transaction.delete)).not.toHaveBeenCalled();
  });

  it('allows host to remove a non-host player', async () => {
    const db = makeRemovePlayerDb({
      gameExists: true,
      gameData: makeGameData(),
    });

    const result = await removePlayer(
      db as unknown as Parameters<typeof removePlayer>[0],
      'game-123',
      playerUid, // target
      hostUid,   // requesting: host
      'catfish',
    );

    expect(result.gameDeleted).toBe(false);
    expect(result.affectedUids).toEqual([playerUid]);
  });

  it('returns the game type in the result', async () => {
    const db = makeRemovePlayerDb({
      gameExists: true,
      gameData: makeGameData(),
    });

    const result = await removePlayer(
      db as unknown as Parameters<typeof removePlayer>[0],
      'game-123',
      playerUid,
      hostUid,
      'catfish',
    );

    expect(result.gameType).toBe('catfish');
  });
});
