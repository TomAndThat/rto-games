import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { GameError, GameErrorCode } from '@rto-games/core';

vi.mock('../../../../lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: {},
}));

vi.mock('../../../catfish/services/lobbyService', () => ({
  joinGame: vi.fn(),
}));

import { adminAuth } from '../../../../lib/firebaseAdmin';
import { joinGame } from '../../../catfish/services/lobbyService';

function makeRequest(opts?: {
  authHeader?: string | null;
  body?: unknown;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts?.authHeader !== null) {
    headers['Authorization'] = opts?.authHeader ?? 'Bearer valid-token';
  }
  return new NextRequest('http://localhost/api/catfish/join-game', {
    method: 'POST',
    headers,
    body: opts?.body !== undefined
      ? JSON.stringify(opts.body)
      : JSON.stringify({
          gameCode: 'ABCDEF',
          playerData: {
            username: 'Alice',
            profilePictureUrl: 'https://example.com/pic.png',
          },
        }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
    uid: 'uid-player',
  } as Awaited<ReturnType<typeof adminAuth.verifyIdToken>>);
  vi.mocked(joinGame).mockResolvedValue({
    gameId: 'game-123',
    gameType: 'catfish',
  });
});

describe('POST /api/catfish/join-game', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await POST(makeRequest({ authHeader: null }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when token verification fails', async () => {
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValue(new Error('bad token'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/catfish/join-game', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: '{invalid json}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when gameCode is missing', async () => {
    const res = await POST(
      makeRequest({
        body: { playerData: { username: 'Alice', profilePictureUrl: 'https://example.com/p.png' } },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when gameCode is empty', async () => {
    const res = await POST(
      makeRequest({
        body: {
          gameCode: '   ',
          playerData: { username: 'Alice', profilePictureUrl: 'https://example.com/p.png' },
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when username is too short', async () => {
    const res = await POST(
      makeRequest({
        body: { gameCode: 'ABCDEF', playerData: { username: 'A', profilePictureUrl: '' } },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when profilePictureUrl is not a string', async () => {
    const res = await POST(
      makeRequest({
        body: { gameCode: 'ABCDEF', playerData: { username: 'Alice', profilePictureUrl: true } },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 with gameId and gameType on success', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json() as { gameId: string; gameType: string };
    expect(body.gameId).toBe('game-123');
    expect(body.gameType).toBe('catfish');
  });

  it('uppercases the gameCode before passing it to joinGame', async () => {
    await POST(makeRequest({ body: {
      gameCode: 'abcdef',
      playerData: { username: 'Alice', profilePictureUrl: 'https://example.com/p.png' },
    }}));

    expect(vi.mocked(joinGame)).toHaveBeenCalledWith(
      expect.anything(),
      'ABCDEF',
      'uid-player',
      expect.any(Object),
      expect.any(String),
    );
  });

  it('returns 404 when game is not found', async () => {
    vi.mocked(joinGame).mockRejectedValue(
      new GameError('Not found', GameErrorCode.GameNotFound),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });

  it('returns 409 when game is already started', async () => {
    vi.mocked(joinGame).mockRejectedValue(
      new GameError('Already started', GameErrorCode.GameAlreadyStarted),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it('returns 409 when player is already in the game', async () => {
    vi.mocked(joinGame).mockRejectedValue(
      new GameError('Already in game', GameErrorCode.AlreadyInGame),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it('returns 409 when game is full', async () => {
    vi.mocked(joinGame).mockRejectedValue(
      new GameError('Game full', GameErrorCode.GameFull),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(joinGame).mockRejectedValue(new Error('DB failure'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
