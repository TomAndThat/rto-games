import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import {
  advancePhase,
  AdvancePhaseError,
  AdvancePhaseErrorCode,
} from '../../../catfish/services/advancePhase';

interface AdvancePhaseRequestBody {
  gameId: string;
}

/**
 * POST /api/catfish/advance-phase
 *
 * Advances the game to the next sub-step or phase. The requesting user must
 * be the game's host.
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
  let body: AdvancePhaseRequestBody;

  try {
    body = (await request.json()) as AdvancePhaseRequestBody;
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
  // 3. Advance the phase
  // ------------------------------------------------------------------
  try {
    await advancePhase(adminDb, gameId.trim(), requestingUid);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AdvancePhaseError) {
      const status = errorCodeToHttpStatus(error.code);
      return NextResponse.json({ error: error.code }, { status });
    }

    console.error('[advance-phase] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

function errorCodeToHttpStatus(code: AdvancePhaseErrorCode): number {
  switch (code) {
    case AdvancePhaseErrorCode.NotHost:
      return 403;
    case AdvancePhaseErrorCode.GameNotFound:
      return 404;
    case AdvancePhaseErrorCode.GameNotStarted:
    case AdvancePhaseErrorCode.GameAlreadyFinished:
      return 409;
    default:
      return 500;
  }
}
