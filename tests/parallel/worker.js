/**
 * Hilo de trabajo de los tests: recibe lotes {task, from, items} y devuelve los resultados.
 * Cada tarea hace TODO el análisis de un tablero/nivel de una sola vez (un único BFS) y devuelve un resumen
 * de números y listas de violaciones: los tests solo comparan ese resumen.
 */
import { parentPort } from 'node:worker_threads';
import { readFileSync } from 'node:fs';
import {
  N, decode, decodeBoard, isValidState, analyze, expand, slideRange, maxDistance, isWon, curve, minReach, rateAt, pickBoard,
  buildLevel, varyBoard, mulberry32, hash32, WINDOW, generateBoard, decorateBoard, FAMILIES, hintMove, moveLimit,
} from '../../src/engine/index.js';
import { levelPlan } from '../../src/game/mechanics.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const bank = read('../../src/data/levels.json');
const special = read('../../src/data/special.json');

const kindsOf = (pieces) => [...new Set(pieces.map((p) => p.kind).filter(Boolean))].sort();
const stripped = (b) => ({ pieces: b.pieces.map(({ o, len, fix }) => ({ o, len, fix })), pos: b.pos, walls: [] });
const MAXV = 6; // violaciones que se guardan por tablero (basta para diagnosticar)

/**
 * Propiedades de seguridad sobre una muestra de estados alcanzables (los `sample` más repartidos):
 * vecinos resolubles, ±1 de distancia (sin hielo), reversibilidad, nunca sin movimientos, siempre hay jugada
 * que acerca a la salida, rangos del tablero = rangos del solver, el hielo solo va a los topes.
 */
function checkStates(b, an, sample) {
  const { pieces, walls } = b;
  const n = pieces.length;
  const hasIce = pieces.some((p) => p.kind === 'ice');
  const v = [];
  const bad = (m) => { if (v.length < MAXV) v.push(m); };
  const g = new Int8Array(N * N);
  const tmp = new Array(n).fill(0);
  const g2 = new Int8Array(N * N);
  const tmp2 = new Array(n).fill(0);
  const step = Math.max(1, Math.floor(an.list.length / sample));
  let checked = 0;
  for (let s = 0; s < an.list.length; s += step) {
    const k = an.list[s];
    const d = an.dist.get(k);
    const here = decode(k, n);
    checked++;
    if (!isValidState(pieces, here, walls)) bad(`estado inválido ${k}`);
    if (d === undefined) { bad(`estado sin salida ${k}`); continue; }
    const ranges = pieces.map((_, i) => slideRange(pieces, here, i, walls));
    let moves = 0;
    let closer = false;
    expand(pieces, k, tmp, g, (i, y, nk) => {
      moves++;
      const nd = an.dist.get(nk);
      if (nd === undefined) return bad(`vecino sin solución ${k}→${nk}`);
      if (nd < d - 1) bad(`mejora más de 1 (${d}→${nd})`);
      if (nd === d - 1) closer = true;
      if (!hasIce && nd > d + 1) bad(`vecino a más de 1 (${d}→${nd})`);
      const [lo, hi] = ranges[i];
      if (y < lo || y > hi) bad(`pieza ${i} fuera de su rango`);
      if (pieces[i].kind === 'ice' && y !== lo && y !== hi) bad('hielo se detiene a medias');
      if (pieces[i].kind !== 'ice' || here[i] === lo || here[i] === hi) {
        let back = false;
        expand(pieces, nk, tmp2, g2, (j, z, bk) => { if (bk === k) back = true; }, walls);
        if (!back) bad(`movimiento irreversible ${k}→${nk}`);
      }
    }, walls);
    if (!moves) bad(`sin movimientos en ${k}`);
    if (d > 0 && !closer) bad(`sin jugada óptima en ${k}`);
    if (v.length >= MAXV) break;
  }
  return { violations: v, checked };
}

const tasks = {
  /** Resumen completo de un tablero del banco: {text, rating, family, strip?:true, sample?:n}. */
  board({ text, rating, strip = false, sample = 60 }) {
    const b = decodeBoard(text);
    const r = {
      rating, kinds: kindsOf(b.pieces), walls: b.walls.length, pieces: b.pieces.length,
      valid: isValidState(b.pieces, b.pos, b.walls), keyPlain: b.pieces[0].kind === undefined,
      keyOk: b.pieces[0].o === 'h' && b.pieces[0].len === 2 && b.pieces[0].fix === 2,
      platesOk: true, violations: [],
    };
    for (const p of b.pieces) {
      if (p.kind !== 'gate') continue;
      const inLane = p.o === 'h' ? p.plate[0] === p.fix : p.plate[1] === p.fix;
      const onWall = b.walls.some(([wr, wc]) => wr === p.plate[0] && wc === p.plate[1]);
      if (inLane || onWall || p.plate[0] >= N || p.plate[1] >= N) r.platesOk = false;
    }
    const an = r.valid ? analyze(b.pieces, b.pos, 600000, b.walls) : null;
    r.solvable = !!an;
    if (!an) return r;
    r.states = an.list.length;
    r.deadEnds = an.list.length - an.dist.size;
    r.maxD = maxDistance(an);
    r.opt = an.dist.get(an.k0);
    if (sample > 0) Object.assign(r, checkStates(b, an, sample));
    if (strip) {
      const s = stripped(b);
      const sa = analyze(s.pieces, s.pos, 600000, []);
      r.plainOpt = sa ? sa.dist.get(sa.k0) : null;
    }
    return r;
  },

  /** Nivel tal como lo construye el juego; juega óptimo con UNA sola búsqueda y devuelve el resumen. */
  level({ start, level, seed, adj = 0 }) {
    const rating = rateAt(start, level);
    const plan = levelPlan(level);
    const base = pickBoard(bank.ratings, rating, seed, level, plan.family, special);
    const board = varyBoard(base, rating, hash32(seed, level, 7));
    const lvl = buildLevel(board, { rating, adj, brave: false, rng: mulberry32(level) });
    const walls = lvl.walls || [];
    const an = analyze(lvl.pieces, lvl.pos, 600000, walls);
    const out = {
      start, level, rating, planFamily: plan.family, family: base.family, boss: plan.boss, opt: lvl.opt,
      target: curve(rating).target, kinds: kindsOf(lvl.pieces), walls: walls.length,
      valid: isValidState(lvl.pieces, lvl.pos, walls), won0: isWon(lvl.pos), solvable: !!an, deadEnds: 0, optReal: null, moves: -1,
    };
    if (!an) return out;
    out.deadEnds = an.list.length - an.dist.size;
    out.optReal = an.dist.get(an.k0);
    const tmp = new Array(lvl.pieces.length).fill(0);
    const g = new Int8Array(N * N);
    let key = an.k0;
    let moves = 0;
    while (an.dist.get(key) > 0 && moves < 500) {
      const d = an.dist.get(key);
      let nxt = null;
      expand(lvl.pieces, key, tmp, g, (i, y, nk) => { if (nxt === null && an.dist.get(nk) === d - 1) nxt = nk; }, walls);
      if (nxt === null) break;
      key = nxt;
      moves++;
    }
    out.moves = moves;
    return out;
  },

  /** buildLevel con todos los ajustes adaptativos y rutas para una dificultad. */
  build({ rating }) {
    const target = curve(rating).target;
    const board = pickBoard(bank.ratings, rating, 123, rating);
    const maxd = maxDistance(analyze(board.pieces, board.pos, 600000));
    const lo = Math.max(1, Math.min(target, maxd) - WINDOW);
    const hi = Math.min(maxd, Math.max(target, lo) + WINDOW);
    const clamp = (x) => Math.max(lo, Math.min(hi, x));
    const rows = [];
    for (const adj of [-2, -1, 0, 1, 2]) {
      for (const brave of [false, true]) {
        const lvl = buildLevel(board, { rating, adj, brave, rng: mulberry32(adj + 9) });
        const an = analyze(lvl.pieces, lvl.pos, 600000);
        const normal = clamp(Math.max(1, target + adj));
        rows.push({
          adj, brave, opt: lvl.opt, real: an?.dist.get(an.k0), valid: isValidState(lvl.pieces, lvl.pos), won0: isWon(lvl.pos),
          expected: brave ? (normal < hi ? normal + 1 : normal) : normal,
        });
      }
    }
    const plain = buildLevel(pickBoard(bank.ratings, rating, 5, 1), { rating, rng: mulberry32(rating) });
    return { rating, target, minReach: minReach(rating), rows, plainOpt: plain.opt };
  },
  /**
   * Generador completo desde cero: tablero base (con o sin muros) y cada familia decorada encima.
   * Cada combinación se comprueba entera (estados, reversibilidad, que el elemento importe) y se juega con pistas hasta ganar.
   */
  generate({ rating, walls, seed, families, sample = 40 }) {
    const base = generateBoard(rating, seed, { walls, maxIters: walls ? 1500 : 1000 });
    const out = { rating, walls, seed, baseWalls: base.walls.length, baseReached: base.reached, combos: [] };
    const combos = [['base', base], ...families.map((f) => [f, decorateBoard(base, f, seed * 31 + rating)])];
    for (const [family, d] of combos) {
      if (!d) { out.combos.push({ family, missing: true }); continue; }
      const an = analyze(d.pieces, d.pos, 600000, d.walls || []);
      const c = { family, kinds: kindsOf(d.pieces), walls: (d.walls || []).length, keyPlain: d.pieces[0].kind === undefined, valid: isValidState(d.pieces, d.pos, d.walls || []), solvable: !!an, violations: [] };
      if (an) {
        c.deadEnds = an.list.length - an.dist.size;
        c.opt = an.dist.get(an.k0);
        c.plain = d.plain;
        c.minGain = FAMILIES[family]?.minGain ?? 0;
        Object.assign(c, checkStates({ pieces: d.pieces, walls: d.walls || [] }, an, sample));
        // nivel construido sobre ese tablero: mínimo exacto, límite = 2×, y la pista lleva a la salida en `opt` pasos
        const lvl = buildLevel({ ...d, walls: d.walls || [] }, { rating, adj: 0, brave: rating % 2 === 1, rng: mulberry32(rating) });
        const la = analyze(lvl.pieces, lvl.pos, 600000, lvl.walls);
        c.lvlOpt = lvl.opt;
        c.lvlReal = la?.dist.get(la.k0);
        c.limitOk = moveLimit(lvl.opt) === lvl.opt * 2;
        let cur = lvl.pos.slice();
        let hintOk = true;
        for (let st = 0; st < lvl.opt; st++) {
          const h = hintMove(lvl.pieces, cur, lvl.walls);
          if (!h || h.left !== lvl.opt - st) { hintOk = false; break; }
          cur[h.i] = h.to;
        }
        c.hintWins = hintOk && isWon(cur);
      }
      out.combos.push(c);
    }
    return out;
  },
};

parentPort.on('message', ({ task, from, items }) => {
  try {
    parentPort.postMessage({ from, results: items.map((it) => tasks[task](it)) });
  } catch (e) {
    parentPort.postMessage({ error: `${task}: ${e.stack || e}` });
  }
});
