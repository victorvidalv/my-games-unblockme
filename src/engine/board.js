/**
 * Tablero 6×6. La pieza 0 es siempre la llave roja: horizontal, de largo 2, en la fila de salida.
 * Una pieza es {o:'h'|'v', len:2|3, fix:fila (h) o columna (v)}; su posición móvil es un entero 0..N-len.
 * Un estado es el arreglo de posiciones; se codifica en un solo número (base 8) para usarlo como clave.
 */
export const N = 6;
export const EXIT_ROW = 2;
export const WIN_POS = N - 2; // posición de la llave roja cuando toca la salida

const P8 = [];
for (let i = 0, v = 1; i < 16; i++, v *= 8) P8.push(v);
export { P8 };

export const encode = (pos) => pos.reduce((k, x, i) => k + x * P8[i], 0);
export const decode = (key, n) => Array.from({ length: n }, (_, i) => Math.floor(key / P8[i]) % 8);

/** Celdas ocupadas por una pieza en la posición x. Útil para dibujar y para pruebas. */
export function cellsOf(piece, x) {
  const out = [];
  for (let k = 0; k < piece.len; k++) {
    out.push(piece.o === 'h' ? [piece.fix, x + k] : [x + k, piece.fix]);
  }
  return out;
}

/** true si el estado es válido: dentro del tablero y sin solapamientos. */
export function isValidState(pieces, pos) {
  if (pieces.length !== pos.length) return false;
  const seen = new Set();
  for (let i = 0; i < pieces.length; i++) {
    if (pos[i] < 0 || pos[i] + pieces[i].len > N) return false;
    for (const [r, c] of cellsOf(pieces[i], pos[i])) {
      const k = r * N + c;
      if (seen.has(k)) return false;
      seen.add(k);
    }
  }
  return true;
}

/** Texto compacto de un tablero: "h2.2.0 v3.1.2 ..." = orientación, largo, fila/columna fija, posición. */
export function encodeBoard(pieces, pos) {
  return pieces.map((p, i) => `${p.o}${p.len}.${p.fix}.${pos[i]}`).join(' ');
}
export function decodeBoard(text) {
  const pieces = [];
  const pos = [];
  for (const tok of text.split(' ')) {
    const [head, fix, x] = tok.split('.');
    pieces.push({ o: head[0], len: Number(head[1]), fix: Number(fix) });
    pos.push(Number(x));
  }
  return { pieces, pos };
}

/** Tablero aleatorio con `others` piezas además de la llave roja. */
export function randomBoard(rng, others, pLong) {
  const g = new Uint8Array(N * N);
  const idx = (r, c, k, o) => (o === 'h' ? r : r + k) * N + (o === 'h' ? c + k : c);
  const free = (r, c, len, o) => {
    for (let k = 0; k < len; k++) if (g[idx(r, c, k, o)]) return false;
    return true;
  };
  const put = (r, c, len, o) => {
    for (let k = 0; k < len; k++) g[idx(r, c, k, o)] = 1;
  };
  const redC = Math.floor(rng() * 3);
  const pieces = [{ o: 'h', len: 2, fix: EXIT_ROW }];
  const pos = [redC];
  put(EXIT_ROW, redC, 2, 'h');
  for (let n = 0; n < others; n++) {
    for (let t = 0; t < 50; t++) {
      const o = rng() < 0.5 ? 'h' : 'v';
      const len = rng() < pLong ? 3 : 2;
      const r = Math.floor(rng() * (o === 'h' ? N : N - len + 1));
      const c = Math.floor(rng() * (o === 'h' ? N - len + 1 : N));
      if (o === 'h' && r === EXIT_ROW) continue;
      if (free(r, c, len, o)) {
        put(r, c, len, o);
        pieces.push({ o, len, fix: o === 'h' ? r : c });
        pos.push(o === 'h' ? c : r);
        break;
      }
    }
  }
  return { pieces, pos };
}

/** Cambia una pieza (no la roja) por otra colocada al azar en un hueco libre. Devuelve null si no cabe. */
export function mutate(b, rng, pLong) {
  const n = b.pieces.length;
  const pieces = b.pieces.map((p) => ({ ...p }));
  const pos = b.pos.slice();
  const i = 1 + Math.floor(rng() * (n - 1));
  const g = new Uint8Array(N * N);
  const mark = (p, x) => {
    for (let k = 0; k < p.len; k++) g[p.o === 'h' ? p.fix * N + x + k : (x + k) * N + p.fix] = 1;
  };
  for (let j = 0; j < n; j++) if (j !== i) mark(pieces[j], pos[j]);
  for (let t = 0; t < 40; t++) {
    const o = rng() < 0.5 ? 'h' : 'v';
    const len = rng() < pLong ? 3 : 2;
    const r = Math.floor(rng() * (o === 'h' ? N : N - len + 1));
    const c = Math.floor(rng() * (o === 'h' ? N - len + 1 : N));
    if (o === 'h' && r === EXIT_ROW) continue;
    const x = o === 'h' ? c : r;
    let ok = true;
    for (let k = 0; k < len; k++) {
      if (g[o === 'h' ? r * N + x + k : (x + k) * N + c]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      pieces[i] = { o, len, fix: o === 'h' ? r : c };
      pos[i] = x;
      return { pieces, pos };
    }
  }
  return null;
}

/** Ocupación del tablero: para cada casilla (fila·6+columna) el índice de la pieza que la ocupa, o -1. */
export function occupancy(pieces, pos) {
  const g = new Int8Array(N * N).fill(-1);
  pieces.forEach((p, i) => {
    for (let k = 0; k < p.len; k++) g[p.o === 'h' ? p.fix * N + pos[i] + k : (pos[i] + k) * N + p.fix] = i;
  });
  return g;
}

/** Posiciones [mín, máx] a las que puede deslizar la pieza i desde el estado `pos` (sin salirse ni atravesar otras). */
export function slideRange(pieces, pos, i, g = occupancy(pieces, pos)) {
  const p = pieces[i];
  const x = pos[i];
  const at = (k) => (p.o === 'h' ? g[p.fix * N + k] : g[k * N + p.fix]);
  let lo = x;
  let hi = x;
  while (lo > 0 && at(lo - 1) < 0) lo--;
  while (hi + p.len < N && at(hi + p.len) < 0) hi++;
  return [lo, hi];
}

/** Con este arrastre mínimo (en casillas) la pieza ya cambia de casilla: los arrastres cortos no se «pegan». */
export const DRAG_MIN = 0.3;

/**
 * Casilla en la que se suelta una pieza arrastrada `delta` casillas desde x0, limitada a [lo, hi].
 * Un arrastre de al menos DRAG_MIN casillas siempre avanza (como mínimo una) hacia donde se tiró.
 */
export function snapDrag(x0, lo, hi, delta) {
  const clamp = (v) => Math.max(lo, Math.min(hi, v));
  const cur = clamp(x0 + delta);
  if (Math.abs(cur - x0) < DRAG_MIN) return x0;
  return clamp(delta > 0 ? Math.max(x0 + 1, Math.round(cur)) : Math.min(x0 - 1, Math.round(cur)));
}
