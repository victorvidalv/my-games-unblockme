import { expect } from 'vitest';
import { N, decode, isValidState, analyze, expand, slideRange, snapDrag, DRAG_MIN } from '../src/engine/index.js';

/** Todas las propiedades que el juego necesita, comprobadas sobre un tablero concreto. */
export function checkBoard(board, label) {
  const { pieces, pos, walls } = board;
  const hasIce = pieces.some((p) => p.kind === 'ice');
  expect(isValidState(pieces, pos, walls), `${label}: estado inicial válido`).toBe(true);
  const an = analyze(pieces, pos, 600000, walls);
  expect(an, `${label}: con solución`).not.toBeNull();
  if (hasIce) expect(an.dist.size, `${label}: cero estados sin salida`).toBe(an.list.length);
  const g = new Int8Array(N * N);
  const tmp = new Array(pieces.length).fill(0);
  let checked = 0;
  for (const k of an.list.slice(0, 500)) {
    const d = an.dist.get(k);
    const here = decode(k, pieces.length);
    const ranges = pieces.map((_, i) => slideRange(pieces, here, i, walls));
    expect(isValidState(pieces, here, walls), `${label}: estado alcanzable válido`).toBe(true);
    let moves = 0;
    let hasStepCloser = false;
    expand(pieces, k, tmp, g, (i, y, nk) => {
      moves++;
      const nd = an.dist.get(nk);
      expect(nd, `${label}: vecino resoluble`).not.toBeUndefined();
      expect(nd, `${label}: nunca mejora más de 1`).toBeGreaterThanOrEqual(d - 1);
      if (nd === d - 1) hasStepCloser = true;
      const [lo, hi] = ranges[i];
      if (pieces[i].kind === 'ice') {
        expect(y === lo || y === hi, `${label}: hielo solo va a tope`).toBe(true);
      }
      if (!hasIce) {
        expect(Math.abs(nd - d), `${label}: vecinos a ≤1`).toBeLessThanOrEqual(1);
      }
      if (pieces[i].kind !== 'ice' || here[i] === lo || here[i] === hi) {
        const back = [];
        expand(pieces, nk, new Array(pieces.length).fill(0), new Int8Array(N * N), (j, z, bk) => back.push(bk), walls);
        expect(back, `${label}: movimiento reversible`).toContain(k);
      }
    }, walls);
    expect(moves, `${label}: nunca sin movimientos`).toBeGreaterThan(0);
    if (d > 0) expect(hasStepCloser, `${label}: existe jugada óptima`).toBe(true);
    // la interfaz y el solver coinciden en qué se puede mover
    pieces.forEach((p, i) => {
      const [lo, hi] = ranges[i];
      expect(lo <= here[i] && here[i] <= hi).toBe(true);
      if (p.kind === 'ice') {
        if (hi > here[i]) expect(snapDrag(here[i], lo, hi, DRAG_MIN + 0.1, 'ice')).toBe(hi);
        if (lo < here[i]) expect(snapDrag(here[i], lo, hi, -(DRAG_MIN + 0.1), 'ice')).toBe(lo);
      }
    });
    checked++;
  }
  return checked;
}

