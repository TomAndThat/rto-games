import { CatfishButton } from "../../components/buttons/CatfishButton";
import Footer from "../../components/Footer";

const hostName = "xxxxxxxxxxxxxxxxxxxx"; // Placeholder - replace with dynamic value when ready
const display = "lobby"; // Placeholder - replace with dynamic value when ready
const removePlayerName = "Geoff"; // Placeholder - replace with dynamic value when ready
const gameCode = "ABCDEF"; // Placeholder - replace with dynamic value when ready

const players = [
  // Placeholder player data - replace with dynamic data when ready
  {
    id: 1,
    playerName: "Geoff",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 2,
    playerName: "Alice",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 3,
    playerName: "Marcus",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 4,
    playerName: "Sophie",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 5,
    playerName: "Jordan",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 6,
    playerName: "Elena",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 7,
    playerName: "Kai",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 8,
    playerName: "Priya",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 9,
    playerName: "Felix",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 10,
    playerName: "Mia",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 11,
    playerName: "Diego",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 12,
    playerName: "Zara",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 13,
    playerName: "Liam",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 14,
    playerName: "Lucia",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 15,
    playerName: "Oscar",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 16,
    playerName: "Ivy",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 17,
    playerName: "Rohan",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 18,
    playerName: "Sienna",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 19,
    playerName: "Xavier",
    image: "/images/catfish/profile-img-placeholder.png",
  },
  {
    id: 20,
    playerName: "Yasmin",
    image: "/images/catfish/profile-img-placeholder.png",
  },
];

export default function Lobby() {
  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      {/* Content wrapper */}
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8 md:p-12">
        {/* Lobby component */}
        {display === "lobby" && (
          <div className="relative flex flex-col justify-between w-full max-w-[850px] min-h-[500px] p-8 text-center mb-12">
            {/* Background */}
            {players.length <= 7 && (
              <>
                <img
                  src={"/images/catfish/backgrounds/lobby-mobile-short.png"}
                  alt="Catfish Game Background"
                  className="absolute sm:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-tablet-short.png"}
                  alt="Catfish Game Background"
                  className="absolute hidden sm:block  top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-desktop-medium.png"}
                  alt="Catfish Game Background"
                  className="absolute hidden md:block top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
              </>
            )}
            {players.length > 7 && players.length <= 14 && (
              <>
                <img
                  src={"/images/catfish/backgrounds/lobby-mobile-medium.png"}
                  alt="Catfish Game Background"
                  className="absolute sm:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-tablet-short.png"}
                  alt="Catfish Game Background"
                  className="absolute hidden sm:block md:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-desktop-medium.png"}
                  alt="Catfish Game Background"
                  className="absolute hidden md:block top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
              </>
            )}
            {players.length > 14 && (
              <>
                <img
                  src={"/images/catfish/backgrounds/lobby-mobile-long.png"}
                  alt="Catfish Game Background"
                  className="absolute sm:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-tablet-medium.png"}
                  alt="Catfish Game Background"
                  className="absolute hidden sm:block md:hidden top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
                <img
                  src={"/images/catfish/backgrounds/lobby-desktop-medium.png"}
                  alt="Catfish Game Background"
                  className="absolute hidden md:block top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
                />
              </>
            )}

            {/* Game Code */}
            <div className="absolute top-[-15px] md:top-[-25px] right-[-10px] p-2 md:p-3 text-white font-heading md:text-2xl rotate-2 lowercase">
              <img
                src={"/images/catfish/backgrounds/game-code-bg.png"}
                alt="Game Code Background"
                className="absolute top-0 left-0 w-full h-full"
              />
              <span className="relative z-10">Game Code: {gameCode}</span>
            </div>

            {/* Game Title */}
            <div className="mb-8 sm:mb-12 md:mb-16 relative z-5">
              <h2 className="mb-4 text-xl sm:text-3xl md:text-5xl font-bold relative z-5">
                {hostName}'s Game
              </h2>
            </div>

            <div
              className={`w-full grow-1 grid ${players.length > 6 ? "grid-cols-3" : "grid-cols-2"}  sm:grid-cols-4 ${players.length > 6 ? "md:grid-cols-6" : "md:grid-cols-5"} gap-4 relative z-5`}
            >
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col items-center mb-4"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Remove player button */}
                    {/* This button only shows if the user *viewing* is the host OR on the player's own card */}
                    <img
                      src={"/images/catfish/buttons/remove-player.png"}
                      className="absolute right-0 bottom-0 w-8 h-auto cursor-pointer"
                    />
                    <img
                      src={player.image}
                      alt={player.playerName}
                      className="w-[80%] h-auto rounded-full mb-2 rounded border-2"
                    />
                  </div>
                  <span className="text-lg font-semibold">
                    {player.playerName}
                  </span>
                </div>
              ))}
            </div>

            {/* This button is only rendered if the viewer is the host */}
            <div className="w-full max-w-[300px] mx-auto mt-8">
              <CatfishButton
                variant="1"
                color="#FDE12D"
                hoverColor="#F0A500"
                textColor="#000"
              >
                Start Game
              </CatfishButton>
            </div>
          </div>
        )}

        {/* Remove Self */}
        {display === "remove_self" && (
          <div className="relative w-full max-w-[400px] p-8 text-center text-white mb-12">
            <img
              src={"/images/catfish/backgrounds/dialogue-1-red-mobile.png"}
              alt="Catfish Game Background"
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
            {/* This P tag is for hosts only */}
            <p className="mb-4 relative z-10">
              Because you're the host, this will end the game for everyone else.
            </p>
            {/* This P tag displays for everyone */}
            <p className="mb-6 relative z-10">
              Are you sure you want to proceed?
            </p>
            <CatfishButton
              variant="4"
              color="#FDE12D"
              hoverColor="#F0A500"
              textColor="#000"
            >
              Remove me!
            </CatfishButton>
          </div>
        )}

        {/* Remove Other */}
        {display === "remove_other" && (
          <div className="relative w-full max-w-[400px] p-8 text-center text-white mb-12">
            <img
              src={"/images/catfish/backgrounds/dialogue-1-red-mobile.png"}
              alt="Catfish Game Background"
              className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
            />
            <h2 className="mb-4 text-3xl sm:text-4xl font-bold relative z-10">
              Imminent Danger
            </h2>
            <p className="mb-4 relative z-10">
              You are about to remove
              <br />
              {removePlayerName} from the game.
            </p>

            <p className="mb-6 relative z-10">
              Are you sure you want to proceed?
            </p>
            <CatfishButton
              variant="4"
              color="#FDE12D"
              hoverColor="#F0A500"
              textColor="#000"
            >
              Remove {removePlayerName}
            </CatfishButton>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
