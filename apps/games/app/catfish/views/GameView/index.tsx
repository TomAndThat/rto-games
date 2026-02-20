"use client";

import { useCatfishGame } from "../../contexts/GameContext";
import type { GameDocument } from "@rto-games/core";
import type { CatfishPhase, CatfishPromptPhase } from "../../types/catfishGame";
import { CatfishPhaseType } from "../../types/catfishGame";
import { getMyPromptForSubStep } from "../../utils/getMyPromptForSubStep";
import { MessageView } from "../MessageView";
import { TextPromptView } from "../TextPromptView";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CatfishPlayingGame = GameDocument & {
  currentPhaseIndex: number;
  phases: CatfishPhase[];
};

// Sub-steps within textPromptIntro that are message screens
const TEXT_PROMPT_INTRO_MESSAGE_SUBSTEPS: Record<number, 1 | 2 | 3> = {
  0: 1,
  2: 2,
  5: 3,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GameView(): React.JSX.Element | null {
  const {
    game,
    uid,
    isHost,
    handleAdvancePhase,
    handleSubmitAnswer,
    isSubmitting,
  } = useCatfishGame();

  if (!game || game.status !== "playing" || !uid) return null;

  const playingGame = game as unknown as CatfishPlayingGame;
  const { currentPhaseIndex, phases } = playingGame;

  if (!phases || currentPhaseIndex === undefined) return null;

  const currentPhase = phases[currentPhaseIndex];

  if (!currentPhase) return null;

  const playerName =
    typeof game.players[uid]?.username === "string"
      ? (game.players[uid].username as string)
      : "Player";

  // Unique key per sub-step so prompt views fully remount between questions,
  // resetting local form state (textarea value, hasSubmitted flag).
  const promptPhase = currentPhase as CatfishPromptPhase & { subStep?: number };
  const stepKey = `${currentPhaseIndex}-${promptPhase.subStep ?? 0}`;

  return (
    <div key={stepKey} className="w-full min-h-screen">
      {renderScreen(
        currentPhase,
        uid,
        playerName,
        isHost,
        game,
        handleAdvancePhase,
        handleSubmitAnswer,
        isSubmitting,
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen router
// ---------------------------------------------------------------------------

function renderScreen(
  phase: CatfishPhase,
  uid: string,
  playerName: string,
  isHost: boolean,
  game: GameDocument,
  onAdvance: () => void,
  onSubmit: (answer: string) => Promise<void>,
  isSubmitting: boolean,
): React.JSX.Element | null {
  switch (phase.type) {
    case CatfishPhaseType.TextPromptIntro: {
      const promptPhase = phase as CatfishPromptPhase & { type: string };
      const messageType =
        TEXT_PROMPT_INTRO_MESSAGE_SUBSTEPS[promptPhase.subStep];

      if (messageType !== undefined) {
        return (
          <MessageView
            messageType={messageType}
            playerName={playerName}
            isHost={isHost}
            onSkip={onAdvance}
          />
        );
      }

      // Prompt sub-step
      const promptInfo = getMyPromptForSubStep(game, uid);
      if (!promptInfo) return null;

      return (
        <TextPromptView
          promptOwnerName={promptInfo.promptOwnerName}
          promptText={promptInfo.promptText}
          isOwnPrompt={promptInfo.isOwnPrompt}
          catfishInstructionText={promptInfo.catfishInstructionText}
          initialIsSubmitted={promptInfo.isSubmitted}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      );
    }

    case CatfishPhaseType.TextPrompt:
    case CatfishPhaseType.ImagePrompt: {
      const promptInfo = getMyPromptForSubStep(game, uid);
      if (!promptInfo) return null;

      return (
        <TextPromptView
          promptOwnerName={promptInfo.promptOwnerName}
          promptText={promptInfo.promptText}
          isOwnPrompt={promptInfo.isOwnPrompt}
          catfishInstructionText={promptInfo.catfishInstructionText}
          initialIsSubmitted={promptInfo.isSubmitted}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      );
    }

    case CatfishPhaseType.Voting:
      // TODO: replace with VotingView once built.
      return null;

    case CatfishPhaseType.Results:
      // TODO: replace with ResultsView once built.
      return null;

    default:
      return null;
  }
}
