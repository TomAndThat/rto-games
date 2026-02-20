'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  getPlayerGameData,
  setPlayerGameField,
} from '../services/playerService';
import { logError } from '../utils/logger';

interface UsePlayerOptions {
  uid: string | null;
  gameType: string;
}

interface UsePlayerReturn {
  playerGameData: Record<string, unknown> | undefined;
  isLoading: boolean;
  /** Update a single field in the player's per-game data. */
  setField: (field: string, value: unknown) => Promise<void>;
  /** Re-fetch data from Firestore; returns the refreshed data. */
  refresh: () => Promise<Record<string, unknown> | undefined>;
}

/**
 * Fetches and caches the current player's per-game data from Firestore.
 * Provides helpers to update individual fields and refresh the cache.
 */
export function usePlayer({ uid, gameType }: UsePlayerOptions): UsePlayerReturn {
  const [playerGameData, setPlayerGameData] = useState<
    Record<string, unknown> | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Track the uid we've last fetched for, so we can synchronously set
  // isLoading = true when uid changes (same pattern as useGame).
  const [trackedUid, setTrackedUid] = useState<string | null>(uid);

  if (trackedUid !== uid) {
    setTrackedUid(uid);
    if (uid !== null) {
      setIsLoading(true);
      setPlayerGameData(undefined);
    }
  }

  const refresh = useCallback(async (): Promise<
    Record<string, unknown> | undefined
  > => {
    if (!uid) {
      setPlayerGameData(undefined);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    try {
      const data = await getPlayerGameData(uid, gameType);
      setPlayerGameData(data);
      return data;
    } catch (error) {
      logError('usePlayer: refresh failed', error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [uid, gameType]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setField = useCallback(
    async (field: string, value: unknown): Promise<void> => {
      if (!uid) throw new Error('Not authenticated');
      await setPlayerGameField(uid, gameType, field, value);
      // Re-fetch player data so the hook's state reflects the write.
      await refresh();
    },
    [uid, gameType, refresh],
  );

  return { playerGameData, isLoading, setField, refresh };
}
