import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    exclude: ['node_modules', '.next', 'tests-e2e', 'playwright-report'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/features/*/domain/**/*.ts',
        'src/features/*/application/**/*.ts',
        'src/shared/lib/normalize-url.ts',
        'src/shared/lib/date.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/index.ts', 'src/features/*/domain/types.ts'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
