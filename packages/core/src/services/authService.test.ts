import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signInAnonymously as firebaseSignInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '../firebase/config';
import { signInAnonymously, onAuthStateChange, getCurrentUser } from './authService';

vi.mock('../firebase/config', () => ({
  getFirebaseAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(),
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(),
}));

function makeMockUser(uid: string): User {
  return { uid, displayName: null, email: null } as unknown as User;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInAnonymously', () => {
  it('calls Firebase signInAnonymously and returns the user', async () => {
    const mockUser = makeMockUser('anon-uid');
    vi.mocked(firebaseSignInAnonymously).mockResolvedValue({
      user: mockUser,
      operationType: 'signIn',
      providerId: null,
    } as unknown as Awaited<ReturnType<typeof firebaseSignInAnonymously>>);

    const user = await signInAnonymously();

    expect(vi.mocked(firebaseSignInAnonymously)).toHaveBeenCalledOnce();
    expect(user.uid).toBe('anon-uid');
  });

  it('propagates errors from Firebase', async () => {
    vi.mocked(firebaseSignInAnonymously).mockRejectedValue(
      new Error('sign-in failed'),
    );

    await expect(signInAnonymously()).rejects.toThrow('sign-in failed');
  });
});

describe('onAuthStateChange', () => {
  it('calls onAuthStateChanged with the provided callback', () => {
    const unsubscribeSpy = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(unsubscribeSpy);

    const callback = vi.fn();
    const unsubscribe = onAuthStateChange(callback);

    expect(vi.mocked(onAuthStateChanged)).toHaveBeenCalledWith(
      expect.anything(),
      callback,
    );
    expect(unsubscribe).toBe(unsubscribeSpy);
  });
});

describe('getCurrentUser', () => {
  it('returns auth.currentUser from the Firebase auth instance', () => {
    const mockUser = makeMockUser('uid-current');
    vi.mocked(getFirebaseAuth).mockReturnValue({
      currentUser: mockUser,
    } as unknown as ReturnType<typeof getFirebaseAuth>);

    const user = getCurrentUser();

    expect(user?.uid).toBe('uid-current');
  });

  it('returns null when no user is signed in', () => {
    vi.mocked(getFirebaseAuth).mockReturnValue({
      currentUser: null,
    } as unknown as ReturnType<typeof getFirebaseAuth>);

    const user = getCurrentUser();

    expect(user).toBeNull();
  });
});
