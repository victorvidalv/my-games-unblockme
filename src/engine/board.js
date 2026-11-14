/**
 * Tablero 6×6. La pieza 0 es siempre la llave roja: horizontal, de largo 2, en la fila de salida.
 * Una pieza es {o:'h'|'v', len:2|3, fix:fila (h) o columna (v)}; su posición móvil es un entero 0..N-len.
 * Un estado es el arreglo de posiciones; se codifica en un solo número (base 8) para usarlo como clave.
 *
 * Piezas especiales (no cambian el estado, solo qué movimientos se permiten, así que todo movimiento sigue
 * siendo reversible y el solver sigue siendo exacto):
 *   muro    – celda fija [fila, columna] en la lista `walls`; nada la atraviesa.
 *   candado – pieza {kind:'gate', plate:[fila,col]}: solo se mueve mientras OTRA pieza cubre la placa.
 *             La placa nunca está en la fila/columna del candado (así mover el candado no cambia la placa).
 *   pesada  – pieza {kind:'heavy'}: solo avanza una casilla por movimiento.
 *   hielo   – pieza {kind:'ice'}: al deslizarla en un sentido no frena hasta chocar con otro bloque, muro o borde.
 *             (Su grafo puede ser dirigido; el solver calcula distancias exactas por aristas invertidas.)
 */
export const N = 6;
export const EXIT_ROW = 2;
export const WIN_POS = N - 2; // posición de la llave roja cuando toca la salida
export const WALL = 99; // marca de muro en la rejilla de ocupación

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

/** true si el estado es válido: dentro del tablero, sin solapamientos y sin pisar muros. */
export function isValidState(pieces, pos, walls = []) {
  if (pieces.length !== pos.length) return false;
  const seen = new Set(walls.map(([r, c]) => r * N + c));
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

/** ¿La placa del candado i está cubierta por otra pieza? (rejilla de ocupación g) */
export const gateOpen = (pieces, i, g) => {
  const pl = pieces[i].plate;
  const v = g[pl[0] * N + pl[1]];
  return v >= 0 && v < WALL && v !== i;
};

/**
 * Texto compacto de un tablero: "h2.2.0 v3.1.2g0.4 h2.5.1p v2.4.0i #3.3" =
 *   pieza: orientación, largo, fila/columna fija, posición; «g<fila>.<col>» = candado con esa placa;
 *   «p» = pesada; «i» = hielo; «#<fila>.<col>» = muro.
 */
export function encodeBoard(pieces, pos, walls = []) {
  const parts = pieces.map((p, i) => {
    const suffix = p.kind === 'gate' ? `g${p.plate[0]}.${p.plate[1]}` : p.kind === 'heavy' ? 'p' : p.kind === 'ice' ? 'i' : '';
    return `${p.o}${p.len}.${p.fix}.${pos[i]}${suffix}`;
  });
  for (const [r, c] of walls) parts.push(`#${r}.${c}`);
  return parts.join(' ');
}
export function decodeBoard(text) {
  const pieces = [];
  const pos = [];
  const walls = [];
  for (const tok of text.split(' ')) {
    if (tok[0] === '#') {
      const [r, c] = tok.slice(1).split('.').map(Number);
      walls.push([r, c]);
      continue;
    }
    const m = /^([hv])(\d)\.(\d)\.(\d)(?:g(\d)\.(\d)|([pi]))?$/.exec(tok);
    if (!m) throw new Error(`Pieza ilegible: ${tok}`);
    const piece = { o: m[1], len: Number(m[2]), fix: Number(m[3]) };
    if (m[5] !== undefined) { piece.kind = 'gate'; piece.plate = [Number(m[5]), Number(m[6])]; }
    else if (m[7] === 'p') piece.kind = 'heavy';
    else if (m[7] === 'i') piece.kind = 'ice';
    pieces.push(piece);
    pos.push(Number(m[4]));
  }
  return { pieces, pos, walls };
}

/**
 * Tablero aleatorio con `others` piezas además de la llave roja y `wallCount` muros sueltos
 * (colocados antes que las piezas, así que las piezas se reparten alrededor de ellos).
 */
export function randomBoard(rng, others, pLong, wallCount = 0) {
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
  const walls = [];
  for (let w = 0; w < wallCount; w++) {
    for (let t = 0; t < 40; t++) {
      const r = Math.floor(rng() * N);
      const c = Math.floor(rng() * N);
      if (!g[r * N + c]) {
        g[r * N + c] = 1;
        walls.push([r, c]);
        break;
      }
    }
  }
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
  return { pieces, pos, walls };
}

/**
 * Cambia una pieza normal (no la roja, ni candados ni pesadas) por otra colocada al azar en un hueco libre,
 * respetando muros. Devuelve null si no cabe.
 */
export function mutate(b, rng, pLong) {
  const n = b.pieces.length;
  const walls = b.walls || [];
  const pieces = b.pieces.map((p) => ({ ...p }));
  const pos = b.pos.slice();
  const normal = [];
  for (let k = 1; k < n; k++) if (!pieces[k].kind) normal.push(k);
  if (!normal.length) return null;
  const i = normal[Math.floor(rng() * normal.length)];
  const g = new Uint8Array(N * N);
  for (const [r, c] of walls) g[r * N + c] = 1;
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
      return { pieces, pos, walls };
    }
  }
  return null;
}

/** Ocupación del tablero: para cada casilla (fila·6+columna) el índice de la pieza, WALL si hay muro, o -1. */
export function occupancy(pieces, pos, walls = []) {
  const g = new Int8Array(N * N).fill(-1);
  for (const [r, c] of walls) g[r * N + c] = WALL;
  pieces.forEach((p, i) => {
    for (let k = 0; k < p.len; k++) g[p.o === 'h' ? p.fix * N + pos[i] + k : (pos[i] + k) * N + p.fix] = i;
  });
  return g;
}

/**
 * Posiciones [mín, máx] a las que puede ir la pieza i desde `pos`: lo que deja libre el tablero (sin salirse,
 * sin atravesar piezas ni muros), una sola casilla si es pesada, y ninguna si es un candado cerrado.
 */
export function slideRange(pieces, pos, i, walls = []) {
  const g = occupancy(pieces, pos, walls);
  const p = pieces[i];
  const x = pos[i];
  if (p.kind === 'gate' && !gateOpen(pieces, i, g)) return [x, x];
  const at = (k) => (p.o === 'h' ? g[p.fix * N + k] : g[k * N + p.fix]);
  let lo = x;
  let hi = x;
  while (lo > 0 && at(lo - 1) < 0) lo--;
  while (hi + p.len < N && at(hi + p.len) < 0) hi++;
  if (p.kind === 'heavy') return [Math.max(lo, x - 1), Math.min(hi, x + 1)];
  return [lo, hi];
}

/** ¿Está esta pieza candada ahora mismo? (para el aviso y la animación) */
export const isLocked = (pieces, pos, i, walls = []) => pieces[i].kind === 'gate' && !gateOpen(pieces, i, occupancy(pieces, pos, walls));

/** Con este arrastre mínimo (en casillas) la pieza ya cambia de casilla: los arrastres cortos no se «pegan». */
export const DRAG_MIN = 0.3;

/**
 * Casilla en la que se suelta una pieza arrastrada `delta` casillas desde x0, limitada a [lo, hi].
 * Un arrastre de al menos DRAG_MIN casillas siempre avanza (como mínimo una) hacia donde se tiró;
 * si la pieza es de hielo (`kind === 'ice'`), patina hasta el tope (lo o hi) en esa dirección.
 */
export function snapDrag(x0, lo, hi, delta, kind) {
  const clamp = (v) => Math.max(lo, Math.min(hi, v));
  const cur = clamp(x0 + delta);
  if (Math.abs(cur - x0) < DRAG_MIN) return x0;
  if (kind === 'ice') return delta > 0 ? hi : lo;
  return clamp(delta > 0 ? Math.max(x0 + 1, Math.round(cur)) : Math.min(x0 - 1, Math.round(cur)));
}
