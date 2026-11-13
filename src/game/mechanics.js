import { zoneIdx } from '../data/zones.js';

/**
 * Piezas especiales y calendario de niveles. Cada ciudad tiene su mecánica; los niveles 1-2 de cada ciudad
 * son normales, la mecánica aparece en el 3, 5, 6, 8 y 9, y el nivel 10 es el JEFE de la ciudad.
 * (El Valle empieza más tarde, en el 6, para que los primeros niveles enseñen lo básico.)
 */
export const MECHANICS = {
  wall: {
    id: 'wall', icon: 'rock', name: 'Roca fija', chip: 'Roca fija',
    tip: 'Las rocas no se mueven ni se pueden empujar. Rodéalas para abrirle camino a la llave roja.',
  },
  gate: {
    id: 'gate', icon: 'lock', name: 'Candado', chip: 'Candado: cubre ▣',
    tip: 'Esta pieza está atrapada. Se libera mientras OTRA pieza cubra la placa ▣ del suelo. En cuanto la tapes, el candado se abre.',
  },
  heavy: {
    id: 'heavy', icon: 'weight', name: 'Pieza pesada', chip: 'Pesada: 1 paso',
    tip: 'Esta pieza pesa tanto que solo avanza UNA casilla por movimiento. Planifica cada paso.',
  },
};

/** Familia de tableros que usa cada ciudad (mismo orden que ZONES). */
export const CITY_FAMILY = ['walls', 'walls', 'gates', 'heavy', 'gates', 'heavy', 'gates', 'walls', 'mixed', 'mixed'];

/** Nombre del jefe de cada ciudad. */
export const BOSS_NAMES = [
  'El Guardián del Valle', 'El Capitán Ancla', 'La Esfinge de Arena', 'El Espantapájaros Gigante', 'El Maestro Relojero',
  'El Coloso de Hielo', 'El Dragón de Papel', 'El Señor de la Fragua', 'El Vigía de las Estrellas', 'El Rey Dorado',
];

/** Los jefes están DESACTIVADOS de momento (no convencía su implementación). El código se conserva; ponlo en true para volver a verlos. */
export const BOSSES_ENABLED = false;

const BOSS_STEP = 10;
export { BOSS_POINTS } from '../engine/scoring.js'; // los jefes dan un 50 % más de puntos
export const BOSS_HINTS = 2;      // y dos pistas
export const BOSS_BOOST = 2;      // y piden 2 movimientos mínimos más de lo normal

/** Qué mecánicas contiene una familia de tableros. */
export const mechanicsOfFamily = (family) => ({
  plain: [], walls: ['wall'], gates: ['gate'], heavy: ['heavy'], mixed: ['wall', 'gate', 'heavy'],
}[family] ?? []);

/**
 * Plan de un nivel: {family, boss, city, step, intro, mechanics}.
 *  - intro: primer nivel de la ciudad con su mecánica (se explica con un aviso).
 */
export function levelPlan(level) {
  const city = zoneIdx(level);
  const step = ((level - 1) % 10) + 1;
  const boss = BOSSES_ENABLED && step === BOSS_STEP;
  const schedule = city === 0 ? [6, 8, 9, 10] : [3, 5, 6, 8, 9, 10];
  let family = 'plain';
  if (schedule.includes(step)) family = boss && city >= 3 ? 'mixed' : CITY_FAMILY[city];
  const intro = family !== 'plain' && step === schedule[0];
  return { family, boss, city, step, intro, mechanics: mechanicsOfFamily(family) };
}

/**
 * Tableros de aprendizaje hechos a mano: la PRIMERA vez que aparece cada pieza, el nivel es un tablero minúsculo
 * (3 movimientos) pensado para entender cómo funciona, con la guía señalando cada movimiento.
 * Formato de los tableros: ver encodeBoard (src/engine/board.js).
 */
export const TUTORIALS = {
  wall: {
    level: 6,
    board: 'h2.2.0 v2.3.2 h2.4.3 #1.3',          // la roca (1,3) impide subir el bloque vertical: hay que bajarlo
    steps: [
      'Esta roca no se mueve. Rodéala: mueve el bloque que brilla.',
      'Bien. Ahora el bloque vertical puede bajar.',
      '¡Hay camino! Saca la llave roja.',
    ],
  },
  gate: {
    level: 23,
    board: 'h2.2.0 v2.3.1g5.0 h2.5.3',            // candado vertical con la placa en (5,0); solo el bloque de abajo llega a ella
    steps: [
      'Este bloque tiene candado y está atrapado. Cubre la placa ▣ con el bloque que brilla.',
      '¡La placa brilla! El candado se abrió: ahora sí puedes moverlo.',
      'Camino libre. Saca la llave roja.',
    ],
  },
  heavy: {
    level: 33,
    board: 'h2.2.0 v2.3.2p #4.3',                // pesada: sube de a una casilla; la roca (4,3) impide bajarla
    steps: [
      'Esta pieza es pesada: solo avanza UNA casilla por movimiento. Muévela hacia arriba.',
      'Una casilla más…',
      '¡Listo! Saca la llave roja.',
    ],
  },
};

/** ¿Hay un tablero de aprendizaje para este nivel y esta pieza (si no se vio ya)? */
export function tutorialFor(level, seenTips = {}) {
  for (const [mech, t] of Object.entries(TUTORIALS)) {
    if (t.level === level && !seenTips[mech]) return { mech, ...t };
  }
  return null;
}
