/**
 * Temas musicales: uno por ciudad (mismo orden que ZONES) más el del menú y el de la elección de héroe.
 * Estilo «juego acogedor»: acordes con séptima, bajo caminante, ritmo con swing y melodías cantables.
 *
 * Cada tema es una pieza de 16 compases (4/4, 16 pasos por compás) que se repite:
 *   prog  – acorde de cada compás. Un número es el grado de la escala (acorde de 7ª diatónico: d, d+2, d+4, d+6);
 *           «"4:7"» fuerza otra calidad (7 dominante, m7, maj7, 9…); un arreglo [a, b] cambia de acorde a mitad de compás.
 *   tune  – la melodía, un texto por compás con notas «grado:duración» (duración en pasos de 1/16, `r` = silencio).
 *           El grado 0 es la tónica; 7 es la tónica una octava arriba.
 *   B     – atajo: en vez de escribir los 16 compases, se escriben 8 (la sección A); la sección B repite los
 *           primeros 6 desplazados `k` grados de la escala (la melodía y los acordes se mueven juntos, así que
 *           siguen sonando bien) y `end`/`endProg` aportan los 2 compases finales.
 *   epic  – capas orquestales extra (0-3): 1 cuerdas largas, 2 + timbal y trompas, 3 + caja y platillo.
 */
export const SCALES = {
  min: [0, 2, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], maj: [0, 2, 4, 5, 7, 9, 11], phr: [0, 1, 3, 5, 7, 8, 10],
  lyd: [0, 2, 4, 6, 7, 9, 11], hmin: [0, 2, 3, 5, 7, 8, 11], mix: [0, 2, 4, 5, 7, 9, 10], phd: [0, 1, 4, 5, 7, 8, 10],
  pent: [0, 2, 4, 7, 9],
};

/** Calidades de acorde que se pueden forzar con «"grado:calidad"» (semitonos sobre la fundamental). */
export const QUALITIES = {
  '7': [0, 4, 7, 10], '9': [0, 4, 7, 10, 14], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], m: [0, 3, 7], maj: [0, 4, 7], dim: [0, 3, 6, 9],
};

/** «11:4 r:2 9:2» → { notes: [[paso, grado, duración], …], length } */
export function parseBar(text) {
  const notes = [];
  let at = 0;
  for (const tok of text.trim().split(/\s+/)) {
    const [deg, dur] = tok.split(':');
    const d = Number(dur);
    if (deg !== 'r') notes.push([at, Number(deg), d]);
    at += d;
  }
  return { notes, length: at };
}

/** Mueve una melodía `k` grados de la escala (los silencios no cambian). */
export const shiftBar = (text, k) => text.trim().split(/\s+/).map((tok) => {
  const [deg, dur] = tok.split(':');
  return deg === 'r' ? tok : `${Number(deg) + k}:${dur}`;
}).join(' ');

/** Mueve un acorde `k` grados (en la sección B los acordes son los diatónicos de la escala). */
export const shiftEntry = (e, k, n = 7) => {
  if (Array.isArray(e)) return e.map((x) => shiftEntry(x, k, n));
  const d = typeof e === 'string' ? Number(e.split(':')[0]) : e;
  return (((d + k) % n) + n) % n;
};

/** Acorde (notas MIDI) de una entrada de `prog` para un tema. */
export function chordMidi(th, entry) {
  const scale = SCALES[th.sc];
  const n = scale.length;
  const at = (deg) => th.root + scale[((deg % n) + n) % n] + 12 * Math.floor(deg / n);
  if (typeof entry === 'string') {
    const [d, q] = entry.split(':');
    const r = at(Number(d));
    return QUALITIES[q].map((x) => r + x);
  }
  return [at(entry), at(entry + 2), at(entry + 4), at(entry + 6)];
}

/** Entrada de `prog` activa en un paso del compás (los acordes dobles cambian en el paso 8). */
export const entryAt = (th, bar, st) => {
  const e = th.prog[bar % th.prog.length];
  return Array.isArray(e) ? (st < 8 ? e[0] : e[1]) : e;
};

const THEME_DATA = [
  { // 0 Valle Esmeralda · Do mayor, pop-folk saltarín con guitarra y flauta
    name: 'Un corazón al sol', epic: 1, bpm: 124, sc: 'maj', root: 48, swing: 0.1, leadVoice: 'flute', compVoice: 'guitar', comp: 'chop16', bassPat: 'pop', groove: 'pop', echo: true,
    prog: [0, [5, 1], '4:7', [0, 5], 3, [2, 5], [1, '4:7'], 0, 5, '2:7', 1, '4:7', 3, 1, '4:7', [0, '4:7']],
    tuneText: ['11:2 11:1 9:1 7:2 9:2 11:2 14:2 16:3 14:1', '12:2 r:1 11:1 9:2 7:2 8:2 10:2 12:1 14:1 15:2', '13:3 13:1 15:2 13:2 11:2 13:2 10:2 r:2', '14:2 14:1 11:1 9:2 11:2 12:2 11:2 9:2 7:2',
      '10:2 12:2 14:2 16:2 14:1 12:1 10:2 12:2 r:2', '13:2 11:1 9:1 11:2 13:2 14:2 12:2 11:2 9:2', '12:2 12:1 14:1 15:2 14:2 13:2 15:1 13:1 11:2 13:2', '14:4 r:2 11:2 14:2 16:2 14:4',
      '12:2 12:1 14:1 16:2 14:2 12:2 11:2 9:2 r:2', '13:2 15:2 13:2 9:2 13:1 15:1 16:4 r:2', '14:2 12:2 10:2 8:2 10:2 12:2 14:4', '11:2 13:2 15:2 17:2 15:2 13:2 11:4',
      '14:3 14:1 16:2 14:2 12:2 14:2 16:2 r:2', '15:2 14:2 12:2 14:2 15:1 14:1 12:2 10:2 r:2', '13:2 15:2 17:4 15:2 13:2 11:2 13:2', '14:2 11:2 14:2 16:2 15:2 13:2 11:2 10:2'],
  },
  { // 1 Puerto de las Velas · Re mixolidio, polka marinera con tamborín
    name: 'Vals de las pequeñas velas', epic: 1, bpm: 126, sc: 'mix', root: 50, swing: 0.1, leadVoice: 'whistle', compVoice: 'accordion', comp: 'oompah', bassPat: 'oompah', groove: 'polka', echo: true,
    prog: [0, 6, 3, 0, 0, 6, [3, 4], 0],
    tuneText: ['7:2 7:1 9:1 11:2 11:2 14:2 13:2 11:2 9:2', '13:2 13:1 15:1 13:2 10:2 12:2 13:2 15:2 r:2', '12:2 14:1 12:1 10:2 12:2 14:2 16:2 14:2 12:2', '11:2 9:2 7:2 9:2 11:3 13:1 14:2 r:2',
      '14:2 14:1 11:1 14:2 16:2 14:2 13:2 11:2 9:2', '13:2 15:2 17:2 15:2 13:1 12:1 10:2 12:2 13:2', '12:2 10:1 12:1 14:2 12:2 11:2 13:1 15:1 13:2 11:2', '14:3 11:1 9:2 7:2 9:2 11:2 14:2 r:2'],
    B: { k: 4, endProg: [[3, 4], 0], end: ['12:2 14:2 16:2 14:2 11:2 13:2 15:2 13:2', '14:2 14:1 11:1 9:2 7:2 9:2 11:2 14:2 r:2'] },
  },
  { // 2 Oasis Dorado · frigio dominante, bazar con clave, conga y clarinete
    name: 'Gotas sobre la arena', epic: 1, bpm: 118, sc: 'phd', root: 52, swing: 0.06, leadVoice: 'clarinet', compVoice: 'pizz', comp: 'montuno', bassPat: 'tumbao', groove: 'latin', echo: true,
    prog: [0, 1, 0, 6, 0, 1, [3, 6], 0],
    tuneText: ['9:1 8:1 9:2 11:2 9:2 7:2 9:1 11:1 13:2 11:2', '10:2 12:1 14:1 12:2 10:2 8:2 10:2 12:2 14:2', '13:2 13:1 11:1 9:2 11:2 13:2 15:2 16:2 13:2', '12:2 10:1 8:1 10:2 12:2 13:2 12:2 10:2 8:2',
      '11:2 13:2 14:1 13:1 11:2 9:2 11:2 13:2 11:2', '12:3 14:1 12:2 10:2 8:2 10:2 12:2 r:2', '10:2 12:2 14:2 16:2 13:2 12:1 10:1 8:2 10:2', '7:2 9:2 11:2 13:2 14:4 r:2 11:2'],
    B: { k: -2, endProg: [[3, 6], 0], end: ['12:2 10:2 8:2 10:2 13:2 12:2 10:2 8:2', '11:2 9:1 8:1 7:2 9:2 11:2 13:2 14:4'] },
  },
  { // 3 Aldea de Otoño · La dórico, shuffle folk con violín y pisotones
    name: 'Las hojas recuerdan', epic: 1, bpm: 116, sc: 'dor', root: 45, swing: 0.22, leadVoice: 'fiddle', compVoice: 'guitar', comp: 'chop16', bassPat: 'pop', groove: 'shuffle', echo: false,
    prog: [0, 3, [6, 3], 0, 0, 3, [6, 4], 0],
    tuneText: ['9:3 9:1 11:2 9:2 7:2 9:2 11:3 13:1', '10:3 10:1 12:2 14:2 12:2 10:2 9:2 7:2', '13:2 12:1 10:1 8:2 10:2 12:2 14:1 12:1 10:2 12:2', '11:3 9:1 7:2 9:2 11:2 13:2 11:2 9:2',
      '7:2 9:2 11:3 13:1 11:2 9:2 7:2 9:2', '12:2 14:2 16:3 14:1 12:2 10:2 12:2 14:2', '10:2 12:1 10:1 8:2 10:2 11:2 13:2 15:2 13:2', '7:3 9:1 11:2 9:2 7:2 9:2 11:4'],
    B: { k: -3, endProg: [[6, 4], 0], end: ['10:2 12:2 14:2 12:2 11:2 13:2 15:2 13:2', '14:3 11:1 9:2 7:2 9:2 11:2 14:2 r:2'] },
  },
  { // 4 Ciudad del Reloj · Fa mayor, funk-disco de tic-tac con sintetizador
    name: 'Las horas prestadas', epic: 1, bpm: 126, sc: 'maj', root: 53, swing: 0.04, leadVoice: 'synth', compVoice: 'pizz', comp: 'chop16', bassPat: 'funk', groove: 'disco', echo: true,
    prog: [0, [1, '4:7'], 0, [5, 1], 3, [2, 5], [1, '4:7'], 0],
    tuneText: ['11:1 r:1 11:1 r:1 9:1 r:1 7:1 r:1 9:2 11:2 14:2 13:2', '12:1 r:1 12:1 r:1 10:2 8:2 11:2 13:1 15:1 13:2 11:2', '13:1 r:1 13:1 r:1 11:1 r:1 9:1 r:1 11:2 13:2 14:4', '12:2 14:1 16:1 14:2 12:2 12:1 10:1 8:2 10:2 12:2',
      '14:2 12:1 14:1 16:2 14:2 12:2 10:2 12:2 14:2', '13:1 r:1 11:1 r:1 9:2 11:2 12:2 14:1 12:1 16:2 14:2', '12:2 10:1 8:1 10:2 12:2 11:2 13:2 15:2 13:2', '14:2 r:1 11:1 9:2 7:2 9:2 11:2 14:2 r:2'],
    B: { k: 2, endProg: [[1, '4:7'], 0], end: ['12:2 10:2 8:2 10:2 11:2 13:2 15:2 13:2', '14:2 r:1 11:1 9:2 7:2 14:4 r:4'] },
  },
  { // 5 Refugio Glacial · Mi bemol mayor, nieve chispeante con celesta y arpegios
    name: 'Campanas de cristal', epic: 1, bpm: 104, sc: 'maj', root: 51, swing: 0.08, leadVoice: 'celesta', compVoice: 'piano', comp: 'arp', bassPat: 'pop', groove: 'soft', echo: true, arpVoice: 'glass', arpPat: [0, 2, 3, 2, 1, 2, 3, 2], arpEvery: 1, arpV: 0.012,
    prog: [0, [2, 5], 3, [1, 4], 0, [5, 2], 3, 4],
    tuneText: ['11:2 r:1 9:1 7:2 9:2 11:2 14:2 16:2 14:2', '13:2 11:1 9:1 11:2 13:2 12:2 11:1 9:1 7:2 9:2', '14:3 12:1 10:2 12:2 14:2 16:2 14:2 12:2', '12:2 10:1 8:1 10:2 12:2 11:2 13:1 15:1 13:2 11:2',
      '9:2 11:2 14:2 16:2 14:1 11:1 9:2 11:2 14:2', '12:2 14:1 12:1 11:2 9:2 13:2 11:1 9:1 11:2 13:2', '12:2 14:2 16:3 14:1 12:2 10:2 12:2 14:2', '13:2 15:2 13:2 11:2 13:3 15:1 17:2 r:2'],
    B: { k: -4, endProg: [[1, 4], 0], end: ['12:2 10:2 8:2 10:2 11:2 13:2 15:2 13:2', '14:4 11:2 9:2 7:2 9:2 11:2 14:2'] },
  },
  { // 6 Villa Sakura · Do sostenido mayor, bossa de pétalos con koto
    name: 'Pétalos en el viento', epic: 1, bpm: 112, sc: 'maj', root: 49, swing: 0.1, leadVoice: 'koto', compVoice: 'pizz', comp: 'skank', bassPat: 'bossa', groove: 'bossa', echo: true,
    prog: [0, 5, 3, 4, 0, [5, 2], 3, [1, 4]],
    tuneText: ['9:2 11:1 9:1 7:2 9:2 11:2 14:2 11:2 9:2', '12:2 14:1 12:1 11:2 12:2 14:2 16:2 14:2 12:2', '12:2 12:1 14:1 16:2 14:2 12:2 9:2 12:2 14:2', '11:2 15:1 11:1 8:2 11:2 15:2 11:2 8:2 11:2',
      '14:2 16:1 14:1 11:2 9:2 11:2 14:2 16:2 14:2', '12:2 14:1 12:1 11:2 9:2 9:2 11:1 9:1 11:2 12:2', '12:3 14:1 12:2 9:2 12:2 14:2 16:2 r:2', '15:2 12:1 8:1 12:2 15:2 11:2 8:1 11:1 15:2 11:2'],
    B: { k: -4, endProg: [[1, 4], 0], end: ['15:2 12:2 8:2 12:2 11:2 8:2 11:2 15:2', '14:4 11:2 9:2 7:2 9:2 11:2 14:2'] },
  },
  { // 7 Puerto del Volcán · Sol menor, marcha al galope con metales
    name: 'La fragua de los sueños', epic: 2, bpm: 128, sc: 'min', root: 43, swing: 0.1, leadVoice: 'brass', compVoice: 'piano', comp: 'charleston', bassPat: 'gallop', groove: 'march', echo: false,
    prog: [0, 5, [3, '4:7'], 0, 5, ['6:7', 2], [3, '4:7'], 0],
    tuneText: ['7:2 7:1 7:1 9:2 11:2 14:3 11:1 9:2 7:2', '12:2 12:1 12:1 14:2 16:2 18:3 16:1 14:2 12:2', '14:2 12:1 10:1 12:2 14:2 11:2 13:1 15:1 17:2 15:2', '14:3 11:1 9:2 7:2 9:2 11:2 14:2 r:2',
      '12:2 12:1 12:1 14:2 16:2 14:3 12:1 14:2 16:2', '13:2 15:1 13:1 17:2 15:2 9:2 11:1 13:1 15:2 13:2', '14:2 12:2 10:2 12:2 11:2 13:1 15:1 17:2 15:2', '7:2 9:2 11:2 14:2 13:2 11:2 14:4'],
    B: { k: 2, endProg: [[3, '4:7'], 0], end: ['14:2 12:2 10:2 12:2 11:2 13:1 15:1 17:2 15:2', '14:2 r:1 11:1 9:2 7:2 14:4 r:4'] },
  },
  { // 8 Ciudad Celeste · Fa sostenido lidio, chill con vibráfono y ecos
    name: 'Un puente entre estrellas', epic: 1, bpm: 108, sc: 'lyd', root: 54, swing: 0.2, leadVoice: 'vibes', compVoice: 'piano', comp: 'charleston', bassPat: 'walk', groove: 'chill', echo: true, arpVoice: 'glass', arpPat: [0, 2, 3, 2], arpEvery: 2, arpV: 0.014,
    prog: [0, [1, 0], 5, [4, 1], 0, [2, 5], [1, 4], 0],
    tuneText: ['11:2 13:1 14:1 16:2 14:2 11:2 13:2 14:2 16:2', '12:2 14:1 12:1 10:2 8:2 9:2 11:1 13:1 14:2 11:2', '12:2 14:2 16:1 14:1 12:2 14:2 16:2 18:2 16:2', '13:2 15:1 13:1 11:2 13:2 12:2 10:1 12:1 14:2 12:2',
      '14:3 13:1 11:2 9:2 11:2 13:2 14:2 16:2', '13:2 11:1 9:1 11:2 13:2 14:2 16:1 14:1 12:2 14:2', '14:2 12:1 10:1 12:2 14:2 13:2 15:2 17:2 15:2', '14:4 r:2 11:2 13:2 14:2 16:4'],
    B: { k: -3, endProg: [[1, 0], 0], end: ['14:2 12:2 10:2 12:2 11:2 13:2 14:2 16:2', '14:4 r:2 9:2 11:2 13:2 14:4'] },
  },
  { // 9 Castillo Dorado · Si bemol mayor, big band con metales y platillo
    name: 'El regreso del alba', epic: 2, bpm: 132, sc: 'maj', root: 46, swing: 0.2, leadVoice: 'brass', compVoice: 'piano', comp: 'charleston', bassPat: 'walk', groove: 'bigband', echo: false,
    prog: [0, 3, [5, 1], 4, 0, 3, [1, 4], 0],
    tuneText: ['7:2 7:1 7:1 11:2 11:2 14:3 11:1 9:2 7:2', '10:2 10:1 10:1 14:2 14:2 16:3 14:1 12:2 10:2', '12:2 12:1 14:1 16:2 14:2 14:2 12:1 10:1 12:2 14:2', '13:2 13:1 15:1 17:2 15:2 13:2 11:2 13:2 15:2',
      '14:2 11:1 14:1 16:2 14:2 11:2 14:2 16:2 r:2', '14:2 12:1 14:1 16:2 14:2 12:2 14:2 16:2 r:2', '14:2 12:2 10:2 12:2 13:2 15:1 13:1 11:2 13:2', '14:3 11:1 14:2 16:2 14:4 r:2 11:2'],
    B: { k: -3, endProg: [[1, 4], 0], end: ['14:2 12:2 10:2 12:2 13:2 15:2 17:2 15:2', '14:3 11:1 14:2 16:2 18:4 r:4'] },
  },
];

/** Menú principal: himno de aventura en pop-rock luminoso, con trompas y timbales. */
const MENU_DATA = {
  name: 'Crónicas de la llave roja', epic: 3, bpm: 120, sc: 'maj', root: 55, swing: 0.08, leadVoice: 'flute', compVoice: 'piano', comp: 'charleston', bassPat: 'pop', groove: 'pop', echo: true, leadV: 0.048,
  prog: [0, [5, 1], 3, [4, 0], 0, [2, 5], [1, 4], 0],
  tuneText: ['7:2 7:1 7:1 11:2 9:2 11:2 14:4 r:2', '14:2 12:1 14:1 16:2 14:2 15:2 14:1 12:1 10:2 12:2', '14:3 12:1 10:2 12:2 14:2 16:2 18:2 16:2', '15:2 13:1 11:1 13:2 15:2 14:2 11:1 14:1 16:2 14:2',
    '11:2 14:1 16:1 18:2 16:2 14:2 11:2 14:2 16:2', '16:2 14:1 13:1 11:2 9:2 12:2 14:1 16:1 18:2 16:2', '14:2 12:1 10:1 12:2 14:2 15:2 13:1 11:1 13:2 15:2', '14:4 r:2 11:2 14:2 16:2 14:4'],
  B: { k: -3, endProg: [[1, 4], 0], end: ['14:2 12:2 10:2 12:2 15:2 13:2 11:2 13:2', '14:4 r:2 9:2 11:2 14:2 16:4'] },
};

/** Elección de héroe: llamada a la aventura en Si menor al galope, que se abre hacia Re mayor. */
const HEROES_DATA = {
  name: 'Un compañero, un poder', epic: 3, bpm: 128, sc: 'min', root: 47, swing: 0.06, leadVoice: 'brass', compVoice: 'piano', comp: 'charleston', bassPat: 'gallop', groove: 'drive', echo: false, leadV: 0.048,
  prog: [0, 5, [2, 6], 0, 0, 5, [3, 4], 0],
  tuneText: ['r:2 7:2 9:2 11:2 14:2 11:2 14:2 16:2', '14:2 16:2 18:4 16:2 14:2 12:2 14:2', '16:2 15:1 13:1 11:2 13:2 13:2 15:1 17:1 15:2 13:2', '14:3 11:1 9:2 7:2 9:2 11:2 14:4',
    '7:2 9:1 11:1 14:2 13:2 11:2 9:2 11:2 14:2', '16:2 14:1 16:1 18:2 16:2 14:2 12:2 14:2 16:2', '14:2 12:1 10:1 12:2 14:2 15:2 13:1 11:1 13:2 15:2', '14:2 r:2 11:2 9:2 7:4 r:4'],
  B: { k: 2, endProg: [[3, 4], 0], end: ['16:2 14:2 12:2 14:2 15:2 13:2 11:2 13:2', '14:4 r:2 11:2 7:4 r:4'] },
};

/** Completa los 8 compases de la sección A con la B desplazada (si el tema usa el atajo `B`) hasta tener 16. */
function expand(d) {
  if (!d.B) return d;
  const n = SCALES[d.sc].length;
  const { k, end, endProg } = d.B;
  return {
    ...d,
    tuneText: [...d.tuneText, ...d.tuneText.slice(0, 6).map((b) => shiftBar(b, k)), ...end],
    prog: [...d.prog, ...d.prog.slice(0, 6).map((e) => shiftEntry(e, k, n)), ...endProg],
  };
}

/** Valores comunes de timbre (suaves) que cada tema puede sobrescribir. */
const build = (raw) => {
  const d = expand(raw);
  return {
    padW: 'sine', padV: 0.016, bassV: 0.07, compV: 0.02, arpV: 0.02, leadV: 0.042, epic: 1, groove: 'pop', echo: false, ...d,
    tune: d.tuneText.map((b) => parseBar(b).notes),
  };
};

export const ZONE_THEMES = THEME_DATA.map(build);
export const MENU_THEME = build(MENU_DATA);
export const HEROES_THEME = build(HEROES_DATA);
export const ALL_THEMES = [...ZONE_THEMES, MENU_THEME, HEROES_THEME];
