/**
 * Genera la familia «walls» (tableros con muros) en src/data/special.json, para las 100 dificultades.
 * Cada tablero se busca con el mismo generador que los normales, pero con muros sueltos que las piezas
 * deben rodear. Solo se aceptan tableros donde los muros IMPORTAN: sin ellos la solución sería más corta.
 *
 *   npm run levels:walls            → todo (varios minutos)
 *   npm run levels:walls -- --only 40-60
 */
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generateBoard } from '../src/engine/generator.js';
import { encodeBoard } from '../src/engine/board.js';
import { analyze } from '../src/engine/solver.js';
import { hash32 } from '../src/engine/rng.js';
import { minReach } from '../src/engine/difficulty.js';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/special.json');
const PER = 6;
const WALLS = 3;

if (!isMainThread) {
  for (const { rating, slot } of workerData.jobs) {
    let seed = hash32(rating, slot, 0x3a11);
    let text = null;
    // Con muros, llegar al mínimo de las dificultades más altas es muy caro: se admiten 2 movimientos menos
    // (el juego ofrece un margen de ±3 movimientos de todos modos).
    const floor = minReach(rating) - (rating > 60 ? 2 : 0);
    for (let attempt = 0; attempt < 8 && !text; attempt++) {
      const b = generateBoard(rating, seed, { maxIters: 1200, walls: WALLS });
      seed = hash32(seed, attempt + 1);
      if (b.maxd < floor) continue;
      const without = analyze(b.pieces, b.pos, 600000, []);
      const dWithout = without ? without.dist.get(without.k0) : 0;
      if (dWithout !== undefined && b.maxd > dWithout) text = encodeBoard(b.pieces, b.pos, b.walls); // los muros importan
    }
    parentPort.postMessage({ rating, slot, text });
  }
  process.exit(0);
}

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const [from, to] = String(arg('only', '1-100')).split('-').map(Number);
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
out.walls = out.walls || Array.from({ length: 100 }, () => []);
const jobs = [];
for (let rating = from; rating <= (to || from); rating++) {
  out.walls[rating - 1] = [];
  for (let slot = 0; slot < PER; slot++) jobs.push({ rating, slot });
}
jobs.sort((a, b) => b.rating - a.rating);
const threads = Math.max(1, cpus().length - 1);
let done = 0;
let failed = 0;
await Promise.all(Array.from({ length: threads }, (_, t) => new Promise((ok) => {
  const w = new Worker(new URL(import.meta.url), { workerData: { jobs: jobs.filter((_, i) => i % threads === t) } });
  w.on('message', (m) => {
    if (m.text) out.walls[m.rating - 1].push(m.text); else failed++;
    if (++done % 100 === 0) console.log(`${done}/${jobs.length} (sin lograr: ${failed})`);
  });
  w.on('exit', ok);
})));
out.walls.forEach((l) => l.sort());
writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`Listo: ${done - failed} tableros con muros, ${failed} sin lograr → ${OUT}`);
