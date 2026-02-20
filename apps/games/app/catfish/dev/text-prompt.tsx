"use client";
import { CatfishButton } from "../components/buttons/CatfishButton";

import Footer from "../components/Footer";

export default function EnterName() {
  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      {/* Page Content container */}
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8">
        {/* Page Content */}
        <div className="w-full max-w-[500px] text-white text-center px-8 md:px-16 py-8 relative">
          <img
            src={"/images/catfish/backgrounds/text-prompt-mobile.png"}
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 sm:hidden"
          />
          <img
            src={"/images/catfish/backgrounds/text-prompt-desktop.png"}
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 hidden sm:block"
          />
          <div className="relative z-10">
            <h2 className="font-heading text-2xl sm:text-4xl md:text-4xl mb-6 sm:mb-8">
              {/* Let's pop this on
              <br />
              <span className="text-owl-yellow">your profile</span> */}
              How would <span className="text-owl-yellow">player name</span>{" "}
              answer this?
            </h2>

            <div className="relative w-full flex flex-col items-center justify-center px-8 py-6 mb-4 md:mb-6">
              <img
                src={"/images/catfish/backgrounds/text-prompt-frame-mobile.png"}
                alt=""
                className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 sm:hidden"
              />
              <img
                src={
                  "/images/catfish/backgrounds/text-prompt-frame-desktop.png"
                }
                alt=""
                className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 hidden sm:block"
              />
              <span className="font-heading relative z-10 text-black text-xl sm:text-2xl md:text-3xl lowercase">
                What's your favourite flavour of ice cream?
              </span>
            </div>
            <form>
              <div className="relative">
                <img
                  src={"/images/catfish/backgrounds/text-input-mobile.png"}
                  alt=""
                  className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 sm:hidden"
                />
                <img
                  src={"/images/catfish/backgrounds/text-input-desktop.png"}
                  alt=""
                  className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 hidden sm:block"
                />
                <div className="relative z-10 mb-6">
                  <textarea
                    className="w-full p-4 text-black text-center handwritten sm:text-lg resize-none min-h-[120px] sm:min-h-[120px] leading-8"
                    minLength={3}
                    maxLength={75}
                    placeholder="Type your answer here..."
                  ></textarea>
                </div>
              </div>
              {/* Button counts down from 60 - 0 */}
              <CatfishButton
                variant="4"
                color="#23CE6B"
                hoverColor="#248c50"
                textColor="#000"
              >
                Submit My Answer (60)
              </CatfishButton>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
