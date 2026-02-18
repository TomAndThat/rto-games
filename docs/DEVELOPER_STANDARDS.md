# Developer Standards — Release the Owl Games Platform

> This document is the authoritative reference for all code written in this repository.
> All contributors — human and AI — must adhere to these standards. Existing code that
> does not meet these standards should be brought into compliance, not used as a precedent.

---

## 1. Language & Tooling

| Concern         | Standard                                                   |
| --------------- | ---------------------------------------------------------- |
| Language        | TypeScript 5.3+ — strict mode, no exceptions               |
| Runtime         | Node 18+                                                   |
| Package manager | pnpm exclusively — never npm or yarn                       |
| Framework       | Next.js (App Router) — no Pages Router patterns            |
| React           | 19+ functional components only — no class components, ever |

---

## 2. TypeScript

### Strictness

- `strict: true` in all `tsconfig.json` files — no overrides
- `noUncheckedIndexedAccess: true` — array/object access always returns `T | undefined`
- `exactOptionalPropertyTypes: true` — `undefined` must be explicit

### Types vs Interfaces

- `interface` for object shapes that describe entities (players, game state, etc.)
- `type` for unions, intersections, mapped types, and utility compositions
- No `enum` — use `as const` object maps instead:

```ts
// ✅
const GamePhase = {
  Lobby: "lobby",
  Playing: "playing",
  Results: "results",
} as const;
type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

// ❌
enum GamePhase {
  Lobby,
  Playing,
  Results,
}
```

### Prohibited

- `any` — use `unknown` and narrow explicitly
- Non-null assertions (`!`) — use type guards or optional chaining
- Type casting with `as` except at verified I/O boundaries (e.g., Firestore data parsing)
- `@ts-ignore` / `@ts-expect-error` without a mandatory explanatory comment on the same line

### Functions

- Explicit return types on all exported functions
- Async functions must explicitly type their return as `Promise<T>`, never `Promise<any>`

---

## 3. Naming Conventions

| Subject                  | Convention              | Example                                |
| ------------------------ | ----------------------- | -------------------------------------- |
| React components         | PascalCase              | `DrawingCanvas`, `PlayerCard`          |
| Component files          | PascalCase `.tsx`       | `DrawingCanvas.tsx`                    |
| Non-component files      | camelCase `.ts`         | `useGameState.ts`, `formatScore.ts`    |
| Directories              | kebab-case              | `drawing-canvas/`, `game-state/`       |
| Variables & functions    | camelCase               | `currentPlayer`, `submitMove()`        |
| Constants (module-level) | SCREAMING_SNAKE_CASE    | `MAX_PLAYERS`, `ROUND_DURATION_MS`     |
| Boolean variables        | `is`/`has`/`can` prefix | `isLoading`, `hasSubmitted`, `canDraw` |
| Event handlers           | `handle` prefix         | `handleSubmit`, `handlePlayerJoin`     |
| Custom hooks             | `use` prefix            | `useGameState`, `useLobby`             |
| Types                    | PascalCase              | `PlayerState`, `GameConfig`            |
| Firestore collections    | camelCase               | `gameRooms`, `playerSessions`          |
| CSS Module classes       | camelCase               | `.drawingCanvas`, `.playerBadge`       |

---

## 4. File & Folder Structure

Every component lives in its own folder:

```
ComponentName/
  ComponentName.tsx            # Component implementation
  ComponentName.module.css     # Scoped styles (if needed)
  ComponentName.test.tsx       # Co-located unit/component test
  index.ts                     # Re-export only
```

The `index.ts` re-export pattern:

```ts
// ✅ index.ts — re-export only, no logic or JSX
export { ComponentName } from "./ComponentName";
```

### Rules

- `index.ts` files are **re-export only** — no logic, no JSX
- One component per file — no barrel files that consolidate unrelated exports
- Shared types for a game or package go in `[scope]/types.ts`
- Shared constants for a game or package go in `[scope]/constants.ts`

### Import Order

Enforced via ESLint — in this order, separated by blank lines:

1. Node built-ins
2. External packages
3. `packages/core` imports
4. Internal app imports (absolute paths)
5. Relative imports
6. Type-only imports last

---

## 5. Styling

### Primary approach: Tailwind utility classes

- All layout, spacing, typography, and colour via Tailwind classes
- Design tokens defined in `tailwind.config` — no hardcoded hex values in markup

### CSS Modules — permitted for

- Complex animations (`@keyframes`)
- Multi-state pseudo-selector chains that become unreadable as utility strings
- Canvas or SVG-adjacent styles that cannot be expressed with Tailwind

CSS Module files are always co-located with their component and named `ComponentName.module.css`.

### Class attribute formatting

Long class lists must use the `cn()` / `clsx` utility — never template literals:

```tsx
// ✅
<div className={cn('flex items-centre', isActive && 'bg-primary', className)} />

// ❌
<div className={`flex items-centre ${isActive ? 'bg-primary' : ''}`} />
```

### Prohibited absolutely

- Inline `style` props — use Tailwind or a CSS Module
- Global CSS for component-specific styles (global CSS is for resets and root-level tokens only)
- `!important`
- Hardcoded pixel values outside of CSS Modules (use Tailwind spacing scale)

---

## 6. React & Next.js

### Components

- Server Components by default in the Next.js App Router
- Add `'use client'` only when the component requires browser APIs, event handlers, or state
- Props interfaces named `[ComponentName]Props`, defined directly above the component
- Destructure props at the function signature level
- No prop drilling beyond two levels — use React Context or Firestore state

```tsx
// ✅
interface PlayerCardProps {
  playerId: string;
  displayName: string;
  isReady: boolean;
}

function PlayerCard({ playerId, displayName, isReady }: PlayerCardProps) { ... }
```

### Hooks

- Custom hooks encapsulate all stateful logic — components should be thin presentation layers
- No business logic inside `useEffect` — extract to named functions
- Every `useEffect` must have an explicit, complete dependency array — no suppressions

### Forbidden patterns

- `React.FC` / `React.FunctionComponent` — use plain function declarations
- Default exports for components — named exports only, re-exported via `index.ts`
- Direct state mutation — always return new objects/arrays

---

## 7. Testing

### Stack

- **Vitest** — unit and integration tests (fast, native ESM, consistent with the build toolchain)
- **React Testing Library** — component tests (test behaviour, not implementation)
- **Playwright** — E2E tests for critical player flows (join lobby, submit move, view results)

### Co-location

Test files live alongside the code they test:

```
ComponentName.test.tsx
useGameState.test.ts
submitMove.test.ts
```

### Coverage expectations

| Scope                        | Requirement                                               |
| ---------------------------- | --------------------------------------------------------- |
| `packages/core` utilities    | 80%+ line coverage                                        |
| Game logic / move validators | 100% — this is the server-trust boundary                  |
| React components             | Test user-observable behaviour only                       |
| E2E                          | One Playwright spec covering the happy-path flow per game |

### Naming

```ts
describe('submitMove', () => {
  it('rejects a move submitted after the round has ended', () => { ... });
  it('accepts a valid move during an active round', () => { ... });
});
```

- `it()` descriptions read as a complete English sentence
- Use `it()` consistently — not the `test()` alias

---

## 8. Firebase / Firestore

- All Firestore reads/writes go through dedicated service functions in `packages/core` — no direct SDK calls in components
- Firestore data must be parsed and validated at the boundary using **Zod** before use anywhere in the application
- **Server-side validation is mandatory for all game moves** — Firestore security rules are the last line of defence, not the first
- Collection and document IDs: camelCase, human-readable (`gameRooms/{roomCode}/players/{playerId}`)
- Real-time subscriptions must be unsubscribed in cleanup (the function returned from `useEffect`)

---

## 9. Error Handling

- Never swallow errors silently — every `catch` block must either rethrow, log, or surface to the user
- No `alert()`, `confirm()`, or `prompt()` — ever
- User-facing error states must use dedicated UI components (error boundaries, notification bars, toast messages) — never raw error text injected into the DOM
- Errors originating from Firestore or server responses must be:
  1. Logged via a structured logger (not `console.log`)
  2. Translated into a user-friendly, British English message before display

---

## 10. Code Style & Quality

### Prettier configuration

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

Prettier is non-negotiable and enforced pre-commit. No exceptions for any file type.

### ESLint

Extends `eslint-config-next` with:

- `@typescript-eslint/recommended-type-checked`
- `import/order` (enforces the import grouping defined in §4)
- `no-console` set to `error` in production builds
- `react/self-closing-comp` — self-close elements and components with no children

### Comments

- JSDoc on all exported functions and types in `packages/core`
- Inline comments explain _why_, not _what_ — the code explains what
- No commented-out code committed to the repository

---

## 11. Git & Version Control

### Branch naming

```
main          # production-ready at all times
dev           # integration branch
feat/[name]   # new feature
fix/[name]    # bug fix
chore/[name]  # tooling, dependencies, configuration
```

### Commit messages — Conventional Commits

```
feat(catfish): add round timer with server-enforced cutoff
fix(lobby): prevent duplicate player IDs on reconnect
chore(deps): upgrade Next.js to 16.2.0
docs(catfish): document Firestore schema for round state
```

- Scope is the game name or workspace (`catfish`, `core`, `admin`, `backend`)
- Present tense, imperative mood (`add`, not `added` or `adds`)
- Maximum 72 characters in the subject line
- Breaking changes denoted with `!` after scope: `feat(core)!: rename createLobby API`

---

## 12. Language & Copy

| Context                                | Standard                                                 |
| -------------------------------------- | -------------------------------------------------------- |
| Any text a user can see                | **British English** (`colour`, `authorise`, `organise`)  |
| Code, variables, comments              | American English acceptable — follow library conventions |
| User-facing error messages             | British English                                          |
| API routes, database fields, constants | American English — follow technical convention           |

---

## 13. Performance

- Use the Next.js `Image` component for all images — no raw `<img>` tags
- Use `next/dynamic` for heavy game-specific components not needed on initial load
- No synchronous blocking operations on the main thread
- Firestore queries must always have explicit limits — no unbounded collection reads

---

_Last updated: 18 February 2026_
