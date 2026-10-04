import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base: required for Capacitor (files served from the app bundle).
  base: './',
  build: { target: 'es2020', sourcemap: false },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
