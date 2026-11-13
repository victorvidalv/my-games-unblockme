import { N, P8, WIN_POS, encode } from './board.js';

/** Llama cb(pieza, nuevaPos, nuevaClave) por cada movimiento posible (un arrastre de cualquier largo = 1 movimiento). */
export function expand(pieces, key, pos, g, cb) {
  const n = pieces.length;
  for (let i = 0; i < n; i++) pos[i] = Math.floor(key / P8[i]) % 8;
  g.fill(-1);
  for (let i = 0; i < n; i++) {
    const p = pieces[i];
    const x = pos[i];
    if (p.o === 'h') for (let k = 0; k < p.len; k++) g[p.fix * N + x + k] = i;
    else for (let k = 0; k < p.len; k++) g[(x + k) * N + p.fix] = i;
  }
  for (let i = 0; i < n; i++) {
    const p = pieces[i];
    const x = pos[i];
    const h = p.o === 'h';
    const f = p.fix;
    let lo = x;
    let hi = x;
    while (lo > 0 && g[h ? f * N + lo - 1 : (lo - 1) * N + f] < 0) lo--;
    while (hi + p.len < N && g[h ? f * N + hi + p.len : (hi + p.len) * N + f] < 0) hi++;
    for (let y = lo; y <= hi; y++) if (y !== x) cb(i, y, key + (y - x) * P8[i]);
  }
}

/**
 * Explora TODA la componente alcanzable desde pos0 y calcula la distancia exacta
 * (nº mínimo de movimientos) de cada estado a la victoria. Devuelve null si no hay salida
 * o la componente supera `cap` estados.
 */
export function analyze(pieces, pos0, cap = 300000) {
  const n = pieces.length;
  const k0 = encode(pos0);
  const pos = new Array(n).fill(0);
  const g = new Int8Array(N * N);
  const seen = new Set([k0]);
  const list = [k0];
  for (let q = 0; q < list.length; q++) {
    expand(pieces, list[q], pos, g, (i, y, nk) => {
      if (!seen.has(nk)) {
        seen.add(nk);
        list.push(nk);
      }
    });
    if (list.length > cap) return null;
  }
  const dist = new Map();
  const queue = [];
  for (const k of list) {
    if (k % 8 === WIN_POS) {
      dist.set(k, 0);
      queue.push(k);
    }
  }
  if (!queue.length) return null;
  for (let q = 0; q < queue.length; q++) {
    const k = queue[q];
    const d = dist.get(k) + 1;
    expand(pieces, k, pos, g, (i, y, nk) => {
      if (!dist.has(nk)) {
        dist.set(nk, d);
        queue.push(nk);
      }
    });
  }
  return { k0, list, dist };
}

/** Mayor distancia a la victoria dentro de la componente (= lo difícil que puede llegar a ser el tablero). */
export function maxDistance(an) {
  let m = 0;
  for (const d of an.dist.values()) if (d > m) m = d;
  return m;
}

/** Siguiente mejor movimiento desde pos0: {i, from, to, left} o null si ya está resuelto/sin solución. */
export function hintMove(pieces, pos0) {
  const an = analyze(pieces, pos0, 600000);
  if (!an) return null;
  const d = an.dist.get(an.k0);
  if (!d) return null;
  const pos = new Array(pieces.length).fill(0);
  const g = new Int8Array(N * N);
  let best = null;
  expand(pieces, an.k0, pos, g, (i, y, nk) => {
    if (!best && an.dist.get(nk) === d - 1) best = { i, from: pos[i], to: y, left: d };
  });
  return best;
}

/** Movimientos mínimos para resolver desde pos (o null si no tiene solución). */
export function minMoves(pieces, pos) {
  const an = analyze(pieces, pos, 600000);
  return an ? an.dist.get(an.k0) ?? null : null;
}
