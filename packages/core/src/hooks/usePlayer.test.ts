import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayer } from './usePlayer';

vi.mock('../services/playerService', () => ({
  getPlayerGameData: vi.fn(),
  setPlayerGameField: vi.fn(),
}));

import { getPlayerGameData, setPlayerGameField } from '../services/playerService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePlayer', () => {
  it('starts in a loading state', async () => {
    // Never resolves to keep loading = true visible momentarily
    vi.mocked(getPlayerGameData).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() =>
      usePlayer({ uid: 'uid-123', gameType: 'catfish' }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.playerGameData).toBeUndefined();
  });

  it('fetches player game data on mount', async () => {
    const mockData = { username: 'Alice', currentGameId: 'game-123' };
    vi.mocked(getPlayerGameData).mockResolvedValue(mockData);

    const { result } = renderHook(() =>
      usePlayer({ uid: 'uid-123', gameType: 'catfish' }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(vi.mocked(getPlayerGameData)).toHaveBeenCalledWith('uid-123', 'catfish');
    expect(result.current.playerGameData).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns undefined data when uid is null', async () => {
    const { result } = renderHook(() =>
      usePlayer({ uid: null, gameType: 'catfish' }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(vi.mocked(getPlayerGameData)).not.toHaveBeenCalled();
    expect(result.current.playerGameData).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('re-fetches when uid changes', async () => {
    const mockData = { username: 'Alice' };
    vi.mocked(getPlayerGameData).mockResolvedValue(mockData);

    const { rerender } = renderHook(
      ({ uid }: { uid: string | null }) =>
        usePlayer({ uid, gameType: 'catfish' }),
      { initialProps: { uid: 'uid-a' as string | null } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(vi.mocked(getPlayerGameData)).toHaveBeenCalledWith('uid-a', 'catfish');

    rerender({ uid: 'uid-b' });

    await act(async () => {
      await Promise.resolve();
    });

    expect(vi.mocked(getPlayerGameData)).toHaveBeenCalledWith('uid-b', 'catfish');
    expect(vi.mocked(getPlayerGameData)).toHaveBeenCalledTimes(2);
  });

  it('calls setPlayerGameField and refreshes on setField', async () => {
    const initialData = { username: 'Alice' };
    const updatedData = { username: 'Alice', score: 10 };

    vi.mocked(getPlayerGameData)
      .mockResolvedValueOnce(initialData)
      .mockResolvedValueOnce(updatedData);
    vi.mocked(setPlayerGameField).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePlayer({ uid: 'uid-123', gameType: 'catfish' }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.setField('score', 10);
    });

    expect(vi.mocked(setPlayerGameField)).toHaveBeenCalledWith(
      'uid-123',
      'catfish',
      'score',
      10,
    );
    // Should refresh after the write
    expect(vi.mocked(getPlayerGameData)).toHaveBeenCalledTimes(2);
    expect(result.current.playerGameData).toEqual(updatedData);
  });

  it('throws from setField when uid is null', async () => {
    vi.mocked(getPlayerGameData).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePlayer({ uid: null, gameType: 'catfish' }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    await expect(async () => {
      await act(async () => {
        await result.current.setField('username', 'Bob');
      });
    }).rejects.toThrow('Not authenticated');
  });

  it('refresh re-fetches and returns updated data', async () => {
    const refreshedData = { username: 'Alice', currentGameId: 'game-999' };
    vi.mocked(getPlayerGameData)
      .mockResolvedValueOnce({ username: 'Alice' })
      .mockResolvedValueOnce(refreshedData);

    const { result } = renderHook(() =>
      usePlayer({ uid: 'uid-123', gameType: 'catfish' }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    let refreshResult: Record<string, unknown> | undefined;
    await act(async () => {
      refreshResult = await result.current.refresh();
    });

    expect(refreshResult).toEqual(refreshedData);
    expect(result.current.playerGameData).toEqual(refreshedData);
  });
});
