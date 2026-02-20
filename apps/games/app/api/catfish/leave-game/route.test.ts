import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { GameError, GameErrorCode } from '@rto-games/core';

vi.mock('../../../../lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: {},
}));

vi.mock('../../../catfish/services/lobbyService', () => ({
  removePlayer: vi.fn(),
}));

import { adminAuth } from '../../../../lib/firebaseAdmin';
import { removePlayer } from '../../../catfish/services/lobbyService';

function makeRequest(opts?: {
  authHeader?: string | null;
  body?: unknown;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts?.authHeader !== null) {
    headers['Authorization'] = opts?.authHeader ?? 'Bearer valid-token';
  }
  return new NextRequest('http://localhost/api/catfish/leave-game', {
    method: 'POST',
    headers,
    body: opts?.body !== undefined
      ? JSON.stringify(opts.body)
      : JSON.stringify({ gameId: 'game-123' }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
    uid: 'uid-player',
  } as Awaited<ReturnType<typeof adminAuth.verifyIdToken>>);
  vi.mocked(removePlayer).mockResolvedValue({
    gameDeleted: false,
    gameType: 'catfish',
    affectedUids: ['uid-player'],
  });
});

describe('POST /api/catfish/leave-game', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await POST(makeRequest({ authHeader: null }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when token verification fails', async () => {
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValue(new Error('bad-token'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/catfish/leave-game', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when gameId is missing', async () => {
    const res = await POST(makeRequest({ body: {} }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when gameId is an empty string', async () => {
    const res = await POST(makeRequest({ body: { gameId: '   ' } }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when targetUid is provided but is not a string', async () => {
    const res = await POST(
      makeRequest({ body: { gameId: 'game-123', targetUid: 42 } }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 with gameDeleted: false when a player self-leaves', async () => {
    const res = await POST(makeRequest({ body: { gameId: 'game-123' } }));
    expect(res.status).toBe(200);
    const body = await res.json() as { gameDeleted: boolean };
    expect(body.gameDeleted).toBe(false);
  });

  it('defaults targetUid to the requesting user when not supplied', async () => {
    await POST(makeRequest({ body: { gameId: 'game-123' } }));

    expect(vi.mocked(removePlayer)).toHaveBeenCalledWith(
      expect.anything(),
      'game-123',
      'uid-player', // targetUid defaults to requestingUid
      'uid-player',
      expect.any(String),
    );
  });

  it('passes explicit targetUid when provided', async () => {
    await POST(
      makeRequest({ body: { gameId: 'game-123', targetUid: 'uid-kick-me' } }),
    );

    expect(vi.mocked(removePlayer)).toHaveBeenCalledWith(
      expect.anything(),
      'game-123',
      'uid-kick-me',
      'uid-player', // requestingUid
      expect.any(String),
    );
  });

  it('returns 200 with gameDeleted: true when the host leaves', async () => {
    vi.mocked(removePlayer).mockResolvedValue({
      gameDeleted: true,
      gameType: 'catfish',
      affectedUids: ['uid-host', 'uid-player'],
    });
    const res = await POST(makeRequest({ body: { gameId: 'game-123' } }));
    expect(res.status).toBe(200);
    const body = await res.json() as { gameDeleted: boolean };
    expect(body.gameDeleted).toBe(true);
  });

  it('returns 403 when NotAuthorised is thrown', async () => {
    vi.mocked(removePlayer).mockRejectedValue(
      new GameError('Not authorised', GameErrorCode.NotAuthorised),
    );
    const res = await POST(makeRequest({ body: { gameId: 'game-123', targetUid: 'uid-other' } }));
    expect(res.status).toBe(403);
  });

  it('returns 404 when game is not found', async () => {
    vi.mocked(removePlayer).mockRejectedValue(
      new GameError('Not found', GameErrorCode.GameNotFound),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(removePlayer).mockRejectedValue(new Error('DB error'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
