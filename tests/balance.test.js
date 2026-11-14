import { describe, it, expect } from 'vitest';
import { averageRuns, simulateRun, PATHS, SKILLS } from '../src/game/balance.js';
import { FREE_UNDOS, JUTH_FREE_HINTS } from '../src/game/heroes.js';
import { MAX_REVIVES, REVIVE_SHARE } from '../src/game/shop.js';

const RUNS = 400;
const MID = [0.5, 0.65, 0.8];

/** Niveles extra (frente a no tener poder) de un héroe, promediados en los 3 caminos y habilidades medias. */
function uplift(hero) {
  let total = 0;
  let n = 0;
  for (const start of PATHS) {
    for (const skill of MID) {
      const base = averageRuns({ hero: 'none', start, skill, runs: RUNS }).cleared;
      total += averageRuns({ hero, start, skill, runs: RUNS }).cleared - base;
      n++;
    }
  }
  return total / n;
}

describe('equilibrio de los poderes de héroe (simulación)', () => {
  it('el modelo es determinista y la habilidad importa: más habilidad, más niveles', () => {
    const a = simulateRun({ hero: 'none', start: 1, skill: 0.6, seed: 7 });
    const b = simulateRun({ hero: 'none', start: 1, skill: 0.6, seed: 7 });
    expect(a).toEqual(b);
    let prev = -1;
    for (const skill of SKILLS) {
      const lv = averageRuns({ hero: 'none', start: 1, skill, runs: RUNS }).cleared;
      expect(lv).toBeGreaterThan(prev);
      prev = lv;
    }
  });

  it('el modelo está calibrado: un jugador medio no llega al final de Normal y uno muy bueno casi sí', () => {
    const avg = averageRuns({ hero: 'none', start: 1, skill: 0.6, runs: RUNS }).cleared;
    const good = averageRuns({ hero: 'none', start: 1, skill: 0.92, runs: RUNS }).cleared;
    expect(avg).toBeGreaterThan(30);
    expect(avg).toBeLessThan(65);
    expect(good).toBeGreaterThan(75);
  });

  it('los tres poderes ayudan de verdad (≥ 10 niveles extra de media)', () => {
    for (const hero of ['lia', 'jean', 'van']) expect(uplift(hero), hero).toBeGreaterThanOrEqual(10);
  });

  it('los tres poderes son justos entre sí: ninguno aporta más de un 25 % sobre la media ni menos de un 25 % por debajo', () => {
    const u = { lia: uplift('lia'), jean: uplift('jean'), van: uplift('van') };
    const mean = (u.lia + u.jean + u.van) / 3;
    for (const [hero, v] of Object.entries(u)) {
      expect(v / mean, `${hero} (${v.toFixed(1)} niveles, media ${mean.toFixed(1)})`).toBeGreaterThan(0.75);
      expect(v / mean, `${hero} (${v.toFixed(1)} niveles, media ${mean.toFixed(1)})`).toBeLessThan(1.25);
    }
  });

  it('el poder antiguo de Juth (+2 pistas por ciudad) era demasiado flojo: por eso ahora es una pista gratis por tablero', () => {
    const old = (() => {
      let t = 0;
      let n = 0;
      for (const start of PATHS) for (const skill of MID) {
        const base = averageRuns({ hero: 'none', start, skill, runs: RUNS }).cleared;
        t += averageRuns({ hero: 'van', start, skill, runs: RUNS, powers: { juthFree: 0, juthHints: 2 } }).cleared - base;
        n++;
      }
      return t / n;
    })();
    expect(old).toBeLessThan(uplift('van') / 3);
    expect(JUTH_FREE_HINTS).toBe(1);
    expect(FREE_UNDOS).toBe(3);
  });

  it('con todos los poderes dados de mano a los buenos jugadores no se «rompe» el juego: seguir siendo posible perder', () => {
    for (const hero of ['lia', 'jean', 'van']) {
      const r = averageRuns({ hero, start: 1, skill: 0.5, runs: RUNS });
      expect(r.completion, hero).toBeLessThan(0.5);
    }
  });
});

describe('revivir comprado (simulación)', () => {
  it('ayuda más a quien más pierde y le duele más al que más puntos tiene', () => {
    const none = averageRuns({ hero: 'none', start: 50, skill: 0.55, runs: RUNS });
    const rev = averageRuns({ hero: 'none', start: 50, skill: 0.55, runs: RUNS, revive: 'city' });
    expect(rev.cleared).toBeGreaterThan(none.cleared + 5);            // un jugador que llega a las ciudades medias aprovecha bien el revivir
    const goodNone = averageRuns({ hero: 'none', start: 75, skill: 1, runs: RUNS });
    const goodRev = averageRuns({ hero: 'none', start: 75, skill: 1, runs: RUNS, revive: 'city' });
    expect(goodRev.score).toBeLessThan(goodNone.score * 0.95);        // al jugador perfecto le cuesta puntos sin darle nada
  });
  it('máximo 1 por partida y cuesta el 33 % de los puntos del momento', () => {
    expect(MAX_REVIVES).toBe(1);
    expect(REVIVE_SHARE).toBe(0.33);
    for (let seed = 1; seed <= 50; seed++) {
      const r = simulateRun({ hero: 'none', start: 1, skill: 0.7, seed, revive: 'city' });
      expect(r.revivesBought).toBeLessThanOrEqual(MAX_REVIVES);
    }
  });
});
