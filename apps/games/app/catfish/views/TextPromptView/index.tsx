"use client";

import { useState, useRef } from "react";
import { CatfishButton } from "../../components/buttons/CatfishButton";
import Footer from "../../components/Footer";
import { useCountdown } from "../../hooks/useCountdown";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANSWER_MIN_LENGTH = 3;
const ANSWER_MAX_LENGTH = 75;
const PROMPT_DURATION_SECONDS = 60;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TextPromptViewProps {
  /** The player whose prompt is being answered (may be the current player for own prompts). */
  promptOwnerName: string;
  /** The prompt text to display. */
  promptText: string;
  /** True when the player is answering their own prompt. */
  isOwnPrompt: boolean;
  /** Resolved catfish instruction, e.g. "Put yourself in Alice's shoes…" */
  catfishInstructionText: string;
  /**
   * True if this player has already submitted for this sub-step.
   * Seeds the local hasSubmitted state, so a page refresh after submitting
   * shows the waiting screen rather than the prompt form.
   */
  initialIsSubmitted?: boolean;
  /** Called when the player submits their answer. */
  onSubmit: (answer: string) => Promise<void>;
  /** True while the API call is in-flight. */
  isSubmitting: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TextPromptView({
  promptOwnerName,
  promptText,
  isOwnPrompt,
  catfishInstructionText,
  initialIsSubmitted = false,
  onSubmit,
  isSubmitting,
}: TextPromptViewProps): React.JSX.Element {
  const [answer, setAnswer] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(initialIsSubmitted);
  const hasAutoSubmittedRef = useRef(false);

  const canSubmit =
    answer.trim().length >= ANSWER_MIN_LENGTH && !hasSubmitted && !isSubmitting;

  // When the countdown expires, auto-submit whatever is typed (even empty string
  // falls through as a timed-out response on the server side).
  const handleCountdownExpiry = () => {
    if (!hasAutoSubmittedRef.current && !hasSubmitted) {
      hasAutoSubmittedRef.current = true;
      void handleSubmit();
    }
  };

  const remaining = useCountdown(
    PROMPT_DURATION_SECONDS,
    handleCountdownExpiry,
  );

  const handleSubmit = async () => {
    if (hasSubmitted) return;
    setHasSubmitted(true);
    await onSubmit(answer.trim());
  };

  const headingCopy = isOwnPrompt ? (
    <>
      Let&rsquo;s pop this on
      <br />
      <span className="text-owl-yellow">your profile</span>
    </>
  ) : (
    <>
      How would <span className="text-owl-yellow">{promptOwnerName}</span>{" "}
      answer this?
    </>
  );

  return (
    <div className="w-full flex flex-col items-center justify-center w-full min-h-screen">
      <div className="grow-1 w-full flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[500px] text-white text-center px-8 md:px-16 py-8 relative">
          {/* Background */}
          <img
            src="/images/catfish/backgrounds/text-prompt-mobile.png"
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 sm:hidden"
          />
          <img
            src="/images/catfish/backgrounds/text-prompt-desktop.png"
            alt=""
            className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 hidden sm:block"
          />

          <div className="relative z-10">
            {/* Catfish instruction (shown only for catfish sub-steps) */}
            {!isOwnPrompt && (
              <p className="handwritten text-base mb-4 opacity-80">
                {catfishInstructionText}
              </p>
            )}

            {/* Heading */}
            <h2 className="font-heading text-2xl sm:text-4xl md:text-4xl mb-6 sm:mb-8">
              {headingCopy}
            </h2>

            {/* Prompt frame */}
            <div className="relative w-full flex flex-col items-center justify-center px-8 py-6 mb-4 md:mb-6">
              <img
                src="/images/catfish/backgrounds/text-prompt-frame-mobile.png"
                alt=""
                className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 sm:hidden"
              />
              <img
                src="/images/catfish/backgrounds/text-prompt-frame-desktop.png"
                alt=""
                className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 hidden sm:block"
              />
              <span className="font-heading relative z-10 text-black text-xl sm:text-2xl md:text-3xl lowercase">
                {promptText}
              </span>
            </div>

            {hasSubmitted ? (
              <WaitingState />
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canSubmit) void handleSubmit();
                }}
              >
                {/* Answer input */}
                <div className="relative">
                  <img
                    src="/images/catfish/backgrounds/text-input-mobile.png"
                    alt=""
                    className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 sm:hidden"
                  />
                  <img
                    src="/images/catfish/backgrounds/text-input-desktop.png"
                    alt=""
                    className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 hidden sm:block"
                  />
                  <div className="relative z-10 mb-6">
                    <textarea
                      className="w-full p-4 text-black text-center handwritten sm:text-lg resize-none min-h-[120px] leading-8"
                      minLength={ANSWER_MIN_LENGTH}
                      maxLength={ANSWER_MAX_LENGTH}
                      placeholder="Type your answer here..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <CatfishButton
                  variant="4"
                  color="#23CE6B"
                  hoverColor="#248c50"
                  textColor="#000"
                  onClick={canSubmit ? () => void handleSubmit() : undefined}
                >
                  {isSubmitting
                    ? "Submitting\u2026"
                    : `Submit My Answer (${remaining})`}
                </CatfishButton>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waiting state
// ---------------------------------------------------------------------------

function WaitingState() {
  return (
    <div className="text-center py-4">
      <p className="handwritten text-xl mb-2">Answer submitted!</p>
      <p className="handwritten text-lg opacity-75">
        Waiting for other players&hellip;
      </p>
    </div>
  );
}
