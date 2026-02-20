import type { GameConfig } from '@rto-games/core';

export const CATFISH_USERNAME_MIN_LENGTH = 2;
export const CATFISH_USERNAME_MAX_LENGTH = 20;
export const CATFISH_MIN_PLAYERS = 3;
export const CATFISH_MAX_PLAYERS = 20;
export const CATFISH_GAME_CODE_LENGTH = 6;

/**
 * Catfish game configuration for the core pre-lobby system.
 *
 * Required steps are checked in order — the player must satisfy each
 * validator before proceeding to the next step or entering the lobby.
 */
export const CATFISH_CONFIG: GameConfig = {
  gameType: 'catfish',
  collectionName: 'catfish',
  minPlayers: CATFISH_MIN_PLAYERS,
  maxPlayers: CATFISH_MAX_PLAYERS,
  requiredSteps: [
    {
      key: 'username',
      validator: (data) =>
        !!data &&
        typeof data.username === 'string' &&
        data.username.length >= CATFISH_USERNAME_MIN_LENGTH &&
        data.username.length <= CATFISH_USERNAME_MAX_LENGTH,
    },
    {
      key: 'profilePicture',
      validator: (data) =>
        !!data &&
        typeof data.profilePictureUrl === 'string' &&
        data.profilePictureUrl.length > 0,
    },
  ],
};
