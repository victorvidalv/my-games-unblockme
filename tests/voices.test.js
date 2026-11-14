import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { VOICE_LINES, VOICE_FILE, voicePath } from '../src/data/voices.js';

const root = new URL('../', import.meta.url);
const guion = readFileSync(new URL('output/voces/guion-voces.md', root), 'utf8');

describe('voces de los héroes al llegar a cada ciudad', () => {
  it('hay 10 frases por héroe (una por ciudad) y coinciden con el guion que se grabó', () => {
    for (const hero of ['lia', 'jean', 'van']) {
      expect(VOICE_LINES[hero], hero).toHaveLength(10);
      for (const line of VOICE_LINES[hero]) {
        expect(line.length).toBeGreaterThan(30);
        expect(line.length).toBeLessThan(120);       // 3-7 s hablado
        expect(guion, `${hero}: «${line}»`).toContain(line);
      }
    }
  });
  it('las rutas siguen el patrón héroe-NN.m4a (Juth usa «juth», su id interno es «van»)', () => {
    expect(VOICE_FILE).toEqual({ lia: 'lia', jean: 'jean', van: 'juth' });
    expect(voicePath('jean', 0)).toBe('voces/jean-01.m4a');
    expect(voicePath('van', 9)).toBe('voces/juth-10.m4a');
    expect(voicePath('lia', 4)).toBe('voces/lia-05.m4a');
  });
  it('los audios de Jean existen, pesan poco y no hay ninguno vacío (los demás héroes se añaden cuando lleguen)', () => {
    for (let city = 0; city < 10; city++) {
      const file = new URL(`public/${voicePath('jean', city)}`, root);
      expect(existsSync(file), `jean-${city + 1}`).toBe(true);
      const kb = statSync(file).size / 1024;
      expect(kb).toBeGreaterThan(15);
      expect(kb).toBeLessThan(120);
    }
    for (const hero of ['lia', 'van']) for (let city = 0; city < 10; city++) {
      const file = new URL(`public/${voicePath(hero, city)}`, root);
      if (existsSync(file)) expect(statSync(file).size, `${hero}-${city + 1}`).toBeGreaterThan(15000);
    }
  });
});
