# RTO Games Platform - Foundation Document

## 1. Project Overview

A web-based multiplayer games platform for Release the Owl. Games accessed via a subdomain (e.g., `games.releasetheowl`), similar to Jackbox/Gartic Phone style experiences.

---

## 2. High-Level Architecture

- **Games App (Next.js)**: Player-facing application with lobbies and gameplay
- **Shared Library**: Centralized functions (create game, join lobby, start game, etc.) to avoid rebuilding infrastructure for each game
- **Admin App (Next.js)**: Behind-the-scenes management
- **Firebase/Firestore**: Real-time database for game state synchronization
- **Render Server**: Optional central heartbeat/timing element for games that need server-side coordination

---

## 3. Core Approach

### Shared Library Pattern

The key efficiency gain: build core game infrastructure _once_ (lobbies, player management, scoring, etc.), then create new games by implementing only game-specific logic using the library.

### Real-time Synchronization

Use Firestore subscriptions for real-time state updates between players.

### Server-Side Timing (Optional)

Some games may need a central server on Render to enforce timing (turn timers, round synchronization) that players can't manipulate client-side.

---

## 4. Games App Structure

The games are hosted within a single Next.js application on the `games.releasetheowl.com` subdomain, with individual games accessed via URL paths:

- `games.releasetheowl.com/gameA` - Game A
- `games.releasetheowl.com/gameB` - Game B
- etc.

Each game is structurally separate (with its own gameplay logic, UI, and components), but all share the same Next.js app and infrastructure. Users will be directed to individual games from the main Release the Owl website (`releasetheowl.com`), rather than landing on a hub page within the games subdomain.

---

## 5. Key Considerations

### Real-Time Performance

Firestore subscriptions provide near real-time updates suitable for party games. Not suitable for games requiring <50ms latency across all players.

### Move Validation

All game moves should be validated server-side, never trusting client submission alone.

---

## 6. To Be Determined

These decisions should be made as development progresses:

- Firestore collection schema and structure
- Data model for game state representation
- Authentication mechanism (Firebase Auth options, session management)
- Specific Firestore security rules
- Admin app feature set and scope
- Which games require server-side timing (vs. Firestore-only)
- Deployment targets and CI/CD pipeline
- Analytics / monitoring approach
- Game replay / persistence requirements
- Disconnection/reconnection handling strategy

---

## Notes

- This document is a living reference. Update as architecture decisions are made.
- Keep the shared library focused; extract patterns only when used across multiple games.
- Each game should document its specific state model and whether it needs server-side coordination.
