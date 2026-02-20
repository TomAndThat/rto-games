'use client';

import { useState, useEffect } from 'react';

import { subscribeToGame } from '../services/gameService';
import type { GameDocument } from '../types';

interface UseGameOptions {
  gameId: string | null;
  collectionName: string;
}

interface UseGameReturn {
  game: GameDocument | null;
  isLoading: boolean;
  /** True when the game document was deleted from Firestore. */
  isDeleted: boolean;
  error: string | null;
}

/**
 * Subscribes to a game document in real time.
 * Pass `gameId: null` to clear the subscription (e.g. when not yet in a game).
 */
export function useGame({ gameId, collectionName }: UseGameOptions): UseGameReturn {
  const [game, setGame] = useState<GameDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedGameId, setTrackedGameId] = useState<string | null>(null);

  // Synchronously update state when gameId changes during render.
  // This prevents race conditions where components check isLoading before
  // the subscription effect has fired.
  if (trackedGameId !== gameId) {
    setTrackedGameId(gameId);
    if (gameId !== null) {
      // Starting to load a new game
      setIsLoading(true);
      setIsDeleted(false);
      setGame(null);
      setError(null);
    } else {
      // Clearing game
      setIsLoading(false);
      setIsDeleted(false);
      setGame(null);
      setError(null);
    }
  }

  useEffect(() => {
    if (!gameId) {
      return;
    }

    const unsubscribe = subscribeToGame(
      gameId,
      {
        onData: (gameData) => {
          setGame(gameData);
          setIsLoading(false);
          setIsDeleted(false);
          setError(null);
        },
        onDeleted: () => {
          setGame(null);
          setIsLoading(false);
          setIsDeleted(true);
          setError(null);
        },
        onError: (err) => {
          setGame(null);
          setIsLoading(false);
          setError(err.message);
        },
      },
      collectionName,
    );

    return unsubscribe;
  }, [gameId, collectionName]);

  return { game, isLoading, isDeleted, error };
}
