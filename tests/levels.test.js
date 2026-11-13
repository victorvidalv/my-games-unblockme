import { describe, it, expect } from 'vitest';
import bank from '../src/data/levels.json';
import {
  N, decodeBoard, isValidState, analyze, maxDistance, minMoves, expand, isWon,
  curve, rateAt, moveLimit, MAX_LEVEL, WINDOW, pickBoard, buildLevel, varyBoard, encodeBoard, mulberry32, calcGain, moveStatus,
} from '../src/engine/index.js';

const RATINGS = Array.from({ length: 100 }, (_, i) => i + 1);

describe('banco de tableros', () => {
  it('tiene tableros para las 100 dificultades', () => {
    expect(bank.ratings).toHaveLength(100);
    for (const list of bank.ratings) expect(list.length).toBeGreaterThanOrEqual(8);
  });

  it('cada tablero es válido, tiene solución y alcanza el mínimo objetivo de su dificultad', () => {
    for (const rating of RATINGS) {
      const target = curve(rating).target;
      for (const text of bank.ratings[rating - 1]) {
        const { pieces, pos } = decodeBoard(text);
        expect(isValidState(pieces, pos), `dif ${rating} inválido`).toBe(true);
        expect(pieces[0]).toEqual({ o: 'h', len: 2, fix: 2 });
        expect(pieces.length, `dif ${rating} nº de piezas`).toBeLessThanOrEqual(curve(rating).others + 1);
        const an = analyze(pieces, pos, 600000);
        expect(an, `dif ${rating} sin solución`).not.toBeNull();
        expect(maxDistance(an), `dif ${rating} no llega a ${target}`).toBeGreaterThanOrEqual(target);
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
      const target = curve(rating).target;
      const base = pickBoard(bank.ratings, rating, 1, rating);
      const seen = new Set();
      for (let seed = 1; seed <= 6; seed++) {
        const v = varyBoard(base, rating, seed);
        expect(isValidState(v.pieces, v.pos)).toBe(true);
        const an = analyze(v.pieces, v.pos, 600000);
        expect(an).not.toBeNull();
        expect(maxDistance(an), `dif ${rating}`).toBeGreaterThanOrEqual(target);
        expect(encodeBoard(v.pieces, v.pos)).toBe(encodeBoard(...Object.values(varyBoard(base, rating, seed))));
        seen.add(encodeBoard(v.pieces, v.pos));
      }
      expect(seen.size, `dif ${rating}: variantes distintas`).toBeGreaterThanOrEqual(4);
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

  it('sin ajuste, el mínimo es exactamente el objetivo de la curva', () => {
    for (const rating of RATINGS) {
      const board = pickBoard(bank.ratings, rating, 5, 1);
      const lvl = buildLevel(board, { rating, rng: mulberry32(rating) });
      expect(lvl.opt).toBe(curve(rating).target);
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
  const an = analyze(lvl.pieces, lvl.pos, 600000);
  const pos = new Array(lvl.pieces.length).fill(0);
  const g = new Int8Array(N * N);
  let key = an.k0;
  let moves = 0;
  while (an.dist.get(key) > 0) {
    const d = an.dist.get(key);
    let next = null;
    expand(lvl.pieces, key, pos, g, (i, y, nk) => {
      if (next === null && an.dist.get(nk) === d - 1) next = nk;
    });
    key = next;
    moves++;
  }
  return moves;
}

describe('partida completa simulada (3 caminos × 100 niveles)', () => {
  for (const start of [1, 50, 75]) {
    it(`camino que empieza en dificultad ${start}: jugando perfecto se gana siempre con el mínimo`, () => {
      let streak = 0;
      let adj = 0;
      for (let level = 1; level <= MAX_LEVEL; level++) {
        const rating = rateAt(start, level);
        const lvl = buildLevel(varyBoard(pickBoard(bank.ratings, rating, 77, level), rating, level), { rating, adj, rng: mulberry32(level) });
        const moves = playOptimally(lvl);
        expect(moves, `nivel ${level}`).toBe(lvl.opt);
        expect(moveStatus(moves, moveLimit(lvl.opt)), 'el mínimo nunca está en riesgo de eliminación').not.toBe('over');
        const gain = calcGain(rating, moves, lvl.opt, streak);
        expect(gain.eff).toBe(1);
        expect(gain.perfect).toBeGreaterThan(0);
        streak++;
        adj = Math.min(level < 10 ? 1 : 2, adj + 1); // jugador perfecto: el ajuste adaptativo sube hasta su tope
      }
    }, 600000);
  }
});
