/**
 * Voces de los héroes al llegar a cada ciudad (una frase por ciudad, 3-7 s). Los audios están en public/voces/
 * (`<héroe>-<ciudad 01-10>.m4a`) y el texto sirve de subtítulo. Guion y dirección de voz: output/voces/guion-voces.md
 * (el id interno de Juth sigue siendo «van»; sus archivos se llaman juth-NN).
 */
export const VOICE_FILE = { lia: 'lia', jean: 'jean', van: 'juth' };

export const VOICE_LINES = {
  lia: [
    'El Valle. Aquí encendí mi brasa por primera vez. Vamos, la niebla no nos va a ganar.',
    'Los Kogn dejaron velas encendidas. Alguien nos esperaba, aunque el mar callara.',
    'Arena y silencio. Pero el fuego no se apaga ni en el desierto. Sigamos.',
    'Las hojas caen sin nombre… pero yo recuerdo el tuyo. Adelante.',
    'Hierro frío y relojes mudos. Aun así, aquí dentro algo late. Escúchalo.',
    'El hielo muerde, sí. Pero mi llama es testaruda. No me detengo.',
    'Flores quietas, como esperando. Hagámoslas florecer, un tablero a la vez.',
    'Este calor lo conozco. La brasa de este volcán y la mía son hermanas.',
    'Tan alto… Los Aluen tejieron esto con luz. Que Vhorn no la apague.',
    'El trono está vacío, pero la sombra de Vhorn sigue aquí. Hoy encendemos el Faro.',
  ],
  jean: [
    'Mi reloj calló antes que esta niebla. Pero cada paso cuenta, y yo cuento los pasos.',
    'Las mareas vuelven. Las horas perdidas, casi nunca. Casi.',
    'Los Sahrim cuentan pozos. Yo cuento segundos. Ninguno de los dos va a perder la cuenta.',
    'Otoño: el mismo instante cayendo una y otra vez. Aprendamos a salir del bucle.',
    'Mi torre. Los engranajes callan, pero yo sé qué hora era. Y cómo volver a ella.',
    'El hielo guarda el segundo exacto antes de la caída. Pisemos justo después.',
    'Cada pétalo suspendido es una deuda con el mañana. Vamos a saldarla.',
    'La fragua mide el tiempo en golpes. Marquemos el nuestro, con calma.',
    'Aquí arriba hasta el pasado vuelve a ser camino. Interesante. Sígueme.',
    'Tri cerró la hora final. Pero yo sé desandar un paso… y dar uno nuevo.',
  ],
  van: [
    'En mi códice falta la página donde este valle perdió la luz. Hoy la escribiremos.',
    'Cada farol del muelle escribe una señal. Los Kogn la leen; yo aprendo.',
    'Bajo esta arena yace una palabra que ni los Sahrim osaron pronunciar. La buscaré.',
    'Los Ennari escribían a sus muertos en la corteza. Aquí cayeron todos los nombres. Los devolveré.',
    'Engranajes que repiten una historia sin pulso. Démosle un final con pulso.',
    'El hielo guarda cicatrices más claras que cualquier tinta. Leámoslas.',
    'Entre cerezos mudos, una sola runa anuncia la salida. Ahí está. ¿La ves?',
    'La ceniza aún revela el rastro de quien pasó… y de quien apagó. Sigámoslo.',
    'Las estrellas trazan el margen que faltaba en mi códice. Ya casi está completo.',
    'La última hoja quedó en blanco. Hoy decimos el nombre que falta, y la cerramos.',
  ],
};

/** Ruta (relativa a la raíz del sitio) del audio de un héroe en una ciudad (0-9). */
export const voicePath = (heroId, city) => `voces/${VOICE_FILE[heroId] || heroId}-${String(city + 1).padStart(2, '0')}.m4a`;
