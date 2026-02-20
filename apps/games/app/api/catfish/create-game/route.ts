import { NextRequest, NextResponse } from 'next/server';

import { GameError, GameErrorCode } from '@rto-games/core';

import {
  CATFISH_CONFIG,
  CATFISH_USERNAME_MIN_LENGTH,
  CATFISH_USERNAME_MAX_LENGTH,
} from '../../../catfish/config/catfishConfig';
import { createGame } from '../../../catfish/services/lobbyService';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';

interface CreateGameRequestBody {
  playerData: {
    username: string;
    profilePictureUrl: string;
  };
}

/**
 * POST /api/catfish/create-game
 *
 * Creates a new Catfish lobby game. The requesting user becomes the host.
 *
 * Headers:
 *   Authorization: Bearer <Firebase ID token>
 *
 * Body:
 *   { playerData: { username: string, profilePictureUrl: string } }
 *
 * Response:
 *   { gameId: string, gameCode: string }
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
  let body: CreateGameRequestBody;

  try {
    body = (await request.json()) as CreateGameRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Bad request — invalid JSON body' },
      { status: 400 },
    );
  }

  const { playerData } = body;

  if (
    !playerData ||
    typeof playerData.username !== 'string' ||
    playerData.username.trim().length < CATFISH_USERNAME_MIN_LENGTH ||
    playerData.username.trim().length > CATFISH_USERNAME_MAX_LENGTH
  ) {
    return NextResponse.json(
      { error: 'Bad request — invalid username' },
      { status: 400 },
    );
  }

  if (typeof playerData.profilePictureUrl !== 'string') {
    return NextResponse.json(
      { error: 'Bad request — profilePictureUrl must be a string' },
      { status: 400 },
    );
  }

  // ------------------------------------------------------------------
  // 3. Create the game
  // ------------------------------------------------------------------
  try {
    const result = await createGame(
      adminDb,
      requestingUid,
      CATFISH_CONFIG.gameType,
      {
        username: playerData.username.trim(),
        profilePictureUrl: playerData.profilePictureUrl,
      },
      {
        minPlayers: CATFISH_CONFIG.minPlayers,
        maxPlayers: CATFISH_CONFIG.maxPlayers,
      },
      CATFISH_CONFIG.collectionName,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof GameError) {
      return NextResponse.json(
        { error: error.code },
        { status: gameErrorToHttpStatus(error.code) },
      );
    }

    console.error('[create-game] Unexpected error:', error);
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
    case GameErrorCode.GameAlreadyStarted:
    case GameErrorCode.AlreadyInGame:
    case GameErrorCode.GameFull:
      return 409;
    default:
      return 500;
  }
}
