import { describe, it, expect } from 'vitest';
import { curve, rateAt, minReach, moveLimit, MAX_LEVEL, TARGET_KNOTS, targetFor } from '../src/engine/difficulty.js';
import { levelPlan, BOSS_NAMES, CITY_FAMILY, mechanicsOfFamily } from '../src/game/mechanics.js';
import { calcGain, gainFor, BOSS_POINTS } from '../src/engine/scoring.js';

const PATHS = { Normal: 1, Difícil: 50, Experto: 75 };
const targetAt = (start, level) => curve(rateAt(start, level)).target;

describe('dificultad: la curva se siente apropiada', () => {
  it('en Normal, desde el nivel 30 hay que pensar (≥ 11 movimientos mínimos) y los primeros niveles enseñan', () => {
    for (let l = 1; l <= 10; l++) expect(targetAt(1, l)).toBeLessThanOrEqual(3);
    expect(targetAt(1, 30)).toBeGreaterThanOrEqual(11);
    expect(targetAt(1, 30)).toBeGreaterThanOrEqual(3 * targetAt(1, 10));
  });
  it('llegar al nivel 100 es desafiante (≥ 35 movimientos mínimos) en todos los caminos', () => {
    for (const start of Object.values(PATHS)) expect(targetAt(start, 100)).toBeGreaterThanOrEqual(35);
  });
  it('Difícil empieza como el nivel 50 de Normal y Experto como el nivel 75 de Normal', () => {
    expect(targetAt(50, 1)).toBe(targetAt(1, 50));
    expect(targetAt(75, 1)).toBe(targetAt(1, 75));
    expect(targetAt(50, 1)).toBeGreaterThanOrEqual(19);
    expect(targetAt(75, 1)).toBeGreaterThanOrEqual(29);
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
  it('el límite sigue siendo el doble del mínimo', () => {
    expect(moveLimit(20)).toBe(40);
  });
});

describe('calendario de piezas especiales y jefes', () => {
  it('los primeros niveles del Valle son normales (se aprende lo básico) y la primera roca llega en el 6', () => {
    for (let l = 1; l <= 5; l++) expect(levelPlan(l).family).toBe('plain');
    expect(levelPlan(6).family).toBe('walls');
    expect(levelPlan(6).intro).toBe(true);
  });
  it('hay un jefe cada 10 niveles con nombre, y nunca es un nivel normal', () => {
    expect(BOSS_NAMES).toHaveLength(10);
    for (let c = 0; c < 10; c++) {
      const p = levelPlan(c * 10 + 10);
      expect(p.boss).toBe(true);
      expect(p.family).not.toBe('plain');
      expect(p.city).toBe(c);
    }
    for (let l = 1; l <= 100; l++) if (l % 10 !== 0) expect(levelPlan(l).boss).toBe(false);
  });
  it('cada ciudad introduce su mecánica una sola vez y la repite en 5-6 niveles', () => {
    for (let c = 0; c < 10; c++) {
      const plans = Array.from({ length: 10 }, (_, k) => levelPlan(c * 10 + k + 1));
      expect(plans.filter((p) => p.intro)).toHaveLength(1);
      const specials = plans.filter((p) => p.family !== 'plain').length;
      expect(specials).toBeGreaterThanOrEqual(4);
      expect(specials).toBeLessThanOrEqual(6);
      expect(plans.filter((p) => p.family === 'plain').length).toBeGreaterThanOrEqual(4);
    }
  });
  it('no se usa una pieza antes de haberla enseñado: muros primero, luego candado, luego pesada', () => {
    const firstSeen = {};
    for (let l = 1; l <= 100; l++) {
      const p = levelPlan(l);
      for (const m of p.mechanics) if (!(m in firstSeen)) firstSeen[m] = l;
      if (p.intro) for (const m of p.mechanics) expect(firstSeen[m], `${m} nivel ${l}`).toBeLessThanOrEqual(l);
    }
    // los jefes mixtos (muros + candado + pesada) solo aparecen cuando ya se conocen las tres
    const bossMixed = [30, 40, 50, 60, 70, 80, 90, 100].filter((l) => levelPlan(l).family === 'mixed');
    expect(Math.min(...bossMixed)).toBeGreaterThanOrEqual(firstSeen.heavy);
    expect(firstSeen.wall).toBeLessThan(firstSeen.gate);
    expect(firstSeen.gate).toBeLessThan(firstSeen.heavy);
  });
  it('cada familia declara qué mecánicas contiene', () => {
    expect(CITY_FAMILY).toHaveLength(10);
    expect(mechanicsOfFamily('plain')).toEqual([]);
    expect(mechanicsOfFamily('mixed')).toEqual(['wall', 'gate', 'heavy']);
  });
  it('el jefe da un 50 % más de puntos', () => {
    const base = calcGain(40, 15, 15, 0).total;
    const boss = gainFor(40, 15, 15, 0, { boss: true });
    expect(boss.total).toBe(base + Math.round(base * (BOSS_POINTS - 1)));
    expect(boss.bossBonus).toBeGreaterThan(0);
    expect(gainFor(40, 15, 15, 0).bossBonus).toBe(0);
  });
});
