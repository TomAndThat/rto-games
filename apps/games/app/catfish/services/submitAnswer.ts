import type { Firestore } from 'firebase-admin/firestore';
import { CATFISH_SUBSTEP_ANSWERER_INDEX, CATFISH_MAX_SUBSTEP } from '../types/catfishGame';
import type { CatfishPromptPhase } from '../types/catfishGame';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATFISH_COLLECTION = 'catfish';

// ---------------------------------------------------------------------------
// Exported errors
// ---------------------------------------------------------------------------

export const SubmitAnswerErrorCode = {
  GameNotFound: 'GAME_NOT_FOUND',
  GameNotPlaying: 'GAME_NOT_PLAYING',
  NotAPromptStep: 'NOT_A_PROMPT_STEP',
  NotAnAnswerer: 'NOT_AN_ANSWERER',
  AlreadySubmitted: 'ALREADY_SUBMITTED',
} as const;
export type SubmitAnswerErrorCode =
  (typeof SubmitAnswerErrorCode)[keyof typeof SubmitAnswerErrorCode];

export class SubmitAnswerError extends Error {
  constructor(
    message: string,
    public readonly code: SubmitAnswerErrorCode,
  ) {
    super(message);
    this.name = 'SubmitAnswerError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameData {
  status: string;
  currentPhaseIndex: number;
  phases: Array<CatfishPromptPhase & { type: string }>;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Submit a player's answer for the current prompt sub-step.
 *
 * Runs in a Firestore transaction to ensure atomicity when writing the
 * response and checking whether all expected answers have been submitted.
 *
 * If all answerers for the current sub-step have submitted, the game is
 * automatically advanced to the next sub-step or phase.
 */
export async function submitAnswer(
  db: Firestore,
  gameId: string,
  requestingUid: string,
  answer: string,
): Promise<void> {
  const gameRef = db.collection(CATFISH_COLLECTION).doc(gameId);

  await db.runTransaction(async (tx) => {
    const gameSnap = await tx.get(gameRef);

    if (!gameSnap.exists) {
      throw new SubmitAnswerError('Game not found', SubmitAnswerErrorCode.GameNotFound);
    }

    const game = gameSnap.data() as GameData;

    if (game.status !== 'playing') {
      throw new SubmitAnswerError(
        'Game is not in playing state',
        SubmitAnswerErrorCode.GameNotPlaying,
      );
    }

    const { currentPhaseIndex, phases } = game;
    const currentPhase = phases[currentPhaseIndex];

    if (!currentPhase) {
      throw new SubmitAnswerError('Game not found', SubmitAnswerErrorCode.GameNotFound);
    }

    // ------------------------------------------------------------------
    // Determine which answerer index corresponds to this subStep
    // ------------------------------------------------------------------
    const subStepMap = CATFISH_SUBSTEP_ANSWERER_INDEX[currentPhase.type];
    const answererIndex = subStepMap?.[currentPhase.subStep];

    if (answererIndex === undefined) {
      throw new SubmitAnswerError(
        'Current sub-step is not a prompt step',
        SubmitAnswerErrorCode.NotAPromptStep,
      );
    }

    // ------------------------------------------------------------------
    // Find the prompt this user is assigned to answer
    // ------------------------------------------------------------------
    let targetPromptOwnerId: string | null = null;

    for (const [ownerId, entry] of Object.entries(currentPhase.prompts)) {
      if (entry.answerers[answererIndex] === requestingUid) {
        targetPromptOwnerId = ownerId;
        break;
      }
    }

    if (!targetPromptOwnerId) {
      throw new SubmitAnswerError(
        'User is not an answerer at this sub-step',
        SubmitAnswerErrorCode.NotAnAnswerer,
      );
    }

    const targetEntry = currentPhase.prompts[targetPromptOwnerId];

    if (
      targetEntry.responses[requestingUid] !== null &&
      targetEntry.responses[requestingUid] !== undefined
    ) {
      throw new SubmitAnswerError(
        'Answer already submitted',
        SubmitAnswerErrorCode.AlreadySubmitted,
      );
    }

    // ------------------------------------------------------------------
    // Build updated phases array (Firestore arrays can't be partially updated)
    // ------------------------------------------------------------------
    const updatedPhases = phases.map((phase, i) => {
      if (i !== currentPhaseIndex) return phase;

      const updatedPrompts = { ...phase.prompts };
      const updatedEntry = {
        ...updatedPrompts[targetPromptOwnerId!],
        responses: {
          ...updatedPrompts[targetPromptOwnerId!].responses,
          [requestingUid]: answer,
        },
      };
      updatedPrompts[targetPromptOwnerId!] = updatedEntry;
      return { ...phase, prompts: updatedPrompts };
    });

    // ------------------------------------------------------------------
    // Check if all answerers for this subStep have now submitted
    // ------------------------------------------------------------------
    const updatedPhase = updatedPhases[currentPhaseIndex] as CatfishPromptPhase & { type: string };
    const allSubmitted = Object.values(updatedPhase.prompts).every((entry) => {
      const answererId = entry.answerers[answererIndex];
      const response = entry.responses[answererId];
      return response !== null && response !== undefined;
    });

    if (allSubmitted) {
      const maxSubStep = CATFISH_MAX_SUBSTEP[currentPhase.type] ?? 0;

      if (currentPhase.subStep < maxSubStep) {
        // Advance to next sub-step within this phase
        (updatedPhases[currentPhaseIndex] as CatfishPromptPhase & { subStep: number }).subStep =
          currentPhase.subStep + 1;
        tx.update(gameRef, { phases: updatedPhases });
      } else if (currentPhaseIndex + 1 < phases.length) {
        // Advance to next phase
        tx.update(gameRef, {
          phases: updatedPhases,
          currentPhaseIndex: currentPhaseIndex + 1,
        });
      } else {
        // End of game
        tx.update(gameRef, { phases: updatedPhases, status: 'finished' });
      }
    } else {
      tx.update(gameRef, { phases: updatedPhases });
    }
  });
}
