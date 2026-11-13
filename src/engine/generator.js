import { mulberry32 } from './rng.js';
import { randomBoard, mutate } from './board.js';
import { analyze, maxDistance } from './solver.js';
import { curve, minReach } from './difficulty.js';

/**
 * Genera un tablero para una dificultad por escalada de colina: parte de un tablero aleatorio
 * y va cambiando una pieza mientras la distancia máxima a la victoria no empeore.
 *
 * Es DETERMINISTA: el presupuesto se mide en iteraciones (no en milisegundos), así que la misma
 * semilla produce el mismo tablero en cualquier dispositivo.
 *
 * @param {number} rating   dificultad 1-100
 * @param {number} seed     semilla
 * @param {object} [opts]
 * @param {number} [opts.goalIters=60]    iteraciones para buscar margen extra (target+3)
 * @param {number} [opts.maxIters=20000]  tope duro de iteraciones
 * @param {number} [opts.walls=0]         muros sueltos que lleva el tablero (familia «muros»)
 * @returns {{pieces, pos, maxd, target, reached:boolean, iters:number}}
 *   pos = estado más lejano de la victoria encontrado; reached = maxd >= target.
 */
export function generateBoard(rating, seed, { goalIters = 60, maxIters = 20000, walls: wallCount = 0 } = {}) {
  const c = curve(rating);
  const floor = minReach(rating);
  const goal = c.target + 3;
  const rng = mulberry32(seed);
  let cur = null;
  let curM = -1;
  let best = null;
  let stall = 0;
  let iters = 0;
  while (iters < maxIters) {
    iters++;
    if (!cur) {
      const b = randomBoard(rng, c.others, c.pLong, wallCount);
      const an = analyze(b.pieces, b.pos, 300000, b.walls);
      if (an) {
        cur = b;
        curM = maxDistance(an);
        cur.farthest = farthest(an, b.pieces.length);
      }
    } else {
      const b = mutate(cur, rng, c.pLong);
      const an = b && analyze(b.pieces, b.pos, 300000, b.walls);
      if (an) {
        const m = maxDistance(an);
        if (m > curM) stall = 0;
        else stall++;
        if (m >= curM) {
          cur = b;
          curM = m;
          cur.farthest = farthest(an, b.pieces.length);
        }
      } else stall++;
      if (stall > 70) {
        cur = null;
        stall = 0;
      }
    }
    if (cur && (!best || curM > best.maxd)) best = { pieces: cur.pieces, pos: cur.farthest, walls: cur.walls || [], maxd: curM };
    if (best && best.maxd >= goal) break;
    if (best && best.maxd >= floor && iters >= goalIters) break;
  }
  return { ...best, target: c.target, reached: best.maxd >= floor, iters };
}

/** Estado de la componente con mayor distancia a la victoria. */
function farthest(an, n) {
  let bk = an.k0;
  let bd = -1;
  for (const [k, d] of an.dist) {
    if (d > bd) {
      bd = d;
      bk = k;
    }
  }
  const pos = [];
  for (let i = 0, v = bk; i < n; i++, v = Math.floor(v / 8)) pos.push(v % 8);
  return pos;
}
