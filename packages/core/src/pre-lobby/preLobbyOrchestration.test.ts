import { describe, it, expect } from 'vitest';
import { getIncompleteStep } from './preLobbyOrchestration';
import type { GameRequiredStep } from '../types';

const alwaysPass: GameRequiredStep = {
  key: 'always_pass',
  validator: () => true,
};

const alwaysFail: GameRequiredStep = {
  key: 'always_fail',
  validator: () => false,
};

const requiresUsername: GameRequiredStep = {
  key: 'username',
  validator: (data) =>
    !!data && typeof data['username'] === 'string' && data['username'].length >= 2,
};

const requiresProfilePic: GameRequiredStep = {
  key: 'profilePicture',
  validator: (data) =>
    !!data &&
    typeof data['profilePictureUrl'] === 'string' &&
    data['profilePictureUrl'].length > 0,
};

describe('getIncompleteStep', () => {
  it('returns null when there are no required steps', () => {
    expect(getIncompleteStep({}, [])).toBeNull();
  });

  it('returns null when all steps pass', () => {
    const steps = [alwaysPass, alwaysPass];
    expect(getIncompleteStep({}, steps)).toBeNull();
  });

  it('returns the key of the first failing step', () => {
    const steps = [alwaysPass, alwaysFail, alwaysPass];
    expect(getIncompleteStep({}, steps)).toBe('always_fail');
  });

  it('returns the first step key when all steps fail', () => {
    const steps = [alwaysFail, alwaysFail];
    expect(getIncompleteStep({}, steps)).toBe('always_fail');
  });

  it('returns null when playerGameData is undefined and all validators pass regardless', () => {
    const passingOnUndefined: GameRequiredStep = {
      key: 'unchecked',
      validator: () => true,
    };
    expect(getIncompleteStep(undefined, [passingOnUndefined])).toBeNull();
  });

  it('returns the first failing step key when playerGameData is undefined', () => {
    const steps = [requiresUsername, requiresProfilePic];
    expect(getIncompleteStep(undefined, steps)).toBe('username');
  });

  it('returns "username" when username is missing', () => {
    const data = { profilePictureUrl: 'https://example.com/pic.png' };
    const steps = [requiresUsername, requiresProfilePic];
    expect(getIncompleteStep(data, steps)).toBe('username');
  });

  it('returns "profilePicture" when username present but profile pic missing', () => {
    const data = { username: 'Alice' };
    const steps = [requiresUsername, requiresProfilePic];
    expect(getIncompleteStep(data, steps)).toBe('profilePicture');
  });

  it('returns null when both username and profile pic are present', () => {
    const data = {
      username: 'Alice',
      profilePictureUrl: 'https://example.com/pic.png',
    };
    const steps = [requiresUsername, requiresProfilePic];
    expect(getIncompleteStep(data, steps)).toBeNull();
  });

  it('returns "username" when username is too short', () => {
    const data = {
      username: 'A', // under the minimum of 2
      profilePictureUrl: 'https://example.com/pic.png',
    };
    const steps = [requiresUsername, requiresProfilePic];
    expect(getIncompleteStep(data, steps)).toBe('username');
  });

  it('evaluates steps in order — short-circuits on the first failure', () => {
    const callOrder: string[] = [];
    const step1: GameRequiredStep = {
      key: 'step1',
      validator: () => {
        callOrder.push('step1');
        return false; // fails
      },
    };
    const step2: GameRequiredStep = {
      key: 'step2',
      validator: () => {
        callOrder.push('step2');
        return true;
      },
    };
    getIncompleteStep({}, [step1, step2]);
    expect(callOrder).toEqual(['step1']); // step2 never called
  });
});
