import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/integration/setup.js'],
    include: ['test/integration/**/*.test.js'],
    testTimeout: 20000,
    fileParallelism: false, // tocan la misma DB: ejecutar en serie
  },
});
