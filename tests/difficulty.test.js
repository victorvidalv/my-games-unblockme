import { describe, it, expect } from 'vitest';
import { curve, rateAt, minReach, moveLimit, MAX_LEVEL, TARGET_KNOTS, targetFor } from '../src/engine/difficulty.js';
import { levelPlan, CITY_FAMILY, mechanicsOfFamily } from '../src/game/mechanics.js';
import { calcGain, gainFor } from '../src/engine/scoring.js';

const PATHS = { Normal: 1, Difícil: 50, Experto: 75 };
const targetAt = (start, level) => curve(rateAt(start, level)).target;

describe('dificultad: la curva se siente apropiada', () => {
  it('en Normal, desde el nivel 20 hay que pensar (≥ 11 movimientos mínimos) y los primeros niveles enseñan', () => {
    for (let l = 1; l <= 10; l++) expect(targetAt(1, l)).toBeLessThanOrEqual(5);
    expect(targetAt(1, 20)).toBeGreaterThanOrEqual(11);
    expect(targetAt(1, 20)).toBeGreaterThanOrEqual(2 * targetAt(1, 10));
  });
  it('llegar al nivel 100 es desafiante (≥ 35 movimientos mínimos) en todos los caminos', () => {
    for (const start of Object.values(PATHS)) expect(targetAt(start, 100)).toBeGreaterThanOrEqual(35);
  });
  it('Difícil y Experto empiezan donde Normal ya exige pensar, y Experto más arriba que Difícil', () => {
    expect(targetAt(50, 1)).toBeGreaterThanOrEqual(11);
    expect(targetAt(75, 1)).toBeGreaterThanOrEqual(targetAt(50, 1) + 5);
    expect(targetAt(50, 1)).toBeLessThan(targetAt(1, 100));
  });
  it('sus curvas son mucho más empinadas: llegan al máximo antes que Normal (Experto antes que Difícil)', () => {
    const first = (start) => { for (let l = 1; l <= MAX_LEVEL; l++) if (targetAt(start, l) >= 37) return l; return MAX_LEVEL + 1; };
    expect(first(75)).toBeLessThan(first(50));
    expect(first(50)).toBeLessThan(first(1));
    expect(first(75)).toBeLessThanOrEqual(45);
    expect(first(50)).toBeLessThanOrEqual(60);
    expect(first(1)).toBeGreaterThanOrEqual(95);
    // en el nivel 50 la diferencia entre caminos se nota claramente
    expect(targetAt(50, 50) - targetAt(1, 50)).toBeGreaterThanOrEqual(8);
  });
  it('cada camino es más difícil que el anterior en el mismo nivel', () => {
    for (let l = 1; l <= MAX_LEVEL; l += 3) {
      expect(targetAt(50, l)).toBeGreaterThanOrEqual(targetAt(1, l));
      expect(targetAt(75, l)).toBeGreaterThanOrEqual(targetAt(50, l));
    }
  });
  it('la dificultad nunca baja a lo largo de un camino y no da saltos bruscos (≤ 2 movimientos de un nivel al siguiente)', () => {
    for (const start of Object.values(PATHS)) {
      for (let l = 2; l <= MAX_LEVEL; l++) {
        const d = targetAt(start, l) - targetAt(start, l - 1);
        expect(d, `camino ${start}, nivel ${l}`).toBeGreaterThanOrEqual(0);
        expect(d, `camino ${start}, nivel ${l}`).toBeLessThanOrEqual(2);
      }
    }
  });
  it('los puntos de control están ordenados y son crecientes', () => {
    for (let i = 1; i < TARGET_KNOTS.length; i++) {
      expect(TARGET_KNOTS[i][0]).toBeGreaterThan(TARGET_KNOTS[i - 1][0]);
      expect(TARGET_KNOTS[i][1]).toBeGreaterThanOrEqual(TARGET_KNOTS[i - 1][1]);
    }
    for (const [r, t] of TARGET_KNOTS) expect(targetFor(r)).toBe(t);
  });
  it('el mínimo exigido al generador baja solo un poco en las dificultades más altas', () => {
    for (let r = 1; r <= 100; r++) {
      expect(minReach(r)).toBeLessThanOrEqual(curve(r).target);
      expect(minReach(r)).toBeGreaterThanOrEqual(curve(r).target - 3);
    }
    expect(minReach(30)).toBe(curve(30).target);
  });
  it('el límite es el doble en Normal y se vuelve más estricto en Difícil y Experto', () => {
    expect(moveLimit(20)).toBe(40);
    expect(moveLimit(20, 1)).toBe(40);
    expect(moveLimit(20, 50)).toBeLessThan(moveLimit(20, 1));
    expect(moveLimit(20, 75)).toBeLessThan(moveLimit(20, 50));
    expect(moveLimit(20, 75)).toBeGreaterThan(20);
  });
});

describe('calendario de piezas especiales', () => {
  it('los primeros 9 niveles son normales; la primera roca llega en el 10', () => {
    for (let l = 1; l <= 9; l++) expect(levelPlan(l).family, `nivel ${l}`).toBe('plain');
    expect(levelPlan(10).family).toBe('walls');
    expect(levelPlan(10).intro).toBe(true);
  });
  it('ningún nivel tiene modo jefe y en todos los tramos hay respiros normales', () => {
    for (let l = 1; l <= 100; l++) expect(levelPlan(l).boss, `nivel ${l}`).toBeUndefined();
    for (let c = 0; c < 10; c++) {
      const plans = Array.from({ length: 10 }, (_, k) => levelPlan(c * 10 + k + 1));
      expect(plans.filter((p) => p.family === 'plain').length, `tramo ${c + 1}`).toBeGreaterThanOrEqual(2);
    }
  });
  it('escalado exacto: rocas ≥10, pesada ≥20, candado ≥30, hielo ≥40; solo un tipo hasta el 50 y combinados >50', () => {
    const firstSeen = {};
    for (let l = 1; l <= 100; l++) {
      const p = levelPlan(l);
      for (const m of p.mechanics) if (!(m in firstSeen)) firstSeen[m] = l;
      if (l <= 50) expect(p.mechanics.length, `nivel ${l} solo 1 tipo`).toBeLessThanOrEqual(1);
    }
    expect(firstSeen.wall).toBe(10);
    expect(firstSeen.heavy).toBe(20);
    expect(firstSeen.gate).toBe(30);
    expect(firstSeen.ice).toBe(40);
    const combos = Array.from({ length: 100 }, (_, i) => levelPlan(i + 1)).filter((p) => p.mechanics.length > 1);
    expect(combos.length).toBeGreaterThan(20);
    for (let l = 51; l <= 100; l++) {
      const p = levelPlan(l);
      if (p.family === 'duo' || p.family === 'mixed') expect(p.mechanics.length).toBeGreaterThanOrEqual(2);
    }
    // Densidad ascendente de combinados: segunda mitad (>70) combina más que 51..70
    const midCombos = Array.from({ length: 20 }, (_, i) => levelPlan(51 + i)).filter((p) => p.mechanics.length > 1).length;
    const lateCombos = Array.from({ length: 30 }, (_, i) => levelPlan(71 + i)).filter((p) => p.mechanics.length > 1).length;
    expect(lateCombos / 30).toBeGreaterThan(midCombos / 20);
  });
  it('cada familia declara qué mecánicas contiene', () => {
    expect(CITY_FAMILY).toHaveLength(10);
    expect(mechanicsOfFamily('plain')).toEqual([]);
    expect(mechanicsOfFamily('ice')).toEqual(['ice']);
    expect(mechanicsOfFamily('duo')).toEqual(['gate', 'heavy', 'ice']);
    expect(mechanicsOfFamily('mixed')).toEqual(['wall', 'gate', 'heavy', 'ice']);
  });
  it('calcGain y gainFor coinciden sin bonos extra', () => {
    const base = calcGain(40, 15, 15, 0).total;
    const g = gainFor(40, 15, 15, 0);
    expect(g.total).toBe(base);
  });
});
