"use client";

import { useState } from "react";
import { useCatfishGame } from "../../contexts/GameContext";
import { CatfishButton } from "../../components/buttons/CatfishButton";
import Footer from "../../components/Footer";

type LobbyDisplay = "lobby" | "remove_self" | "remove_other";

export function Lobby() {
  const { game, uid, handleRemovePlayer, handleStartGame, isSubmitting } =
    useCatfishGame();

  const [display, setDisplay] = useState<LobbyDisplay>("lobby");
  const [removeTargetUid, setRemoveTargetUid] = useState<string | null>(null);
  const [removeTargetName, setRemoveTargetName] = useState("");

  if (!game || !uid) return null;

  const isHost = game.hostUid === uid;
  const players = Object.entries(game.players).map(([playerId, data]) => ({
    uid: playerId,
    username: typeof data.username === "string" ? data.username : "Unknown",
    profilePictureUrl:
      typeof data.profilePictureUrl === "string"
        ? data.profilePictureUrl
        : "/images/catfish/profile-img-placeholder.png",
    isHost: data.isHost,
  }));

  const hostName = players.find((p) => p.isHost)?.username ?? "Unknown";

  const handleRemoveClick = (targetUid: string, targetName: string): void => {
    setRemoveTargetUid(targetUid);
    setRemoveTargetName(targetName);
    setDisplay(targetUid === uid ? "remove_self" : "remove_other");
  };

  const handleConfirmRemove = async (): Promise<void> => {
    if (removeTargetUid) {
      await handleRemovePlayer(removeTargetUid);
    }
    setDisplay("lobby");
    setRemoveTargetUid(null);
    setRemoveTargetName("");
  };

  const handleCancelRemove = (): void => {
    setDisplay("lobby");
    setRemoveTargetUid(null);
    setRemoveTargetName("");
  };

  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8 md:p-12">
        {/* ---- Lobby view ---- */}
        {display === "lobby" && (
          <div className="relative flex flex-col justify-between w-full max-w-[850px] min-h-[500px] p-8 text-center mb-12">
            {/* Background — adapts to player count */}
            {players.length <= 7 && (
              <>
                <img
                  src={"/images/catfish/backgrounds/lobby-mobile-short.png"}
                  alt=""
                  className="absolute sm:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-tablet-short.png"}
                  alt=""
                  className="absolute hidden sm:block top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-desktop-medium.png"}
                  alt=""
                  className="absolute hidden md:block top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
              </>
            )}
            {players.length > 7 && players.length <= 14 && (
              <>
                <img
                  src={"/images/catfish/backgrounds/lobby-mobile-medium.png"}
                  alt=""
                  className="absolute sm:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-tablet-short.png"}
                  alt=""
                  className="absolute hidden sm:block md:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-desktop-medium.png"}
                  alt=""
                  className="absolute hidden md:block top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
              </>
            )}
            {players.length > 14 && (
              <>
                <img
                  src={"/images/catfish/backgrounds/lobby-mobile-long.png"}
                  alt=""
                  className="absolute sm:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-tablet-medium.png"}
                  alt=""
                  className="absolute hidden sm:block md:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-desktop-medium.png"}
                  alt=""
                  className="absolute hidden md:block top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
              </>
            )}

            {/* Game Code */}
            <div className="absolute top-[-20px] md:top-[-25px] right-[-10px] p-2 md:p-3 text-white font-heading text-2xl md:text-3xl rotate-2 lowercase">
              <img
                src={"/images/catfish/backgrounds/game-code-bg.png"}
                alt=""
                className="absolute top-0 left-0 w-full h-full"
              />
              <span className="relative z-10">Code: {game.gameCode}</span>
            </div>

            {/* Game Title */}
            <div className="mb-8 sm:mb-12 md:mb-16 relative z-5">
              <h2 className="mb-4 text-xl sm:text-3xl md:text-5xl font-bold relative z-5">
                {hostName}&apos;s Game
              </h2>
            </div>

            {/* Player grid */}
            <div
              className={`w-full grow-1 grid ${players.length > 6 ? "grid-cols-3" : "grid-cols-2"} sm:grid-cols-4 ${players.length > 6 ? "md:grid-cols-6" : "md:grid-cols-5"} gap-4 relative z-5`}
            >
              {players.map((player) => (
                <div
                  key={player.uid}
                  className="flex flex-col items-center mb-4"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Remove button — visible to the host, or on the player's own card */}
                    {(isHost || player.uid === uid) && (
                      <img
                        src={"/images/catfish/buttons/remove-player.png"}
                        className="absolute right-0 bottom-0 w-8 h-auto cursor-pointer z-10"
                        onClick={() =>
                          handleRemoveClick(player.uid, player.username)
                        }
                        alt="Remove player"
                      />
                    )}
                    <img
                      src={player.profilePictureUrl}
                      alt={player.username}
                      className="w-[80%] h-auto rounded-full mb-2 rounded border-2"
                    />
                  </div>
                  <span className="text-lg font-semibold">
                    {player.username}
                  </span>
                </div>
              ))}
            </div>

            {/* Start game — host only */}
            {isHost && (
              <div className="w-full max-w-[300px] mx-auto mt-8">
                <CatfishButton
                  variant="1"
                  color="#FDE12D"
                  hoverColor="#F0A500"
                  textColor="#000"
                  onClick={isSubmitting ? undefined : handleStartGame}
                >
                  {isSubmitting ? "Starting\u2026" : "Start Game"}
                </CatfishButton>
              </div>
            )}
          </div>
        )}

        {/* ---- Remove Self confirmation ---- */}
        {display === "remove_self" && (
          <div className="relative w-full max-w-[400px] p-8 text-center text-white mb-12">
            <img
              src={"/images/catfish/backgrounds/dialogue-1-red-mobile.png"}
              alt=""
              className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
            />
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold relative z-10">
              Imminent Danger
            </h2>
            <p className="mb-4 relative z-10">
              You are about to remove
              <br />
              yourself from the game.
            </p>
            {isHost && (
              <p className="mb-4 relative z-10">
                Because you&apos;re the host, this will end the game for
                everyone else.
              </p>
            )}
            <p className="mb-6 relative z-10">
              Are you sure you want to proceed?
            </p>
            <div className="space-y-3 relative z-10">
              <CatfishButton
                variant="4"
                color="#FDE12D"
                hoverColor="#F0A500"
                textColor="#000"
                onClick={isSubmitting ? undefined : handleConfirmRemove}
              >
                {isSubmitting ? "Removing\u2026" : "Remove me!"}
              </CatfishButton>
              <CatfishButton
                variant="4"
                color="#5465ff"
                hoverColor="#2E3192"
                onClick={handleCancelRemove}
              >
                Cancel
              </CatfishButton>
            </div>
          </div>
        )}

        {/* ---- Remove Other confirmation ---- */}
        {display === "remove_other" && (
          <div className="relative w-full max-w-[400px] p-8 text-center text-white mb-12">
            <img
              src={"/images/catfish/backgrounds/dialogue-1-red-mobile.png"}
              alt=""
              className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
            />
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold relative z-10">
              Imminent Danger
            </h2>
            <p className="mb-4 relative z-10">
              You are about to remove
              <br />
              {removeTargetName} from the game.
            </p>
            <p className="mb-6 relative z-10">
              Are you sure you want to proceed?
            </p>
            <div className="space-y-3 relative z-10">
              <CatfishButton
                variant="4"
                color="#FDE12D"
                hoverColor="#F0A500"
                textColor="#000"
                onClick={isSubmitting ? undefined : handleConfirmRemove}
              >
                {isSubmitting ? "Removing\u2026" : `Remove ${removeTargetName}`}
              </CatfishButton>
              <CatfishButton
                variant="4"
                color="#5465ff"
                hoverColor="#2E3192"
                onClick={handleCancelRemove}
              >
                Cancel
              </CatfishButton>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
