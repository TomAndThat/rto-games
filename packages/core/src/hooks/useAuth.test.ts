import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

// Mock the services used by useAuth
vi.mock('../services/authService', () => ({
  onAuthStateChange: vi.fn(),
  signInAnonymously: vi.fn(),
}));

import { onAuthStateChange, signInAnonymously } from '../services/authService';
import type { User } from 'firebase/auth';

function makeMockUser(uid: string): User {
  return { uid } as unknown as User;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAuth', () => {
  it('starts in a loading state', () => {
    // Never call the callback — stay loading
    vi.mocked(onAuthStateChange).mockReturnValue(vi.fn());

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.uid).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('resolves with uid and isAuthenticated when a user is present', async () => {
    const mockUser = makeMockUser('uid-abc');
    vi.mocked(onAuthStateChange).mockImplementation((callback) => {
      // Fire synchronously so the useEffect sees the user immediately
      callback(mockUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    // Wait for the state update to flush
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.uid).toBe('uid-abc');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('signs in anonymously when no user exists', async () => {
    vi.mocked(signInAnonymously).mockResolvedValue(makeMockUser('new-anon-uid'));
    vi.mocked(onAuthStateChange).mockImplementation((callback) => {
      // First call: no user (triggers sign-in)
      act(() => {
        callback(null);
      });
      return vi.fn();
    });

    renderHook(() => useAuth());

    // Give the async sign-in a tick to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(vi.mocked(signInAnonymously)).toHaveBeenCalledOnce();
  });

  it('sets isAuthenticated false and stops loading when sign-in fails', async () => {
    vi.mocked(signInAnonymously).mockRejectedValue(new Error('auth/network-request-failed'));
    vi.mocked(onAuthStateChange).mockImplementation((callback) => {
      act(() => {
        callback(null);
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.uid).toBeNull();
  });

  it('calls the unsubscribe function on unmount', () => {
    const unsubscribeSpy = vi.fn();
    vi.mocked(onAuthStateChange).mockReturnValue(unsubscribeSpy);

    const { unmount } = renderHook(() => useAuth());
    unmount();

    expect(unsubscribeSpy).toHaveBeenCalledOnce();
  });
});
