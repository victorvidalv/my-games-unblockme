import { describe, it, expect } from 'vitest';
import { ALL_THEMES, ZONE_THEMES, MENU_THEME, HEROES_THEME, SCALES, parseBar, shiftBar, shiftEntry, chordMidi, entryAt } from '../src/audio/themes.js';

const degreesOf = (e, n) => {
  const d = typeof e === 'string' ? Number(e.split(':')[0]) : e;
  return [d, d + 2, d + 4, d + 6].map((x) => ((x % n) + n) % n);
};

describe('temas musicales', () => {
  it('hay un tema para cada una de las 10 ciudades, más menú y héroes', () => {
    expect(ZONE_THEMES).toHaveLength(10);
    expect(MENU_THEME.name).toBeTruthy();
    expect(HEROES_THEME.name).toBeTruthy();
  });

  it('cada tema tiene 16 compases de melodía y de acordes, y cada compás suma exactamente 16 pasos', () => {
    for (const th of ALL_THEMES) {
      expect(th.tuneText, th.name).toHaveLength(16);
      expect(th.prog, th.name).toHaveLength(16);
      expect(SCALES[th.sc], th.name).toBeTruthy();
      th.tuneText.forEach((bar, i) => expect(parseBar(bar).length, `${th.name}, compás ${i + 1}`).toBe(16));
    }
  });

  it('las notas quedan en un registro cantable y los acordes existen en la escala', () => {
    for (const th of ALL_THEMES) {
      const n = SCALES[th.sc].length;
      for (const bar of th.tune) for (const [, deg, dur] of bar) {
        expect(deg, th.name).toBeGreaterThanOrEqual(-3);
        expect(deg, th.name).toBeLessThanOrEqual(2 * n + 8);
        expect(dur).toBeGreaterThan(0);
      }
      for (const e of th.prog.flat()) expect(shiftEntry(e, 0, n)).toBeLessThan(n);
    }
  });

  it('los tiempos fuertes (pasos 0 y 8) caen sobre notas del acorde: la melodía suena armónica', () => {
    for (const th of ALL_THEMES) {
      const n = SCALES[th.sc].length;
      let strong = 0;
      let inChord = 0;
      th.tune.forEach((bar, i) => {
        for (const [at, deg] of bar) {
          if (at !== 0 && at !== 8) continue;
          strong++;
          if (degreesOf(entryAt(th, i, at), n).includes(((deg % n) + n) % n)) inChord++;
        }
      });
      expect(inChord / strong, th.name).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('los acordes son de 4 notas (séptimas) y suenan en un registro medio', () => {
    for (const th of ALL_THEMES) {
      for (let bar = 0; bar < 16; bar++) for (const st of [0, 8]) {
        const c = chordMidi(th, entryAt(th, bar, st));
        expect(c.length).toBeGreaterThanOrEqual(4);
        expect(c[0]).toBeGreaterThanOrEqual(36);
        expect(c[0]).toBeLessThanOrEqual(70);
      }
    }
  });

  it('desplazar una melodía y su acorde por grados conserva la armonía', () => {
    expect(shiftBar('7:2 r:2 9:4', 3)).toBe('10:2 r:2 12:4');
    expect(shiftEntry([0, '4:7'], 2)).toEqual([2, 6]);
    expect(shiftEntry(5, 4)).toBe(2);
  });

  it('cada tema es distinguible: nombres, melodías e identidad (escala, tónica, instrumentos, tempo)', () => {
    const names = ALL_THEMES.map((t) => t.name);
    expect(new Set(names).size).toBe(ALL_THEMES.length);
    const ids = ALL_THEMES.map((t) => [t.sc, t.root, t.leadVoice, t.compVoice].join('|'));
    expect(new Set(ids).size).toBe(ALL_THEMES.length);
    const tunes = ALL_THEMES.map((t) => JSON.stringify(t.tune));
    expect(new Set(tunes).size).toBe(ALL_THEMES.length);
    for (let i = 0; i < ALL_THEMES.length; i++) for (let j = i + 1; j < ALL_THEMES.length; j++) {
      const a = new Set(ALL_THEMES[i].tune.flatMap((b, k) => b.map(([at, d]) => `${k}:${at}:${d}`)));
      const b = ALL_THEMES[j].tune.flatMap((bar, k) => bar.map(([at, d]) => `${k}:${at}:${d}`));
      expect(b.filter((x) => a.has(x)).length / b.length, `${ALL_THEMES[i].name} vs ${ALL_THEMES[j].name}`).toBeLessThan(0.4);
    }
    // varios timbres de melodía distintos entre las ciudades
    expect(new Set(ZONE_THEMES.map((t) => t.leadVoice)).size).toBeGreaterThanOrEqual(6);
  });

  it('son alegres y bailables: tempo entre 100 y 136, con swing y mayoría de escalas luminosas', () => {
    for (const th of ALL_THEMES) {
      expect(th.bpm, th.name).toBeGreaterThanOrEqual(100);
      expect(th.bpm, th.name).toBeLessThanOrEqual(136);
      expect(th.swing, th.name).toBeGreaterThan(0);
      expect(th.swing, th.name).toBeLessThanOrEqual(0.33);
    }
    const bright = ['maj', 'lyd', 'mix'];
    expect(ZONE_THEMES.filter((t) => bright.includes(t.sc)).length).toBeGreaterThanOrEqual(6);
    for (const th of ALL_THEMES) expect(th.epic, th.name).toBeGreaterThanOrEqual(1);
    expect(MENU_THEME.epic).toBe(3);
    expect(HEROES_THEME.epic).toBe(3);
  });

  it('la melodía no queda siempre en notas largas: cada tema tiene ritmo variado', () => {
    for (const th of ALL_THEMES) {
      const durs = new Set(th.tune.flat().map(([, , d]) => d));
      expect(durs.size, th.name).toBeGreaterThanOrEqual(3);
    }
  });
});
