"use client";

import { DrawingCanvas } from "../../components/DrawingCanvas";
import { CatfishButton } from "../../components/buttons/CatfishButton";
import Footer from "../../components/Footer";

export default function ProfilePic() {
  const handleSubmit = (dataUrl: string) => {
    // TODO: send dataUrl to game state / Firestore
    console.log("Drawing submitted", dataUrl.slice(0, 60) + "…");
  };

  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center">
      <div className="grow-1 flex flex-col items-center justify-center p-4">
        {/* Page Content */}
        <div className="p-8 relative w-full max-w-[450px] text-center flex flex-col gap-4">
          <img
            src={"/images/catfish/backgrounds/profile-pic-module-bg-mobile.png"}
            alt="Catfish Game Background"
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          />
          <h2 className="text-4xl relative z-10">
            Draw Your
            <br />
            Profile Pic
          </h2>

          <DrawingCanvas
            className="flex-1 min-h-0"
            aspectRatio="1:1"
            onSubmit={handleSubmit}
          />

          <CatfishButton variant="1" color="#23CE6B" hoverColor="#10AC84">
            Submit Drawing
          </CatfishButton>
        </div>
      </div>
      <Footer />
    </div>
  );
}
