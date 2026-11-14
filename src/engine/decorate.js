import { N } from './board.js';
import { analyze } from './solver.js';
import { mulberry32 } from './rng.js';

/**
 * Piezas especiales que se añaden a un tablero del banco:
 *   gates – una pieza pasa a ser candado con su placa;
 *   heavy – una pieza pasa a ser pesada (avanza de a una casilla);
 *   ice   – una pieza pasa a ser de hielo (patina hasta el tope sin parar a medias);
 *   mixed – combina muros + candado + pesada + hielo sobre un tablero de la familia «walls».
 * minGain = cuántos movimientos más debe costar la solución respecto al tablero sin decorar:
 * así el elemento especial IMPORTA (si no cambiara la solución, sería un adorno sin sentido).
 * Además, si lleva hielo se exige cero callejones sin salida (an.dist.size === an.list.length),
 * garantizando que el jugador nunca quede atrapado sin solución desde ningún estado alcanzable.
 */
export const FAMILIES = {
  gates: { gate: 1, minGain: 1 },
  heavy: { heavy: 1, minGain: 1 },
  ice:   { ice: 1, minGain: 1 },
  duo:   { duo: 1, minGain: 2 },
  mixed: { gate: 1, heavy: 1, ice: 1, minGain: 2, base: 'walls' },
};

const DUO_PAIRS = [['heavy', 'ice'], ['gate', 'ice'], ['gate', 'heavy']];

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
export function decorateBoard(board, family, seed, { tries, minOpt = 0 } = {}) {
  const spec = FAMILIES[family];
  if (!spec) throw new Error(`Familia desconocida: ${family}`);
  const rng = mulberry32(seed);
  const walls = board.walls || [];
  const plainAn = analyze(board.pieces, board.pos, 600000, walls);
  if (!plainAn) return null;
  const plain = plainAn.dist.get(plainAn.k0);
  const targetOpt = Math.max(plain + spec.minGain, minOpt);
  const cap = Math.min(600000, Math.max(120000, plainAn.list.length * 2));
  const n = board.pieces.length;
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const attempts = tries ?? (spec.ice ? 90 : spec.duo ? 75 : 48);

  for (let t = 0; t < attempts; t++) {
    const pieces = board.pieces.map((p) => ({ ...p }));
    const used = new Set([0]);
    const pair = spec.duo ? DUO_PAIRS[(seed + t) % DUO_PAIRS.length] : null;
    const useHeavy = spec.heavy || pair?.includes('heavy');
    const useIce = spec.ice || pair?.includes('ice');
    const useGate = spec.gate || pair?.includes('gate');
    if (useHeavy) {
      const cand = [];
      for (let i = 1; i < n; i++) if (pieces[i].len === 2) cand.push(i);
      if (!cand.length) continue;
      const i = pick(cand);
      pieces[i].kind = 'heavy';
      used.add(i);
    }
    if (useIce) {
      const count = spec.ice ? (t < attempts / 3 ? 1 : t < (attempts * 2) / 3 ? 2 : 3) : 1;
      let cand = [];
      for (let i = 1; i < n; i++) if (!used.has(i)) cand.push(i);
      if (!cand.length) continue;
      for (let m = 0; m < count && cand.length; m++) {
        const idx = Math.floor(rng() * cand.length);
        const i = cand[idx];
        pieces[i].kind = 'ice';
        used.add(i);
        cand.splice(idx, 1);
      }
    }
    if (useGate) {
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
    const an = analyze(pieces, board.pos, cap, walls);
    if (!an) continue;
    if (useIce && an.dist.size < an.list.length) continue; // cero callejones sin salida alcanzables
    const opt = an.dist.get(an.k0);
    if (opt === undefined || opt < targetOpt) continue;
    return { pieces, pos: board.pos.slice(), walls, plain, opt };
  }
  return null;
}
