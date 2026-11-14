import { describe, it, expect } from 'vitest';
import { WORLD, PEOPLES, INSCRIPTIONS, LORE_PORTRAITS } from '../src/data/lore.js';
import { CHAPTERS, HERO_LORE, HERO_TALK } from '../src/data/story.js';
import { HEROES } from '../src/game/heroes.js';
import { ZONES } from '../src/data/zones.js';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const storyText = JSON.stringify([CHAPTERS, HERO_LORE, HERO_TALK]);

describe('mundo e historia: Thyes, año 4133', () => {
  it('hay 10 capítulos, uno por ciudad, cada uno con su sello, título y frase grabada', () => {
    expect(CHAPTERS).toHaveLength(10);
    expect(ZONES).toHaveLength(10);
    expect(new Set(CHAPTERS.map((c) => c.seal)).size).toBe(10);
    CHAPTERS.forEach((c, i) => {
      expect(c.title && c.opening && c.end && c.seal, `capítulo ${i + 1}`).toBeTruthy();
      expect(c.cityLines, `capítulo ${i + 1}`).toHaveLength(3);
      expect(c.inscription).toBe(INSCRIPTIONS[i]);
    });
  });

  it('las diez frases grabadas se leen en orden como una sola idea que empieza por Tri y termina con Tri', () => {
    expect(INSCRIPTIONS).toHaveLength(10);
    const text = INSCRIPTIONS.join(' ');
    expect(INSCRIPTIONS[0]).toMatch(/Tri/);
    expect(INSCRIPTIONS[9]).toMatch(/Tri/);
    for (const light of ['brasa', 'hora', 'palabra']) expect(text.toLowerCase()).toContain(light);
  });

  it('el mundo se llama Thyes, es el año 4133 y aparece en el menú, el viaje y el final', () => {
    expect(WORLD).toMatchObject({ name: 'Thyes', year: 4133, nextYear: 4134, villain: 'Vhorn', guardian: 'Tri' });
    expect(read('index.html')).toContain('AÑO 4133');
    expect(read('src/game/session.js')).toContain('WORLD.year');
    expect(read('src/ui/finale.js')).toMatch(/año 4134/);
    expect(storyText).toContain('4133');
  });

  it('los cuatro pueblos antiguos (Kogn, Sahrim, Ennari, Aluen) viven en su reino y se mencionan en varios textos', () => {
    expect(PEOPLES.map((p) => p.name)).toEqual(['Kogn', 'Sahrim', 'Ennari', 'Aluen']);
    for (const p of PEOPLES) {
      const home = JSON.stringify(CHAPTERS[p.city]);
      expect(home, `${p.name} en su reino`).toContain(p.name);
      expect((storyText.match(new RegExp(p.name, 'g')) || []).length, `${p.name} mencionado`).toBeGreaterThanOrEqual(2);
    }
    expect(JSON.stringify(CHAPTERS[1])).toMatch(/Kogn/);   // el Puerto de las Velas: los antiguos Kogn viajan hasta allí
  });

  it('el malo se llama Vhorn: se nombra en la historia, aparece al inicio y en el final, y Tri no es la culpable en los textos oficiales', () => {
    expect((storyText.match(/Vhorn/g) || []).length).toBeGreaterThanOrEqual(5);
    expect(CHAPTERS[0].opening).toContain('Vhorn');
    expect(CHAPTERS[9].opening).toContain('Vhorn');
    expect(CHAPTERS[9].end).toContain('Vhorn');
    for (const h of Object.values(HERO_LORE)) expect(h.endingLore).toMatch(/Faro del Alba/);
    expect(read('index.html')).toContain('VHORN');
    expect(read('src/ui/finale.js')).toContain('Vhorn');
  });

  it('cada héroe encaja con una de las tres luces y todos terminan en el Faro, el año 4133 o Thyes', () => {
    expect(HEROES.map((h) => h.role)).toEqual(['Portadora de la Brasa', 'Vigía del Péndulo', 'Escriba de las Runas']);
    for (const h of Object.values(HERO_LORE)) {
      expect(h.chapterLines).toHaveLength(10);
      expect(h.endingLore).toMatch(/Thyes|4133/);
    }
  });

  it('la tienda, el revivir y la pantalla de derrota hablan el mismo idioma del mundo', () => {
    expect(read('src/ui/shop.js')).toMatch(/Thyes/);
    expect(read('src/ui/shop.js')).toMatch(/Kogn/);
    expect(read('index.html')).toMatch(/Viejo de la Fragua/);
    expect(read('src/ui/finale.js')).toMatch(/LA NOCHE SE CIERRA/);
  });

  it('no quedan en los textos del juego las ideas antiguas que chocan con la historia', () => {
    for (const bad of ['dios del fuego', 'Dios nórdico', 'LA SOMBRA DE TRI']) expect(read('index.html')).not.toContain(bad);
    expect(read('src/data/story.js')).not.toContain('Tri apagó');
  });

  it('los retratos de la historia existen (640×960 WebP) y cada pueblo sale en su reino; Vhorn, antes del Castillo', () => {
    const ids = Object.values(LORE_PORTRAITS).map((p) => p.id);
    expect(ids.sort()).toEqual(['aluen', 'ennari', 'kogn', 'sahrim', 'vhorn']);
    for (const [city, p] of Object.entries(LORE_PORTRAITS)) {
      const file = new URL(`../public/historia/${p.id}.webp`, import.meta.url);
      expect(existsSync(file), p.id).toBe(true);
      expect(readFileSync(file).length, p.id).toBeGreaterThan(20000);
      expect(p.name && p.caption).toBeTruthy();
      const people = PEOPLES.find((x) => x.id === p.id);
      if (people) expect(Number(city)).toBe(people.city);
    }
    expect(LORE_PORTRAITS[9].id).toBe('vhorn');
  });
});
