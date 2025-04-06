import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['functions/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['functions/src/**/*.ts'],
      exclude: ['functions/src/**/*.test.ts', 'functions/src/**/*.d.ts'],
    },
  },
}); 