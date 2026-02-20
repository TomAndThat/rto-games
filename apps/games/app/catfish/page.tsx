"use client";

import { useCatfishGame } from "./contexts/GameContext";

import { EnterName } from "./views/EnterName";
import { JoinGame } from "./views/JoinGame";
import { LandingPage } from "./views/LandingPage";
import { Lobby } from "./views/Lobby";
import { ProfilePic } from "./views/ProfilePic";
import { GameView } from "./views/GameView";

export default function CatfishPage() {
  const { currentView, isViewReady } = useCatfishGame();

  if (!isViewReady) {
    return null;
  }

  switch (currentView) {
    case "landing":
      return <LandingPage />;
    case "join_game":
      return <JoinGame />;
    case "enter_name":
      return <EnterName />;
    case "profile_pic":
      return <ProfilePic />;
    case "lobby":
      return <Lobby />;
    case "playing":
      return <GameView />;
    default:
      return <LandingPage />;
  }
}
