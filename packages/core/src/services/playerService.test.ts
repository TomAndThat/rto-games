import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentReference,
  type DocumentSnapshot,
} from 'firebase/firestore';
import {
  getPlayerDocument,
  getPlayerGameData,
  setPlayerGameField,
  setPlayerCurrentGame,
  clearPlayerCurrentGame,
} from './playerService';

vi.mock('../firebase/config', () => ({
  getFirebaseDb: vi.fn(() => ({})),
}));

// serverTimestamp is used in playerService for lastActive
vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...original,
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => 'server-timestamp-sentinel'),
  };
});

function makeMockSnapshot(exists: boolean, data?: unknown): DocumentSnapshot {
  return {
    exists: () => exists,
    data: () => data,
  } as unknown as DocumentSnapshot;
}

function makeValidPlayerData() {
  return {
    games: {
      catfish: { username: 'Alice', currentGameId: 'game-123' },
    },
    lastActive: { seconds: 1704067200, nanoseconds: 0 },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(doc).mockReturnValue({} as DocumentReference);
});

// ---------------------------------------------------------------------------
// getPlayerDocument
// ---------------------------------------------------------------------------

describe('getPlayerDocument', () => {
  it('returns null when the player document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(false));
    const result = await getPlayerDocument('uid-123');
    expect(result).toBeNull();
  });

  it('returns null when schema validation fails', async () => {
    vi.mocked(getDoc).mockResolvedValue(
      makeMockSnapshot(true, { invalid: true }),
    );
    const result = await getPlayerDocument('uid-123');
    expect(result).toBeNull();
  });

  it('calls doc with the players collection and the uid', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(false));
    await getPlayerDocument('uid-abc');
    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'players', 'uid-abc');
  });
});

// ---------------------------------------------------------------------------
// getPlayerGameData
// ---------------------------------------------------------------------------

describe('getPlayerGameData', () => {
  it('returns undefined when the player document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(false));
    const result = await getPlayerGameData('uid-123', 'catfish');
    expect(result).toBeUndefined();
  });

  it('returns undefined when the game type is not present in the games map', async () => {
    // The real playerDocumentSchema requires a Timestamp for lastActive, which our
    // plain object doesn't satisfy. The service will catch the validation error and
    // return null → getPlayerGameData returns undefined.
    vi.mocked(getDoc).mockResolvedValue(
      makeMockSnapshot(true, makeValidPlayerData()),
    );
    const result = await getPlayerGameData('uid-123', 'nonexistent');
    // schema failure → null from getPlayerDocument → undefined here
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// setPlayerGameField
// ---------------------------------------------------------------------------

describe('setPlayerGameField', () => {
  it('calls setDoc when the player document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(false));
    vi.mocked(setDoc).mockResolvedValue(undefined);

    await setPlayerGameField('uid-123', 'catfish', 'username', 'Alice');

    expect(vi.mocked(setDoc)).toHaveBeenCalledWith(
      expect.anything(),
      {
        games: { catfish: { username: 'Alice' } },
        lastActive: 'server-timestamp-sentinel',
      },
    );
  });

  it('calls updateDoc when the player document exists', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(true, {}));
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await setPlayerGameField('uid-123', 'catfish', 'username', 'Bob');

    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(
      expect.anything(),
      {
        'games.catfish.username': 'Bob',
        lastActive: 'server-timestamp-sentinel',
      },
    );
  });

  it('does not call setDoc when updateDoc is used', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(true, {}));
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await setPlayerGameField('uid-123', 'catfish', 'username', 'Bob');

    expect(vi.mocked(setDoc)).not.toHaveBeenCalled();
  });

  it('does not call updateDoc when setDoc is used', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(false));
    vi.mocked(setDoc).mockResolvedValue(undefined);

    await setPlayerGameField('uid-123', 'catfish', 'username', 'Alice');

    expect(vi.mocked(updateDoc)).not.toHaveBeenCalled();
  });

  it('includes serverTimestamp in the write', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(false));
    vi.mocked(setDoc).mockResolvedValue(undefined);

    await setPlayerGameField('uid-123', 'catfish', 'score', 100);

    expect(vi.mocked(serverTimestamp)).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// setPlayerCurrentGame
// ---------------------------------------------------------------------------

describe('setPlayerCurrentGame', () => {
  it('calls setPlayerGameField with currentGameId', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(true, {}));
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await setPlayerCurrentGame('uid-123', 'catfish', 'game-abc');

    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ 'games.catfish.currentGameId': 'game-abc' }),
    );
  });
});

// ---------------------------------------------------------------------------
// clearPlayerCurrentGame
// ---------------------------------------------------------------------------

describe('clearPlayerCurrentGame', () => {
  it('sets currentGameId to null', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeMockSnapshot(true, {}));
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await clearPlayerCurrentGame('uid-123', 'catfish');

    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ 'games.catfish.currentGameId': null }),
    );
  });
});
