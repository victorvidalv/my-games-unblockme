import { N } from './board.js';
import { analyze } from './solver.js';
import { mulberry32 } from './rng.js';

/**
 * Piezas especiales que se añaden a un tablero del banco:
 *   gates – una pieza pasa a ser candado con su placa;
 *   heavy – una pieza pasa a ser pesada (avanza de a una casilla);
 *   mixed – ambas, sobre un tablero que ya lleva muros (familia «walls», generada aparte).
 * minGain = cuántos movimientos más debe costar la solución respecto al tablero sin decorar:
 * así el elemento especial IMPORTA (si no cambiara la solución, sería un adorno sin sentido).
 * Los muros no se añaden aquí: un tablero normal ya está tan apretado que un muro suelto casi siempre lo
 * deja sin solución, así que los tableros con muros se generan desde cero (generateBoard con `walls`).
 */
export const FAMILIES = {
  gates: { gate: 1, minGain: 1 },
  heavy: { heavy: 1, minGain: 1 },
  mixed: { gate: 1, heavy: 1, minGain: 2, base: 'walls' },
};

/** Celdas por las que puede pasar alguna pieza (sus carriles), saltando la pieza `skip`. */
function laneCells(pieces, skip = -1) {
  const cells = new Set();
  pieces.forEach((p, i) => {
    if (i === skip) return;
    for (let k = 0; k < N; k++) cells.add(p.o === 'h' ? p.fix * N + k : k * N + p.fix);
  });
  return cells;
}

/**
 * Añade un candado y/o una pieza pesada a `board` ({pieces,pos,walls}) y comprueba con el solver que:
 *  - sigue teniendo solución desde la misma posición inicial,
 *  - cuesta al menos `minGain` movimientos más que sin decorar.
 * Devuelve {pieces, pos, walls, plain, opt} o null si no lo consigue en `tries` intentos. Determinista por semilla.
 */
export function decorateBoard(board, family, seed, { tries = 60 } = {}) {
  const spec = FAMILIES[family];
  if (!spec) throw new Error(`Familia desconocida: ${family}`);
  const rng = mulberry32(seed);
  const walls = board.walls || [];
  const plainAn = analyze(board.pieces, board.pos, 600000, walls);
  if (!plainAn) return null;
  const plain = plainAn.dist.get(plainAn.k0);
  const n = board.pieces.length;
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  for (let t = 0; t < tries; t++) {
    const pieces = board.pieces.map((p) => ({ ...p }));
    const used = new Set([0]);
    if (spec.heavy) {
      const cand = [];
      for (let i = 1; i < n; i++) if (pieces[i].len === 2) cand.push(i);
      if (!cand.length) continue;
      const i = pick(cand);
      pieces[i].kind = 'heavy';
      used.add(i);
    }
    if (spec.gate) {
      const cand = [];
      for (let i = 1; i < n; i++) if (!used.has(i)) cand.push(i);
      if (!cand.length) continue;
      const i = pick(cand);
      const lanes = laneCells(pieces, i);            // la placa debe poder ser cubierta por OTRA pieza
      const wallSet = new Set(walls.map(([r, c]) => r * N + c));
      const options = [];
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const onGateLane = pieces[i].o === 'h' ? r === pieces[i].fix : c === pieces[i].fix; // nunca en el carril del candado
          if (!onGateLane && lanes.has(r * N + c) && !wallSet.has(r * N + c)) options.push([r, c]);
        }
      }
      if (!options.length) continue;
      pieces[i].kind = 'gate';
      pieces[i].plate = pick(options);
    }
    const an = analyze(pieces, board.pos, 600000, walls);
    if (!an) continue;
    const opt = an.dist.get(an.k0);
    if (opt === undefined || opt < plain + spec.minGain) continue;
    return { pieces, pos: board.pos.slice(), walls, plain, opt };
  }
  return null;
}
