import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { GameError, GameErrorCode } from '@rto-games/core';

// Mock Firebase Admin auth and db
vi.mock('../../../../lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: {},
}));

// Mock the lobbyService createGame function
vi.mock('../../../catfish/services/lobbyService', () => ({
  createGame: vi.fn(),
}));

import { adminAuth } from '../../../../lib/firebaseAdmin';
import { createGame } from '../../../catfish/services/lobbyService';

function makeRequest(opts?: {
  authHeader?: string | null;
  body?: unknown;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts?.authHeader !== null) {
    headers['Authorization'] = opts?.authHeader ?? 'Bearer valid-token';
  }
  return new NextRequest('http://localhost/api/catfish/create-game', {
    method: 'POST',
    headers,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : JSON.stringify({
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
    uid: 'uid-host',
  } as Awaited<ReturnType<typeof adminAuth.verifyIdToken>>);
  vi.mocked(createGame).mockResolvedValue({
    gameId: 'generated-game-id',
    gameCode: 'ABCDEF',
  });
});

describe('POST /api/catfish/create-game', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req = makeRequest({ authHeader: null });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/unauthorized|unauthorised|missing/i);
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = makeRequest({ authHeader: 'Basic dXNlcjpwYXNz' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is invalid', async () => {
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValue(new Error('invalid-token'));
    const req = makeRequest();
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when the request body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/catfish/create-game', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when username is missing', async () => {
    const req = makeRequest({
      body: { playerData: { profilePictureUrl: 'https://example.com/pic.png' } },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when username is too short', async () => {
    const req = makeRequest({
      body: {
        playerData: { username: 'A', profilePictureUrl: 'https://example.com/pic.png' },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when username is too long', async () => {
    const req = makeRequest({
      body: {
        playerData: {
          username: 'A'.repeat(21), // max is 20
          profilePictureUrl: 'https://example.com/pic.png',
        },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when profilePictureUrl is not a string', async () => {
    const req = makeRequest({
      body: { playerData: { username: 'Alice', profilePictureUrl: 42 } },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 201 with gameId and gameCode on success', async () => {
    const req = makeRequest();
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json() as { gameId: string; gameCode: string };
    expect(body.gameId).toBe('generated-game-id');
    expect(body.gameCode).toBe('ABCDEF');
  });

  it('passes the host uid and player data to createGame', async () => {
    const req = makeRequest({
      body: { playerData: { username: 'Alice', profilePictureUrl: 'https://example.com/alice.png' } },
    });
    await POST(req);

    expect(vi.mocked(createGame)).toHaveBeenCalledWith(
      expect.anything(), // adminDb
      'uid-host',
      expect.any(String), // gameType
      { username: 'Alice', profilePictureUrl: 'https://example.com/alice.png' },
      expect.any(Object), // { minPlayers, maxPlayers }
      expect.any(String), // collectionName
    );
  });

  it('returns 500 when GameError CodeGenerationFailed is thrown (maps to default)', async () => {
    vi.mocked(createGame).mockRejectedValue(
      new GameError('Code gen failed', GameErrorCode.CodeGenerationFailed),
    );
    const req = makeRequest();
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(createGame).mockRejectedValue(new Error('Unexpected DB failure'));
    const req = makeRequest();
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
