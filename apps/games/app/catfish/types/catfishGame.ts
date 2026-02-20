import type { Timestamp } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Phase types
// ---------------------------------------------------------------------------

export const CatfishPhaseType = {
  TextPromptIntro: 'textPromptIntro',
  TextPrompt: 'textPrompt',
  ImagePrompt: 'imagePrompt',
  Voting: 'voting',
  Results: 'results',
} as const;
export type CatfishPhaseType =
  (typeof CatfishPhaseType)[keyof typeof CatfishPhaseType];

// ---------------------------------------------------------------------------
// Prompt phase
// ---------------------------------------------------------------------------

export interface CatfishPromptEntry {
  /** Reference ID of the source prompt document in textPrompts / imagePrompts */
  promptId: string;
  /** Denormalised prompt text; avoids reads during gameplay */
  promptText: string;
  /**
   * [realPlayerId, catfish1Id, catfish2Id]
   * Index 0 is always the genuine player — do NOT expose this order to clients.
   */
  answerers: [string, string, string];
  /** Pre-computed display order shown to voters; same for all clients */
  shuffledAnswerers: [string, string, string];
  /**
   * Keyed by answererId.
   * string = submitted answer (text) or Firebase Storage URL (image).
   * null = timed out or no submission.
   */
  responses: Record<string, string | null>;
}

export interface CatfishPromptPhase {
  type:
    | typeof CatfishPhaseType.TextPromptIntro
    | typeof CatfishPhaseType.TextPrompt
    | typeof CatfishPhaseType.ImagePrompt;
  /** Which of the 3 questions the room is currently answering (0–2) */
  questionIndex: number;
  /** Keyed by the prompt owner's player UID */
  prompts: Record<string, CatfishPromptEntry>;
}

// ---------------------------------------------------------------------------
// Voting phase
// ---------------------------------------------------------------------------

export interface CatfishVotingPhase {
  type: typeof CatfishPhaseType.Voting;
  /** Index in the phases array of the prompt round this vote scores */
  linkedPhaseIndex: number;
  /** e.g. "Will the real {playerName} please stand up?" */
  votingPromptText: string;
  /** Ordered list of prompt-owner player UIDs to vote through */
  votingOrder: string[];
  /** Current position in votingOrder; advanced by the server */
  currentVotingIndex: number;
  /**
   * Nested map: votes[promptOwnerId][voterId] = answererId they chose.
   */
  votes: Record<string, Record<string, string>>;
}

// ---------------------------------------------------------------------------
// Results phase
// ---------------------------------------------------------------------------

export interface CatfishResultsPhase {
  type: typeof CatfishPhaseType.Results;
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export type CatfishPhase =
  | CatfishPromptPhase
  | CatfishVotingPhase
  | CatfishResultsPhase;

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface CatfishGamePlayer {
  username: string;
  joinedAt: Timestamp;
  isHost: boolean;
  /** Firebase Storage URL set during the profile picture phase */
  profilePictureUrl: string | null;
  /** Running total; incremented after each voting phase */
  score: number;
}

// ---------------------------------------------------------------------------
// Game document
// ---------------------------------------------------------------------------

export interface CatfishGameDocument {
  gameCode: string;
  gameType: 'catfish';
  hostUid: string;
  status: 'lobby' | 'playing' | 'finished';
  minPlayers: number;
  maxPlayers: number;
  createdAt: Timestamp;
  /** Index into the phases array — the single source of truth for game progression */
  currentPhaseIndex: number;
  /**
   * Server-set deadline for the current timed window.
   * null until the timing backend is implemented.
   */
  phaseDeadline: Timestamp | null;
  /** Keyed by player UID */
  players: Record<string, CatfishGamePlayer>;
  /** Full ordered playlist of game events; written once at startGame */
  phases: CatfishPhase[];
}
