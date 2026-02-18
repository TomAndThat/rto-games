"use client";

import { useState } from "react";

// Load Views
import EnterName from "./views/EnterName/page";
import JoinGame from "./views/JoinGame/page";
import LandingPage from "./views/LandingPage/page";
import Lobby from "./views/Lobby/page";
import ProfilePic from "./views/ProfilePic/page";

export default function CatfishPage() {
  // Change this value to toggle between views during development
  // Options: 'landing' | 'profile_pic' | 'enter_name' | 'lobby' | 'join_game'
  const [state, setState] = useState<
    "landing" | "profile_pic" | "enter_name" | "lobby" | "join_game"
  >("landing");

  // Router
  switch (state) {
    case "landing":
      return <LandingPage />;
    case "profile_pic":
      return <ProfilePic />;
    case "enter_name":
      return <EnterName />;
    case "lobby":
      return <Lobby />;
    case "join_game":
      return <JoinGame />;
    default:
      return <LandingPage />;
  }
}
