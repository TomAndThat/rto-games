"use client";

import { useState } from "react";
import { useCatfishGame } from "../../contexts/GameContext";
import { useCatfishUI } from "../../contexts/UIContext";
import { CatfishButton } from "../../components/buttons/CatfishButton";
import Footer from "../../components/Footer";
import {
  CATFISH_USERNAME_MIN_LENGTH,
  CATFISH_USERNAME_MAX_LENGTH,
} from "../../config/catfishConfig";

export function EnterName() {
  const { handleSetUsername, isSubmitting } = useCatfishGame();
  const { showNotification } = useCatfishUI();
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const trimmed = username.trim();
    if (trimmed.length < CATFISH_USERNAME_MIN_LENGTH) {
      showNotification({
        text: `Username must be at least ${CATFISH_USERNAME_MIN_LENGTH} characters.`,
        bgColor: "bg-red-500",
      });
      return;
    }
    if (trimmed.length > CATFISH_USERNAME_MAX_LENGTH) {
      showNotification({
        text: `Username must be no more than ${CATFISH_USERNAME_MAX_LENGTH} characters.`,
        bgColor: "bg-red-500",
      });
      return;
    }

    await handleSetUsername(trimmed);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8">
        <div className="relative w-full max-w-[400px] p-8 text-center mb-12">
          <img
            src={"/images/catfish/backgrounds/dialogue-1-blue-mobile.png"}
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          />
          <h2 className="mb-4 text-2xl font-bold relative z-10">
            Choose Your Username
          </h2>
          <p className="mb-6 relative z-10">
            How should other players
            <br />
            see you in the game?
          </p>
          <form onSubmit={handleSubmit}>
            <div className="relative mb-4">
              <img
                src={"/images/catfish/inputs/text-input-1.png"}
                alt=""
                className="absolute top-1/2 left-1/2 w-[100%] h-[130%] font-bold -translate-x-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="Eg Geoff or Lorna"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full max-w-[300px] text-center p-2 handwritten"
                minLength={CATFISH_USERNAME_MIN_LENGTH}
                maxLength={CATFISH_USERNAME_MAX_LENGTH}
              />
            </div>
            <CatfishButton
              variant="4"
              color="#FDE12D"
              hoverColor="#F0A500"
              textColor="#000"
            >
              {isSubmitting ? "Setting\u2026" : "Set Username"}
            </CatfishButton>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
