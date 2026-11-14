# Guion de voces de los héroes (llegada a cada ciudad)

30 frases cortas (3 héroes × 10 ciudades). Cada una se oye al empezar el primer nivel de una ciudad nueva. Duración objetivo: **3–7 segundos**.

## Cómo entregarlas (lo más fácil para ambos)

- **Un archivo por frase**, ya recortado, con este nombre exacto: `lia-01.mp3` … `lia-10.mp3`, `jean-01.mp3` … `jean-10.mp3`, `juth-01.mp3` … `juth-10.mp3` (el número es la ciudad, 01 = Valle Esmeralda … 10 = Castillo Dorado).
- Formato **MP3 o WAV** (se convierten solos), mono o estéreo, sin música ni ruido de fondo, con medio segundo de silencio al principio y al final.
- Déjalos en una carpeta nueva `public/voces/` (o pásamelos y los coloco yo).
- Si prefieres **un solo archivo largo por héroe** (las 10 frases seguidas con 2 s de silencio entre ellas), también sirve: hay que cortarlo y para eso se necesita `ffmpeg` (ahora no está instalado en este equipo; se instala con un comando).

## Dirección de voz (para el generador de voz)

- **Lía** (Portadora de la Brasa): joven, valiente y cálida; directa, con una sonrisa en la voz. Ritmo vivo, energía, un punto de testarudez. Nunca grita.
- **Jean** (Vigía del Péndulo): sereno, preciso e irónico; voz grave y tranquila, pausas medidas, como quien cuenta cada segundo. Un toque de humor seco.
- **Juth** (Escriba de las Runas): reflexivo y misterioso; voz suave, casi susurrada, cadencia de quien lee en voz alta un libro antiguo. Pausas poéticas.

## Frases

### Lía

| Archivo | Ciudad | Frase |
|---|---|---|
| lia-01 | Valle Esmeralda | El Valle. Aquí encendí mi brasa por primera vez. Vamos, la niebla no nos va a ganar. |
| lia-02 | Puerto de las Velas | Los Kogn dejaron velas encendidas. Alguien nos esperaba, aunque el mar callara. |
| lia-03 | Oasis Dorado | Arena y silencio. Pero el fuego no se apaga ni en el desierto. Sigamos. |
| lia-04 | Aldea de Otoño | Las hojas caen sin nombre… pero yo recuerdo el tuyo. Adelante. |
| lia-05 | Ciudad del Reloj | Hierro frío y relojes mudos. Aun así, aquí dentro algo late. Escúchalo. |
| lia-06 | Refugio Glacial | El hielo muerde, sí. Pero mi llama es testaruda. No me detengo. |
| lia-07 | Villa Sakura | Flores quietas, como esperando. Hagámoslas florecer, un tablero a la vez. |
| lia-08 | Puerto del Volcán | Este calor lo conozco. La brasa de este volcán y la mía son hermanas. |
| lia-09 | Ciudad Celeste | Tan alto… Los Aluen tejieron esto con luz. Que Vhorn no la apague. |
| lia-10 | Castillo Dorado | El trono está vacío, pero la sombra de Vhorn sigue aquí. Hoy encendemos el Faro. |

### Jean

| Archivo | Ciudad | Frase |
|---|---|---|
| jean-01 | Valle Esmeralda | Mi reloj calló antes que esta niebla. Pero cada paso cuenta, y yo cuento los pasos. |
| jean-02 | Puerto de las Velas | Las mareas vuelven. Las horas perdidas, casi nunca. Casi. |
| jean-03 | Oasis Dorado | Los Sahrim cuentan pozos. Yo cuento segundos. Ninguno de los dos va a perder la cuenta. |
| jean-04 | Aldea de Otoño | Otoño: el mismo instante cayendo una y otra vez. Aprendamos a salir del bucle. |
| jean-05 | Ciudad del Reloj | Mi torre. Los engranajes callan, pero yo sé qué hora era. Y cómo volver a ella. |
| jean-06 | Refugio Glacial | El hielo guarda el segundo exacto antes de la caída. Pisemos justo después. |
| jean-07 | Villa Sakura | Cada pétalo suspendido es una deuda con el mañana. Vamos a saldarla. |
| jean-08 | Puerto del Volcán | La fragua mide el tiempo en golpes. Marquemos el nuestro, con calma. |
| jean-09 | Ciudad Celeste | Aquí arriba hasta el pasado vuelve a ser camino. Interesante. Sígueme. |
| jean-10 | Castillo Dorado | Tri cerró la hora final. Pero yo sé desandar un paso… y dar uno nuevo. |

### Juth

| Archivo | Ciudad | Frase |
|---|---|---|
| juth-01 | Valle Esmeralda | En mi códice falta la página donde este valle perdió la luz. Hoy la escribiremos. |
| juth-02 | Puerto de las Velas | Cada farol del muelle escribe una señal. Los Kogn la leen; yo aprendo. |
| juth-03 | Oasis Dorado | Bajo esta arena yace una palabra que ni los Sahrim osaron pronunciar. La buscaré. |
| juth-04 | Aldea de Otoño | Los Ennari escribían a sus muertos en la corteza. Aquí cayeron todos los nombres. Los devolveré. |
| juth-05 | Ciudad del Reloj | Engranajes que repiten una historia sin pulso. Démosle un final con pulso. |
| juth-06 | Refugio Glacial | El hielo guarda cicatrices más claras que cualquier tinta. Leámoslas. |
| juth-07 | Villa Sakura | Entre cerezos mudos, una sola runa anuncia la salida. Ahí está. ¿La ves? |
| juth-08 | Puerto del Volcán | La ceniza aún revela el rastro de quien pasó… y de quien apagó. Sigámoslo. |
| juth-09 | Ciudad Celeste | Las estrellas trazan el margen que faltaba en mi códice. Ya casi está completo. |
| juth-10 | Castillo Dorado | La última hoja quedó en blanco. Hoy decimos el nombre que falta, y la cerramos. |

## Opcional (si quieres más adelante)

Para dar más vida se pueden añadir 3 frases más por héroe: una al **empezar la aventura**, una al **perder** («La noche se cierra…») y una al **ganar el juego** («Thyes amanece»). No hacen falta para empezar.
