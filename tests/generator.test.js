import { describe, it, expect, beforeAll } from 'vitest';
import { runPool, FULL } from './parallel/pool.js';

/**
 * El generador de tableros probado desde cero, en paralelo: para cada dificultad × (con/sin muros) × semilla se genera
 * un tablero base y se decora con TODAS las familias (candado, pesada, hielo, dúo, mezcla). Cada combinación debe cumplir:
 * válida, con solución, sin callejones, movimientos reversibles, el elemento IMPORTA, nivel con mínimo exacto y pista ganadora.
 */
const FAMILIES = ['gates', 'heavy', 'ice', 'duo', 'mixed'];
const RATINGS = FULL ? [3, 8, 14, 20, 28, 36, 45, 55, 65, 75, 85] : [6, 18, 32, 50, 70];
const SEEDS = FULL ? [1, 2, 3] : [1, 2];

const jobs = [];
for (const rating of RATINGS) for (const walls of [0, 3]) for (const seed of SEEDS) jobs.push({ rating, walls, seed, families: FAMILIES, sample: FULL ? 120 : 40 });
jobs.sort((a, b) => b.rating - a.rating);

let runs = [];
const combos = () => runs.flatMap((r) => r.combos.filter((c) => !c.missing).map((c) => ({ ...c, rating: r.rating, walls0: r.walls, seed: r.seed })));

beforeAll(async () => {
  runs = await runPool('generate', jobs, { batch: 1 });
}, 600000);

describe('generador: todas las combinaciones de piezas', () => {
  it('el tablero base se genera (con muros si se piden) y alcanza el objetivo', () => {
    for (const r of runs) {
      // los tableros con muros a dificultad alta son caros: el banco los genera aparte (hasta ~85) con más intentos
      if (!r.walls || r.rating <= 50) expect(r.baseReached, `dif ${r.rating} muros ${r.walls}`).toBe(true);
      if (r.walls) expect(r.baseWalls, `dif ${r.rating}`).toBeGreaterThan(0);
      else expect(r.baseWalls).toBe(0);
    }
  });

  it('cada familia se consigue decorar en la mayoría de bases (si no, el juego usa otra familia del banco)', () => {
    for (const f of FAMILIES) {
      const all = runs.map((r) => r.combos.find((c) => c.family === f));
      const ok = all.filter((c) => c && !c.missing).length;
      expect(ok, `${f}: decorados ${ok}/${all.length}`).toBeGreaterThanOrEqual(f === 'ice' ? 1 : Math.ceil(all.length * 0.3));
    }
    expect(combos().length).toBeGreaterThan(30);
  });

  it('todas las combinaciones son válidas, resolubles, sin callejones y la llave roja nunca es especial', () => {
    for (const c of combos()) {
      const id = `${c.family} dif ${c.rating} muros ${c.walls0} semilla ${c.seed}`;
      expect(c.valid, id).toBe(true);
      expect(c.keyPlain, `${id}: llave roja`).toBe(true);
      expect(c.solvable, id).toBe(true);
      expect(c.deadEnds, `${id}: sin callejones`).toBe(0);
    }
  });

  it('cada familia lleva lo que promete y el elemento especial importa (cuesta movimientos extra)', () => {
    const want = { gates: ['gate'], heavy: ['heavy'], ice: ['ice'] };
    for (const c of combos().filter((x) => x.family !== 'base')) {
      const id = `${c.family} dif ${c.rating} muros ${c.walls0}`;
      if (want[c.family]) expect(c.kinds, id).toEqual(want[c.family]);
      if (c.family === 'duo') expect(c.kinds.length, id).toBe(2);
      if (c.family === 'mixed') expect(c.kinds, id).toEqual(['gate', 'heavy', 'ice']);
      expect(c.opt, id).toBeGreaterThanOrEqual(c.plain + c.minGain);
    }
  });

  it('seguridad por estados: reversibles, nunca sin movimientos, siempre hay jugada óptima, hielo solo a los topes', () => {
    let states = 0;
    for (const c of combos()) {
      expect(c.violations, `${c.family} dif ${c.rating} muros ${c.walls0} semilla ${c.seed}`).toEqual([]);
      states += c.checked;
    }
    expect(states).toBeGreaterThan(2000);
  });

  it('el nivel construido tiene el mínimo exacto, el límite es el doble y la pista lo gana en `mínimo` pasos', () => {
    for (const c of combos()) {
      const id = `${c.family} dif ${c.rating} muros ${c.walls0} semilla ${c.seed}`;
      expect(c.lvlReal, id).toBe(c.lvlOpt);
      expect(c.lvlOpt, id).toBeGreaterThanOrEqual(1);
      expect(c.limitOk, id).toBe(true);
      expect(c.hintWins, `${id}: la pista llega a la salida`).toBe(true);
    }
  });
});
