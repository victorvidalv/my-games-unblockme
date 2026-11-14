/**
 * Añade candados y piezas pesadas a los tableros del banco y escribe sus familias en src/data/special.json:
 *   gates y heavy salen de src/data/levels.json; mixed sale de los tableros con muros (familia walls, que genera
 *   `npm run levels:walls`). Si una combinación no se puede decorar se deja vacía y el juego usa otro tablero.
 *
 *   npm run levels:decorate
 *   npm run levels:decorate -- --only 20-60
 */
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { decodeBoard, encodeBoard } from '../src/engine/board.js';
import { decorateBoard, FAMILIES } from '../src/engine/decorate.js';
import { minReach } from '../src/engine/difficulty.js';
import { hash32 } from '../src/engine/rng.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BANK = resolve(ROOT, 'src/data/levels.json');
const OUT = resolve(ROOT, 'src/data/special.json');

if (!isMainThread) {
  const { jobs, ratings, bases } = workerData;
  const pickWallFallback = (rating, slot) => {
    for (let r = Math.min(rating - 1, bases.walls.length - 1); r >= 69; r--) {
      const pool = bases.walls[r];
      if (pool?.length) return pool[hash32(rating, slot, r) % pool.length];
    }
    return null;
  };
  for (const { rating, slot, family } of jobs) {
    const base = FAMILIES[family].base;
    const text = base ? (bases[base]?.[rating - 1]?.[slot] || pickWallFallback(rating, slot)) : ratings[rating - 1][slot];
    if (!text) { parentPort.postMessage({ rating, slot, family, text: null }); continue; }
    const board = decodeBoard(text);
    const minOpt = base && !bases[base]?.[rating - 1]?.[slot] ? minReach(rating) - 2 : 0;
    const d = decorateBoard(board, family, hash32(rating, slot, family.length, 0xdec0), { minOpt });
    parentPort.postMessage({ rating, slot, family, text: d ? encodeBoard(d.pieces, d.pos, d.walls) : null });
  }
  process.exit(0);
}

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const [from, to] = String(arg('only', '1-100')).split('-').map(Number);
const { ratings } = JSON.parse(readFileSync(BANK, 'utf8'));
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const families = Object.keys(FAMILIES);
for (const f of [...families, 'walls']) out[f] = out[f] || Array.from({ length: 100 }, () => []);
const jobs = [];
for (let rating = from; rating <= (to || from); rating++) {
  for (const f of families) out[f][rating - 1] = [];
  ratings[rating - 1].forEach((_, slot) => { for (const family of families) jobs.push({ rating, slot, family }); });
}
jobs.sort((a, b) => b.rating - a.rating);
const threads = Math.max(1, cpus().length - 1);
let done = 0;
let failed = 0;
await Promise.all(Array.from({ length: threads }, (_, t) => new Promise((ok) => {
  const w = new Worker(new URL(import.meta.url), { workerData: { jobs: jobs.filter((_, i) => i % threads === t), ratings, bases: { walls: out.walls } } });
  w.on('message', (m) => {
    if (m.text) out[m.family][m.rating - 1].push(m.text); else failed++;
    if (++done % 200 === 0) console.log(`${done}/${jobs.length} (sin decorar: ${failed})`);
  });
  w.on('exit', ok);
})));
for (const f of families) out[f].forEach((l) => l.sort());      // orden estable: el resultado no depende de los hilos
writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`Listo: ${done - failed} tableros decorados, ${failed} sin decorar → ${OUT}`);
