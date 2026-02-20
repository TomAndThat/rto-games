# Testing Setup — Quick Reference

## ✅ What's Been Implemented

### Infrastructure

- **Vitest** for unit & integration tests
- **React Testing Library** for component tests
- **Playwright** for E2E tests across 5 browser configurations
- **Coverage reporting** with 80% threshold for core package
- **Test utilities** and factories for common test patterns

### Configuration Files

- `vitest.config.ts` — Root, core package, and games app
- `playwright.config.ts` — E2E test configuration
- Test setup files with Firebase mocking and Next.js mocking

### Example Tests

- **Unit tests:** `logger.test.ts`, `errors.test.ts` (12 passing tests)
- **Component test:** `CatfishButton.test.tsx` (14 passing tests)
- **E2E test:** `catfish/happy-path.spec.ts` (5 test scenarios, 25 total across browsers)

### Documentation

- [TESTING.md](TESTING.md) — Comprehensive testing guide
- [e2e/README.md](../e2e/README.md) — E2E test documentation

---

## 🚀 Quick Start

### Run All Tests

```bash
# Unit & integration (all workspaces)
pnpm --filter @rto-games/core test --run
pnpm --filter games test --run

# E2E tests (requires dev server running)
pnpm test:e2e

# With UI
pnpm test:e2e:ui
```

### Development Workflow

```bash
# Watch mode for TDD
pnpm --filter @rto-games/core test

# Coverage report
pnpm --filter @rto-games/core test:coverage

# Debug E2E tests
pnpm exec playwright test --debug
```

---

## 📊 Test Results

**Current Status:**

- ✅ Core package: 12/12 tests passing
- ✅ Games app: 14/14 tests passing
- ✅ E2E: 5 scenarios configured (25 tests across browsers)
- ✅ Total: 26 tests passing

**Coverage:**

- Core package enforces 80% coverage threshold
- Games app coverage is tracked but not enforced

---

## 🎯 Next Steps

1. **Run E2E tests** once dev server is stable
2. **Add tests** as new features are implemented
3. **Maintain coverage** above 80% for core utilities
4. **Expand E2E** to cover full game rounds when ready

---

## 📚 Key Files

| File                              | Purpose                     |
| --------------------------------- | --------------------------- |
| `packages/core/src/test/utils.ts` | Test factories & helpers    |
| `apps/games/test/setup.ts`        | Global test setup           |
| `docs/TESTING.md`                 | Comprehensive testing guide |
| `playwright.config.ts`            | E2E configuration           |

---

_Setup completed: 18 February 2026_
