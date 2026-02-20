"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  useAuth,
  usePlayer,
  useGame,
  getIncompleteStep,
  lookupGameByCode,
  uploadProfilePicture,
  getPlayerGameData,
  setPlayerCurrentGame,
  clearPlayerCurrentGame,
  getGameById,
  getFirebaseAuth,
  GameError,
  GameErrorCode,
  logError,
  type GameDocument,
} from "@rto-games/core";

import { useCatfishUI } from "./UIContext";
import { CATFISH_CONFIG } from "../config/catfishConfig";

// ---------------------------------------------------------------------------
// View & intent enums
// ---------------------------------------------------------------------------

export const CatfishView = {
  Landing: "landing",
  JoinGame: "join_game",
  EnterName: "enter_name",
  ProfilePic: "profile_pic",
  Lobby: "lobby",
  Playing: "playing",
} as const;
export type CatfishView = (typeof CatfishView)[keyof typeof CatfishView];

const FlowIntent = {
  None: "none",
  Create: "create",
  Join: "join",
} as const;
type FlowIntent = (typeof FlowIntent)[keyof typeof FlowIntent];

// ---------------------------------------------------------------------------
// Error messages (British English, user-facing)
// ---------------------------------------------------------------------------

const ERROR_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "Game not found. Please check the code and try again.",
  GAME_ALREADY_STARTED: "This game has already started.",
  ALREADY_IN_GAME: "You're already in this game.",
  NOT_AUTHORISED: "You're not authorised to do that.",
  GAME_FULL: "This game is full.",
  CODE_GENERATION_FAILED: "Unable to create game. Please try again.",
  AUTH_REQUIRED: "Please wait while we set things up\u2026",
  GAME_DELETED: "This game no longer exists.",
  NOT_HOST: "Only the host can start the game.",
  INSUFFICIENT_PLAYERS: "Not enough players to start the game.",
  INSUFFICIENT_PROMPTS:
    "Something went wrong setting up the game. Please try again.",
};

function getUserFacingError(error: unknown): string {
  if (error instanceof GameError) {
    return (
      ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again."
    );
  }
  return "Something went wrong. Please try again.";
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface CatfishGameContextValue {
  uid: string | null;
  isAuthLoading: boolean;
  playerGameData: Record<string, unknown> | undefined;
  isPlayerLoading: boolean;
  game: GameDocument | null;
  gameId: string | null;
  isGameLoading: boolean;
  isHost: boolean;
  currentView: CatfishView;
  isViewReady: boolean;
  isSubmitting: boolean;
  handleNewGame: () => void;
  handleJoinGameNavigate: () => void;
  handleJoinGameSubmit: (gameCode: string) => Promise<void>;
  handleSetUsername: (username: string) => Promise<void>;
  handleSubmitProfilePicture: (dataUrl: string) => Promise<void>;
  handleRemovePlayer: (targetUid: string) => Promise<void>;
  handleLeaveGame: () => Promise<void>;
  handleStartGame: () => Promise<void>;
  handleAdvancePhase: () => Promise<void>;
  handleSubmitAnswer: (answer: string) => Promise<void>;
  handleBackToLanding: () => void;
}

const CatfishGameContext = createContext<CatfishGameContextValue | undefined>(
  undefined,
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CatfishGameProviderProps {
  children: ReactNode;
}

export function CatfishGameProvider({
  children,
}: CatfishGameProviderProps): React.JSX.Element {
  const { showNotification } = useCatfishUI();
  const { uid, isLoading: isAuthLoading } = useAuth();

  const [currentView, setCurrentView] = useState<CatfishView>("landing");
  const [intent, setIntent] = useState<FlowIntent>("none");
  const [pendingGameCode, setPendingGameCode] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestorationResolved, setIsRestorationResolved] = useState(false);
  const hasAttemptedRestoration = useRef(false);

  const {
    playerGameData,
    isLoading: isPlayerLoading,
    setField,
  } = usePlayer({ uid, gameType: CATFISH_CONFIG.gameType });

  const {
    game,
    isLoading: isGameLoading,
    isDeleted: isGameDeleted,
  } = useGame({ gameId, collectionName: CATFISH_CONFIG.collectionName });

  // ---- Reset helper ----

  const resetToLanding = useCallback((): void => {
    setCurrentView("landing");
    setIntent("none");
    setPendingGameCode(null);
    setGameId(null);
  }, []);

  // ---- Derived state ----

  const isHost = !!(uid && game?.players[uid]?.isHost);

  // ---- Detect status transition to playing ----

  useEffect(() => {
    if (
      (currentView === "lobby" || currentView === "playing") &&
      game?.status === "playing"
    ) {
      setCurrentView("playing");
    }
  }, [game?.status, currentView]);

  // ---- Detect removal from game or game deletion while in lobby ----

  useEffect(() => {
    if (currentView !== "lobby" || !gameId || isGameLoading) return;

    // Game document was deleted (host ended the game).
    if (isGameDeleted) {
      showNotification({ text: "The game has been ended by the host." });
      resetToLanding();
      return;
    }

    // Player was removed from the game by the host.
    if (game && uid && !game.players[uid]) {
      showNotification({ text: "You have been removed from the game." });
      resetToLanding();
    }
  }, [
    game,
    gameId,
    isGameLoading,
    isGameDeleted,
    uid,
    currentView,
    showNotification,
    resetToLanding,
  ]);

  // ---- Restore game state on page refresh ----

  useEffect(() => {
    // Only attempt restoration once when auth and player data are loaded
    if (
      hasAttemptedRestoration.current ||
      isAuthLoading ||
      isPlayerLoading ||
      !uid ||
      gameId !== null // Already have a gameId (from normal flow)
    ) {
      return;
    }

    hasAttemptedRestoration.current = true;

    const currentGameId =
      typeof playerGameData?.currentGameId === "string"
        ? playerGameData.currentGameId
        : null;

    if (!currentGameId) {
      setIsRestorationResolved(true);
      return;
    }

    // Validate game still exists and player is still in it
    const validateAndRestore = async (): Promise<void> => {
      try {
        const gameData = await getGameById(
          currentGameId,
          CATFISH_CONFIG.collectionName,
        );

        if (!gameData) {
          await clearPlayerCurrentGame(uid, CATFISH_CONFIG.gameType);
          setIsRestorationResolved(true);
          return;
        }

        if (!gameData.players[uid]) {
          await clearPlayerCurrentGame(uid, CATFISH_CONFIG.gameType);
          setIsRestorationResolved(true);
          return;
        }

        // Valid game — restore state
        setGameId(currentGameId);
        setCurrentView("lobby");
        setIsRestorationResolved(true);
      } catch {
        await clearPlayerCurrentGame(uid, CATFISH_CONFIG.gameType);
        setIsRestorationResolved(true);
      }
    };

    validateAndRestore();
  }, [
    uid,
    isAuthLoading,
    isPlayerLoading,
    playerGameData,
    gameId,
    resetToLanding,
  ]);

  // ---- Core flow engine ----

  /**
   * Returns a Firebase ID token for the current user.
   * Throws a GameError if the user is not authenticated.
   */
  const getIdToken = useCallback(async (): Promise<string> => {
    const auth = getFirebaseAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token)
      throw new GameError("Not authenticated", GameErrorCode.AuthRequired);
    return token;
  }, []);

  /**
   * Evaluates the player's pre-lobby progress and either navigates to the
   * next incomplete step or creates/joins the game. Callers are responsible
   * for managing `isSubmitting` state; this function does not touch it.
   */
  const navigateToNextStep = useCallback(
    async (
      data: Record<string, unknown> | undefined,
      currentIntent: FlowIntent,
      currentGameCode: string | null,
    ): Promise<void> => {
      if (!uid) return;

      const incompleteStep = getIncompleteStep(
        data,
        CATFISH_CONFIG.requiredSteps,
      );

      if (incompleteStep === "username") {
        setCurrentView("enter_name");
        return;
      }
      if (incompleteStep === "profilePicture") {
        setCurrentView("profile_pic");
        return;
      }

      // All requirements met — create or join the game
      const username = typeof data?.username === "string" ? data.username : "";
      const profilePictureUrl =
        typeof data?.profilePictureUrl === "string"
          ? data.profilePictureUrl
          : "";

      const playerData = { username, profilePictureUrl };

      if (currentIntent === "create") {
        const idToken = await getIdToken();
        const response = await fetch("/api/catfish/create-game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ playerData }),
        });
        if (!response.ok) {
          const errorBody = (await response.json()) as { error?: string };
          const code = (errorBody.error ?? "") as GameErrorCode;
          throw new GameError(code, code);
        }
        const result = (await response.json()) as { gameId: string };
        setPlayerCurrentGame(uid, CATFISH_CONFIG.gameType, result.gameId).catch(
          (err) =>
            logError("navigateToNextStep: failed to track currentGameId", err),
        );
        setGameId(result.gameId);
        setCurrentView("lobby");
      } else if (currentIntent === "join" && currentGameCode) {
        const idToken = await getIdToken();
        const response = await fetch("/api/catfish/join-game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ gameCode: currentGameCode, playerData }),
        });
        if (!response.ok) {
          const errorBody = (await response.json()) as { error?: string };
          const code = (errorBody.error ?? "") as GameErrorCode;
          throw new GameError(code, code);
        }
        const result = (await response.json()) as { gameId: string };
        setPlayerCurrentGame(uid, CATFISH_CONFIG.gameType, result.gameId).catch(
          (err) =>
            logError("navigateToNextStep: failed to track currentGameId", err),
        );
        setGameId(result.gameId);
        setCurrentView("lobby");
      }
    },
    [uid, getIdToken],
  );

  // ---- Public handlers ----

  const handleNewGame = useCallback(async (): Promise<void> => {
    if (!uid) {
      showNotification({ text: ERROR_MESSAGES.AUTH_REQUIRED ?? "" });
      return;
    }

    setIntent("create");
    setIsSubmitting(true);
    try {
      await navigateToNextStep(playerGameData, "create", null);
    } catch (error) {
      showNotification({
        text: getUserFacingError(error),
        bgColor: "bg-red-500",
      });
      resetToLanding();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    uid,
    playerGameData,
    showNotification,
    navigateToNextStep,
    resetToLanding,
  ]);

  const handleJoinGameNavigate = useCallback((): void => {
    setCurrentView("join_game");
  }, []);

  const handleJoinGameSubmit = useCallback(
    async (gameCode: string): Promise<void> => {
      if (!uid) {
        showNotification({ text: ERROR_MESSAGES.AUTH_REQUIRED ?? "" });
        return;
      }

      const code = gameCode.toUpperCase();
      setIsSubmitting(true);

      try {
        const foundId = await lookupGameByCode(
          code,
          CATFISH_CONFIG.collectionName,
        );
        if (!foundId) {
          showNotification({
            text: ERROR_MESSAGES.GAME_NOT_FOUND ?? "",
            bgColor: "bg-red-500",
          });
          return;
        }

        setIntent("join");
        setPendingGameCode(code);
        await navigateToNextStep(playerGameData, "join", code);
      } catch (error) {
        showNotification({
          text: getUserFacingError(error),
          bgColor: "bg-red-500",
        });
        resetToLanding();
      } finally {
        setIsSubmitting(false);
      }
    },
    [uid, playerGameData, showNotification, navigateToNextStep, resetToLanding],
  );

  const handleSetUsername = useCallback(
    async (username: string): Promise<void> => {
      if (!uid) return;
      setIsSubmitting(true);

      try {
        await setField("username", username);
        const updated = await getPlayerGameData(uid, CATFISH_CONFIG.gameType);
        await navigateToNextStep(updated, intent, pendingGameCode);
      } catch (error) {
        showNotification({
          text: getUserFacingError(error),
          bgColor: "bg-red-500",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      uid,
      intent,
      pendingGameCode,
      setField,
      showNotification,
      navigateToNextStep,
    ],
  );

  const handleSubmitProfilePicture = useCallback(
    async (dataUrl: string): Promise<void> => {
      if (!uid) return;
      setIsSubmitting(true);

      try {
        const url = await uploadProfilePicture(
          uid,
          CATFISH_CONFIG.gameType,
          dataUrl,
        );
        await setField("profilePictureUrl", url);
        const updated = await getPlayerGameData(uid, CATFISH_CONFIG.gameType);
        await navigateToNextStep(updated, intent, pendingGameCode);
      } catch (error) {
        showNotification({
          text: getUserFacingError(error),
          bgColor: "bg-red-500",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      uid,
      intent,
      pendingGameCode,
      setField,
      showNotification,
      navigateToNextStep,
    ],
  );

  const handleRemovePlayer = useCallback(
    async (targetUid: string): Promise<void> => {
      if (!uid || !gameId) return;
      setIsSubmitting(true);

      try {
        const idToken = await getIdToken();
        const response = await fetch("/api/catfish/leave-game", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ gameId, targetUid }),
        });

        if (!response.ok) {
          const errorBody = (await response.json()) as { error?: string };
          const code = (errorBody.error ?? "") as GameErrorCode;
          throw new GameError(code, code);
        }

        // Clear our own game tracking and return to landing when self-leaving
        if (targetUid === uid) {
          clearPlayerCurrentGame(uid, CATFISH_CONFIG.gameType).catch(
            () => undefined,
          );
          resetToLanding();
        }
      } catch (error) {
        showNotification({
          text: getUserFacingError(error),
          bgColor: "bg-red-500",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [uid, gameId, getIdToken, showNotification, resetToLanding],
  );

  const handleLeaveGame = useCallback(async (): Promise<void> => {
    if (!uid || !gameId) return;
    await handleRemovePlayer(uid);
  }, [uid, gameId, handleRemovePlayer]);

  const handleStartGame = useCallback(async (): Promise<void> => {
    if (!uid || !gameId) return;
    setIsSubmitting(true);

    try {
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        showNotification({
          text: ERROR_MESSAGES.AUTH_REQUIRED ?? "",
          bgColor: "bg-red-500",
        });
        return;
      }

      const response = await fetch("/api/catfish/start-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ gameId }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        const errorCode = body.error ?? "";
        const userMessage =
          ERROR_MESSAGES[errorCode] ??
          "Something went wrong. Please try again.";
        showNotification({ text: userMessage, bgColor: "bg-red-500" });
      }
    } catch {
      showNotification({
        text: "Something went wrong. Please try again.",
        bgColor: "bg-red-500",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [uid, gameId, showNotification]);

  const handleSubmitAnswer = useCallback(
    async (answer: string): Promise<void> => {
      if (!uid || !gameId) return;
      setIsSubmitting(true);

      try {
        const idToken = await getIdToken();
        const response = await fetch("/api/catfish/submit-answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ gameId, answer }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          const errorCode = body.error ?? "";
          const userMessage =
            ERROR_MESSAGES[errorCode] ??
            "Something went wrong. Please try again.";
          showNotification({ text: userMessage, bgColor: "bg-red-500" });
        }
      } catch {
        showNotification({
          text: "Something went wrong. Please try again.",
          bgColor: "bg-red-500",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [uid, gameId, getIdToken, showNotification],
  );

  const handleAdvancePhase = useCallback(async (): Promise<void> => {
    if (!uid || !gameId) return;
    setIsSubmitting(true);

    try {
      const idToken = await getIdToken();
      const response = await fetch("/api/catfish/advance-phase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ gameId }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        const errorCode = body.error ?? "";
        const userMessage =
          ERROR_MESSAGES[errorCode] ??
          "Something went wrong. Please try again.";
        showNotification({ text: userMessage, bgColor: "bg-red-500" });
      }
    } catch {
      showNotification({
        text: "Something went wrong. Please try again.",
        bgColor: "bg-red-500",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [uid, gameId, getIdToken, showNotification]);

  const handleBackToLanding = useCallback((): void => {
    resetToLanding();
  }, [resetToLanding]);

  // ---- Context value ----

  // View is ready once restoration has resolved what view to show.
  const isViewReady = isRestorationResolved;

  const value: CatfishGameContextValue = {
    uid,
    isAuthLoading,
    playerGameData,
    isPlayerLoading,
    game,
    gameId,
    isGameLoading,
    isHost,
    currentView,
    isViewReady,
    isSubmitting,
    handleNewGame,
    handleJoinGameNavigate,
    handleJoinGameSubmit,
    handleSetUsername,
    handleSubmitProfilePicture,
    handleRemovePlayer,
    handleLeaveGame,
    handleStartGame,
    handleAdvancePhase,
    handleSubmitAnswer,
    handleBackToLanding,
  };

  return (
    <CatfishGameContext.Provider value={value}>
      {children}
    </CatfishGameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCatfishGame(): CatfishGameContextValue {
  const context = useContext(CatfishGameContext);
  if (context === undefined) {
    throw new Error("useCatfishGame must be used within a CatfishGameProvider");
  }
  return context;
}
