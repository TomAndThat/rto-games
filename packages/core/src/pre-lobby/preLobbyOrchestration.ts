import type { GameRequiredStep } from '../types';

/**
 * Iterates through the game's required pre-lobby steps and returns the key
 * of the first step that is not yet satisfied, or `null` if every step passes.
 *
 * Games define their required steps in their config; this function is
 * game-agnostic and simply runs each validator in order.
 */
export function getIncompleteStep(
  playerGameData: Record<string, unknown> | undefined,
  requiredSteps: readonly GameRequiredStep[],
): string | null {
  for (const step of requiredSteps) {
    if (!step.validator(playerGameData)) {
      return step.key;
    }
  }
  return null;
}
