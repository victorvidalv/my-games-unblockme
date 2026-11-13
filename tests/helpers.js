import { expect } from 'vitest';
import { N, decode, isValidState, analyze, expand, slideRange } from '../src/engine/index.js';

/** Todas las propiedades que el juego necesita, comprobadas sobre un tablero concreto. */
export function checkBoard(board, label) {
  const { pieces, pos, walls } = board;
  expect(isValidState(pieces, pos, walls), `${label}: estado inicial válido`).toBe(true);
  const an = analyze(pieces, pos, 600000, walls);
  expect(an, `${label}: con solución`).not.toBeNull();
  const g = new Int8Array(N * N);
  const tmp = new Array(pieces.length).fill(0);
  let checked = 0;
  for (const k of an.list.slice(0, 500)) {
    const d = an.dist.get(k);
    const here = decode(k, pieces.length);
    expect(isValidState(pieces, here, walls), `${label}: estado alcanzable válido`).toBe(true);
    let moves = 0;
    expand(pieces, k, tmp, g, (i, y, nk) => {
      moves++;
      expect(Math.abs(an.dist.get(nk) - d), `${label}: vecinos a ≤1`).toBeLessThanOrEqual(1);
      const back = [];
      expand(pieces, nk, new Array(pieces.length).fill(0), new Int8Array(N * N), (j, z, bk) => back.push(bk), walls);
      expect(back, `${label}: movimiento reversible`).toContain(k);
    }, walls);
    expect(moves, `${label}: nunca sin movimientos`).toBeGreaterThan(0);
    // la interfaz y el solver coinciden en qué se puede mover
    pieces.forEach((p, i) => {
      const [lo, hi] = slideRange(pieces, here, i, walls);
      expect(lo <= here[i] && here[i] <= hi).toBe(true);
    });
    checked++;
  }
  return checked;
}

