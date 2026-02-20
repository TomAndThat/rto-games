import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  CatfishGameProvider,
  useCatfishGame,
  CatfishView,
} from "./GameContext";

// ---------------------------------------------------------------------------
// Mock @rto-games/core
// ---------------------------------------------------------------------------

vi.mock("@rto-games/core", () => {
  class GameError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = "GameError";
      this.code = code;
    }
  }

  return {
    useAuth: vi.fn(),
    usePlayer: vi.fn(),
    useGame: vi.fn(),
    getIncompleteStep: vi.fn(),
    lookupGameByCode: vi.fn(),
    uploadProfilePicture: vi.fn(),
    getPlayerGameData: vi.fn(),
    setPlayerCurrentGame: vi.fn(),
    clearPlayerCurrentGame: vi.fn(),
    getGameById: vi.fn(),
    getFirebaseAuth: vi.fn(),
    GameError,
    GameErrorCode: {
      GameNotFound: "GAME_NOT_FOUND",
      GameAlreadyStarted: "GAME_ALREADY_STARTED",
      AlreadyInGame: "ALREADY_IN_GAME",
      NotAuthorised: "NOT_AUTHORISED",
      GameFull: "GAME_FULL",
      CodeGenerationFailed: "CODE_GENERATION_FAILED",
      AuthRequired: "AUTH_REQUIRED",
      GameDeleted: "GAME_DELETED",
    },
    logError: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Mock UIContext
// ---------------------------------------------------------------------------

const showNotificationSpy = vi.fn();
vi.mock("./UIContext", () => ({
  useCatfishUI: vi.fn(() => ({
    showNotification: showNotificationSpy,
    hideNotification: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Imports after mocks are declared
// ---------------------------------------------------------------------------

import {
  useAuth,
  usePlayer,
  useGame,
  getIncompleteStep,
  lookupGameByCode,
  getPlayerGameData,
  setPlayerCurrentGame,
  getGameById,
  getFirebaseAuth,
} from "@rto-games/core";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_AUTH = {
  uid: "uid-test",
  isLoading: false,
  isAuthenticated: true,
};

const DEFAULT_PLAYER = {
  playerGameData: {
    username: "Alice",
    profilePictureUrl: "https://example.com/pic.png",
  },
  isLoading: false,
  setField: vi.fn(),
  refresh: vi.fn(),
};

const DEFAULT_GAME = {
  game: null,
  isLoading: false,
  isDeleted: false,
  error: null,
};

const MOCK_ID_TOKEN = "mock-id-token";

function setupDefaultMocks() {
  vi.mocked(useAuth).mockReturnValue(DEFAULT_AUTH);
  vi.mocked(usePlayer).mockReturnValue(DEFAULT_PLAYER);
  vi.mocked(useGame).mockReturnValue(DEFAULT_GAME);
  vi.mocked(getIncompleteStep).mockReturnValue(null); // all steps complete by default
  vi.mocked(getFirebaseAuth).mockReturnValue({
    currentUser: { getIdToken: vi.fn().mockResolvedValue(MOCK_ID_TOKEN) },
  } as unknown as ReturnType<typeof getFirebaseAuth>);
  vi.mocked(setPlayerCurrentGame).mockResolvedValue(undefined);
}

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderGameContext() {
  return renderHook(() => useCatfishGame(), {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(CatfishGameProvider, null, children),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  showNotificationSpy.mockClear();
  setupDefaultMocks();
});

describe("useCatfishGame", () => {
  it("throws when used outside CatfishGameProvider", () => {
    expect(() => {
      renderHook(() => useCatfishGame());
    }).toThrow("useCatfishGame must be used within a CatfishGameProvider");
  });
});

describe("CatfishGameProvider — initial state", () => {
  it("starts on the landing view", () => {
    const { result } = renderGameContext();
    expect(result.current.currentView).toBe(CatfishView.Landing);
  });

  it("exposes uid from useAuth", () => {
    const { result } = renderGameContext();
    expect(result.current.uid).toBe("uid-test");
  });

  it("exposes playerGameData from usePlayer", () => {
    const { result } = renderGameContext();
    expect(result.current.playerGameData).toEqual(
      DEFAULT_PLAYER.playerGameData,
    );
  });

  it("is not submitting initially", () => {
    const { result } = renderGameContext();
    expect(result.current.isSubmitting).toBe(false);
  });
});

describe("handleJoinGameNavigate", () => {
  it("sets the view to join_game", () => {
    const { result } = renderGameContext();

    act(() => {
      result.current.handleJoinGameNavigate();
    });

    expect(result.current.currentView).toBe(CatfishView.JoinGame);
  });
});

describe("handleBackToLanding", () => {
  it("resets the view to landing", () => {
    const { result } = renderGameContext();

    act(() => {
      result.current.handleJoinGameNavigate(); // go to join_game
    });
    expect(result.current.currentView).toBe(CatfishView.JoinGame);

    act(() => {
      result.current.handleBackToLanding();
    });
    expect(result.current.currentView).toBe(CatfishView.Landing);
  });
});

describe("handleNewGame", () => {
  it("shows AUTH_REQUIRED notification when uid is null", async () => {
    vi.mocked(useAuth).mockReturnValue({
      uid: null,
      isLoading: false,
      isAuthenticated: false,
    });
    const { result } = renderGameContext();

    await act(async () => {
      (result.current.handleNewGame as () => Promise<void>)();
      await Promise.resolve();
    });

    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("set things up"),
      }),
    );
  });

  it("navigates to enter_name when username step is incomplete", async () => {
    vi.mocked(getIncompleteStep).mockReturnValue("username");
    const { result } = renderGameContext();

    await act(async () => {
      await (result.current.handleNewGame as () => Promise<void>)();
    });

    expect(result.current.currentView).toBe(CatfishView.EnterName);
  });

  it("navigates to profile_pic when username done but profile pic missing", async () => {
    vi.mocked(getIncompleteStep).mockReturnValue("profilePicture");
    const { result } = renderGameContext();

    await act(async () => {
      await (result.current.handleNewGame as () => Promise<void>)();
    });

    expect(result.current.currentView).toBe(CatfishView.ProfilePic);
  });

  it("calls create-game API and navigates to lobby when all steps complete", async () => {
    vi.mocked(getIncompleteStep).mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ gameId: "new-game-id" }),
    } as unknown as Response);

    const { result } = renderGameContext();

    await act(async () => {
      await (result.current.handleNewGame as () => Promise<void>)();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/catfish/create-game",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result.current.currentView).toBe(CatfishView.Lobby);
    expect(result.current.gameId).toBe("new-game-id");
  });

  it("shows notification and resets to landing when create-game API returns an error", async () => {
    vi.mocked(getIncompleteStep).mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "CODE_GENERATION_FAILED" }),
    } as unknown as Response);

    const { result } = renderGameContext();

    await act(async () => {
      await (result.current.handleNewGame as () => Promise<void>)();
    });

    expect(showNotificationSpy).toHaveBeenCalled();
    expect(result.current.currentView).toBe(CatfishView.Landing);
  });
});

describe("handleJoinGameSubmit", () => {
  it("shows game-not-found notification when lookup returns null", async () => {
    vi.mocked(lookupGameByCode).mockResolvedValue(null);
    const { result } = renderGameContext();

    await act(async () => {
      await result.current.handleJoinGameSubmit("ABCDEF");
    });

    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("not found") }),
    );
  });

  it("shows AUTH_REQUIRED when uid is null", async () => {
    vi.mocked(useAuth).mockReturnValue({
      uid: null,
      isLoading: false,
      isAuthenticated: false,
    });
    const { result } = renderGameContext();

    await act(async () => {
      await result.current.handleJoinGameSubmit("ABCDEF");
    });

    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("set things up"),
      }),
    );
  });

  it("advances to lobby when game is found and all steps complete", async () => {
    vi.mocked(lookupGameByCode).mockResolvedValue("game-123");
    vi.mocked(getIncompleteStep).mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue({ gameId: "game-123", gameType: "catfish" }),
    } as unknown as Response);

    const { result } = renderGameContext();

    await act(async () => {
      await result.current.handleJoinGameSubmit("abcdef");
    });

    expect(result.current.currentView).toBe(CatfishView.Lobby);
    expect(result.current.gameId).toBe("game-123");
  });

  it("advances to enter_name when game found but username missing", async () => {
    vi.mocked(lookupGameByCode).mockResolvedValue("game-123");
    vi.mocked(getIncompleteStep).mockReturnValue("username");
    const { result } = renderGameContext();

    await act(async () => {
      await result.current.handleJoinGameSubmit("ABCDEF");
    });

    expect(result.current.currentView).toBe(CatfishView.EnterName);
  });
});

describe("handleSetUsername", () => {
  it("does nothing when uid is null", async () => {
    vi.mocked(useAuth).mockReturnValue({
      uid: null,
      isLoading: false,
      isAuthenticated: false,
    });
    const { result } = renderGameContext();

    await act(async () => {
      await result.current.handleSetUsername("Alice");
    });

    expect(DEFAULT_PLAYER.setField).not.toHaveBeenCalled();
  });

  it("calls setField with the username", async () => {
    vi.mocked(getPlayerGameData).mockResolvedValue({
      username: "Alice",
      profilePictureUrl: "https://example.com/pic.png",
    });
    vi.mocked(getIncompleteStep).mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ gameId: "game-x" }),
    } as unknown as Response);

    const { result } = renderGameContext();

    await act(async () => {
      await result.current.handleSetUsername("Alice");
    });

    expect(DEFAULT_PLAYER.setField).toHaveBeenCalledWith("username", "Alice");
  });

  it("navigates to profile_pic when profile picture is the next step", async () => {
    vi.mocked(DEFAULT_PLAYER.setField).mockResolvedValue(undefined);
    vi.mocked(getPlayerGameData).mockResolvedValue({ username: "Alice" });
    vi.mocked(getIncompleteStep).mockReturnValue("profilePicture");

    const { result } = renderGameContext();

    await act(async () => {
      await result.current.handleSetUsername("Alice");
    });

    expect(result.current.currentView).toBe(CatfishView.ProfilePic);
  });
});

describe("handleLeaveGame", () => {
  it("does nothing when gameId is null", async () => {
    const { result } = renderGameContext();
    // gameId starts null
    expect(result.current.gameId).toBeNull();

    global.fetch = vi.fn();

    await act(async () => {
      await result.current.handleLeaveGame();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("handleStartGame", () => {
  it("calls the start-game API with gameId", async () => {
    // Set up with a gameId by going through create-game flow
    vi.mocked(getIncompleteStep).mockReturnValue(null);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ gameId: "game-xyz" }),
      }) // create-game
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) }); // start-game
    global.fetch = fetchMock;

    const { result } = renderGameContext();

    // First get into the lobby
    await act(async () => {
      await (result.current.handleNewGame as () => Promise<void>)();
    });
    expect(result.current.gameId).toBe("game-xyz");

    // Now start the game
    await act(async () => {
      await (result.current.handleStartGame as () => Promise<void>)();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/catfish/start-game",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ gameId: "game-xyz" }),
      }),
    );
  });

  it("shows a notification when start-game API returns an error", async () => {
    vi.mocked(getIncompleteStep).mockReturnValue(null);
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ gameId: "game-xyz" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: "NOT_HOST" }),
      });

    const { result } = renderGameContext();

    await act(async () => {
      await (result.current.handleNewGame as () => Promise<void>)();
    });

    await act(async () => {
      await (result.current.handleStartGame as () => Promise<void>)();
    });

    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("host") }),
    );
  });

  it("does nothing when gameId is null", async () => {
    global.fetch = vi.fn();
    const { result } = renderGameContext();

    await act(async () => {
      await (result.current.handleStartGame as () => Promise<void>)();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("game deletion detection", () => {
  it("shows notification and resets to landing when game is deleted in lobby", async () => {
    // Step 1: get into the lobby
    vi.mocked(getIncompleteStep).mockReturnValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ gameId: "game-123" }),
    } as unknown as Response);

    // Start with the game not deleted
    vi.mocked(useGame).mockReturnValue({
      game: { players: { "uid-test": {} } } as unknown as ReturnType<
        typeof useGame
      >["game"],
      isLoading: false,
      isDeleted: false,
      error: null,
    });

    const { result, rerender } = renderHook(() => useCatfishGame(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(CatfishGameProvider, null, children),
    });

    await act(async () => {
      await (result.current.handleNewGame as () => Promise<void>)();
    });
    expect(result.current.currentView).toBe(CatfishView.Lobby);

    // Step 2: simulate game deletion
    vi.mocked(useGame).mockReturnValue({
      game: null,
      isLoading: false,
      isDeleted: true,
      error: null,
    });

    await act(async () => {
      rerender();
    });

    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("ended") }),
    );
    expect(result.current.currentView).toBe(CatfishView.Landing);
  });
});

describe("state restoration on mount", () => {
  it("resolves to landing when no currentGameId in player data", async () => {
    vi.mocked(usePlayer).mockReturnValue({
      ...DEFAULT_PLAYER,
      playerGameData: { username: "Alice" }, // no currentGameId
    });

    const { result } = renderGameContext();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.currentView).toBe(CatfishView.Landing);
  });

  it("restores lobby when game still exists and player is in it", async () => {
    vi.mocked(usePlayer).mockReturnValue({
      ...DEFAULT_PLAYER,
      playerGameData: { username: "Alice", currentGameId: "restored-game" },
    });
    vi.mocked(getGameById).mockResolvedValue({
      players: { "uid-test": {} },
    } as unknown as Awaited<ReturnType<typeof getGameById>>);
    vi.mocked(useGame).mockReturnValue({
      game: null,
      isLoading: false,
      isDeleted: false,
      error: null,
    });

    const { result } = renderGameContext();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.gameId).toBe("restored-game");
    expect(result.current.currentView).toBe(CatfishView.Lobby);
  });
});
