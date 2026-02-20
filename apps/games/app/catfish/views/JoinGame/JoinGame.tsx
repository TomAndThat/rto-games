"use client";

import { useState } from "react";
import { useCatfishGame } from "../../contexts/GameContext";
import { useCatfishUI } from "../../contexts/UIContext";
import { CatfishButton } from "../../components/buttons/CatfishButton";
import Footer from "../../components/Footer";
import { CATFISH_GAME_CODE_LENGTH } from "../../config/catfishConfig";

export function JoinGame() {
  const { handleJoinGameSubmit, handleBackToLanding, isSubmitting } =
    useCatfishGame();
  const { showNotification } = useCatfishUI();
  const [gameCode, setGameCode] = useState("");

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const trimmed = gameCode.trim().toUpperCase();
    if (trimmed.length !== CATFISH_GAME_CODE_LENGTH) {
      showNotification({
        text: `Game code must be ${CATFISH_GAME_CODE_LENGTH} characters.`,
        bgColor: "bg-red-500",
      });
      return;
    }

    await handleJoinGameSubmit(trimmed);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8">
        <div className="relative w-full max-w-[400px] p-8 text-center mb-12">
          <img
            src={"/images/catfish/backgrounds/dialogue-2-green-mobile.png"}
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          />
          <div
            className="absolute top-[-5px] left-[-10px] p-2 rotate-357 cursor-pointer"
            onClick={handleBackToLanding}
          >
            <img
              src="/images/catfish/backgrounds/dialogue-back-bg.png"
              alt=""
              className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
            />
            <p className="relative z-10 font-heading text-xl text-left">
              {"<"} Back
            </p>
          </div>
          <h2 className="mb-4 text-4xl font-bold relative z-10">Join Game</h2>
          <p className="mb-6 relative z-10">Please enter the game code below</p>
          <form onSubmit={handleSubmit}>
            <div className="relative mb-4">
              <img
                src={"/images/catfish/inputs/text-input-1.png"}
                alt=""
                className="absolute top-1/2 left-1/2 w-[100%] h-[130%] font-bold -translate-x-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="ABCDEF"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full max-w-[300px] text-center p-2 handwritten uppercase"
                minLength={CATFISH_GAME_CODE_LENGTH}
                maxLength={CATFISH_GAME_CODE_LENGTH}
              />
            </div>
            <CatfishButton
              variant="4"
              color="#FDE12D"
              hoverColor="#F0A500"
              textColor="#000"
            >
              {isSubmitting ? "Joining\u2026" : "Join Game"}
            </CatfishButton>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
