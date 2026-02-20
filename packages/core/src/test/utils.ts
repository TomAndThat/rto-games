import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Test utilities for @rto-games/core
 * Provides mocking helpers, factories, and custom render functions
 */

/**
 * Factory: Create a mock player for testing
 */
export function createMockPlayer(overrides?: Partial<{
  id: string;
  name: string;
  profilePicUrl: string;
  isReady: boolean;
  score: number;
}>) {
  return {
    id: overrides?.id ?? `player-${Math.random().toString(36).substring(7)}`,
    name: overrides?.name ?? 'Test Player',
    profilePicUrl: overrides?.profilePicUrl ?? 'https://example.com/avatar.jpg',
    isReady: overrides?.isReady ?? false,
    score: overrides?.score ?? 0,
  };
}

/**
 * Factory: Create a mock game room for testing
 */
export function createMockGameRoom(overrides?: Partial<{
  roomCode: string;
  hostId: string;
  phase: string;
  players: unknown[];
  createdAt: number;
}>) {
  return {
    roomCode: overrides?.roomCode ?? 'TEST',
    hostId: overrides?.hostId ?? 'host-123',
    phase: overrides?.phase ?? 'lobby',
    players: overrides?.players ?? [],
    createdAt: overrides?.createdAt ?? Date.now(),
  };
}

/**
 * Custom render function that wraps with common providers
 * Add game contexts or other providers here as needed
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    ...options,
    // Add wrapper with providers here when needed:
    // wrapper: ({ children }) => <GameProvider>{children}</GameProvider>,
  });
}

/**
 * Mock Firestore document snapshot
 */
export function createMockDocumentSnapshot<T>(data: T, id: string) {
  return {
    id,
    exists: () => true,
    data: () => data,
    ref: { id, path: `collection/${id}` },
  };
}

/**
 * Mock Firestore query snapshot
 */
export function createMockQuerySnapshot<T>(docs: Array<{ id: string; data: T }>) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((doc) => createMockDocumentSnapshot(doc.data, doc.id)),
  };
}

/**
 * Wait for a condition to be true (useful for async state updates)
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 50,
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
