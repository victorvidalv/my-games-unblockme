import { describe, it, expect } from 'vitest';
import bank from '../src/data/levels.json';
import special from '../src/data/special.json';
import { decodeBoard, minMoves, maxDistance, analyze, curve, minReach, isValidState, N } from '../src/engine/index.js';
import { checkBoard } from './helpers.js';

const FAMILIES = ['walls', 'gates', 'heavy', 'mixed'];
const RATINGS = Array.from({ length: 100 }, (_, i) => i + 1);

/** Quita muros, candados y pesadas: el mismo tablero «normal» para comparar. */
const stripped = (b) => ({ pieces: b.pieces.map(({ o, len, fix }) => ({ o, len, fix })), pos: b.pos, walls: [] });

describe('banco de tableros especiales', () => {
  it('hay tableros de cada familia en (casi) todas las dificultades que se usan', () => {
    for (const f of FAMILIES) {
      expect(special[f], f).toHaveLength(100);
      const have = RATINGS.filter((r) => special[f][r - 1].length > 0).length;
      // los muros (y el mixto, que parte de ellos) no se logran por encima de la dificultad 85: ahí se usa otra familia
      expect(have, `${f}: dificultades con tableros`).toBeGreaterThanOrEqual(f === 'walls' || f === 'mixed' ? 80 : 95);
    }
  });

  it('cada tablero especial es válido, tiene solución y alcanza el mínimo de su dificultad', () => {
    for (const f of FAMILIES) {
      for (const rating of RATINGS) {
        for (const text of special[f][rating - 1]) {
          const b = decodeBoard(text);
          expect(isValidState(b.pieces, b.pos, b.walls), `${f} ${rating} válido`).toBe(true);
          const an = analyze(b.pieces, b.pos, 600000, b.walls);
          expect(an, `${f} ${rating} con solución`).not.toBeNull();
          // el mínimo exigido baja un poco más para los tableros con muros (son más caros de encontrar)
          expect(maxDistance(an), `${f} ${rating} alcanza ${minReach(rating) - 2}`).toBeGreaterThanOrEqual(minReach(rating) - 2);
          expect(b.pieces[0].kind, 'la llave roja nunca es especial').toBeUndefined();
        }
      }
    }
  }, 600000);

  it('el elemento especial IMPORTA: sin él la solución sería más corta', () => {
    for (const f of FAMILIES) {
      for (const rating of RATINGS.filter((r) => r % 7 === 0)) {
        for (const text of special[f][rating - 1]) {
          const b = decodeBoard(text);
          const withIt = minMoves(b.pieces, b.pos, b.walls);
          const without = stripped(b);
          expect(withIt, `${f} ${rating}`).toBeGreaterThan(minMoves(without.pieces, without.pos, []) ?? 0);
        }
      }
    }
  }, 300000);

  it('seguridad total: movimientos reversibles, jamás sin movimientos, vecinos a ≤1 y rangos del tablero = rangos del solver', () => {
    let boards = 0;
    for (const f of FAMILIES) {
      for (const rating of RATINGS.filter((r) => r % 9 === 0)) {
        for (const text of special[f][rating - 1].slice(0, 3)) {
          checkBoard(decodeBoard(text), `${f} ${rating}`);
          boards++;
        }
      }
    }
    expect(boards).toBeGreaterThan(40);
  }, 600000);

  it('el candado tiene su placa fuera de su carril y la placa no cae sobre un muro', () => {
    for (const f of ['gates', 'mixed']) {
      for (const rating of RATINGS) {
        for (const text of special[f][rating - 1]) {
          const b = decodeBoard(text);
          for (const p of b.pieces) {
            if (p.kind !== 'gate') continue;
            expect(p.o === 'h' ? p.plate[0] === p.fix : p.plate[1] === p.fix, `${f} ${rating}`).toBe(false);
            expect(b.walls.some(([r, c]) => r === p.plate[0] && c === p.plate[1])).toBe(false);
            expect(p.plate[0] < N && p.plate[1] < N).toBe(true);
          }
        }
      }
    }
  }, 120000);

  it('cada familia contiene realmente lo que promete', () => {
    for (const rating of RATINGS) {
      for (const t of special.walls[rating - 1]) expect(decodeBoard(t).walls.length).toBeGreaterThan(0);
      for (const t of special.gates[rating - 1]) expect(decodeBoard(t).pieces.some((p) => p.kind === 'gate')).toBe(true);
      for (const t of special.heavy[rating - 1]) expect(decodeBoard(t).pieces.some((p) => p.kind === 'heavy')).toBe(true);
      for (const t of special.mixed[rating - 1]) {
        const b = decodeBoard(t);
        expect(b.walls.length > 0 && b.pieces.some((p) => p.kind === 'gate') && b.pieces.some((p) => p.kind === 'heavy')).toBe(true);
      }
    }
  }, 120000);

  it('los tableros normales del banco siguen alcanzando el objetivo de la nueva curva', () => {
    for (const rating of RATINGS) {
      for (const text of bank.ratings[rating - 1]) {
        const b = decodeBoard(text);
        expect(maxDistance(analyze(b.pieces, b.pos, 600000)), `normal ${rating}`).toBeGreaterThanOrEqual(minReach(rating));
        expect(b.pieces.length - 1).toBeLessThanOrEqual(curve(rating).others);
      }
    }
  }, 600000);
});
