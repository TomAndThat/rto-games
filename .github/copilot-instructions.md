# RTO Games Platform - AI Coding Agent Instructions

## Ways of Working

**Collaboration principles for this project:**

### 🚫 Do NOT write code without explicit consent

- **Never start implementing** without confirming the approach first. By doing this you are being expressly **unhelpful**
- Ask clarifying questions before proposing solutions
- Present options and wait for direction rather than choosing for me
- If uncertain about requirements, discuss before coding

### ✅ DO prioritize alignment over speed

- **Accuracy and collaboration > proactivity and helpfulness**
- Propose a plan and get approval before execution
- Check assumptions explicitly ("Should I...?", "Would you prefer...?")
- When multiple approaches exist, outline trade-offs and ask which to pursue
- If I ask for analysis, provide analysis - don't jump to implementation

### 💬 Communication style

- Ask questions early and often
- Confirm understanding before taking action
- Present technical decisions as options, not fait accompli
- When suggesting changes, explain "why" and wait for go-ahead

### 🇬🇧 Language: UK English for public-facing copy only

**Rule:** If a user can see it without opening developer tools, it must be UK English.

- ✅ **UK English required:**
  - UI copy (buttons, labels, error messages, notifications)
  - Marketing pages and landing pages
  - User-facing documentation (help docs, FAQs, onboarding)
  - Email templates
  - Error messages shown to users
- ✅ **US English acceptable:**
  - Code (variables, functions, comments)
  - Internal documentation (READMEs, architecture docs)
  - Database schemas and collection names
  - API routes and endpoints
  - Library/framework conventions (e.g., `color` in CSS must stay as-is)

### 🎬 Production Ready

- All code must be production-ready quality, even in early stages
- It is _never_ acceptable to use alert() style messaging. All user-facing messages must be presented in proper components with appropriate styling and UX patterns.
- It is _never_ acceptable to think of or describe the project as an "MVP" or "prototype" in code comments, documentation, or communication. We are building a production-ready codebase from day one.

## Project Overview

**Release the Owl Games**: A web-based multiplayer games platform (like Jackbox/Gartic Phone) using a monorepo structure (`core`, `games`, `admin`, `backend` workspaces), Next.js frontends, and Firestore real-time synchronization.

## Architecture Essentials

### Workspace Organization

- **packages/core**: Shared game infrastructure (lobbies, player management, scoring, move validation)
- **apps/games**: Next.js app hosting all game implementations at URL paths (`/gameA`, `/gameB`, etc.)
- **apps/admin**: Next.js management interface
- **apps/backend**: Render-hosted server for server-side timing coordination (when needed)

### Core Pattern: Shared Library First

New games reuse infrastructure from `core` rather than rebuilding. Extract game logic only into the shared library when **actually used across multiple games** — avoid premature abstraction.

### Real-Time State & Validation

- **Firestore subscriptions** power real-time game state updates between players
- **Server-side validation mandatory**: Never trust client-submitted moves; validate all game actions on the server
- Suitable for 100-300ms latency party games, not competitive esports (<50ms requirement)

## Development Workflow

### Monorepo Commands

```bash
npm run dev              # Start all workspaces in dev mode
npm run build            # Build all workspaces
npm run test             # Run tests across workspaces (if configured)
npm run lint             # Lint all workspaces
npm run type-check       # TypeScript checks across workspaces
```

### Adding a New Game

1. Add game logic to `packages/games/[gameName]` as a Next.js route component
2. Use `packages/core` hooks/functions for common features (lobbies, player state, scoring)
3. Define game-specific Firestore schema in game documentation
4. Determine if server-side timing needed in `packages/backend` (document decision in game README)

## Key Conventions

- **Language**: TypeScript (v5.3+); Node 18+, npm 9+
- **Framework**: Next.js for web frontends
- **Database**: Firebase/Firestore (real-time subscriptions, no internal state management)
- **Structure**: Each game documents its state model and server-sync requirements
- **Validation**: All player actions validated server-side (core library or backend)

## Reference

- See [docs/FOUNDATION.md](../../docs/FOUNDATION.md) for architecture rationale, design decisions, and TBD items (auth, Firestore rules, analytics, etc.)
- See [docs/DEVELOPER_STANDARDS.md](../../docs/DEVELOPER_STANDARDS.md) for comprehensive coding standards that all code must adhere to (TypeScript, naming, testing, Git conventions, etc.)
