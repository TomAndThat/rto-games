import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { StartGameError, StartGameErrorCode } from '../../../catfish/services/startGame';

vi.mock('../../../../lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  adminDb: {},
}));

vi.mock('../../../catfish/services/startGame', () => ({
  startGame: vi.fn(),
  StartGameErrorCode: {
    GameNotFound: 'GAME_NOT_FOUND',
    NotHost: 'NOT_HOST',
    GameAlreadyStarted: 'GAME_ALREADY_STARTED',
    InsufficientPlayers: 'INSUFFICIENT_PLAYERS',
    InsufficientPrompts: 'INSUFFICIENT_PROMPTS',
  },
  StartGameError: class StartGameError extends Error {
    constructor(
      message: string,
      public readonly code: string,
    ) {
      super(message);
      this.name = 'StartGameError';
    }
  },
}));

import { adminAuth } from '../../../../lib/firebaseAdmin';
import { startGame } from '../../../catfish/services/startGame';

function makeRequest(opts?: {
  authHeader?: string | null;
  body?: unknown;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts?.authHeader !== null) {
    headers['Authorization'] = opts?.authHeader ?? 'Bearer valid-token';
  }
  return new NextRequest('http://localhost/api/catfish/start-game', {
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
    uid: 'uid-host',
  } as Awaited<ReturnType<typeof adminAuth.verifyIdToken>>);
  vi.mocked(startGame).mockResolvedValue(undefined);
});

describe('POST /api/catfish/start-game', () => {
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
    const req = new NextRequest('http://localhost/api/catfish/start-game', {
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

  it('returns 400 when gameId is empty', async () => {
    const res = await POST(makeRequest({ body: { gameId: '   ' } }));
    expect(res.status).toBe(400);
  });

  it('returns 200 with success: true on success', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean };
    expect(body.success).toBe(true);
  });

  it('calls startGame with the correct gameId and requestingUid', async () => {
    await POST(makeRequest({ body: { gameId: 'game-abc' } }));

    expect(vi.mocked(startGame)).toHaveBeenCalledWith(
      expect.anything(), // adminDb
      'game-abc',
      'uid-host',
    );
  });

  it('trims whitespace from gameId before passing to startGame', async () => {
    await POST(makeRequest({ body: { gameId: '  game-abc  ' } }));

    expect(vi.mocked(startGame)).toHaveBeenCalledWith(
      expect.anything(),
      'game-abc',
      'uid-host',
    );
  });

  it('returns 403 when StartGameError NotHost is thrown', async () => {
    vi.mocked(startGame).mockRejectedValue(
      new StartGameError('Not host', StartGameErrorCode.NotHost),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 404 when StartGameError GameNotFound is thrown', async () => {
    vi.mocked(startGame).mockRejectedValue(
      new StartGameError('Not found', StartGameErrorCode.GameNotFound),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });

  it('returns 409 when StartGameError GameAlreadyStarted is thrown', async () => {
    vi.mocked(startGame).mockRejectedValue(
      new StartGameError('Already started', StartGameErrorCode.GameAlreadyStarted),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it('returns 409 when StartGameError InsufficientPlayers is thrown', async () => {
    vi.mocked(startGame).mockRejectedValue(
      new StartGameError('Too few players', StartGameErrorCode.InsufficientPlayers),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it('returns 409 when StartGameError InsufficientPrompts is thrown', async () => {
    vi.mocked(startGame).mockRejectedValue(
      new StartGameError('No prompts', StartGameErrorCode.InsufficientPrompts),
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(startGame).mockRejectedValue(new Error('Unexpected failure'));
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
