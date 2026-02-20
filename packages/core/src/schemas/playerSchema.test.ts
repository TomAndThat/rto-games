import { describe, it, expect, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';

vi.mock('firebase/firestore', async (importOriginal) => {
  const { Timestamp: RealTimestamp } =
    await importOriginal<typeof import('firebase/firestore')>();
  return {
    Timestamp: RealTimestamp,
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(),
  };
});

import { playerDocumentSchema } from './playerSchema';

function makeTimestamp(): Timestamp {
  return Timestamp.fromDate(new Date('2025-01-01T00:00:00Z'));
}

describe('playerDocumentSchema', () => {
  it('parses a valid player document', () => {
    const data = {
      games: {
        catfish: {
          username: 'Alice',
          profilePictureUrl: 'https://example.com/pic.png',
          currentGameId: 'game-123',
        },
      },
      lastActive: makeTimestamp(),
    };
    const result = playerDocumentSchema.parse(data);
    expect(result.games['catfish']?.['username']).toBe('Alice');
    expect(result.games['catfish']?.['currentGameId']).toBe('game-123');
  });

  it('parses a player document with an empty games map', () => {
    const data = {
      games: {},
      lastActive: makeTimestamp(),
    };
    const result = playerDocumentSchema.parse(data);
    expect(result.games).toEqual({});
  });

  it('parses a player document with multiple game types', () => {
    const data = {
      games: {
        catfish: { username: 'Alice' },
        anotherGame: { score: 100 },
      },
      lastActive: makeTimestamp(),
    };
    const result = playerDocumentSchema.parse(data);
    expect(Object.keys(result.games)).toHaveLength(2);
  });

  it('rejects a document missing games', () => {
    expect(() =>
      playerDocumentSchema.parse({ lastActive: makeTimestamp() }),
    ).toThrow();
  });

  it('rejects a document with a non-Timestamp lastActive', () => {
    expect(() =>
      playerDocumentSchema.parse({
        games: {},
        lastActive: '2025-01-01',
      }),
    ).toThrow();
  });

  it('rejects a document where games is not an object', () => {
    expect(() =>
      playerDocumentSchema.parse({
        games: 'not-an-object',
        lastActive: makeTimestamp(),
      }),
    ).toThrow();
  });

  it('accepts game data with unknown field types (z.unknown passthrough)', () => {
    const data = {
      games: {
        catfish: {
          currentGameId: null,
          score: 0,
          someArray: [1, 2, 3],
        },
      },
      lastActive: makeTimestamp(),
    };
    expect(() => playerDocumentSchema.parse(data)).not.toThrow();
  });
});
