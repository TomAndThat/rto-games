import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

const timestampSchema = z.custom<Timestamp>(
  (val) => val instanceof Timestamp,
  { message: 'Expected a Firestore Timestamp' },
);

/**
 * Schema for a player entry within the game document's players map.
 * Uses `.passthrough()` to preserve game-specific fields (e.g. profilePictureUrl).
 */
export const gamePlayerSchema = z
  .object({
    username: z.string(),
    joinedAt: timestampSchema,
    isHost: z.boolean(),
  })
  .passthrough();

/**
 * Schema for the top-level game document in the `games` collection.
 */
export const gameDocumentSchema = z.object({
  gameCode: z.string(),
  gameType: z.string(),
  hostUid: z.string(),
  status: z.enum(['lobby', 'playing', 'finished']),
  minPlayers: z.number(),
  maxPlayers: z.number(),
  createdAt: timestampSchema,
  players: z.record(z.string(), gamePlayerSchema),
});

export type GameDocumentParsed = z.infer<typeof gameDocumentSchema>;

/**
 * Schema for the game code lookup document in the `gameCodeLookup` collection.
 */
export const gameCodeLookupSchema = z.object({
  gameId: z.string(),
  createdAt: timestampSchema,
});

export type GameCodeLookupParsed = z.infer<typeof gameCodeLookupSchema>;
