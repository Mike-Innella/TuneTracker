import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
// `server-only` throws outside React Server bundles; tests import server code directly.
const alias = { 'server-only': r('./scripts/empty-module.ts'), '@': r('./client/src') };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['shared/**/*.test.ts', 'server/tests/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['server/tests/integration/**/*.test.ts'],
          globalSetup: ['server/tests/integration/global-setup.ts'],
          setupFiles: ['server/tests/integration/setup.ts'],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['client/src/**/*.test.tsx'],
          setupFiles: ['client/src/test-setup.ts'],
        },
      },
    ],
  },
});
