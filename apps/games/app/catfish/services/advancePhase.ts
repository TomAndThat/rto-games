import type { Firestore } from 'firebase-admin/firestore';
import { CATFISH_MAX_SUBSTEP } from '../types/catfishGame';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATFISH_COLLECTION = 'catfish';

// ---------------------------------------------------------------------------
// Exported errors
// ---------------------------------------------------------------------------

export const AdvancePhaseErrorCode = {
  GameNotFound: 'GAME_NOT_FOUND',
  NotHost: 'NOT_HOST',
  GameNotStarted: 'GAME_NOT_STARTED',
  GameAlreadyFinished: 'GAME_ALREADY_FINISHED',
} as const;
export type AdvancePhaseErrorCode =
  (typeof AdvancePhaseErrorCode)[keyof typeof AdvancePhaseErrorCode];

export class AdvancePhaseError extends Error {
  constructor(
    message: string,
    public readonly code: AdvancePhaseErrorCode,
  ) {
    super(message);
    this.name = 'AdvancePhaseError';
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Advance the game to the next sub-step or the next phase.
 *
 * Rules:
 * - If the current phase has a subStep and it has not reached its maximum,
 *   increment subStep.
 * - Otherwise increment currentPhaseIndex. If this would exceed the phases
 *   array, set status to 'finished' instead.
 *
 * Called by the host-skip handler and (in future) the timing backend.
 */
export async function advancePhase(
  db: Firestore,
  gameId: string,
  requestingUid: string,
): Promise<void> {
  const gameRef = db.collection(CATFISH_COLLECTION).doc(gameId);

  await db.runTransaction(async (transaction) => {
    const gameSnap = await transaction.get(gameRef);

    if (!gameSnap.exists) {
      throw new AdvancePhaseError('Game not found', AdvancePhaseErrorCode.GameNotFound);
    }

    const game = gameSnap.data() as {
      hostUid: string;
      status: string;
      currentPhaseIndex: number;
      phases: Array<{ type: string; subStep?: number }>;
    };

    if (game.hostUid !== requestingUid) {
      throw new AdvancePhaseError(
        'Only the host can advance the phase',
        AdvancePhaseErrorCode.NotHost,
      );
    }

    if (game.status === 'lobby') {
      throw new AdvancePhaseError(
        'Game has not started yet',
        AdvancePhaseErrorCode.GameNotStarted,
      );
    }

    if (game.status === 'finished') {
      throw new AdvancePhaseError(
        'Game is already finished',
        AdvancePhaseErrorCode.GameAlreadyFinished,
      );
    }

    const { currentPhaseIndex, phases } = game;
    const currentPhase = phases[currentPhaseIndex];

    if (!currentPhase) {
      throw new AdvancePhaseError('Game not found', AdvancePhaseErrorCode.GameNotFound);
    }

    const maxSubStep = CATFISH_MAX_SUBSTEP[currentPhase.type];
    const hasSubSteps = maxSubStep !== undefined;
    const currentSubStep = currentPhase.subStep ?? 0;

    if (hasSubSteps && currentSubStep < maxSubStep) {
      // Firestore cannot update array elements by index via dot notation —
      // we must replace the full phases array.
      const updatedPhases = phases.map((phase, i) =>
        i === currentPhaseIndex
          ? { ...phase, subStep: currentSubStep + 1 }
          : phase,
      );
      transaction.update(gameRef, { phases: updatedPhases });
      return;
    }

    // Advance to the next phase
    const nextPhaseIndex = currentPhaseIndex + 1;

    if (nextPhaseIndex >= phases.length) {
      transaction.update(gameRef, { status: 'finished' });
      return;
    }

    transaction.update(gameRef, { currentPhaseIndex: nextPhaseIndex });
  });
}
