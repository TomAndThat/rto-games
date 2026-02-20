import { NextRequest, NextResponse } from 'next/server';

import { GameError, GameErrorCode } from '@rto-games/core';

import { CATFISH_CONFIG } from '../../../catfish/config/catfishConfig';
import { removePlayer } from '../../../catfish/services/lobbyService';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';

interface LeaveGameRequestBody {
  gameId: string;
  /** The player to remove. Defaults to the requesting user if omitted (self-leave). */
  targetUid?: string;
}

/**
 * POST /api/catfish/leave-game
 *
 * Removes a player from a Catfish lobby.
 * A player may remove themselves at any time.
 * The host may remove any other player.
 * If the host removes themselves, the game is deleted entirely.
 *
 * Headers:
 *   Authorization: Bearer <Firebase ID token>
 *
 * Body:
 *   { gameId: string, targetUid?: string }
 *
 * Response:
 *   { gameDeleted: boolean }
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
  let body: LeaveGameRequestBody;

  try {
    body = (await request.json()) as LeaveGameRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Bad request — invalid JSON body' },
      { status: 400 },
    );
  }

  const { gameId, targetUid } = body;

  if (typeof gameId !== 'string' || gameId.trim() === '') {
    return NextResponse.json(
      { error: 'Bad request — gameId is required' },
      { status: 400 },
    );
  }

  if (targetUid !== undefined && typeof targetUid !== 'string') {
    return NextResponse.json(
      { error: 'Bad request — targetUid must be a string if provided' },
      { status: 400 },
    );
  }

  // If no targetUid supplied, the player is leaving themselves
  const resolvedTargetUid = targetUid ?? requestingUid;

  // ------------------------------------------------------------------
  // 3. Remove the player
  // ------------------------------------------------------------------
  try {
    const result = await removePlayer(
      adminDb,
      gameId.trim(),
      resolvedTargetUid,
      requestingUid,
      CATFISH_CONFIG.collectionName,
    );

    return NextResponse.json({ gameDeleted: result.gameDeleted }, { status: 200 });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json(
        { error: error.code },
        { status: gameErrorToHttpStatus(error.code) },
      );
    }

    console.error('[leave-game] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

function gameErrorToHttpStatus(code: GameErrorCode): number {
  switch (code) {
    case GameErrorCode.NotAuthorised:
      return 403;
    case GameErrorCode.GameNotFound:
      return 404;
    default:
      return 500;
  }
}
