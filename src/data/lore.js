/**
 * El mundo del juego: THYES, año 4133. Una sola fuente para los nombres que recorren todos los textos
 * (capítulos, héroes, tienda, revivir, finales…) y que los tests comprueban.
 *
 * Trama (críptica, se revela por capas):
 *  - Thyes tiene diez reinos. En el año 4133 la sombra de VHORN apagó el Faro del Alba y llegó la Noche Larga.
 *  - TRI, guardiana del Faro, selló los diez reinos. Todos creen que fue ella quien los encerró…
 *  - …pero los diez sellos llevan grabada una sola frase (INSCRIPTIONS), que se lee en orden: Tri cerró para proteger.
 *  - Tres luces despiertan lo sellado: la Brasa (Lía), la Hora (Jean) y la Palabra (Juth). La Llave Roja abre cada cerrojo.
 *  - Los cuatro pueblos antiguos —Kogn, Sahrim, Ennari y Aluen— guardan, cada uno, un pedazo de esa historia.
 */
export const WORLD = {
  name: 'Thyes',
  year: 4133,
  nextYear: 4134,
  beacon: 'el Faro del Alba',
  guardian: 'Tri',
  villain: 'Vhorn',
  key: 'la llave roja',
};

/** Pueblos antiguos de Thyes: cada uno vive (o vivía) en un reino y se nombra en sus capítulos. */
export const PEOPLES = [
  { id: 'kogn', name: 'Kogn', city: 1, trait: 'navegantes de las mareas antiguas' },
  { id: 'sahrim', name: 'Sahrim', city: 2, trait: 'caravaneros que cuentan pozos como quien cuenta años' },
  { id: 'ennari', name: 'Ennari', city: 3, trait: 'escribas de la corteza que escriben los nombres de los muertos en los árboles' },
  { id: 'aluen', name: 'Aluen', city: 8, trait: 'tejedores de puentes bajo las estrellas' },
];

/** La frase grabada en los diez sellos; leída en orden revela por qué cerró Tri. */
export const INSCRIPTIONS = [
  'Tri cerró las puertas.',
  'No por miedo a lo que entra,',
  'sino por lo que aún respiraba dentro.',
  'Cada reino guardó un nombre,',
  'y cada nombre, una hora.',
  'Tres luces pueden despertarlos:',
  'la brasa que no se rinde,',
  'la hora que sabe volver,',
  'la palabra que nombra lo perdido.',
  'Entonces Tri abrirá los ojos.',
];

/**
 * Retratos de la historia (public/historia/*.webp, 640×960). Se muestran en el diálogo de viaje del capítulo indicado
 * (índice de ciudad 0-9): los cuatro pueblos en su reino y Vhorn justo antes del Castillo Dorado.
 */
export const LORE_PORTRAITS = {
  1: { id: 'kogn', name: 'Los Kogn', caption: 'Navegantes de las mareas antiguas' },
  2: { id: 'sahrim', name: 'Los Sahrim', caption: 'Caravaneros que cuentan pozos como años' },
  3: { id: 'ennari', name: 'Los Ennari', caption: 'Escribas que escriben a sus muertos en la corteza' },
  8: { id: 'aluen', name: 'Los Aluen', caption: 'Tejedores de puentes bajo las estrellas' },
  9: { id: 'vhorn', name: 'Vhorn, el Apagador', caption: 'La sombra que apagó el Faro del Alba' },
};
export const lorePortraitSrc = (id) => `historia/${id}.webp`;
