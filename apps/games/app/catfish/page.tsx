"use client";

import { useState } from "react";

// Load Views
import LandingPage from "./views/LandingPage/page";
import ProfilePic from "./views/ProfilePic/page";
import EnterName from "./views/EnterName/page";
import Lobby from "./views/Lobby/page";

export default function CatfishPage() {
  // Change this value to toggle between views during development
  // Options: 'landing' | 'profile_pic' | 'enter_name' | 'lobby'
  const [state, setState] = useState<
    "landing" | "profile_pic" | "enter_name" | "lobby"
  >("lobby");

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
    default:
      return <LandingPage />;
  }
}
