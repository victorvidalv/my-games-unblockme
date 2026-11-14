import { describe, it, expect, beforeAll } from 'vitest';
import bank from '../src/data/levels.json';
import {
  isValidState, analyze, maxDistance, minReach, MAX_LEVEL, pickBoard, varyBoard, encodeBoard, calcGain, moveLimit, moveStatus,
} from '../src/engine/index.js';
import { runPool, FULL } from './parallel/pool.js';

// La validación del banco está en bank.test.js; aquí se construyen niveles como lo hace el juego, repartidos en hilos.
const RATINGS = Array.from({ length: 100 }, (_, i) => i + 1);
const STARTS = [1, 50, 75];
const SEED = 77;

describe('variantes: cada partida tiene tableros distintos', () => {
  it('varyBoard conserva solución y mínimo objetivo, es determinista y cambia el tablero', () => {
    for (const rating of FULL ? [1, 15, 30, 45, 60] : [1, 30, 60]) {
      const base = pickBoard(bank.ratings, rating, 1, rating);
      const seen = new Set();
      for (let seed = 1; seed <= 4; seed++) {
        const v = varyBoard(base, rating, seed);
        expect(isValidState(v.pieces, v.pos)).toBe(true);
        const an = analyze(v.pieces, v.pos, 600000);
        expect(an).not.toBeNull();
        expect(maxDistance(an), `dif ${rating}`).toBeGreaterThanOrEqual(minReach(rating));
        expect(encodeBoard(v.pieces, v.pos)).toBe(encodeBoard(...Object.values(varyBoard(base, rating, seed))));
        seen.add(encodeBoard(v.pieces, v.pos));
      }
      expect(seen.size, `dif ${rating}: variantes distintas`).toBeGreaterThanOrEqual(2);
    }
  }, 120000);
});


describe('construcción de niveles (mínimos exactos)', () => {
  let builds = [];
  beforeAll(async () => {
    const ratings = FULL ? RATINGS : RATINGS.filter((r) => r % 3 === 1 || r > 95);
    builds = await runPool('build', ratings.map((rating) => ({ rating })), { batch: 2 });
  }, 300000);

  it('el mínimo anunciado es el real y respeta ajuste adaptativo y ruta aventurera', () => {
    expect(builds.length).toBeGreaterThan(30);
    for (const b of builds) {
      for (const r of b.rows) {
        const id = `dif ${b.rating} adj ${r.adj} brave ${r.brave}`;
        expect(r.valid, id).toBe(true);
        expect(r.won0, `${id}: no puede empezar ganado`).toBe(false);
        expect(r.real, id).toBe(r.opt);
        expect(r.opt, id).toBe(r.expected);
      }
    }
  });

  it('sin ajuste, el mínimo es el objetivo de la curva (hasta 3 menos en las dificultades más altas)', () => {
    for (const b of builds) {
      expect(b.plainOpt, `dif ${b.rating}`).toBeLessThanOrEqual(b.target);
      expect(b.plainOpt, `dif ${b.rating}`).toBeGreaterThanOrEqual(b.minReach);
    }
  });
});

/** Ajuste adaptativo de un jugador perfecto: +1 por nivel hasta 1 (niveles < 10) o 2 después. */
const adjFor = (level) => {
  let adj = 0;
  for (let l = 1; l < level; l++) adj = Math.min(l < 10 ? 1 : 2, adj + 1);
  return adj;
};

describe('partida completa simulada (3 caminos × 100 niveles, con piezas especiales y hielo)', () => {
  const jobs = STARTS.flatMap((start) => Array.from({ length: MAX_LEVEL }, (_, i) => ({ start, level: i + 1, seed: SEED, adj: adjFor(i + 1) })));
  let sim = [];
  beforeAll(async () => {
    sim = await runPool('level', jobs.sort((a, b) => b.level - a.level), { batch: 3 });
  }, 600000);
  const path = (start) => sim.filter((r) => r.start === start).sort((a, b) => a.level - b.level);

  for (const start of STARTS) {
    it(`camino que empieza en dificultad ${start}: jugando perfecto se gana siempre con el mínimo`, () => {
      const levels = path(start);
      expect(levels).toHaveLength(MAX_LEVEL);
      let streak = 0;
      let fallbacks = 0;
      for (const r of levels) {
        const id = `nivel ${r.level} dif ${r.rating}`;
        if (r.family === 'plain' && r.planFamily !== 'plain') fallbacks++;
        // la pieza especial prometida está presente (salvo que el banco no tuviera esa familia y se usara otra)
        if (r.family === 'walls') expect(r.walls, id).toBeGreaterThan(0);
        if (r.family === 'gates') expect(r.kinds, id).toContain('gate');
        if (r.family === 'heavy') expect(r.kinds, id).toContain('heavy');
        if (r.family === 'ice') expect(r.kinds, id).toContain('ice');
        if (r.family === 'duo') expect(r.kinds.length, id).toBe(2);
        if (r.family === 'mixed') { expect(r.walls, id).toBeGreaterThan(0); expect(r.kinds, id).toEqual(['gate', 'heavy', 'ice']); }
        // dificultad prevista: ±3 del objetivo (+2 de margen en los tableros con muros)
        expect(r.opt, id).toBeGreaterThanOrEqual(Math.max(1, r.target - 5));
        expect(r.opt, id).toBeLessThanOrEqual(r.target + 3 + 2);
        expect(r.valid, id).toBe(true);
        expect(r.won0, `${id}: no empieza ganado`).toBe(false);
        expect(r.solvable, id).toBe(true);
        expect(r.deadEnds, `${id}: sin callejones`).toBe(0);
        // jugando perfecto se gana con el mínimo anunciado: ningún nivel queda atascado
        expect(r.optReal, id).toBe(r.opt);
        expect(r.moves, id).toBe(r.opt);
        expect(moveStatus(r.moves, moveLimit(r.opt, start))).not.toBe('over');
        expect(calcGain(r.rating, r.moves, r.opt, streak).eff).toBe(1);
        streak++;
      }
      expect(fallbacks, 'niveles que tuvieron que usar un tablero normal por falta de la familia').toBeLessThanOrEqual(4);
    });
  }

  it('el aprendizaje funciona: los 9 primeros niveles de Normal son normales y suaves', () => {
    for (const r of path(1).slice(0, 9)) {
      expect(r.planFamily).toBe('plain');
      expect(r.walls).toBe(0);
      expect(r.kinds).toEqual([]);
      expect(r.opt).toBeLessThanOrEqual(6 + 2);
    }
  });

  it('todos los niveles 10 de ciudad tienen su familia y dificultad normal', () => {
    for (const start of STARTS) {
      for (let level = 10; level <= 100; level += 10) {
        const r = path(start)[level - 1];
        expect(r.boss).toBeUndefined();
        expect(r.opt).toBeLessThanOrEqual(r.target + 3 + 2);
      }
    }
  });

  it('la dificultad percibida real crece a lo largo de cada camino (mínimo medio por tramos de 10 niveles)', () => {
    for (const start of STARTS) {
      let prev = 0;
      for (let block = 0; block < 10; block++) {
        const avg = path(start).slice(block * 10, block * 10 + 10).reduce((a, r) => a + r.opt, 0) / 10;
        expect(avg, `camino ${start}, tramo ${block + 1}`).toBeGreaterThanOrEqual(prev - 0.6);
        prev = avg;
      }
    }
  });

  it('en Normal, a partir del nivel 30 el mínimo medio ya exige pensar (≥ 10) y al final es desafiante (≥ 30)', () => {
    const avg = (from, to) => path(1).slice(from - 1, to).reduce((a, r) => a + r.opt, 0) / (to - from + 1);
    expect(avg(30, 39)).toBeGreaterThanOrEqual(10);
    expect(avg(91, 100)).toBeGreaterThanOrEqual(30);
  });
});
