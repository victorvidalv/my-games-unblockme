import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Cada archivo en su propio hilo; los tests pesados reparten además su trabajo en un pool de worker_threads
    // (tests/parallel). FULL=1 npm test → revisión exhaustiva en vez de la muestra determinista.
    pool: 'threads',
    testTimeout: 60000,
    hookTimeout: 300000,
  },
});
