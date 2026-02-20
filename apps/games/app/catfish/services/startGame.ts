import type { Firestore, Timestamp } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  CatfishPhase,
  CatfishPromptEntry,
  CatfishPromptPhase,
  CatfishVotingPhase,
} from '../types/catfishGame';
import { CatfishPhaseType } from '../types/catfishGame';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATFISH_COLLECTION = 'catfish';
const TEXT_PROMPTS_COLLECTION = 'textPrompts';
const IMAGE_PROMPTS_COLLECTION = 'imagePrompts';
const VOTING_PROMPTS_COLLECTION = 'votingPrompts';
const CATFISH_INSTRUCTION_PROMPTS_COLLECTION = 'catfishInstructionPrompts';

/** Number of text/image prompt rounds in the game */
const PROMPT_ROUND_COUNT = 2;

/** Number of unique prompts required per player per prompt type */
const PROMPTS_PER_PLAYER = PROMPT_ROUND_COUNT; // one per round

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fisher-Yates shuffle — returns a new shuffled array, does not mutate input.
 */
function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp as T;
  }
  return shuffled;
}

interface PromptDoc {
  id: string;
  text: string;
}

/**
 * Fetch all active prompts from a collection and return them shuffled.
 */
async function fetchShuffledPrompts(
  db: Firestore,
  collectionName: string,
): Promise<PromptDoc[]> {
  const snapshot = await db
    .collection(collectionName)
    .where('isActive', '==', true)
    .get();

  const prompts: PromptDoc[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    text: (doc.data() as { text: string }).text,
  }));

  return shuffleArray(prompts);
}

/**
 * Assign answerers for one prompt round using an offset strategy.
 *
 * For each player at index i in a freshly-shuffled list:
 *   - answerers[0] = the real player (index i)
 *   - answerers[1] = catfish at (i + 1) % n
 *   - answerers[2] = catfish at (i + 2) % n
 *
 * This guarantees 3 unique answerers per prompt for any n >= 3.
 */
function assignAnswerersForRound(
  playerIds: readonly string[],
): Record<string, [string, string, string]> {
  const shuffled = shuffleArray(playerIds);
  const n = shuffled.length;
  const result: Record<string, [string, string, string]> = {};

  for (let i = 0; i < n; i++) {
    const real = shuffled[i] as string;
    const catfish1 = shuffled[(i + 1) % n] as string;
    const catfish2 = shuffled[(i + 2) % n] as string;
    result[real] = [real, catfish1, catfish2];
  }

  return result;
}

/**
 * Build a prompt phase for one round.
 */
function buildPromptPhase(
  phaseType:
    | typeof CatfishPhaseType.TextPromptIntro
    | typeof CatfishPhaseType.TextPrompt
    | typeof CatfishPhaseType.ImagePrompt,
  playerIds: readonly string[],
  promptPool: PromptDoc[],
  poolOffset: number,
  catfishInstructionPool: PromptDoc[],
  playerUsernames: Record<string, string>,
): CatfishPromptPhase {
  const answerersByPlayer = assignAnswerersForRound(playerIds);

  const prompts: Record<string, CatfishPromptEntry> = {};

  playerIds.forEach((playerId, i) => {
    const prompt = promptPool[poolOffset + i];
    if (!prompt) {
      throw new Error(
        `Insufficient prompts in pool (needed index ${poolOffset + i}, pool size ${promptPool.length})`,
      );
    }

    const answerers = answerersByPlayer[playerId] as [string, string, string];
    const shuffledAnswerers = shuffleArray(answerers) as [
      string,
      string,
      string,
    ];

    // Pick a random catfish instruction template and resolve {playerName}
    const ownerUsername = playerUsernames[playerId] ?? 'them';
    const instructionTemplate =
      catfishInstructionPool[Math.floor(Math.random() * catfishInstructionPool.length)];
    const catfishInstructionText = (instructionTemplate as PromptDoc).text.replace(
      '{playerName}',
      ownerUsername,
    );

    // Initialise responses to null for all answerers
    const responses: Record<string, null> = {};
    for (const answererId of answerers) {
      responses[answererId] = null;
    }

    prompts[playerId] = {
      promptId: prompt.id,
      promptText: prompt.text,
      answerers,
      shuffledAnswerers,
      catfishInstructionText,
      responses,
    };
  });

  return {
    type: phaseType,
    subStep: 0,
    prompts,
  };
}

/**
 * Build a voting phase.
 */
function buildVotingPhase(
  linkedPhaseIndex: number,
  votingPromptText: string,
  playerIds: readonly string[],
): CatfishVotingPhase {
  return {
    type: CatfishPhaseType.Voting,
    linkedPhaseIndex,
    votingPromptText,
    votingOrder: shuffleArray(playerIds),
    currentVotingIndex: 0,
    votes: {},
  };
}

// ---------------------------------------------------------------------------
// Exported errors
// ---------------------------------------------------------------------------

export const StartGameErrorCode = {
  GameNotFound: 'GAME_NOT_FOUND',
  NotHost: 'NOT_HOST',
  GameAlreadyStarted: 'GAME_ALREADY_STARTED',
  InsufficientPlayers: 'INSUFFICIENT_PLAYERS',
  InsufficientPrompts: 'INSUFFICIENT_PROMPTS',
} as const;
export type StartGameErrorCode =
  (typeof StartGameErrorCode)[keyof typeof StartGameErrorCode];

export class StartGameError extends Error {
  constructor(
    message: string,
    public readonly code: StartGameErrorCode,
  ) {
    super(message);
    this.name = 'StartGameError';
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Validate and start a Catfish game.
 *
 * - Validates the requesting user is the host and the game is in lobby status
 * - Fetches prompts from the shared collections
 * - Assigns prompts and catfish for all rounds
 * - Writes the complete phases array and transitions status → playing
 *
 * Runs server-side via the Firebase Admin SDK.
 */
export async function startGame(
  db: Firestore,
  gameId: string,
  requestingUid: string,
): Promise<void> {
  // ------------------------------------------------------------------
  // 1. Fetch and validate the game document
  // ------------------------------------------------------------------
  const gameRef = db.collection(CATFISH_COLLECTION).doc(gameId);
  const gameSnap = await gameRef.get();

  if (!gameSnap.exists) {
    throw new StartGameError('Game not found', StartGameErrorCode.GameNotFound);
  }

  const game = gameSnap.data() as {
    hostUid: string;
    status: string;
    minPlayers: number;
    players: Record<string, { username: string }>;
  };

  if (game.hostUid !== requestingUid) {
    throw new StartGameError(
      'Only the host can start the game',
      StartGameErrorCode.NotHost,
    );
  }

  if (game.status !== 'lobby') {
    throw new StartGameError(
      'Game has already started',
      StartGameErrorCode.GameAlreadyStarted,
    );
  }

  const playerIds = Object.keys(game.players);
  const playerCount = playerIds.length;
  const playerUsernames: Record<string, string> = {};
  for (const [uid, player] of Object.entries(game.players)) {
    playerUsernames[uid] = player.username;
  }

  if (playerCount < game.minPlayers) {
    throw new StartGameError(
      `Not enough players — need at least ${game.minPlayers}, have ${playerCount}`,
      StartGameErrorCode.InsufficientPlayers,
    );
  }

  // ------------------------------------------------------------------
  // 2. Fetch prompt pools
  // ------------------------------------------------------------------
  const requiredTextPrompts = playerCount * PROMPTS_PER_PLAYER;
  const requiredImagePrompts = playerCount * PROMPTS_PER_PLAYER;

  const [textPrompts, imagePrompts, votingPrompts, catfishInstructionPrompts] = await Promise.all([
    fetchShuffledPrompts(db, TEXT_PROMPTS_COLLECTION),
    fetchShuffledPrompts(db, IMAGE_PROMPTS_COLLECTION),
    fetchShuffledPrompts(db, VOTING_PROMPTS_COLLECTION),
    fetchShuffledPrompts(db, CATFISH_INSTRUCTION_PROMPTS_COLLECTION),
  ]);

  if (catfishInstructionPrompts.length === 0) {
    throw new StartGameError(
      'No catfish instruction prompts available',
      StartGameErrorCode.InsufficientPrompts,
    );
  }

  if (textPrompts.length < requiredTextPrompts) {
    throw new StartGameError(
      `Insufficient text prompts — need ${requiredTextPrompts}, found ${textPrompts.length}`,
      StartGameErrorCode.InsufficientPrompts,
    );
  }

  if (imagePrompts.length < requiredImagePrompts) {
    throw new StartGameError(
      `Insufficient image prompts — need ${requiredImagePrompts}, found ${imagePrompts.length}`,
      StartGameErrorCode.InsufficientPrompts,
    );
  }

  if (votingPrompts.length === 0) {
    throw new StartGameError(
      'No voting prompts available',
      StartGameErrorCode.InsufficientPrompts,
    );
  }

  // ------------------------------------------------------------------
  // 3. Build phases
  //
  // Phase order:
  //   0: textPromptIntro  (text round 1 — guided onboarding copy)
  //   1: voting           (scores round 0)
  //   2: imagePrompt      (image round 1)
  //   3: voting           (scores round 2)
  //   4: textPrompt       (text round 2)
  //   5: voting           (scores round 4)
  //   6: imagePrompt      (image round 2)
  //   7: voting           (scores round 6)
  //   8: results
  // ------------------------------------------------------------------

  const pickVotingPrompt = (): string => {
    const prompt = votingPrompts[Math.floor(Math.random() * votingPrompts.length)];
    return (prompt as PromptDoc).text;
  };

  const textRound1 = buildPromptPhase(
    CatfishPhaseType.TextPromptIntro,
    playerIds,
    textPrompts,
    0,
    catfishInstructionPrompts,
    playerUsernames,
  );

  const imageRound1 = buildPromptPhase(
    CatfishPhaseType.ImagePrompt,
    playerIds,
    imagePrompts,
    0,
    catfishInstructionPrompts,
    playerUsernames,
  );

  const textRound2 = buildPromptPhase(
    CatfishPhaseType.TextPrompt,
    playerIds,
    textPrompts,
    playerCount,
    catfishInstructionPrompts,
    playerUsernames,
  );

  const imageRound2 = buildPromptPhase(
    CatfishPhaseType.ImagePrompt,
    playerIds,
    imagePrompts,
    playerCount,
    catfishInstructionPrompts,
    playerUsernames,
  );

  const phases: CatfishPhase[] = [
    textRound1,                                         // 0
    buildVotingPhase(0, pickVotingPrompt(), playerIds), // 1
    imageRound1,                                        // 2
    buildVotingPhase(2, pickVotingPrompt(), playerIds), // 3
    textRound2,                                         // 4
    buildVotingPhase(4, pickVotingPrompt(), playerIds), // 5
    imageRound2,                                        // 6
    buildVotingPhase(6, pickVotingPrompt(), playerIds), // 7
    { type: CatfishPhaseType.Results },                 // 8
  ];

  // ------------------------------------------------------------------
  // 4. Build per-player score initialisers
  //    (profilePictureUrl already present from the pre-lobby flow)
  // ------------------------------------------------------------------
  const playerScoreUpdates: Record<string, number> = {};
  for (const playerId of playerIds) {
    playerScoreUpdates[`players.${playerId}.score`] = 0;
  }

  // ------------------------------------------------------------------
  // 5. Write everything atomically
  // ------------------------------------------------------------------
  await gameRef.update({
    status: 'playing',
    currentPhaseIndex: 0,
    phaseDeadline: null,
    phases,
    ...playerScoreUpdates,
    startedAt: FieldValue.serverTimestamp() as unknown as Timestamp,
  });
}
