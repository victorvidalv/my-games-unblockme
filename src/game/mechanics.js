import { zoneIdx } from '../data/zones.js';

/**
 * Piezas especiales y calendario de niveles. Cada ciudad tiene su mecánica; los primeros niveles de cada ciudad
 * son normales y la mecánica aparece en los tramos 3, 5, 6, 8, 9 y 10.
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
  ice: {
    id: 'ice', icon: 'ice', name: 'Pieza de hielo', chip: 'Hielo: hasta el tope',
    tip: 'Resbala sin freno: en cuanto la empujas, patina hasta chocar con otra pieza, una roca o el borde. No puede parar a medias.',
  },
};

/** Familia dominante por ciudad (referencia de progresión; ver LEVEL_FAMILIES para cada nivel 1..100). */
export const CITY_FAMILY = ['walls', 'walls', 'heavy', 'gates', 'ice', 'duo', 'mixed', 'mixed', 'mixed', 'mixed'];

/**
 * Calendario de los 100 niveles:
 *   1–9   solo tableros normales (`plain`)
 *   10+   rocas (`walls`) a veces (tutorial en el 10)
 *   20+   pesadas (`heavy`) a veces (tutorial en el 20); hasta el 50, máximo 1 tipo por nivel
 *   30+   candados (`gates`) a veces (tutorial en el 30)
 *   40+   hielo (`ice`) a veces (tutorial en el 40)
 *   51+   combinaciones de piezas (`duo` y `mixed`) en dificultad ascendente junto a individuales y respiros normales
 */
export const LEVEL_FAMILIES = [
  // 1..10
  'plain', 'plain', 'plain', 'plain', 'plain', 'plain', 'plain', 'plain', 'plain', 'walls',
  // 11..20
  'plain', 'plain', 'walls', 'plain', 'plain', 'walls', 'plain', 'walls', 'plain', 'heavy',
  // 21..30
  'plain', 'walls', 'plain', 'plain', 'heavy', 'plain', 'walls', 'plain', 'heavy', 'gates',
  // 31..40
  'plain', 'heavy', 'plain', 'walls', 'plain', 'gates', 'plain', 'heavy', 'gates', 'ice',
  // 41..50 (aún de un solo tipo por nivel)
  'plain', 'walls', 'plain', 'ice', 'gates', 'plain', 'heavy', 'plain', 'ice', 'gates',
  // 51..60 (pasado el 50 ya se pueden combinar)
  'duo', 'plain', 'ice', 'plain', 'duo', 'heavy', 'plain', 'walls', 'plain', 'duo',
  // 61..70
  'gates', 'plain', 'duo', 'plain', 'mixed', 'plain', 'ice', 'duo', 'plain', 'mixed',
  // 71..80
  'duo', 'plain', 'mixed', 'walls', 'plain', 'duo', 'plain', 'mixed', 'ice', 'mixed',
  // 81..90
  'mixed', 'plain', 'duo', 'plain', 'mixed', 'heavy', 'plain', 'mixed', 'duo', 'mixed',
  // 91..100
  'mixed', 'duo', 'plain', 'mixed', 'ice', 'plain', 'mixed', 'duo', 'mixed', 'mixed',
];

const INTRO_LEVELS = new Set([10, 20, 30, 40, 51]);

/** Qué mecánicas contiene una familia de tableros. */
export const mechanicsOfFamily = (family) => ({
  plain: [],
  walls: ['wall'],
  gates: ['gate'],
  heavy: ['heavy'],
  ice: ['ice'],
  duo: ['gate', 'heavy', 'ice'],
  mixed: ['wall', 'gate', 'heavy', 'ice'],
}[family] ?? []);

/** Plan de un nivel (1..100): {family, city, step, intro, mechanics}. */
export function levelPlan(level) {
  const city = zoneIdx(level);
  const step = ((level - 1) % 10) + 1;
  const family = LEVEL_FAMILIES[level - 1] ?? 'mixed';
  return { family, city, step, intro: INTRO_LEVELS.has(level), mechanics: mechanicsOfFamily(family) };
}

/**
 * Tableros de aprendizaje hechos a mano: la PRIMERA vez que aparece cada pieza, el nivel es un tablero minúsculo
 * (3 movimientos) pensado para entender cómo funciona, con la guía señalando cada movimiento.
 * Formato de los tableros: ver encodeBoard (src/engine/board.js).
 */
export const TUTORIALS = {
  wall: {
    level: 10,
    board: 'h2.2.0 v2.3.2 h2.4.3 #1.3',          // la roca (1,3) impide subir el bloque vertical: hay que bajarlo
    steps: [
      'Esta roca no se mueve. Rodéala: mueve el bloque que brilla.',
      'Bien. Ahora el bloque vertical puede bajar.',
      '¡Hay camino! Saca la llave roja.',
    ],
  },
  heavy: {
    level: 20,
    board: 'h2.2.0 v2.3.2p #4.3',                // pesada: sube de a una casilla; la roca (4,3) impide bajarla
    steps: [
      'Esta pieza es pesada: solo avanza UNA casilla por movimiento. Muévela hacia arriba.',
      'Una casilla más…',
      '¡Listo! Saca la llave roja.',
    ],
  },
  gate: {
    level: 30,
    board: 'h2.2.0 v2.3.1g5.0 h2.5.3',            // candado vertical con la placa en (5,0); solo el bloque de abajo llega a ella
    steps: [
      'Este bloque tiene candado y está atrapado. Cubre la placa ▣ con el bloque que brilla.',
      '¡La placa brilla! El candado se abrió: ahora sí puedes moverlo.',
      'Camino libre. Saca la llave roja.',
    ],
  },
  ice: {
    level: 40,
    board: 'h2.2.0 v3.3.0i h2.3.2',             // hielo: primero aparta el tope de abajo y luego patina de golpe hasta el fondo
    steps: [
      'Esta pieza es de hielo y patina sin parar hasta un tope. Primero aparta el bloque que brilla.',
      '¡Camino despejado! Empuja la pieza de hielo hacia abajo: patinará hasta el borde.',
      '¡Patina en un solo movimiento! Ahora saca la llave roja.',
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
