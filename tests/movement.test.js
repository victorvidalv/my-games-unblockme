import { describe, it, expect } from 'vitest';
import bank from '../src/data/levels.json';
import {
  N, decodeBoard, decode, isValidState, slideRange, snapDrag, DRAG_MIN, expand, analyze,
  buildLevel, mulberry32, curve, minReach,
} from '../src/engine/index.js';

/** Para cada pieza, el rango [mín, máx] que resulta de los movimientos que permite el solver. */
function solverRanges(pieces, pos) {
  const key = pos.reduce((k, x, i) => k + x * 8 ** i, 0);
  const lo = pos.slice();
  const hi = pos.slice();
  expand(pieces, key, new Array(pieces.length).fill(0), new Int8Array(N * N), (i, y) => {
    lo[i] = Math.min(lo[i], y);
    hi[i] = Math.max(hi[i], y);
  });
  return pieces.map((_, i) => [lo[i], hi[i]]);
}

describe('movilidad de las piezas', () => {
  it('el rango que usa la interfaz para arrastrar coincide exactamente con los movimientos del solver', () => {
    for (const rating of [1, 10, 25, 40, 60, 80, 100]) {
      const board = decodeBoard(bank.ratings[rating - 1][0]);
      const lvl = buildLevel(board, { rating, rng: mulberry32(rating) });
      const an = analyze(lvl.pieces, lvl.pos, 600000);
      for (const k of an.list.slice(0, 400)) {
        const pos = decode(k, lvl.pieces.length);
        const expected = solverRanges(lvl.pieces, pos);
        lvl.pieces.forEach((_, i) => expect(slideRange(lvl.pieces, pos, i), `dif ${rating} pieza ${i}`).toEqual(expected[i]));
      }
    }
  });

  it('cualquier casilla dentro del rango es un estado válido (nunca se solapan piezas al soltar)', () => {
    for (const rating of [5, 35, 65, 95]) {
      const board = decodeBoard(bank.ratings[rating - 1][1]);
      const lvl = buildLevel(board, { rating, rng: mulberry32(9) });
      lvl.pieces.forEach((_, i) => {
        const [lo, hi] = slideRange(lvl.pieces, lvl.pos, i);
        for (let x = lo; x <= hi; x++) {
          const pos = lvl.pos.slice();
          pos[i] = x;
          expect(isValidState(lvl.pieces, pos), `dif ${rating} pieza ${i} → ${x}`).toBe(true);
        }
      });
    }
  });

  it('en ningún estado alcanzable el jugador se queda sin movimientos (siempre hay una pieza que se mueve)', () => {
    for (const rating of [1, 20, 50, 80, 100]) {
      for (const slot of [0, 5]) {
        const lvl = buildLevel(decodeBoard(bank.ratings[rating - 1][slot]), { rating, rng: mulberry32(slot) });
        const an = analyze(lvl.pieces, lvl.pos, 600000);
        const g = new Int8Array(N * N);
        const pos = new Array(lvl.pieces.length).fill(0);
        for (const k of an.list.slice(0, 600)) {
          let moves = 0;
          expand(lvl.pieces, k, pos, g, () => moves++);
          expect(moves, `dif ${rating} estado ${k}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('el estado inicial de cada dificultad tiene al menos una pieza que se puede mover y la llave roja sale en el mínimo anunciado', () => {
    for (let rating = 1; rating <= 100; rating += 3) {
      const lvl = buildLevel(decodeBoard(bank.ratings[rating - 1][2]), { rating, rng: mulberry32(rating) });
      const movable = lvl.pieces.filter((_, i) => { const [lo, hi] = slideRange(lvl.pieces, lvl.pos, i); return hi > lo; });
      expect(movable.length, `dif ${rating}`).toBeGreaterThan(0);
      expect(lvl.opt).toBeLessThanOrEqual(curve(rating).target);
      expect(lvl.opt).toBeGreaterThanOrEqual(minReach(rating)); // en las dificultades más altas el banco admite hasta 3 menos
    }
  });
});

describe('arrastre: snapDrag', () => {
  it('un arrastre corto (≥ 0.3 casillas) ya mueve la pieza una casilla; menos de eso la deja', () => {
    expect(snapDrag(2, 0, 4, 0.31)).toBe(3);
    expect(snapDrag(2, 0, 4, -0.31)).toBe(1);
    expect(snapDrag(2, 0, 4, 0.29)).toBe(2);
    expect(snapDrag(2, 0, 4, -0.29)).toBe(2);
    expect(DRAG_MIN).toBe(0.3);
  });
  it('nunca sale del rango libre aunque se arrastre mucho', () => {
    expect(snapDrag(2, 1, 3, 10)).toBe(3);
    expect(snapDrag(2, 1, 3, -10)).toBe(1);
  });
  it('si la pieza está bloqueada por ambos lados no se mueve', () => {
    expect(snapDrag(2, 2, 2, 3)).toBe(2);
    expect(snapDrag(2, 2, 2, -3)).toBe(2);
  });
  it('respeta el redondeo normal en arrastres largos y siempre avanza en la dirección del arrastre', () => {
    for (let x0 = 0; x0 <= 4; x0++) for (let lo = 0; lo <= x0; lo++) for (let hi = x0; hi <= 4; hi++) {
      for (let d = -5; d <= 5; d += 0.1) {
        const r = snapDrag(x0, lo, hi, d);
        expect(r).toBeGreaterThanOrEqual(lo);
        expect(r).toBeLessThanOrEqual(hi);
        if (d > 0) expect(r).toBeGreaterThanOrEqual(x0);
        if (d < 0) expect(r).toBeLessThanOrEqual(x0);
        if (Math.abs(d) >= DRAG_MIN + 1e-9 && ((d > 0 && hi > x0) || (d < 0 && lo < x0))) expect(r).not.toBe(x0);
      }
    }
  });
});
