'use client';

import { useCatfishGame } from '../../contexts/GameContext';
import { CatfishButton } from '../../components/buttons/CatfishButton';
import Footer from '../../components/Footer';

export function LandingPage() {
  const { handleNewGame, handleJoinGameNavigate, isAuthLoading } =
    useCatfishGame();

  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      <div className="grow-1 flex flex-col items-center justify-center p-8">
        <div className="relative w-full max-w-[450px] p-12 text-center mb-12">
          <img
            src={'/images/catfish/backgrounds/homepage-module-bg-mobile.png'}
            alt="Catfish Game Background"
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          />
          <img
            src={'/images/catfish/catfish-logo.png'}
            alt="Catfish Game Logo"
            className="mb-12 w-full h-auto relative z-5"
          />
          <div className="w-full space-y-3">
            <CatfishButton
              variant="1"
              color="#5465ff"
              hoverColor="#2E3192"
              onClick={isAuthLoading ? undefined : handleNewGame}
            >
              New Game
            </CatfishButton>
            <CatfishButton
              variant="2"
              color="#23CE6B"
              hoverColor="#10AC84"
              onClick={isAuthLoading ? undefined : handleJoinGameNavigate}
            >
              Join Game
            </CatfishButton>
            <CatfishButton
              variant="3"
              color="#FDE12D"
              hoverColor="#F0A500"
              textColor="#000"
            >
              How To Play
            </CatfishButton>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
