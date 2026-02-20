# Catfish Game - Technical Documentation

Technical implementation details and development guidance for the Catfish game.

---

## UI Context System

### Overview

The Catfish game uses a centralized UI Context (`UIContext.tsx`) to manage shared UI elements across all game views. This provides a consistent, reusable API for notifications and other UI components.

**Location**: `apps/games/app/catfish/contexts/UIContext.tsx`

### Architecture

- **Context Provider**: `UIProvider` wraps the entire Catfish layout
- **Hook**: `useCatfishUI()` provides access to UI controls from any component
- **Design**: Extensible architecture allows adding modals, toasts, and other UI elements in future

### Current Features

#### Notifications

Animated notification bar that slides down from the top of the screen with:

- Auto-dismiss after configurable duration (default: 5000ms)
- Manual dismiss with X button
- Customizable background and text colours
- Slide-down/slide-up animations (300ms)
- Single notification display (new notifications replace existing ones)

---

## NotificationBar Component

**Location**: `apps/games/app/catfish/components/NotificationBar/`

### Props

```typescript
interface NotificationBarProps {
  text: string; // Notification message
  bgColor?: string; // Tailwind background class (default: "bg-owl-green")
  textColor?: string; // Tailwind text colour class (default: "text-white")
  onDismiss: () => void; // Callback when user dismisses
  isExiting?: boolean; // Internal animation state
}
```

### Responsive Design

Uses breakpoint-specific divider images for optimal visual quality at each screen size:

- `notification-bar-sm.png` - Mobile (< 640px)
- `notification-bar-md.png` - Small tablets (640px - 768px)
- `notification-bar-lg.png` - Tablets (768px - 1024px)
- `notification-bar-xl.png` - Desktop (1024px - 1280px)
- `notification-bar-xxl.png` - Large desktop (1280px - 1536px)

Images are swapped using Tailwind responsive classes to ensure crisp rendering at all viewport sizes.

---

## Usage Examples

### Basic Notification

```tsx
"use client";

import { useCatfishUI } from "../../contexts/UIContext";

export default function MyView() {
  const { showNotification } = useCatfishUI();

  const handleAction = () => {
    showNotification({
      text: "Action completed successfully!",
    });
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

### Custom Styling

```tsx
showNotification({
  text: "Warning: Time is running out!",
  bgColor: "bg-red-500",
  textColor: "text-yellow-300",
  duration: 3000, // 3 seconds
});
```

### Manual Dismissal Only

```tsx
showNotification({
  text: "This notification won't auto-dismiss",
  duration: Infinity, // Never auto-dismiss
});
```

---

## Game Document Schema

> **Status: Draft — under discussion, not yet implemented**

### Overview

The core package manages the game document through the lobby phase, writing to a game-type-specific collection (e.g. `catfishGames/{gameId}`). This means there is a single document per game instance — no separate core document and game document. The collection name is passed as a parameter to the core package.

When the game starts, the `startGame` function transitions `status` from `lobby` → `playing`, writes the full `phases` array to the document, and populates the `players` map with Catfish-specific fields. From that point, `currentPhaseIndex` is the single source of truth for where the game is.

---

### Prompt Collections (global, not per-game)

Three top-level Firestore collections hold the shared pool of prompts:

```
/textPrompts/{promptId}
  text: string
  isActive: boolean
  createdAt: Timestamp

/imagePrompts/{promptId}
  text: string
  isActive: boolean
  createdAt: Timestamp

/votingPrompts/{promptId}
  text: string           ← contains {playerName} placeholder for runtime substitution
  isActive: boolean
  createdAt: Timestamp
```

Only prompts where `isActive: true` are eligible for selection. Text and image prompts are assigned uniquely per player per game. Voting prompts can repeat.

---

### `catfishGames/{gameId}` Document

#### Top-level fields

```
gameCode: string
gameType: 'catfish'
hostUid: string
status: 'lobby' | 'playing' | 'finished'
minPlayers: number
maxPlayers: number
createdAt: Timestamp
currentPhaseIndex: number     ← index into the phases array; the single source of truth
                                 for game progression. All clients watch this field.
phaseDeadline: Timestamp      ← when the current timed window expires (server-set).
                                 Reset by the server each time currentPhaseIndex advances.
players: { ... }              ← see Players map below
phases: [ ... ]               ← see Phases array below
```

---

#### Players map

Per-player data for the Catfish game. Keyed by player UID.

```
players:
  [playerId]:
    username: string
    joinedAt: Timestamp
    isHost: boolean
    profilePictureUrl: string | null  ← Firebase Storage URL; set during profile picture phase
    score: number                     ← running total, incremented after each voting phase
```

---

#### Phases array

The `phases` array is the complete, ordered playlist of game events. It is written in full when `startGame` is called and never reordered. The game engine reads `phases[currentPhaseIndex]` to determine what to render.

Each phase has a `type` field. Currently defined types:

| Type              | Description                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `textPromptIntro` | First text prompt round — identical data shape to `textPrompt` but signals the client to render guided introductory copy between questions |
| `textPrompt`      | Subsequent text prompt rounds                                                                                                              |
| `imagePrompt`     | Image (drawing) prompt rounds                                                                                                              |
| `voting`          | Vote on the previous prompt round                                                                                                          |

**Default phase order for a standard Catfish game:**

```
0: textPromptIntro
1: voting          ← linkedPhaseIndex: 0
2: imagePrompt
3: voting          ← linkedPhaseIndex: 2
4: textPrompt
5: voting          ← linkedPhaseIndex: 4
6: imagePrompt
7: voting          ← linkedPhaseIndex: 6
8: results
```

---

#### Prompt phase shape (`textPromptIntro` | `textPrompt` | `imagePrompt`)

```
phases[n]:
  type: 'textPromptIntro' | 'textPrompt' | 'imagePrompt'
  questionIndex: number           ← 0–2, which of the 3 questions the room is currently on.
                                     Advanced by the server when phaseDeadline expires or all
                                     responses are submitted.
  prompts:                        ← map keyed by the prompt owner's playerId
    [playerId]:
      promptId: string            ← ref to the source textPrompts / imagePrompts doc
      promptText: string          ← denormalised for display; avoids extra reads at runtime
      answerers: string[]         ← [realPlayerId, catfish1Id, catfish2Id]
                                     index 0 is always the genuine player
      shuffledAnswerers: string[] ← answerers in randomised display order, pre-computed
                                     server-side at game start to ensure all clients see
                                     the same order
      responses:
        [answererId]: string | null ← text answer or Firebase Storage URL for images;
                                      null = no submission (timed out or left blank)
```

---

#### Voting phase shape

```
phases[n]:
  type: 'voting'
  linkedPhaseIndex: number        ← index of the prompt phase this voting round scores
  votingPromptText: string        ← e.g. "Will the real {playerName} please stand up?"
                                     {playerName} substituted at display time
  votingOrder: string[]           ← ordered list of prompt-owner playerIds to vote through
  currentVotingIndex: number      ← current position in votingOrder; advanced by server
  votes:
    [promptOwnerId]:              ← the player whose prompt is being voted on
      [voterId]: string           ← the answererId the voter picked
```

---

### Key Design Decisions

**Single document per game**
The core package writes to a game-type-specific collection (e.g. `catfishGames`), passed as a parameter. There is no separate core document — one document handles both lobby and gameplay state.

**Phases as a playlist**
The full phases array is pre-computed and written at game start. Adding interstitials, ad breaks, or other event types is as simple as inserting a new phase type into the array — the game engine reads `phases[currentPhaseIndex].type` and renders accordingly.

**`textPromptIntro` for the first round**
Structurally identical to `textPrompt` but signals the client to render guided introductory copy between questions. Subsequent rounds use `textPrompt` and skip the onboarding copy.

**`answerers[0]` is always the real player**
The genuine response can always be derived server-side without an extra field. `shuffledAnswerers` provides the display order to clients, pre-computed at game start so all clients see the same sequence.

**Why denormalise `promptText`?**
Avoids each client fetching the prompt document separately during gameplay. The text is read once at game start and embedded in the game document.

**Scores: running total**
Scores are incremented after each voting phase rather than derived at the end. This enables a live leaderboard without aggregating all vote data on the client.

**`phaseDeadline` at the top level**
A single `phaseDeadline` timestamp, reset by the server each time `currentPhaseIndex` or `questionIndex` advances. Clients display a countdown derived from this value.

---

## Technical Decisions

### Why Context Over State Management?

- **Simplicity**: No external state management library needed for UI elements
- **Scope**: UI state is local to Catfish game, doesn't need global app state
- **Performance**: React Context is sufficient for infrequent UI updates
- **Extensibility**: Easy to add new UI controls without restructuring

### Why Single Notification?

- **UX**: Party game context - important messages should be prominent, not stacked
- **Simplicity**: Avoids queue management complexity
- **Performance**: Minimal DOM updates
- **Design**: Cleaner UI without notification clutter

### Animation Approach

CSS animations over JavaScript for:

- **Performance**: GPU-accelerated transforms
- **Smoothness**: Native browser optimization
- **Maintainability**: Declarative styles easier to modify

---

## Future Enhancements

Potential additions to the UI Context system:

- **Modals**: Game rules, player info, confirmations
- **Toast notifications**: Non-intrusive status updates
- **Loading states**: Waiting for other players
- **Timer displays**: Round countdown UI

---

## Related Files

- **Context**: `apps/games/app/catfish/contexts/UIContext.tsx`
- **Component**: `apps/games/app/catfish/components/NotificationBar/index.tsx`
- **Styles**: `apps/games/app/catfish/components/NotificationBar/NotificationBar.css`
- **Layout**: `apps/games/app/catfish/layout.tsx` (UIProvider wrapper)
