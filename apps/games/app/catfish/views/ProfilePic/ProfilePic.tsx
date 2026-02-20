'use client';

import { useRef, useState } from 'react';
import { useCatfishGame } from '../../contexts/GameContext';
import { DrawingCanvas } from '../../components/DrawingCanvas';
import type { DrawingCanvasHandle } from '../../components/DrawingCanvas/DrawingCanvas';
import { CatfishButton } from '../../components/buttons/CatfishButton';
import Footer from '../../components/Footer';

export function ProfilePic() {
  const { handleSubmitProfilePicture, isSubmitting } = useCatfishGame();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrawingSubmit = async (dataUrl: string): Promise<void> => {
    setIsUploading(true);
    try {
      await handleSubmitProfilePicture(dataUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitClick = (): void => {
    canvasRef.current?.submit();
  };

  const busy = isUploading || isSubmitting;

  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center">
      <div className="grow-1 flex flex-col items-center justify-center p-4">
        <div className="p-8 relative w-full max-w-[450px] text-center flex flex-col gap-4">
          <img
            src={'/images/catfish/backgrounds/profile-pic-module-bg-mobile.png'}
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          />
          <h2 className="text-4xl relative z-10">
            Draw Your
            <br />
            Profile Pic
          </h2>

          <DrawingCanvas
            ref={canvasRef}
            className="flex-1 min-h-0"
            aspectRatio="1:1"
            onSubmit={handleDrawingSubmit}
          />

          <CatfishButton
            variant="1"
            color="#23CE6B"
            hoverColor="#10AC84"
            onClick={busy ? undefined : handleSubmitClick}
          >
            {busy ? 'Uploading\u2026' : 'Submit Drawing'}
          </CatfishButton>
        </div>
      </div>
      <Footer />
    </div>
  );
}
