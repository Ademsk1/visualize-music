import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 70,
      },
      exclude: [
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.*',
        // Tooling config files.
        'eslint.config.js',
        'vite.config.ts',
        'vitest.config.ts',
        // Entry points / integration surfaces (covered indirectly).
        '**/main.tsx',
        '**/App.tsx',
        // WebGL-heavy controller: covered by pure helpers instead.
        '**/scene/SceneController.ts',
        // Browser permission + media stream integration (hard to unit-test reliably).
        '**/audio/createAudioGraph.ts',
        // Pure type-only module.
        '**/types/featureFrame.ts',
        '**/vite-env.d.ts',
      ],
    },
  },
})
