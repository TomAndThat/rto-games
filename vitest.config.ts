import { defineConfig } from 'vitest/config';

/**
 * Base Vitest configuration for RTO Games monorepo
 * Extended by individual workspace configurations
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/tests/**',
      ],
    },
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'out'],
  },
});
