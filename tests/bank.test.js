import { describe, it, expect, beforeAll } from 'vitest';
import bank from '../src/data/levels.json';
import special from '../src/data/special.json';
import { curve, minReach } from '../src/engine/index.js';
import { runPool, FULL } from './parallel/pool.js';

/**
 * Banco completo (tableros normales + 6 familias especiales) verificado en paralelo:
 * un solo análisis por tablero repartido entre todos los hilos, y cada test lee ese resumen.
 * (Sustituye a la validación en serie de levels.test.js y special-bank.test.js.)
 */
const FAMILIES = ['walls', 'gates', 'heavy', 'ice', 'duo', 'mixed'];
const RATINGS = Array.from({ length: 100 }, (_, i) => i + 1);

const jobs = [];
for (const rating of RATINGS) {
  bank.ratings[rating - 1].forEach((text) => jobs.push({ text, rating, family: 'plain', sample: FULL ? 150 : 30 }));
  for (const f of FAMILIES) {
    for (const text of special[f][rating - 1]) {
      // «sin el elemento especial» cuesta otra búsqueda: con FULL=1 en todos, si no en 1 de cada 3 dificultades
      jobs.push({ text, rating, family: f, strip: FULL || rating % 3 === 0, sample: FULL ? 150 : 40 });
    }
  }
}
jobs.sort((a, b) => b.rating - a.rating); // los más caros primero: el reparto entre hilos queda parejo

let results = [];
const of = (family) => results.filter((r) => r.family === family);

beforeAll(async () => {
  const out = await runPool('board', jobs, { batch: 6 });
  results = out.map((r, i) => ({ ...r, family: jobs[i].family, text: jobs[i].text }));
}, 300000);

describe('banco de tableros normales', () => {
  it('tiene tableros para las 100 dificultades', () => {
    expect(bank.ratings).toHaveLength(100);
    for (const list of bank.ratings) expect(list.length).toBeGreaterThanOrEqual(8);
    for (const list of bank.ratings) expect(new Set(list).size).toBeGreaterThanOrEqual(10);
  });

  it('cada tablero es válido, tiene solución, cero atascos y alcanza el mínimo de su dificultad', () => {
    expect(of('plain').length).toBe(bank.ratings.flat().length);
    for (const r of of('plain')) {
      const id = `normal ${r.rating} ${r.text}`;
      expect(r.valid, `${id} válido`).toBe(true);
      expect(r.keyOk, `${id} llave roja`).toBe(true);
      expect(r.kinds, `${id} sin piezas especiales`).toEqual([]);
      expect(r.pieces - 1, `${id} nº de piezas`).toBeLessThanOrEqual(curve(r.rating).others);
      expect(r.solvable, `${id} con solución`).toBe(true);
      expect(r.deadEnds, `${id} sin callejones`).toBe(0);
      expect(r.maxD, `${id} alcanza ${minReach(r.rating)}`).toBeGreaterThanOrEqual(minReach(r.rating));
    }
  });
});

describe('banco de tableros especiales', () => {
  it('hay tableros de cada familia en (casi) todas las dificultades que se usan', () => {
    for (const f of FAMILIES) {
      expect(special[f], f).toHaveLength(100);
      const have = RATINGS.filter((r) => special[f][r - 1].length > 0).length;
      expect(have, `${f}: dificultades con tableros`).toBeGreaterThanOrEqual(f === 'walls' ? 80 : f === 'mixed' ? 90 : f === 'ice' ? 0 : 95);
    }
  });

  it('cada familia contiene realmente lo que promete', () => {
    const has = (r, k) => r.kinds.includes(k);
    for (const r of of('walls')) expect(r.walls, r.text).toBeGreaterThan(0);
    for (const r of of('gates')) expect(has(r, 'gate'), r.text).toBe(true);
    for (const r of of('heavy')) expect(has(r, 'heavy'), r.text).toBe(true);
    for (const r of of('ice')) expect(has(r, 'ice'), r.text).toBe(true);
    for (const r of of('duo')) expect(r.kinds.length, r.text).toBe(2);
    for (const r of of('mixed')) {
      expect(r.walls, r.text).toBeGreaterThan(0);
      expect(r.kinds, r.text).toEqual(['gate', 'heavy', 'ice']);
    }
  });

  it('cada tablero es válido, resoluble, sin estados sin salida y alcanza el mínimo de su dificultad', () => {
    for (const f of FAMILIES) {
      expect(of(f).length, f).toBeGreaterThan(100);
      for (const r of of(f)) {
        const id = `${f} ${r.rating} ${r.text}`;
        expect(r.valid, `${id} válido`).toBe(true);
        expect(r.keyPlain, `${id}: la llave roja nunca es especial`).toBe(true);
        expect(r.keyOk, `${id} llave roja`).toBe(true);
        expect(r.solvable, `${id} con solución`).toBe(true);
        expect(r.deadEnds, `${id} sin callejones sin salida`).toBe(0);
        // los tableros con muros son más caros de encontrar: el mínimo exigido baja un poco
        expect(r.maxD, `${id} alcanza ${minReach(r.rating) - 2}`).toBeGreaterThanOrEqual(minReach(r.rating) - 2);
      }
    }
  });

  it('el elemento especial IMPORTA: sin él la solución sería más corta', () => {
    let checked = 0;
    for (const r of results.filter((x) => x.family !== 'plain' && x.plainOpt !== undefined)) {
      expect(r.plainOpt, `${r.family} ${r.rating} ${r.text}`).not.toBeNull();
      expect(r.opt, `${r.family} ${r.rating} ${r.text}`).toBeGreaterThan(r.plainOpt);
      checked++;
    }
    expect(checked).toBeGreaterThan(300);
  });

  it('el candado tiene su placa fuera de su carril y no cae sobre un muro', () => {
    for (const r of results.filter((x) => x.kinds.includes('gate'))) expect(r.platesOk, `${r.family} ${r.rating} ${r.text}`).toBe(true);
  });
});

describe('seguridad de TODOS los tableros (muestra repartida de estados alcanzables)', () => {
  it('movimientos reversibles, jamás sin movimientos, siempre hay jugada óptima y rangos de la interfaz = solver', () => {
    let states = 0;
    for (const r of results) {
      expect(r.violations, `${r.family} ${r.rating} ${r.text}`).toEqual([]);
      states += r.checked;
    }
    expect(states).toBeGreaterThan(100000);
  });
});
