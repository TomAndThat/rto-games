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

/**
 * Maximum subStep value for each prompt phase type.
 * When subStep reaches this value the server advances currentPhaseIndex.
 */
export const CATFISH_MAX_SUBSTEP: Record<string, number> = {
  [CatfishPhaseType.TextPromptIntro]: 5,
  [CatfishPhaseType.TextPrompt]: 2,
  [CatfishPhaseType.ImagePrompt]: 2,
};

/**
 * Maps phase type + subStep → which index in `answerers` is responding.
 * Only prompt subSteps are included; message subSteps are absent.
 *
 * textPromptIntro: 1→0 (own), 3→1 (catfish 1), 4→2 (catfish 2)
 * textPrompt:      0→0,        1→1,              2→2
 * imagePrompt:     0→0,        1→1,              2→2
 */
export const CATFISH_SUBSTEP_ANSWERER_INDEX: Record<string, Record<number, number>> = {
  [CatfishPhaseType.TextPromptIntro]: { 1: 0, 3: 1, 4: 2 },
  [CatfishPhaseType.TextPrompt]: { 0: 0, 1: 1, 2: 2 },
  [CatfishPhaseType.ImagePrompt]: { 0: 0, 1: 1, 2: 2 },
};

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
   * Resolved catfish instruction shown to answerers[1] and answerers[2].
   * e.g. "Put yourself in Alice's shoes and answer this"
   * Stored resolved (player name substituted) at startGame time.
   */
  catfishInstructionText: string;
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
  /**
   * Index of the current sub-step within this phase. Incremented by the
   * server (host skip or timer expiry) — all clients derive their view from
   * this value.
   *
   * textPromptIntro sub-steps:
   *   0 → Message 1 (Welcome)
   *   1 → Prompt q0  (real player answers their own prompt)
   *   2 → Message 2  (catfish instructions)
   *   3 → Prompt q1  (catfish answer 1)
   *   4 → Prompt q2  (catfish answer 2)
   *   5 → Message 3  (pre-voting)
   *
   * textPrompt / imagePrompt sub-steps:
   *   0 → Prompt q0
   *   1 → Prompt q1
   *   2 → Prompt q2
   */
  subStep: number;
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
