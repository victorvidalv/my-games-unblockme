import { decodeBoard, mutate } from './board.js';
import { analyze, maxDistance } from './solver.js';
import { mulberry32 } from './rng.js';
import { braveExtra, curve, WINDOW } from './difficulty.js';
import { hash32 } from './rng.js';

/**
 * Banco de tableros precalculados: `bank[rating-1]` es una lista de textos de tablero
 * (ver encodeBoard). Se generan con `npm run levels`, así cada nivel está garantizado
 * y se carga al instante, sin esperas ni diferencias entre dispositivos.
 * `special[familia][rating-1]` trae los mismos tableros decorados con muros, candados o piezas pesadas
 * (`npm run levels:decorate`); si falta una familia se usa el tablero normal.
 */
/** Si una familia no tiene tableros a esa dificultad (los muros no se consiguen por encima de 85) se prueba con otra especial. */
export const FALLBACK = {
  plain: ['plain'],
  walls: ['walls', 'gates'],
  gates: ['gates'],
  heavy: ['heavy'],
  ice: ['ice', 'gates'],
  duo: ['duo', 'ice', 'gates', 'heavy'],
  mixed: ['mixed', 'duo', 'ice', 'walls', 'gates', 'heavy'],
};

export function pickBoard(bank, rating, seed, level, family = 'plain', special = null) {
  let used = 'plain';
  let list = bank[rating - 1];
  for (const f of FALLBACK[family] ?? ['plain']) {
    const l = f === 'plain' ? bank[rating - 1] : special?.[f]?.[rating - 1];
    if (l?.length) { used = f; list = l; break; }
  }
  if (!list || !list.length) throw new Error(`Sin tableros para la dificultad ${rating}`);
  const text = list[hash32(seed, level, rating) % list.length];
  return { ...decodeBoard(text), family: used };
}

/**
 * Variante nueva de un tablero del banco: cambia 1-3 piezas al azar y solo acepta el cambio si el tablero
 * sigue teniendo solución y alcanza el mínimo objetivo de la dificultad (se comprueba con el solver).
 * Así dos partidas nunca repiten tablero aunque el banco sea finito. Determinista para una semilla.
 */
export function varyBoard(board, rating, seed, { tries = 8, changes = 3 } = {}) {
  const rng = mulberry32(seed);
  const { target, pLong } = curve(rating);
  const walls = board.walls || [];
  let cur = { pieces: board.pieces, pos: board.pos, walls };
  let accepted = 0;
  const hasIce = board.pieces.some((p) => p.kind === 'ice');
  for (let t = 0; t < tries && accepted < changes; t++) {
    const cand = mutate(cur, rng, pLong);
    if (!cand) continue;
    const an = analyze(cand.pieces, cand.pos, 600000, walls);
    if (an && (!hasIce || an.dist.size === an.list.length) && maxDistance(an) >= target) {
      cur = cand;
      accepted++;
    }
  }
  return { ...cur, family: board.family };
}

/**
 * Elige el estado inicial de un tablero para el nivel.
 *  - adj: ajuste adaptativo (-2..+2) según la eficiencia del jugador en niveles anteriores.
 *  - brave: ruta aventurera → usa la siguiente distancia mayor disponible.
 * Devuelve {pieces, pos, opt} donde opt = movimientos mínimos reales del estado elegido.
 */
export function buildLevel(board, { rating, adj = 0, brave = false, rng = Math.random, boost = 0 }) {
  const walls = board.walls || [];
  const an = analyze(board.pieces, board.pos, 600000, walls);
  if (!an) throw new Error('Tablero sin solución');
  const target = curve(rating).target;
  let maxd = 0;
  for (const d of an.dist.values()) if (d > maxd) maxd = d;
  const lo = Math.max(1, Math.min(target, maxd) - WINDOW);
  const hi = Math.min(maxd, Math.max(target, lo) + WINDOW);
  const byDist = new Map();
  for (const k of an.list) {
    const d = an.dist.get(k);
    if (d === undefined || d < lo || d > hi) continue;
    if (!byDist.has(d)) byDist.set(d, []);
    byDist.get(d).push(k);
  }
  const ds = [...byDist.keys()];
  const want = Math.max(1, target + adj + boost);
  const normal = ds.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
  const higher = ds.filter((v) => v > normal);
  const wantBrave = normal + braveExtra(normal);                   // ruta aventurera: más movimientos, el más cercano disponible
  const opt = brave && higher.length ? higher.reduce((a, b) => (Math.abs(b - wantBrave) < Math.abs(a - wantBrave) ? b : a)) : normal;
  const keys = byDist.get(opt);
  const key = keys[Math.floor(rng() * keys.length)];
  const pos = [];
  for (let i = 0, v = key; i < board.pieces.length; i++, v = Math.floor(v / 8)) pos.push(v % 8);
  return { pieces: board.pieces, pos, walls, opt };
}

