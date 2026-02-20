import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebaseAdmin';
import {
  submitAnswer,
  SubmitAnswerError,
  SubmitAnswerErrorCode,
} from '../../../catfish/services/submitAnswer';

interface SubmitAnswerRequestBody {
  gameId: string;
  answer: string;
}

/**
 * POST /api/catfish/submit-answer
 *
 * Submits a player's answer for the current prompt sub-step.
 * If all expected answerers have submitted, the game auto-advances.
 *
 * Headers:
 *   Authorization: Bearer <Firebase ID token>
 *
 * Body:
 *   { "gameId": string, "answer": string }
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
  let body: SubmitAnswerRequestBody;

  try {
    body = (await request.json()) as SubmitAnswerRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Bad request — invalid JSON body' },
      { status: 400 },
    );
  }

  const { gameId, answer } = body;

  if (!gameId || typeof gameId !== 'string' || gameId.trim() === '') {
    return NextResponse.json(
      { error: 'Bad request — gameId is required' },
      { status: 400 },
    );
  }

  if (typeof answer !== 'string') {
    return NextResponse.json(
      { error: 'Bad request — answer must be a string' },
      { status: 400 },
    );
  }

  // ------------------------------------------------------------------
  // 3. Submit the answer
  // ------------------------------------------------------------------
  try {
    await submitAnswer(adminDb, gameId.trim(), requestingUid, answer.trim());
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof SubmitAnswerError) {
      const status = errorCodeToHttpStatus(error.code);
      return NextResponse.json({ error: error.code }, { status });
    }

    console.error('[submit-answer] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}

function errorCodeToHttpStatus(code: SubmitAnswerErrorCode): number {
  switch (code) {
    case SubmitAnswerErrorCode.GameNotFound:
      return 404;
    case SubmitAnswerErrorCode.GameNotPlaying:
    case SubmitAnswerErrorCode.NotAPromptStep:
    case SubmitAnswerErrorCode.NotAnAnswerer:
    case SubmitAnswerErrorCode.AlreadySubmitted:
      return 409;
    default:
      return 500;
  }
}
