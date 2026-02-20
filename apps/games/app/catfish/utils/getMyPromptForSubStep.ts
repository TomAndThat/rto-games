import type { GameDocument } from '@rto-games/core';
import type { CatfishPhase, CatfishPromptPhase } from '../types/catfishGame';
import { CATFISH_SUBSTEP_ANSWERER_INDEX } from '../types/catfishGame';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MyPromptInfo {
  /** UID of the player whose prompt is being answered */
  promptOwnerId: string;
  /** Display name of the prompt owner */
  promptOwnerName: string;
  /** The prompt text to display */
  promptText: string;
  /** True when the player is answering their own prompt */
  isOwnPrompt: boolean;
  /**
   * Resolved catfish instruction string, e.g. "Put yourself in Alice's shoes…"
   * Always present — used for catfish players; ignored for own-prompt renders.
   */
  catfishInstructionText: string;
  /** True if this player has already submitted a response for this sub-step */
  isSubmitted: boolean;
}

type CatfishPlayingGame = GameDocument & {
  currentPhaseIndex: number;
  phases: CatfishPhase[];
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Derives the prompt this player should be answering at the current sub-step.
 *
 * Returns `null` when the current sub-step is a message screen (not a prompt),
 * or when the player is not an answerer at this sub-step.
 */
export function getMyPromptForSubStep(
  game: GameDocument,
  uid: string,
): MyPromptInfo | null {
  const playingGame = game as unknown as CatfishPlayingGame;
  const { currentPhaseIndex, phases } = playingGame;
  const currentPhase = phases?.[currentPhaseIndex];

  if (!currentPhase) return null;

  // Only prompt phases have sub-step answerer mappings
  if (!('prompts' in currentPhase)) return null;

  const promptPhase = currentPhase as CatfishPromptPhase & { type: string };
  const subStepMap = CATFISH_SUBSTEP_ANSWERER_INDEX[promptPhase.type];
  const answererIndex = subStepMap?.[promptPhase.subStep];

  // Sub-step is a message screen, not a prompt
  if (answererIndex === undefined) return null;

  // Find the prompt this player is assigned to answer
  for (const [ownerId, entry] of Object.entries(promptPhase.prompts)) {
    if (entry.answerers[answererIndex] !== uid) continue;

    const ownerPlayer = game.players[ownerId];
    const promptOwnerName =
      typeof ownerPlayer?.username === 'string' ? ownerPlayer.username : 'them';

    const isSubmitted =
      entry.responses[uid] !== null && entry.responses[uid] !== undefined;

    return {
      promptOwnerId: ownerId,
      promptOwnerName,
      promptText: entry.promptText,
      isOwnPrompt: ownerId === uid,
      catfishInstructionText: entry.catfishInstructionText,
      isSubmitted,
    };
  }

  return null;
}
