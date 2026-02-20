import { describe, it, expect, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';

// Override the global firebase/firestore mock for this file so that Timestamp is real
vi.mock('firebase/firestore', async (importOriginal) => {
  const { Timestamp: RealTimestamp } =
    await importOriginal<typeof import('firebase/firestore')>();
  return {
    Timestamp: RealTimestamp,
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    serverTimestamp: vi.fn(),
  };
});

import {
  gameDocumentSchema,
  gameCodeLookupSchema,
  gamePlayerSchema,
} from './gameSchema';

function makeTimestamp(): Timestamp {
  return Timestamp.fromDate(new Date('2025-01-01T00:00:00Z'));
}

describe('gamePlayerSchema', () => {
  it('parses a valid player entry', () => {
    const data = {
      username: 'Alice',
      joinedAt: makeTimestamp(),
      isHost: true,
    };
    expect(() => gamePlayerSchema.parse(data)).not.toThrow();
    const result = gamePlayerSchema.parse(data);
    expect(result.username).toBe('Alice');
    expect(result.isHost).toBe(true);
  });

  it('preserves extra fields via passthrough', () => {
    const data = {
      username: 'Bob',
      joinedAt: makeTimestamp(),
      isHost: false,
      profilePictureUrl: 'https://example.com/pic.png',
      score: 42,
    };
    const result = gamePlayerSchema.parse(data);
    expect(result.profilePictureUrl).toBe('https://example.com/pic.png');
    expect(result.score).toBe(42);
  });

  it('rejects a player missing username', () => {
    const data = {
      joinedAt: makeTimestamp(),
      isHost: false,
    };
    expect(() => gamePlayerSchema.parse(data)).toThrow();
  });

  it('rejects a player with a non-Timestamp joinedAt', () => {
    const data = {
      username: 'Bad',
      joinedAt: '2025-01-01',
      isHost: false,
    };
    expect(() => gamePlayerSchema.parse(data)).toThrow();
  });
});

describe('gameDocumentSchema', () => {
  function makeValidGame(overrides?: Record<string, unknown>) {
    return {
      gameCode: 'ABCDEF',
      gameType: 'catfish',
      hostUid: 'uid-host',
      status: 'lobby',
      minPlayers: 3,
      maxPlayers: 20,
      createdAt: makeTimestamp(),
      players: {
        'uid-host': {
          username: 'Host',
          joinedAt: makeTimestamp(),
          isHost: true,
        },
      },
      ...overrides,
    };
  }

  it('parses a valid game document', () => {
    const result = gameDocumentSchema.parse(makeValidGame());
    expect(result.gameCode).toBe('ABCDEF');
    expect(result.gameType).toBe('catfish');
    expect(result.status).toBe('lobby');
    expect(result.players['uid-host']?.username).toBe('Host');
  });

  it('accepts all valid status values', () => {
    for (const status of ['lobby', 'playing', 'finished'] as const) {
      expect(() =>
        gameDocumentSchema.parse(makeValidGame({ status })),
      ).not.toThrow();
    }
  });

  it('rejects an invalid status value', () => {
    expect(() =>
      gameDocumentSchema.parse(makeValidGame({ status: 'unknown' })),
    ).toThrow();
  });

  it('rejects a document missing required fields', () => {
    expect(() => gameDocumentSchema.parse({ gameCode: 'ABCDEF' })).toThrow();
  });

  it('rejects a non-Timestamp createdAt', () => {
    expect(() =>
      gameDocumentSchema.parse(makeValidGame({ createdAt: Date.now() })),
    ).toThrow();
  });

  it('handles multiple players', () => {
    const data = makeValidGame({
      players: {
        'uid-host': { username: 'Host', joinedAt: makeTimestamp(), isHost: true },
        'uid-player2': {
          username: 'Player2',
          joinedAt: makeTimestamp(),
          isHost: false,
        },
      },
    });
    const result = gameDocumentSchema.parse(data);
    expect(Object.keys(result.players)).toHaveLength(2);
  });

  it('handles empty players map', () => {
    const result = gameDocumentSchema.parse(makeValidGame({ players: {} }));
    expect(result.players).toEqual({});
  });
});

describe('gameCodeLookupSchema', () => {
  it('parses a valid lookup document', () => {
    const data = { gameId: 'game-123', createdAt: makeTimestamp() };
    const result = gameCodeLookupSchema.parse(data);
    expect(result.gameId).toBe('game-123');
  });

  it('rejects a lookup document missing gameId', () => {
    expect(() =>
      gameCodeLookupSchema.parse({ createdAt: makeTimestamp() }),
    ).toThrow();
  });

  it('rejects a non-Timestamp createdAt', () => {
    expect(() =>
      gameCodeLookupSchema.parse({ gameId: 'game-123', createdAt: '2025-01-01' }),
    ).toThrow();
  });
});
