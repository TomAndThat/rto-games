# Playwright E2E Tests

This directory contains end-to-end tests for RTO Games using Playwright.

## Structure

```
e2e/
  catfish/
    happy-path.spec.ts    # Main user flow for Catfish game
  [future-game]/
    happy-path.spec.ts    # Main user flow for each game
```

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode (recommended for development)
pnpm test:e2e:ui

# Run specific test file
pnpm exec playwright test e2e/catfish/happy-path.spec.ts

# Run in specific browser
pnpm exec playwright test --project=chromium

# Debug mode
pnpm exec playwright test --debug
```

## Writing Tests

### Test Structure

Each game should have at minimum a "happy path" test covering:

1. Landing on game page
2. Creating/joining a lobby
3. Entering player name
4. Game flow (basic round)
5. Viewing results

### Best Practices

- Test behaviour users can observe, not implementation details
- Use `data-testid` attributes sparingly; prefer accessible selectors (`getByRole`, `getByLabel`)
- Keep tests focused on critical paths
- Use page object models for complex, reusable interactions
- Avoid hard-coded waits; rely on Playwright's auto-waiting

### Example

```typescript
import { test, expect } from "@playwright/test";

test.describe("Game Name Happy Path", () => {
  test("user can complete full game flow", async ({ page }) => {
    await page.goto("/game-name");
    await expect(
      page.getByRole("heading", { name: "Game Name" }),
    ).toBeVisible();

    // Create lobby
    await page.getByRole("button", { name: "Create Game" }).click();

    // ... continue flow
  });
});
```

## Firebase Emulators

For tests requiring Firebase, ensure emulators are running:

```bash
pnpm emulators
```

Tests will automatically connect to emulated services via environment configuration.
