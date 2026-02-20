"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Counts down from `seconds` to 0, calling `onComplete` when done.
 * Returns the current remaining seconds.
 */
export function useCountdown(seconds: number, onComplete?: () => void): number {
  const [remaining, setRemaining] = useState(seconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onCompleteRef.current?.();
      return;
    }

    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return remaining;
}
