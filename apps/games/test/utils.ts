import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

/**
 * Test utilities for games app
 * Provides game-specific testing helpers
 */

/**
 * Custom render function for game components
 * Wraps with necessary providers and contexts
 */
export function renderGameComponent(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    ...options,
    // Add game-specific context providers here as needed
  });
}

/**
 * Mock canvas context for drawing tests
 */
export function createMockCanvasContext(): Partial<CanvasRenderingContext2D> {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
  };
}

/**
 * Helper to mock canvas element
 */
export function mockCanvasElement() {
  const mockContext = createMockCanvasContext();
  const mockCanvas = {
    getContext: vi.fn(() => mockContext),
    width: 500,
    height: 500,
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  };

  // Mock HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => mockContext as CanvasRenderingContext2D,
  ) as unknown as HTMLCanvasElement['getContext'];

  return { mockCanvas, mockContext };
}
