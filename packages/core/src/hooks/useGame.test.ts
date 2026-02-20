import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGame } from './useGame';
import type { GameDocument, GameSubscriptionCallbacks } from '../types';

vi.mock('../services/gameService', () => ({
  subscribeToGame: vi.fn(),
}));

import { subscribeToGame } from '../services/gameService';

function makeMockGame(overrides?: Partial<GameDocument>): GameDocument {
  return {
    gameCode: 'ABCDEF',
    gameType: 'catfish',
    hostUid: 'uid-host',
    status: 'lobby',
    minPlayers: 3,
    maxPlayers: 20,
    createdAt: { seconds: 1704067200, nanoseconds: 0 } as unknown as GameDocument['createdAt'],
    players: {},
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useGame', () => {
  it('returns not loading and null game when gameId is null', () => {
    const { result } = renderHook(() =>
      useGame({ gameId: null, collectionName: 'catfish' }),
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.game).toBeNull();
    expect(result.current.isDeleted).toBe(false);
    expect(result.current.error).toBeNull();
    expect(vi.mocked(subscribeToGame)).not.toHaveBeenCalled();
  });

  it('sets isLoading to true immediately when gameId is provided', () => {
    vi.mocked(subscribeToGame).mockReturnValue(vi.fn()); // never calls back

    const { result } = renderHook(() =>
      useGame({ gameId: 'game-123', collectionName: 'catfish' }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.game).toBeNull();
  });

  it('calls subscribeToGame with the correct arguments', () => {
    vi.mocked(subscribeToGame).mockReturnValue(vi.fn());

    renderHook(() =>
      useGame({ gameId: 'game-abc', collectionName: 'catfish' }),
    );

    expect(vi.mocked(subscribeToGame)).toHaveBeenCalledWith(
      'game-abc',
      expect.objectContaining({
        onData: expect.any(Function),
        onDeleted: expect.any(Function),
        onError: expect.any(Function),
      }),
      'catfish',
    );
  });

  it('updates game state and stops loading when onData fires', () => {
    const mockGame = makeMockGame({ gameCode: 'XYZXYZ' });
    let capturedCallbacks!: GameSubscriptionCallbacks;

    vi.mocked(subscribeToGame).mockImplementation((_id, callbacks) => {
      capturedCallbacks = callbacks;
      return vi.fn();
    });

    const { result } = renderHook(() =>
      useGame({ gameId: 'game-123', collectionName: 'catfish' }),
    );

    act(() => {
      capturedCallbacks.onData(mockGame);
    });

    expect(result.current.game?.gameCode).toBe('XYZXYZ');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isDeleted).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets isDeleted and clears game when onDeleted fires', () => {
    let capturedCallbacks!: GameSubscriptionCallbacks;

    vi.mocked(subscribeToGame).mockImplementation((_id, callbacks) => {
      capturedCallbacks = callbacks;
      act(() => callbacks.onData(makeMockGame()));
      return vi.fn();
    });

    const { result } = renderHook(() =>
      useGame({ gameId: 'game-123', collectionName: 'catfish' }),
    );

    act(() => {
      capturedCallbacks.onDeleted();
    });

    expect(result.current.game).toBeNull();
    expect(result.current.isDeleted).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error string when onError fires', () => {
    let capturedCallbacks!: GameSubscriptionCallbacks;

    vi.mocked(subscribeToGame).mockImplementation((_id, callbacks) => {
      capturedCallbacks = callbacks;
      return vi.fn();
    });

    const { result } = renderHook(() =>
      useGame({ gameId: 'game-123', collectionName: 'catfish' }),
    );

    act(() => {
      capturedCallbacks.onError(new Error('Firestore connection lost'));
    });

    expect(result.current.error).toBe('Firestore connection lost');
    expect(result.current.game).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('unsubscribes on unmount', () => {
    const unsubscribeSpy = vi.fn();
    vi.mocked(subscribeToGame).mockReturnValue(unsubscribeSpy);

    const { unmount } = renderHook(() =>
      useGame({ gameId: 'game-123', collectionName: 'catfish' }),
    );

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalledOnce();
  });

  it('resets state when gameId changes to null', () => {
    let capturedCallbacks!: GameSubscriptionCallbacks;
    vi.mocked(subscribeToGame).mockImplementation((_id, callbacks) => {
      capturedCallbacks = callbacks;
      return vi.fn();
    });

    const { result, rerender } = renderHook(
      ({ gameId }: { gameId: string | null }) =>
        useGame({ gameId, collectionName: 'catfish' }),
      { initialProps: { gameId: 'game-123' as string | null } },
    );

    act(() => {
      capturedCallbacks.onData(makeMockGame());
    });

    expect(result.current.game).not.toBeNull();

    rerender({ gameId: null });

    expect(result.current.game).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isDeleted).toBe(false);
  });
});
