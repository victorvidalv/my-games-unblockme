/* Thyes, año 4133: diez reinos sellados por Tri tras la noche de Vhorn, y la senda de regreso al alba. Nombres y trama: src/data/lore.js */
import { INSCRIPTIONS } from './lore.js';

export const CHAPTERS = [
  {
    seal: 'Corazón',
    title: 'El umbral de musgo',
    end: 'El sello del Corazón se quiebra. La bruma cede paso en el valle.',
    opening: 'Thyes, año 4133. Vhorn apagó el Faro del Alba y Tri selló el primer reino; bajo la niebla verde aún respira un sendero.',
    cityLines: [
      'Puentes de piedra duermen bajo el musgo; los antiguos Kogn los marcaron con una espiral que nadie descifra.',
      'La niebla espesa guarda el primer umbral.',
      'Solo la llave roja recuerda el camino.',
    ],
  },
  {
    seal: 'Marea',
    title: 'Las velas inmóviles',
    end: 'El sello de la Marea cae. Los faroles vuelven a arder en el muelle y los Kogn cantan en su lengua vieja.',
    opening: 'Los antiguos Kogn, pueblo de las mareas, amarraban aquí sus naves cada invierno; ahora las quillas callan en agua muerta y hasta el viento teme soltar amarras.',
    cityLines: [
      'Los Kogn aún encienden una vela en cada muelle: dicen que el mar recuerda a quien lo espera.',
      'Las velas arden sin viento ni mañana.',
      'Cada paso abre hueco entre cadenas.',
    ],
  },
  {
    seal: 'Agua',
    title: 'El pozo de arena',
    end: 'El sello del Agua brota de nuevo. La sed abandona la arena y los Sahrim vuelven a contar pozos.',
    opening: 'Los Sahrim cruzaban estas dunas contando pozos como quien cuenta años; el oro del desierto cubrió el agua viva y cae la noche seca.',
    cityLines: [
      'Dunas doradas sepultan el último pozo de los Sahrim.',
      'El sol no perdona los rodeos inútiles.',
      'La estrella hundida aún marca la salida.',
    ],
  },
  {
    seal: 'Memoria',
    title: 'Hojas sin nombre',
    end: 'El sello de la Memoria despierta. La aldea pronuncia su nombre y los Ennari vuelven a escribirlo en la corteza.',
    opening: 'Cayeron las hojas y con ellas los nombres; los Ennari, que escribían a sus muertos en la corteza, buscan aún la voz entre las raíces.',
    cityLines: [
      'Hojas secas borran toda huella reciente.',
      'Los altares ennari callan entre árboles dorados.',
      'Mira despacio: la senda muta al caer la tarde.',
    ],
  },
  {
    seal: 'Chispa',
    title: 'Engranajes mudos',
    end: 'El sello de la Chispa gira otra vez. La torre retoma su vigilia.',
    opening: 'El péndulo calló en mitad de la noche del año 4133; el acero aguarda un pulso exacto y los relojeros kogn y ennari firmaron juntos cada engranaje.',
    cityLines: [
      'Las agujas callan sobre torres de bronce.',
      'Un giro torpe cierra toda la calle.',
      'Aquí el orden vence antes que la prisa.',
    ],
  },
  {
    seal: 'Valor',
    title: 'Filo de escarcha',
    end: 'El sello del Valor rompe el témpano. El eco regresa a la cumbre.',
    opening: 'El hielo sepultó la campana del monte, la que los Aluen oían desde el cielo; quien pisa sin tino resbala hasta el borde.',
    cityLines: [
      'La escarcha convierte el paso en caída.',
      'El refugio calla bajo un manto blanco.',
      'Quien toca el hielo cruza hasta el final.',
    ],
  },
  {
    seal: 'Vida',
    title: 'Pétalos cautivos',
    end: 'El sello de la Vida florece. La brisa devuelve la primavera.',
    opening: 'Los Sahrim trajeron la primera semilla de cerezo cruzando tres desiertos; hoy el último aliento del jardín no abre sin un cerco roto.',
    cityLines: [
      'Un jardín inmóvil vigila la puerta.',
      'Los cerezos aguardan un gesto preciso.',
      'Tras la calma, el cerrojo aún resiste.',
    ],
  },
  {
    seal: 'Fuego',
    title: 'Muelles de ceniza',
    end: 'El sello del Fuego arde limpio. El puerto vuelve a forjar su destino.',
    opening: 'La brasa duerme bajo piedra negra; las rejas del puerto guardan el calor que Vhorn no pudo apagar.',
    cityLines: [
      'La ceniza cubre las losas de basalto.',
      'La fragua respira bajo el muelle oscuro.',
      'Mide la ruta antes de cruzar el acero.',
    ],
  },
  {
    seal: 'Cielo',
    title: 'Puentes del abismo',
    end: 'El sello del Cielo tiende el último puente. El castillo aguarda arriba.',
    opening: 'Los Aluen tejieron estas islas bajo las estrellas; la noche de Vhorn cortó sus puentes y solo queda la vía de luz.',
    cityLines: [
      'La noche envuelve las torres suspendidas.',
      'Cada tablero pesa como un juramento.',
      'Solo la lucidez cruza este abismo.',
    ],
  },
  {
    seal: 'Alba',
    title: 'El trono vacío',
    end: 'El último sello cae en silencio. Las tres luces encienden el Faro del Alba y la sombra de Vhorn se encoge.',
    opening: 'Tras diez reinos rotos aguarda el Faro. En el trono dorado no hay nadie: solo la sombra de Vhorn, que espera a que alguien diga su nombre.',
    cityLines: [
      'Murallas de oro guardan la cámara final.',
      'Todas las cenizas desembocan aquí.',
      'Abre el paso y devuelve el alba a Thyes.',
    ],
  },
].map((c, i) => ({ ...c, inscription: INSCRIPTIONS[i] }));

export const HERO_LORE = {
  lia: {
    chapterLines: [
      'La niebla intenta apagar mi brasa, pero aún camino.',
      'Los Kogn me dieron una vela para el camino; mi llama tiembla sobre el agua quieta.',
      'La arena bebe toda lluvia, mas no toca el fuego que llevo.',
      'Las hojas caen sin dueño; sigo buscando a quien guiaba.',
      'Hierro muerto y relojes mudos. Aun así, un latido persiste.',
      'El hielo muerde la piel, pero protege la última chispa.',
      'Entre flores inmóviles, hasta la ceniza pide volver a vivir.',
      'Este volcán late como una herida antigua. No me detendré.',
      'Arriba, los Aluen tejieron luz entre estrellas frías; ni Vhorn la apaga.',
      'Llegué al castillo sin corona, solo con la llama que salvamos.',
    ],
    quote: '«Incluso la ceniza recuerda el calor.»',
    endingLore: 'Lía entrega la última brasa al Faro del Alba. La sombra de Vhorn se encoge y, por primera vez desde el año 4133, Thyes ve amanecer.',
    thanksWin: '«Mi llama resistió la caída porque no me soltaste. El alba vuelve a arder.»',
    thanksLoss: '«La brasa se apaga por hoy, viajero. Cuando vuelvas a llamar, volverá a arder.»',
  },
  jean: {
    chapterLines: [
      'Mi reloj calló antes de esta niebla. Cada paso pesa siglos.',
      'Las mareas regresan; las horas perdidas, casi nunca.',
      'La arena mide un tiempo que nadie quiso contar.',
      'El otoño repite siempre el mismo instante caído.',
      'Aquí nacieron mis engranajes, y aquí aprendí a retroceder.',
      'El hielo guarda el segundo exacto antes de la derrota.',
      'Cada pétalo suspendido es una deuda con el mañana.',
      'En esta fragua el tiempo se mide en golpes y ceniza.',
      'Entre astros altos, hasta el pasado vuelve a ser camino.',
      'Tri cerró la hora final, pero olvidó que yo sé desandar el paso.',
    ],
    quote: '«Todo error deja una grieta por donde volver.»',
    endingLore: 'Jean ajusta la última aguja sobre el Faro del Alba. La hora detenida desde el año 4133 vuelve a correr por los diez reinos de Thyes.',
    thanksWin: '«Cada paso atrás valió la pena. Devolvimos el mañana a diez reinos.»',
    thanksLoss: '«El péndulo se detiene aquí. Descansa; otro ciclo aún espera su hora.»',
  },
  van: {
    chapterLines: [
      'En mi libro falta la página donde este valle perdió la luz.',
      'Las quillas callan, mas cada farol escribe una señal.',
      'Bajo esta arena yace una palabra que ni los Sahrim osaron pronunciar.',
      'Las hojas caídas ocultan los nombres que los Ennari guardaban, y que Tri, dicen, borró.',
      'Engranajes fríos repiten una historia escrita sin pulso.',
      'El hielo guarda cicatrices más claras que cualquier tinta.',
      'Entre cerezos mudos, una sola runa anuncia la salida.',
      'Sobre la piedra negra, la ceniza aún revela el rastro.',
      'Las estrellas trazan el margen que faltaba en mi códice.',
      'La última hoja quedó en blanco; hoy la cerramos frente al trono.',
    ],
    quote: '«Lo que no se nombra sigue buscando salida.»',
    endingLore: 'Juth traza el último signo sobre el Faro del Alba y pronuncia el nombre que faltaba. Thyes recuerda, y Vhorn ya no tiene con qué apagarla.',
    thanksWin: '«Cerramos el códice con luz limpia. Los diez reinos ya recuerdan su nombre.»',
    thanksLoss: '«Faltaron líneas en esta página, compañero. Volveremos a abrir el libro.»',
  },
};

export const HERO_TALK = {
  lia: {
    win: ['Una puerta menos.', 'La brasa sigue viva.', 'Todavía queda senda.'],
    bonus: {
      cards: '«Alza los sellos. Veamos qué esconden.»',
      wheel: '«Deja que gire el hierro. Seguimos.»',
      slots: '«Tres ascuas alineadas abren paso.»',
      catch: '«¡No dejes que se apaguen esas chispas!»',
      runes: '«Que las runas recuerden por nosotros.»',
      pendulum: '«Pulso firme. Que la llama no tiemble.»',
    },
    prize: '«Nos guardará del próximo umbral.»',
    empty: '«La ceniza nada regala hoy.»',
  },
  jean: {
    win: ['Justo a tiempo.', 'El pulso no falló.', 'Un error menos en la cuenta.'],
    bonus: {
      cards: '«Cada marca vuelve a su sitio.»',
      wheel: '«Un péndulo sin agujas. Probemos.»',
      slots: '«Tres relojes buscando la misma hora.»',
      catch: '«Duran un suspiro. Mide el segundo.»',
      runes: '«La memoria es un reloj: repite el tic.»',
      pendulum: '«Mi viejo péndulo. Este sí sé pararlo.»',
    },
    prize: '«Tiempo ganado para lo que viene.»',
    empty: '«El reloj cobró su peaje.»',
  },
  van: {
    win: ['Queda escrito.', 'El signo cedió.', 'Había una salida oculta.'],
    bonus: {
      cards: '«Las runas se repiten. Observa.»',
      wheel: '«Cada giro traza una línea nueva.»',
      slots: '«Tres ecos antiguos. Escucha.»',
      catch: '«Lee el trazo antes de atrapar.»',
      runes: '«Las runas se escriben una a una. Léelas.»',
      pendulum: '«El signo exacto está en el centro.»',
    },
    prize: '«Lo guardo entre las páginas.»',
    empty: '«Conviene anotar también este vacío.»',
  },
};
