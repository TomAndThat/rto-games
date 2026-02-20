import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';
import path from 'node:path';

/**
 * Vitest configuration for games app
 * Tests game-specific components and behaviour
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'games',
      setupFiles: ['./test/setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './app'),
        '@rto-games/core': path.resolve(__dirname, '../../packages/core/src'),
      },
    },
  }),
);
