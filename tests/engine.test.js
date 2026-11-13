import { describe, it, expect } from 'vitest';
import {
  N, WIN_POS, encode, decode, encodeBoard, decodeBoard, isValidState, randomBoard,
  analyze, hintMove, minMoves, maxDistance, expand,
  curve, rateAt, moveLimit, MAX_LEVEL,
  generateBoard, mulberry32, calcGain, gainFor, baseScore, moveStatus, movesLeft, isWon,
} from '../src/engine/index.js';

/** Tablero mínimo: llave roja sola → 1 movimiento (un arrastre largo hasta la salida). */
const solo = { pieces: [{ o: 'h', len: 2, fix: 2 }], pos: [0] };

/** Un coche vertical de largo 3 tapa la salida: hay que moverlo antes → 2 movimientos. */
const blocked = {
  pieces: [{ o: 'h', len: 2, fix: 2 }, { o: 'v', len: 3, fix: 4 }],
  pos: [0, 1], // ocupa filas 1-3 de la columna 4
};

/** Primer tablero aleatorio que tiene solución (algunos tableros al azar no la tienen). */
function solvable(rng, others, pLong) {
  for (;;) {
    const b = randomBoard(rng, others, pLong);
    const an = analyze(b.pieces, b.pos);
    if (an) return { b, an };
  }
}

describe('solver', () => {
  it('cuenta un arrastre largo como un solo movimiento', () => {
    expect(minMoves(solo.pieces, solo.pos)).toBe(1);
  });
  it('calcula 2 movimientos cuando hay que apartar un bloque', () => {
    expect(minMoves(blocked.pieces, blocked.pos)).toBe(2);
  });
  it('un estado ya ganado tiene distancia 0 y no da pista', () => {
    expect(minMoves(solo.pieces, [WIN_POS])).toBe(0);
    expect(hintMove(solo.pieces, [WIN_POS])).toBeNull();
  });
  it('la pista siempre acorta la distancia en exactamente 1', () => {
    const h = hintMove(blocked.pieces, blocked.pos);
    expect(h.left).toBe(2);
    const next = blocked.pos.slice();
    next[h.i] = h.to;
    expect(minMoves(blocked.pieces, next)).toBe(1);
  });
  it('detecta tableros sin solución: una columna entera bloqueada', () => {
    const stuck = {
      pieces: [{ o: 'h', len: 2, fix: 2 }, { o: 'v', len: 3, fix: 2 }, { o: 'v', len: 3, fix: 2 }],
      pos: [0, 0, 3], // dos verticales de 3 llenan la columna 2 y no pueden moverse
    };
    expect(isValidState(stuck.pieces, stuck.pos)).toBe(true);
    expect(analyze(stuck.pieces, stuck.pos)).toBeNull();
    expect(minMoves(stuck.pieces, stuck.pos)).toBeNull();
  });
  it('los vecinos de un estado son simétricos (se puede volver con 1 movimiento)', () => {
    const rng = mulberry32(7);
    const { b, an } = solvable(rng, 8, 0.3);
    const g = new Int8Array(N * N);
    const pos = new Array(b.pieces.length).fill(0);
    for (const k of an.list.slice(0, 200)) {
      expand(b.pieces, k, pos, g, (i, y, nk) => {
        const back = [];
        expand(b.pieces, nk, new Array(b.pieces.length).fill(0), g, (j, z, bk) => back.push(bk));
        expect(back).toContain(k);
      });
    }
  });
  it('la distancia de cada vecino difiere como máximo en 1 (BFS exacto)', () => {
    const { b, an } = solvable(mulberry32(3), 7, 0.2);
    const g = new Int8Array(N * N);
    const pos = new Array(b.pieces.length).fill(0);
    for (const k of an.list.slice(0, 300)) {
      const d = an.dist.get(k);
      expand(b.pieces, k, pos, g, (i, y, nk) => {
        expect(Math.abs(an.dist.get(nk) - d)).toBeLessThanOrEqual(1);
      });
    }
  });
  it('seguir la pista desde cualquier estado llega a la victoria en `distancia` movimientos', () => {
    const { b, an } = solvable(mulberry32(11), 8, 0.3);
    const far = an.list.filter((k) => an.dist.get(k) >= 3).slice(0, 5);
    for (const k of far) {
      let pos = decode(k, b.pieces.length);
      const d0 = an.dist.get(k);
      let steps = 0;
      while (!isWon(pos)) {
        const h = hintMove(b.pieces, pos);
        pos = pos.slice();
        pos[h.i] = h.to;
        expect(isValidState(b.pieces, pos)).toBe(true);
        steps++;
        expect(steps).toBeLessThanOrEqual(d0);
      }
      expect(steps).toBe(d0);
    }
  });
});

describe('codificación', () => {
  it('encode/decode son inversos', () => {
    expect(decode(encode([3, 0, 5, 1]), 4)).toEqual([3, 0, 5, 1]);
  });
  it('encodeBoard/decodeBoard son inversos', () => {
    const b = randomBoard(mulberry32(5), 9, 0.3);
    expect(decodeBoard(encodeBoard(b.pieces, b.pos))).toEqual({ ...b, walls: [] });
  });
  it('randomBoard produce tableros válidos con la llave roja en la fila de salida', () => {
    for (let s = 1; s <= 50; s++) {
      const b = randomBoard(mulberry32(s), 3 + (s % 11), 0.3);
      expect(isValidState(b.pieces, b.pos)).toBe(true);
      expect(b.pieces[0]).toEqual({ o: 'h', len: 2, fix: 2 });
    }
  });
});

describe('dificultad', () => {
  it('rateAt sube linealmente de la dificultad inicial a 100', () => {
    for (const start of [1, 50, 75]) {
      expect(rateAt(start, 1)).toBe(start);
      expect(rateAt(start, MAX_LEVEL)).toBe(100);
      for (let l = 2; l <= MAX_LEVEL; l++) expect(rateAt(start, l)).toBeGreaterThanOrEqual(rateAt(start, l - 1));
    }
  });
  it('los movimientos objetivo crecen con la dificultad (tutorial suave → 37)', () => {
    expect(curve(1).target).toBe(2);
    expect(curve(10).target).toBeLessThanOrEqual(3);
    expect(curve(20).target).toBe(6);
    expect(curve(30).target).toBe(11);
    expect(curve(50).target).toBe(19);
    expect(curve(75).target).toBe(29);
    expect(curve(100).target).toBe(37);
    for (let r = 2; r <= 100; r++) {
      expect(curve(r).target).toBeGreaterThanOrEqual(curve(r - 1).target);
      expect(curve(r).others).toBeGreaterThanOrEqual(curve(r - 1).others);
    }
  });
  it('el límite de movimientos es el doble del mínimo', () => {
    expect(moveLimit(7)).toBe(14);
  });
});

describe('generador', () => {
  it('es determinista: misma semilla, mismo tablero', () => {
    const a = generateBoard(30, 4242);
    const b = generateBoard(30, 4242);
    expect(encodeBoard(a.pieces, a.pos)).toBe(encodeBoard(b.pieces, b.pos));
    expect(a.maxd).toBe(b.maxd);
  }, 120000);
  it('alcanza el mínimo objetivo y el estado devuelto está a esa distancia', () => {
    for (const rating of [1, 8, 20, 28]) {
      const g = generateBoard(rating, 1000 + rating);
      expect(g.reached).toBe(true);
      expect(g.maxd).toBeGreaterThanOrEqual(g.target);
      expect(minMoves(g.pieces, g.pos)).toBe(g.maxd);
      expect(maxDistance(analyze(g.pieces, g.pos))).toBe(g.maxd);
    }
  }, 120000);
});

describe('puntaje y límite de movimientos', () => {
  it('mínimo exacto = perfecto (+20%)', () => {
    const g = calcGain(1, 5, 5, 0);
    expect(g.eff).toBe(1);
    expect(g.perfect).toBe(Math.round(baseScore(1) * 0.2));
  });
  it('al doble del mínimo no hay puntos', () => {
    expect(calcGain(10, 10, 5, 0).pts).toBe(0);
  });
  it('la racha multiplica hasta ×1.5', () => {
    expect(calcGain(10, 4, 4, 0).mult).toBeCloseTo(1.1);
    expect(calcGain(10, 4, 4, 99).mult).toBeCloseTo(1.5);
  });
  it('la ruta aventurera suma un 10%', () => {
    const base = gainFor(10, 4, 4, 0).total;
    expect(gainFor(10, 4, 4, 0, { brave: true }).total).toBe(base + Math.round(base * 0.1));
  });
  it('estado del contador: ok → aviso → último → eliminado', () => {
    expect(moveStatus(3, 10)).toBe('ok');
    expect(moveStatus(8, 10)).toBe('warn');
    expect(moveStatus(10, 10)).toBe('last');
    expect(moveStatus(11, 10)).toBe('over');
    expect(movesLeft(7, 10)).toBe(3);
    expect(movesLeft(12, 10)).toBe(0);
  });
});
