import { decodeBoard, mutate } from './board.js';
import { analyze, maxDistance } from './solver.js';
import { mulberry32 } from './rng.js';
import { curve, WINDOW } from './difficulty.js';
import { hash32 } from './rng.js';

/**
 * Banco de tableros precalculados: `bank[rating-1]` es una lista de textos de tablero
 * (ver encodeBoard). Se generan con `npm run levels`, así cada nivel está garantizado
 * y se carga al instante, sin esperas ni diferencias entre dispositivos.
 */
export function pickBoard(bank, rating, seed, level) {
  const list = bank[rating - 1];
  if (!list || !list.length) throw new Error(`Sin tableros para la dificultad ${rating}`);
  const text = list[hash32(seed, level, rating) % list.length];
  return decodeBoard(text);
}

/**
 * Variante nueva de un tablero del banco: cambia 1-3 piezas al azar y solo acepta el cambio si el tablero
 * sigue teniendo solución y alcanza el mínimo objetivo de la dificultad (se comprueba con el solver).
 * Así dos partidas nunca repiten tablero aunque el banco sea finito. Determinista para una semilla.
 */
export function varyBoard(board, rating, seed, { tries = 8, changes = 3 } = {}) {
  const rng = mulberry32(seed);
  const { target, pLong } = curve(rating);
  let cur = { pieces: board.pieces, pos: board.pos };
  let accepted = 0;
  for (let t = 0; t < tries && accepted < changes; t++) {
    const cand = mutate(cur, rng, pLong);
    if (!cand) continue;
    const an = analyze(cand.pieces, cand.pos, 600000);
    if (an && maxDistance(an) >= target) {
      cur = cand;
      accepted++;
    }
  }
  return cur;
}

/**
 * Elige el estado inicial de un tablero para el nivel.
 *  - adj: ajuste adaptativo (-2..+2) según la eficiencia del jugador en niveles anteriores.
 *  - brave: ruta aventurera → usa la siguiente distancia mayor disponible.
 * Devuelve {pieces, pos, opt} donde opt = movimientos mínimos reales del estado elegido.
 */
export function buildLevel(board, { rating, adj = 0, brave = false, rng = Math.random }) {
  const an = analyze(board.pieces, board.pos, 600000);
  if (!an) throw new Error('Tablero sin solución');
  const target = curve(rating).target;
  let maxd = 0;
  for (const d of an.dist.values()) if (d > maxd) maxd = d;
  const lo = Math.max(1, Math.min(target, maxd) - WINDOW);
  const hi = Math.min(maxd, Math.max(target, lo) + WINDOW);
  const byDist = new Map();
  for (const k of an.list) {
    const d = an.dist.get(k);
    if (d < lo || d > hi) continue;
    if (!byDist.has(d)) byDist.set(d, []);
    byDist.get(d).push(k);
  }
  const ds = [...byDist.keys()];
  const want = Math.max(1, target + adj);
  const normal = ds.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
  const higher = ds.filter((v) => v > normal);
  const opt = brave && higher.length ? Math.min(...higher) : normal;
  const keys = byDist.get(opt);
  const key = keys[Math.floor(rng() * keys.length)];
  const pos = [];
  for (let i = 0, v = key; i < board.pieces.length; i++, v = Math.floor(v / 8)) pos.push(v % 8);
  return { pieces: board.pieces, pos, opt };
}

