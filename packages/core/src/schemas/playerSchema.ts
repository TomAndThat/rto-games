import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

const timestampSchema = z.custom<Timestamp>(
  (val) => val instanceof Timestamp,
  { message: 'Expected a Firestore Timestamp' },
);

/**
 * Schema for validating player documents read from Firestore.
 * The inner game data maps use `z.unknown()` to allow game-specific fields
 * to pass through without the core package needing to know their shape.
 */
export const playerDocumentSchema = z.object({
  games: z.record(z.string(), z.record(z.string(), z.unknown())),
  lastActive: timestampSchema,
});

export type PlayerDocumentParsed = z.infer<typeof playerDocumentSchema>;
