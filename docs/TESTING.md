# Testing Guide — RTO Games Platform

This document describes the testing infrastructure and practices for the Release the Owl Games platform.

## Testing Stack

| Tool                      | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| **Vitest**                | Unit and integration tests               |
| **React Testing Library** | Component behaviour testing              |
| **Playwright**            | End-to-end tests for critical user flows |
| **Vitest UI**             | Interactive test runner (optional)       |
| **Coverage v8**           | Code coverage reporting                  |

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests across workspaces
pnpm test

# Run tests for a specific workspace
pnpm --filter @rto-games/core test
pnpm --filter games test

# Run tests in watch mode (re-runs on file changes)
pnpm --filter @rto-games/core test --watch

# Run with UI (interactive test explorer)
pnpm --filter @rto-games/core test:ui

# Generate coverage report
pnpm --filter @rto-games/core test:coverage
```

### E2E Tests with Playwright

```bash
# Run all E2E tests
pnpm test:e2e

# Run with interactive UI
pnpm test:e2e:ui

# Run specific test file
pnpm exec playwright test e2e/catfish/happy-path.spec.ts

# Run in specific browser
pnpm exec playwright test --project=chromium

# Run in headed mode (see browser)
pnpm exec playwright test --headed

# Debug mode (step through tests)
pnpm exec playwright test --debug

# Generate and view test report
pnpm exec playwright show-report
```

## Project Structure

### Core Package Tests

```
packages/core/
  src/
    utils/
      logger.ts
      logger.test.ts          # Co-located unit test
    services/
      gameService.ts
      gameService.test.ts     # Co-located integration test
    test/
      setup.ts                # Global test setup (mocks, cleanup)
      utils.ts                # Test utilities (factories, helpers)
  vitest.config.ts            # Vitest configuration
```

### Games App Tests

```
apps/games/
  app/
    catfish/
      components/
        buttons/
          CatfishButton.tsx
          CatfishButton.test.tsx  # Co-located component test
  test/
    setup.ts                      # Global test setup
    utils.ts                      # Game-specific test utilities
  vitest.config.ts                # Vitest configuration
```

### E2E Tests

```
e2e/
  catfish/
    happy-path.spec.ts        # Main user flow for Catfish
  [future-game]/
    happy-path.spec.ts        # Main user flow for each game
playwright.config.ts          # Playwright configuration
```

## Coverage Requirements

| Scope                     | Target      | Enforced |
| ------------------------- | ----------- | -------- |
| `packages/core` utilities | 80%+        | ✅ Yes   |
| Game logic / validators   | 100%        | Manual   |
| React components          | N/A         | No       |
| E2E critical paths        | 1 spec/game | Manual   |

**Note on component coverage:** Components are tested for **observable behaviour**, not lines of code. Focus on user interactions, not implementation details.

## Writing Tests

### Unit Tests

**Location:** Co-located with the source file (`*.test.ts`)

**Purpose:** Test pure functions, utilities, and isolated business logic

**Example:**

```typescript
import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring";

describe("calculateScore", () => {
  it("returns 0 for no correct answers", () => {
    expect(calculateScore(0, 10)).toBe(0);
  });

  it("awards points proportional to correct answers", () => {
    expect(calculateScore(5, 10)).toBe(500);
  });
});
```

### Component Tests

**Location:** Co-located with component (`ComponentName.test.tsx`)

**Purpose:** Test user-observable behaviour (clicks, inputs, rendering)

**Guidelines:**

- Test what users see and do, not implementation
- Use accessible queries (`getByRole`, `getByLabelText`)
- Avoid testing internal state or props directly
- Don't test styling details (unless critical to UX)

**Example:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerCard } from './PlayerCard';

describe('PlayerCard', () => {
  it('displays player name', () => {
    render(<PlayerCard name="Alice" score={100} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('calls onKick when kick button is clicked', async () => {
    const user = userEvent.setup();
    const handleKick = vi.fn();

    render(<PlayerCard name="Bob" onKick={handleKick} />);
    await user.click(screen.getByRole('button', { name: /kick/i }));

    expect(handleKick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests

**Location:** `e2e/[game-name]/` directory

**Purpose:** Test critical user flows end-to-end

**Guidelines:**

- One happy-path spec per game minimum
- Test from the user's perspective (no implementation details)
- Use realistic data and interactions
- Prefer accessible selectors over test IDs
- Keep tests focused on critical paths

**Example:**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Game Happy Path", () => {
  test("user can complete full game flow", async ({ page }) => {
    await page.goto("/game");

    // Create game
    await page.getByRole("button", { name: "Create Game" }).click();

    // Enter name
    await page.getByRole("textbox", { name: "Name" }).fill("TestPlayer");
    await page.getByRole("button", { name: "Continue" }).click();

    // Verify lobby reached
    await expect(page.getByText(/lobby/i)).toBeVisible();
  });
});
```

## Test Utilities

### Factories

Create mock data for tests:

```typescript
import {
  createMockPlayer,
  createMockGameRoom,
} from "@rto-games/core/test/utils";

const player = createMockPlayer({ name: "Alice", score: 100 });
const room = createMockGameRoom({ roomCode: "TEST", hostId: player.id });
```

### Custom Render

Wrap components with necessary providers:

```typescript
import { renderWithProviders } from '@/test/utils';

renderWithProviders(<MyComponent />);
```

### Canvas Mocking

For drawing components:

```typescript
import { mockCanvasElement } from "@/test/utils";

const { mockCanvas, mockContext } = mockCanvasElement();
// Canvas methods are now mocked and can be spied on
```

## Firebase Testing

### Using Emulators

For tests requiring real Firebase interactions, use emulators:

1. Start emulators in a separate terminal:

   ```bash
   pnpm emulators
   ```

2. Tests will automatically connect to emulated services

3. Data is cleared between test runs

### Mocking Firebase

For most unit tests, Firebase is mocked in `test/setup.ts`. Individual tests can override with more specific mocks:

```typescript
import { vi } from "vitest";
import * as firestore from "firebase/firestore";

vi.mocked(firestore.getDoc).mockResolvedValue({
  exists: () => true,
  data: () => ({ name: "Test Game" }),
});
```

## Common Patterns

### Testing Async State

```typescript
import { waitFor } from '@testing-library/react';

render(<AsyncComponent />);
await waitFor(() => {
  expect(screen.getByText('Loaded!')).toBeInTheDocument();
});
```

### Testing Error States

```typescript
it('displays error message on failure', async () => {
  // Mock service to throw error
  vi.mocked(gameService.createGame).mockRejectedValue(
    new Error('Failed to create game')
  );

  render(<CreateGameButton />);
  await user.click(screen.getByRole('button'));

  expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
});
```

### Testing Loading States

```typescript
it('shows loading indicator while submitting', async () => {
  const user = userEvent.setup();
  render(<SubmitForm />);

  await user.type(screen.getByRole('textbox'), 'test');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

## Debugging Tests

### Vitest

```bash
# Show console logs in test output
pnpm test -- --reporter=verbose

# Run single test file
pnpm test -- packages/core/src/utils/logger.test.ts

# Run tests matching pattern
pnpm test -- -t "calculates score"

# Debug with Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### Playwright

```bash
# Debug mode (pause on each action)
pnpm exec playwright test --debug

# UI mode (visual test runner)
pnpm test:e2e:ui

# Trace viewer (view test recording)
pnpm exec playwright show-trace trace.zip

# Generate trace on failure
pnpm exec playwright test --trace on
```

## CI/CD Integration

Tests run automatically in CI (when configured):

- **Unit/Integration tests:** Run on all PRs
- **E2E tests:** Run on main branch pushes
- **Coverage reports:** Generated and stored as artifacts
- **Test failures:** Block PR merging

## Best Practices

✅ **DO:**

- Write tests that test behaviour, not implementation
- Co-locate tests with the code they test
- Use descriptive test names that read as sentences
- Keep tests simple and focused
- Use factories for test data
- Clean up after tests (handled automatically by setup)
- Test error paths and edge cases
- Use `it()` consistently (not `test()` alias)

❌ **DON'T:**

- Test internal state or private methods
- Rely on test execution order
- Use hard-coded waits (`setTimeout`)
- Snapshot test large components (brittle)
- Test framework implementation (e.g., "useState is called")
- Commit `.only` or `.skip` to version control
- Use `any` type in test code
- Test styling unless critical to UX

## Troubleshooting

### Tests timing out

- Check for missing `await` on async operations
- Increase timeout for slow operations
- Ensure background processes (servers) are running

### Mock not working

- Verify mock is defined before importing tested code
- Check that the mock path exactly matches import path
- Clear mock state between tests with `vi.clearAllMocks()`

### Flaky E2E tests

- Use Playwright's auto-waiting (avoid hard waits)
- Increase timeout for slow operations
- Check for race conditions in async operations
- Ensure tests are isolated and don't depend on each other

### Coverage not accurate

- Check that source files are in `include` pattern
- Verify `exclude` patterns aren't too broad
- Run `pnpm test:coverage -- --reporter=verbose`

---

_Last updated: 18 February 2026_
