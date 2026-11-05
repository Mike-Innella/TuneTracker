import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
// `server-only` throws outside React Server bundles; tests import server code directly.
const alias = { 'server-only': r('./infrastructure/scripts/empty-module.ts'), '@': r('./frontend/src') };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['packages/shared/**/*.test.ts', 'backend/tests/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['backend/tests/integration/**/*.test.ts'],
          globalSetup: ['backend/tests/integration/global-setup.ts'],
          setupFiles: ['backend/tests/integration/setup.ts'],
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
          include: ['frontend/src/**/*.test.tsx'],
          setupFiles: ['frontend/src/test-setup.ts'],
        },
      },
    ],
  },
});
