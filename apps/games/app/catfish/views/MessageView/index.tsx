"use client";

import { CatfishButton } from "../../components/buttons/CatfishButton";
import Footer from "../../components/Footer";
import { useCountdown } from "../../hooks/useCountdown";

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const MESSAGE_CONFIG = {
  1: {
    backgroundImage: "/images/catfish/backgrounds/love-note-1.png",
    durationSeconds: 30,
  },
  2: {
    backgroundImage: "/images/catfish/backgrounds/love-note-2.png",
    durationSeconds: 20,
  },
  3: {
    backgroundImage: "/images/catfish/backgrounds/love-note-2.png",
    durationSeconds: 20,
  },
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MessageViewProps {
  messageType: 1 | 2 | 3;
  /** The current player's first name, used in the message-1 greeting. */
  playerName: string;
  /** True when this player is the host — shows the skip button. */
  isHost: boolean;
  /** Called when the host taps skip, or when the host's countdown expires. */
  onSkip: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageView({
  messageType,
  playerName,
  isHost,
  onSkip,
}: MessageViewProps): React.JSX.Element {
  const config = MESSAGE_CONFIG[messageType];

  const remaining = useCountdown(
    config.durationSeconds,
    isHost ? onSkip : undefined,
  );

  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[350px] text-center p-8 relative">
          <img
            src={config.backgroundImage}
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2"
          />
          <div className="relative z-10">
            {messageType === 1 && <Message1Content playerName={playerName} />}
            {messageType === 2 && <Message2Content />}
            {messageType === 3 && <Message3Content />}

            {isHost && (
              <CatfishButton
                variant="4"
                color="#23CE6B"
                hoverColor="#248c50"
                textColor="#000"
                onClick={onSkip}
              >
                Skip ({remaining})
              </CatfishButton>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message content sub-components
// ---------------------------------------------------------------------------

function Message1Content({ playerName }: { playerName: string }) {
  return (
    <>
      <p className="handwritten text-lg">Hi there</p>
      <p className="handwritten text-2xl mb-4">{playerName}</p>
      <p className="mb-4 handwritten text-lg">
        Let&rsquo;s create your dating profile!
      </p>
      <p className="mb-4 handwritten text-lg">
        Fill in the prompt as honestly as you can.
      </p>
      <p className="mb-4 handwritten text-lg">
        You&rsquo;ll get points if people can recognise the real you.
      </p>
    </>
  );
}

function Message2Content() {
  return (
    <>
      <p className="mb-4 handwritten text-lg">
        Now you&rsquo;re going to fill in the prompt for someone else!
      </p>
      <p className="mb-4 handwritten text-lg">
        When it&rsquo;s time to vote, you&rsquo;ll score a point for every
        player you fooled into thinking your answer was the real one.
      </p>
    </>
  );
}

function Message3Content() {
  return (
    <>
      <p className="mb-4 handwritten text-lg font-bold">
        Now it&rsquo;s time to vote!
      </p>
      <p className="mb-4 handwritten text-lg">
        Remember &mdash; you&rsquo;ll get a point for picking the real answer.
      </p>
      <p className="mb-4 handwritten text-lg">
        If you get it wrong, the point goes to the catfish.
      </p>
    </>
  );
}
