import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';

/**
 * Vitest configuration for @rto-games/core package
 * Enforces 80% coverage threshold for shared infrastructure
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: '@rto-games/core',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/test/**',
          'src/**/*.test.{ts,tsx}',
          'src/index.ts', // Re-export only
          'src/**/index.ts', // Re-export only
        ],
      },
    },
  }),
);
