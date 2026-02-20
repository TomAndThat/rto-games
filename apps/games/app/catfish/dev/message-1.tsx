"use client";
import { CatfishButton } from "../components/buttons/CatfishButton";

import Footer from "../components/Footer";

export default function EnterName() {
  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      {/* Page Content container */}
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8">
        {/* Page Content */}
        <div className="w-full max-w-[350px] text-center p-8 relative">
          <img
            src={"/images/catfish/backgrounds/love-note-1.png"}
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          />
          <div className="relative z-10">
            <p className="handwritten text-lg">Hi there</p>
            {/* Dynamically insert player name here */}
            <p className="handwritten text-2xl mb-4">Player Name</p>
            <p className="mb-4 handwritten text-lg">
              Let's create your dating profile!
            </p>
            <p className="mb-4 handwritten text-lg">
              Fill in the prompt as honestly as you can.
            </p>
            <p className="mb-4 handwritten text-lg">
              You'll get points if people can recognise the real you.
            </p>

            {/* Game host only - counts down to automatic forwarding */}
            <CatfishButton
              variant="4"
              color="#23CE6B"
              hoverColor="#248c50"
              textColor="#000"
            >
              Skip (30)
            </CatfishButton>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
