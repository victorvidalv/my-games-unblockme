import { describe, it, expect } from 'vitest';
import bank from '../src/data/levels.json';
import special from '../src/data/special.json';
import { levelPlan, BOSS_BOOST } from '../src/game/mechanics.js';
import {
  N, decodeBoard, isValidState, analyze, maxDistance, minMoves, expand, isWon,
  curve, minReach, rateAt, moveLimit, MAX_LEVEL, WINDOW, pickBoard, buildLevel, varyBoard, encodeBoard, mulberry32, hash32, calcGain, moveStatus,
} from '../src/engine/index.js';

const RATINGS = Array.from({ length: 100 }, (_, i) => i + 1);

describe('banco de tableros', () => {
  it('tiene tableros para las 100 dificultades', () => {
    expect(bank.ratings).toHaveLength(100);
    for (const list of bank.ratings) expect(list.length).toBeGreaterThanOrEqual(8);
  });

  it('cada tablero es válido, tiene solución y alcanza el mínimo objetivo de su dificultad', () => {
    for (const rating of RATINGS) {
      for (const text of bank.ratings[rating - 1]) {
        const { pieces, pos } = decodeBoard(text);
        expect(isValidState(pieces, pos), `dif ${rating} inválido`).toBe(true);
        expect(pieces[0]).toEqual({ o: 'h', len: 2, fix: 2 });
        expect(pieces.length, `dif ${rating} nº de piezas`).toBeLessThanOrEqual(curve(rating).others + 1);
        const an = analyze(pieces, pos, 600000);
        expect(an, `dif ${rating} sin solución`).not.toBeNull();
        expect(maxDistance(an), `dif ${rating} no llega a ${minReach(rating)}`).toBeGreaterThanOrEqual(minReach(rating));
      }
    }
  }, 120000);

  it('casi no hay tableros repetidos dentro de una misma dificultad (las variantes añaden el resto)', () => {
    for (const list of bank.ratings) expect(new Set(list).size).toBeGreaterThanOrEqual(10);
  });
});

describe('variantes: cada partida tiene tableros distintos', () => {
  it('varyBoard conserva solución y mínimo objetivo, es determinista y cambia el tablero', () => {
    for (const rating of [1, 15, 30, 45, 60]) {
      const base = pickBoard(bank.ratings, rating, 1, rating);
      const seen = new Set();
      for (let seed = 1; seed <= 6; seed++) {
        const v = varyBoard(base, rating, seed);
        expect(isValidState(v.pieces, v.pos)).toBe(true);
        const an = analyze(v.pieces, v.pos, 600000);
        expect(an).not.toBeNull();
        expect(maxDistance(an), `dif ${rating}`).toBeGreaterThanOrEqual(minReach(rating));
        expect(encodeBoard(v.pieces, v.pos)).toBe(encodeBoard(...Object.values(varyBoard(base, rating, seed))));
        seen.add(encodeBoard(v.pieces, v.pos));
      }
      expect(seen.size, `dif ${rating}: variantes distintas`).toBeGreaterThanOrEqual(3);
    }
  }, 120000);
});

describe('construcción de niveles (mínimos exactos)', () => {
  it('el mínimo anunciado es el real y respeta ajuste adaptativo y ruta aventurera', () => {
    for (const rating of RATINGS) {
      const target = curve(rating).target;
      const board = pickBoard(bank.ratings, rating, 123, rating);
      const maxd = maxDistance(analyze(board.pieces, board.pos, 600000));
      const lo = Math.max(1, Math.min(target, maxd) - WINDOW);
      const hi = Math.min(maxd, Math.max(target, lo) + WINDOW);
      const clamp = (v) => Math.max(lo, Math.min(hi, v));
      for (const adj of [-2, -1, 0, 1, 2]) {
        for (const brave of [false, true]) {
          const lvl = buildLevel(board, { rating, adj, brave, rng: mulberry32(adj + 9) });
          expect(isValidState(lvl.pieces, lvl.pos)).toBe(true);
          expect(isWon(lvl.pos), 'no puede empezar ganado').toBe(false);
          expect(minMoves(lvl.pieces, lvl.pos), `dif ${rating} adj ${adj}`).toBe(lvl.opt);
          const normal = clamp(Math.max(1, target + adj));
          const expected = brave ? (normal < hi ? normal + 1 : normal) : normal;
          expect(lvl.opt, `dif ${rating} adj ${adj} brave ${brave}`).toBe(expected);
        }
      }
    }
  }, 120000);

  it('sin ajuste, el mínimo es el objetivo de la curva (hasta 3 menos en las dificultades más altas)', () => {
    for (const rating of RATINGS) {
      const board = pickBoard(bank.ratings, rating, 5, 1);
      const lvl = buildLevel(board, { rating, rng: mulberry32(rating) });
      expect(lvl.opt).toBeLessThanOrEqual(curve(rating).target);
      expect(lvl.opt).toBeGreaterThanOrEqual(minReach(rating));
    }
  }, 120000);

  it('la dificultad percibida (mínimo medio) crece a lo largo de cada camino', () => {
    for (const start of [1, 50, 75]) {
      let prev = 0;
      for (let block = 0; block < 10; block++) {
        let sum = 0;
        for (let l = block * 10 + 1; l <= block * 10 + 10; l++) {
          const r = rateAt(start, l);
          sum += buildLevel(pickBoard(bank.ratings, r, 9, l), { rating: r, rng: mulberry32(l) }).opt;
        }
        expect(sum / 10, `camino ${start}, bloque ${block + 1}`).toBeGreaterThanOrEqual(prev);
        prev = sum / 10;
      }
    }
  }, 120000);
});

/** Juega un nivel de forma óptima: siempre el vecino con distancia − 1. Devuelve los movimientos usados. */
function playOptimally(lvl) {
  const walls = lvl.walls || [];
  const an = analyze(lvl.pieces, lvl.pos, 600000, walls);
  const pos = new Array(lvl.pieces.length).fill(0);
  const g = new Int8Array(N * N);
  let key = an.k0;
  let moves = 0;
  while (an.dist.get(key) > 0) {
    const d = an.dist.get(key);
    let next = null;
    expand(lvl.pieces, key, pos, g, (i, y, nk) => {
      if (next === null && an.dist.get(nk) === d - 1) next = nk;
    }, walls);
    key = next;
    moves++;
  }
  return moves;
}

/** Construye el nivel tal como lo hace el juego: familia según la ciudad, variante, jefe más difícil. */
function makeLevel(start, level, seed, adj = 0, brave = false) {
  const rating = rateAt(start, level);
  const plan = levelPlan(level);
  const base = pickBoard(bank.ratings, rating, seed, level, plan.family, special);
  const board = varyBoard(base, rating, hash32(seed, level, 7));
  const lvl = buildLevel(board, { rating, adj, brave, boost: plan.boss ? BOSS_BOOST : 0, rng: mulberry32(level) });
  return { rating, plan, base, lvl };
}

describe('partida completa simulada (3 caminos × 100 niveles, con piezas especiales y jefes)', () => {
  for (const start of [1, 50, 75]) {
    it(`camino que empieza en dificultad ${start}: jugando perfecto se gana siempre con el mínimo`, () => {
      let streak = 0;
      let adj = 0;
      let fallbacks = 0;
      for (let level = 1; level <= MAX_LEVEL; level++) {
        const { rating, plan, base, lvl } = makeLevel(start, level, 77, adj);
        if (base.family === 'plain' && plan.family !== 'plain') fallbacks++;
        const target = curve(rating).target;
        // la pieza especial prometida está presente (salvo que el banco no tuviera esa familia y se usara otra)
        if (base.family === 'walls') expect(lvl.walls.length, `nivel ${level}`).toBeGreaterThan(0);
        if (base.family === 'gates') expect(lvl.pieces.some((p) => p.kind === 'gate'), `nivel ${level}`).toBe(true);
        if (base.family === 'heavy') expect(lvl.pieces.some((p) => p.kind === 'heavy'), `nivel ${level}`).toBe(true);
        // la dificultad es la prevista (±3 del objetivo + ajuste + jefe)
        // los tableros con muros del banco admiten hasta 2 movimientos menos que el objetivo (más el margen de ±3)
        expect(lvl.opt, `nivel ${level} dif ${rating}`).toBeGreaterThanOrEqual(Math.max(1, target - 5));
        expect(lvl.opt, `nivel ${level} dif ${rating}`).toBeLessThanOrEqual(target + 3 + (plan.boss ? BOSS_BOOST : 0) + 2);
        expect(isValidState(lvl.pieces, lvl.pos, lvl.walls), `nivel ${level}`).toBe(true);
        expect(isWon(lvl.pos), 'no empieza ganado').toBe(false);
        // jugando perfecto se gana con el mínimo anunciado: ningún nivel queda atascado
        const moves = playOptimally(lvl);
        expect(moves, `nivel ${level}`).toBe(lvl.opt);
        expect(minMoves(lvl.pieces, lvl.pos, lvl.walls), `nivel ${level}`).toBe(lvl.opt);
        expect(moveStatus(moves, moveLimit(lvl.opt))).not.toBe('over');
        const gain = calcGain(rating, moves, lvl.opt, streak);
        expect(gain.eff).toBe(1);
        streak++;
        adj = Math.min(level < 10 ? 1 : 2, adj + 1);
      }
      expect(fallbacks, 'niveles que tuvieron que usar un tablero normal por falta de la familia').toBeLessThanOrEqual(4);
    }, 600000);
  }

  it('el aprendizaje funciona: los 5 primeros niveles de Normal son normales y pequeños', () => {
    for (let level = 1; level <= 5; level++) {
      const { plan, lvl } = makeLevel(1, level, 1);
      expect(plan.family).toBe('plain');
      expect(lvl.walls).toEqual([]);
      expect(lvl.pieces.every((p) => !p.kind)).toBe(true);
      expect(lvl.opt).toBeLessThanOrEqual(5);
    }
  }, 60000);

  it('sin jefes: ningún nivel lleva dificultad extra ni bono de jefe', () => {
    for (const start of [1, 50, 75]) {
      for (let level = 10; level <= 100; level += 10) {
        const { plan, lvl, rating } = makeLevel(start, level, 5);
        expect(plan.boss).toBe(false);
        expect(lvl.opt).toBeLessThanOrEqual(curve(rating).target + 3 + 2);
      }
    }
  }, 300000);

  it('la dificultad percibida real crece a lo largo de cada camino (mínimo medio por tramos de 10 niveles)', () => {
    for (const start of [1, 50, 75]) {
      let prev = 0;
      for (let block = 0; block < 10; block++) {
        let sum = 0;
        for (let l = block * 10 + 1; l <= block * 10 + 10; l++) sum += makeLevel(start, l, 9).lvl.opt;
        const avg = sum / 10;
        expect(avg, `camino ${start}, tramo ${block + 1}`).toBeGreaterThanOrEqual(prev - 0.6);
        prev = avg;
      }
    }
  }, 600000);

  it('en Normal, a partir del nivel 30 el mínimo medio ya exige pensar (≥ 10) y al final es desafiante (≥ 30)', () => {
    const avg = (from, to) => {
      let sum = 0;
      for (let l = from; l <= to; l++) sum += makeLevel(1, l, 3).lvl.opt;
      return sum / (to - from + 1);
    };
    expect(avg(30, 39)).toBeGreaterThanOrEqual(10);
    expect(avg(91, 100)).toBeGreaterThanOrEqual(30);
  }, 300000);
});
