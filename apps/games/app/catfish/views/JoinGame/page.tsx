import { CatfishButton } from "../../components/buttons/CatfishButton";
import Footer from "../../components/Footer";

export default function JoinGame() {
  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8">
        <div className="relative w-full max-w-[400px] p-8 text-center mb-12">
          <img
            src={"/images/catfish/backgrounds/dialogue-2-green-mobile.png"}
            alt="Catfish Game Background"
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          />
          <h2 className="mb-4 text-4xl font-bold relative z-10">Join Game</h2>
          <p className="mb-6 relative z-10">Please enter the game code below</p>
          <form>
            <div className="relative mb-4">
              <img
                src={"/images/catfish/inputs/text-input-1.png"}
                alt="Catfish Game Background"
                className="absolute top-1/2 left-1/2 w-[100%] h-[130%] font-bold -translate-x-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="ABCDEF"
                className="w-full max-w-[300px] text-center p-2 handwritten uppercase"
                minLength={6}
                maxLength={6}
              />
            </div>
            <CatfishButton
              variant="4"
              color="#FDE12D"
              hoverColor="#F0A500"
              textColor="#000"
            >
              Join Game
            </CatfishButton>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
