import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import {
  startGame,
  StartGameError,
  StartGameErrorCode,
} from '../../../catfish/services/startGame';

interface StartGameRequestBody {
  gameId: string;
}

/**
 * POST /api/catfish/start-game
 *
 * Starts a Catfish game. The requesting user must be the game's host.
 *
 * Headers:
 *   Authorization: Bearer <Firebase ID token>
 *
 * Body:
 *   { "gameId": string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ------------------------------------------------------------------
  // 1. Verify auth token
  // ------------------------------------------------------------------
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorised — missing or malformed Authorization header' },
      { status: 401 },
    );
  }

  const idToken = authHeader.slice(7);
  let requestingUid: string;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    requestingUid = decoded.uid;
  } catch {
    return NextResponse.json(
      { error: 'Unauthorised — invalid or expired token' },
      { status: 401 },
    );
  }

  // ------------------------------------------------------------------
  // 2. Parse and validate request body
  // ------------------------------------------------------------------
  let body: StartGameRequestBody;

  try {
    body = (await request.json()) as StartGameRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Bad request — invalid JSON body' },
      { status: 400 },
    );
  }

  const { gameId } = body;

  if (!gameId || typeof gameId !== 'string' || gameId.trim() === '') {
    return NextResponse.json(
      { error: 'Bad request — gameId is required' },
      { status: 400 },
    );
  }

  // ------------------------------------------------------------------
  // 3. Start the game
  // ------------------------------------------------------------------
  try {
    await startGame(adminDb, gameId.trim(), requestingUid);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof StartGameError) {
      const status = errorCodeToHttpStatus(error.code);
      return NextResponse.json({ error: error.code }, { status });
    }

    // Unexpected error — log and return a generic response
    console.error('[start-game] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

function errorCodeToHttpStatus(code: StartGameErrorCode): number {
  switch (code) {
    case StartGameErrorCode.NotHost:
      return 403;
    case StartGameErrorCode.GameNotFound:
      return 404;
    case StartGameErrorCode.GameAlreadyStarted:
    case StartGameErrorCode.InsufficientPlayers:
    case StartGameErrorCode.InsufficientPrompts:
      return 409;
    default:
      return 500;
  }
}
