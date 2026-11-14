import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';

const WORKER = new URL('./worker.js', import.meta.url);

/** Hilos que usa el pool: todos los núcleos menos uno (mínimo 2). Se puede fijar con TEST_THREADS. */
export const THREADS = Math.max(2, Number(process.env.TEST_THREADS) || cpus().length - 1);

/** true con FULL=1: comprueba TODOS los niveles/dificultades en vez de una muestra determinista. */
export const FULL = process.env.FULL === '1';

/**
 * Reparte `items` entre varios hilos (cola compartida: el que termina pide más) y ejecuta `task` en cada uno.
 * Devuelve los resultados en el mismo orden que `items`.
 */
export function runPool(task, items, { threads = THREADS, batch = 4 } = {}) {
  if (!items.length) return Promise.resolve([]);
  const out = new Array(items.length);
  let next = 0;
  let pending = 0;
  const workers = [];
  return new Promise((resolve, reject) => {
    const fail = (err) => { workers.forEach((w) => w.terminate()); reject(err); };
    const feed = (w) => {
      if (next >= items.length) {
        if (pending === 0) { workers.forEach((x) => x.terminate()); resolve(out); }
        return;
      }
      const from = next;
      next = Math.min(items.length, next + batch);
      pending++;
      w.postMessage({ task, from, items: items.slice(from, next) });
    };
    for (let t = 0; t < Math.min(threads, Math.ceil(items.length / batch)); t++) {
      const w = new Worker(WORKER);
      workers.push(w);
      w.on('message', ({ from, results, error }) => {
        if (error) return fail(new Error(error));
        results.forEach((r, i) => { out[from + i] = r; });
        pending--;
        feed(w);
      });
      w.on('error', fail);
      feed(w);
    }
  });
}
