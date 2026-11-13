import { describe, it, expect } from 'vitest';
import {
  N, WALL, encode, encodeBoard, decodeBoard, isValidState, occupancy, slideRange, isLocked, snapDrag,
  expand, hintMove, minMoves, randomBoard, mutate, generateBoard, decorateBoard, FAMILIES,
  mulberry32, isWon,
} from '../src/engine/index.js';
import { checkBoard } from './helpers.js';

/** Red en fila 2, una vertical que lleva a la salida cerrada por un muro. */
const RED = { o: 'h', len: 2, fix: 2 };

describe('muros', () => {
  it('un muro bloquea el paso: la llave no puede atravesarlo', () => {
    const pieces = [RED];
    expect(minMoves(pieces, [0])).toBe(1);
    expect(slideRange(pieces, [0], 0, [[2, 3]])).toEqual([0, 1]);
    expect(minMoves(pieces, [0], [[2, 4]])).toBeNull(); // muro en la salida: sin solución
  });
  it('los muros cuentan como celdas ocupadas y no se puede colocar una pieza encima', () => {
    const g = occupancy([RED], [0], [[0, 0], [5, 5]]);
    expect(g[0]).toBe(WALL);
    expect(g[5 * N + 5]).toBe(WALL);
    expect(isValidState([RED], [0], [[2, 1]])).toBe(false);
    expect(isValidState([RED], [0], [[2, 3]])).toBe(true);
  });
  it('rodear un muro cuesta movimientos: la distancia sube', () => {
    const pieces = [RED, { o: 'v', len: 2, fix: 3 }];
    const open = minMoves(pieces, [0, 0]);
    const walled = minMoves(pieces, [0, 0], [[3, 3]]);
    expect(walled).toBeGreaterThanOrEqual(open);
  });
});

describe('candado con placa', () => {
  // La llave (fila 2) está bloqueada por un candado vertical en la columna 3 (filas 1-2).
  // La placa (5,0) solo la puede cubrir la pieza horizontal de la fila 5.
  const pieces = [RED, { o: 'v', len: 2, fix: 3, kind: 'gate', plate: [5, 0] }, { o: 'h', len: 2, fix: 5 }];
  it('cerrado: no se mueve; abierto (placa cubierta): sí', () => {
    const closed = [0, 1, 3];                     // la horizontal en columnas 3-4: la placa (5,0) está libre
    expect(isLocked(pieces, closed, 1)).toBe(true);
    expect(slideRange(pieces, closed, 1)).toEqual([1, 1]);
    const open = [0, 1, 0];                       // la horizontal cubre columnas 0-1 → cubre la placa
    expect(isLocked(pieces, open, 1)).toBe(false);
    expect(slideRange(pieces, open, 1)[1]).toBeGreaterThan(1);
  });
  it('la solución obliga a abrir el candado primero', () => {
    expect(minMoves(pieces, [0, 1, 3])).toBe(3); // placa, mover candado, sacar la llave
    const h = hintMove(pieces, [0, 1, 3]);
    expect(h.i).toBe(2);                          // la primera pista es cubrir la placa
  });
  it('mover el candado no cambia la placa, así que todo movimiento es reversible', () => {
    const open = [0, 1, 0];
    const g = new Int8Array(N * N);
    const pos = new Array(3).fill(0);
    expand(pieces, encode(open), pos, g, (i, y, nk) => {
      const back = [];
      expand(pieces, nk, new Array(3).fill(0), new Int8Array(N * N), (j, z, bk) => back.push(bk));
      expect(back).toContain(encode(open));
    });
  });
});

describe('pieza pesada', () => {
  it('solo avanza una casilla por movimiento (la llave pesada tarda más)', () => {
    const light = [RED];
    expect(minMoves(light, [0])).toBe(1);
    const heavy = [{ ...RED, kind: 'heavy' }];
    expect(slideRange(heavy, [0], 0)).toEqual([0, 1]);
    expect(minMoves(heavy, [0])).toBe(4);       // de la columna 0 a la 4, de una en una
    expect(snapDrag(0, ...slideRange(heavy, [0], 0), 3)).toBe(1);
  });
});

describe('formato de texto', () => {
  it('los muros, candados y pesadas sobreviven a codificar y decodificar', () => {
    const pieces = [RED, { o: 'v', len: 3, fix: 2, kind: 'gate', plate: [4, 5] }, { o: 'h', len: 2, fix: 0, kind: 'heavy' }];
    const text = encodeBoard(pieces, [1, 0, 3], [[5, 0], [3, 3]]);
    expect(text).toContain('g4.5');
    expect(text).toContain('#5.0');
    expect(decodeBoard(text)).toEqual({ pieces, pos: [1, 0, 3], walls: [[5, 0], [3, 3]] });
  });
  it('un texto ilegible da un error claro', () => {
    expect(() => decodeBoard('h2.2.x')).toThrow(/ilegible/);
  });
});

describe('generador con muros y decoración', () => {
  it('genera tableros con muros que importan y cumplen todas las propiedades', () => {
    for (const rating of [10, 30, 50]) {
      const b = generateBoard(rating, 1000 + rating, { walls: 3, maxIters: 1500 });
      expect(b.walls.length).toBeGreaterThan(0);
      expect(b.reached, `dif ${rating} alcanza el objetivo`).toBe(true);
      expect(checkBoard(b, `muros ${rating}`)).toBeGreaterThan(10);
    }
  }, 120000);

  it('mutate conserva los muros y no toca candados ni pesadas', () => {
    const b = generateBoard(25, 77, { walls: 3, maxIters: 800 });
    const d = decorateBoard(b, 'mixed', 5) ?? b;
    const rng = mulberry32(3);
    for (let t = 0; t < 30; t++) {
      const m = mutate(d, rng, 0.3);
      if (!m) continue;
      expect(m.walls).toEqual(d.walls);
      d.pieces.forEach((p, i) => { if (p.kind) expect(m.pieces[i]).toEqual(p); });
      expect(isValidState(m.pieces, m.pos, m.walls)).toBe(true);
    }
  }, 60000);

  it('decorar añade candado/pesada que importan (cuestan movimientos extra) y respeta las reglas', () => {
    for (const rating of [12, 30, 55]) {
      const base = generateBoard(rating, 4000 + rating, { maxIters: 1500 });
      for (const family of ['gates', 'heavy']) {
        const d = decorateBoard(base, family, 9);
        if (!d) continue; // en algún tablero muy apretado puede no haber forma; el script lo deja vacío
        expect(d.opt, `${family} ${rating}`).toBeGreaterThanOrEqual(d.plain + FAMILIES[family].minGain);
        const gate = d.pieces.find((p) => p.kind === 'gate');
        if (gate) {
          const onLane = gate.o === 'h' ? gate.plate[0] === gate.fix : gate.plate[1] === gate.fix;
          expect(onLane, 'la placa nunca está en el carril del candado').toBe(false);
        }
        expect(checkBoard(d, `${family} ${rating}`)).toBeGreaterThan(5);
      }
    }
  }, 120000);

  it('la llave roja nunca es candado ni pesada', () => {
    const base = generateBoard(20, 11, { maxIters: 800 });
    for (const family of ['gates', 'heavy']) {
      const d = decorateBoard(base, family, 3);
      if (d) expect(d.pieces[0].kind).toBeUndefined();
    }
  });
  it('un tablero aleatorio con muros no coloca piezas encima de los muros', () => {
    for (let s = 1; s <= 30; s++) {
      const b = randomBoard(mulberry32(s), 6, 0.3, 3);
      expect(isValidState(b.pieces, b.pos, b.walls)).toBe(true);
    }
  });
  it('isWon sigue funcionando con la llave en la salida', () => {
    expect(isWon([4])).toBe(true);
  });
});
