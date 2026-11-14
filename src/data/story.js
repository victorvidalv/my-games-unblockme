/* Los Diez Sellos trazan una sola crónica oscura y clara: diez reinos sellados por Tri y la senda de regreso al alba. */
export const CHAPTERS = [
  {
    seal: 'Corazón',
    title: 'El umbral de musgo',
    end: 'El sello del Corazón se quiebra. La bruma cede paso en el valle.',
    opening: 'Tri apagó el Faro; bajo la niebla verde aún respira un sendero.',
    cityLines: [
      'Puentes de piedra duermen bajo el musgo.',
      'La niebla espesa guarda el primer umbral.',
      'Solo la llave roja recuerda el camino.',
    ],
  },
  {
    seal: 'Marea',
    title: 'Las velas inmóviles',
    end: 'El sello de la Marea cae. Los faroles vuelven a arder en el muelle.',
    opening: 'Las quillas callan en agua muerta; hasta el viento teme soltar amarras.',
    cityLines: [
      'Naves antiguas yacen presas del puerto.',
      'Las velas arden sin viento ni mañana.',
      'Cada paso abre hueco entre cadenas.',
    ],
  },
  {
    seal: 'Agua',
    title: 'El pozo de arena',
    end: 'El sello del Agua brota de nuevo. La sed abandona la arena.',
    opening: 'El oro del desierto cubrió el agua viva; bajo las dunas cae la noche seca.',
    cityLines: [
      'Dunas doradas sepultan el último pozo.',
      'El sol no perdona los rodeos inútiles.',
      'La estrella hundida aún marca la salida.',
    ],
  },
  {
    seal: 'Memoria',
    title: 'Hojas sin nombre',
    end: 'El sello de la Memoria despierta. La aldea pronuncia su nombre.',
    opening: 'Cayeron las hojas y con ellas los nombres; las raíces aún guardan la voz.',
    cityLines: [
      'Hojas secas borran toda huella reciente.',
      'Los altares callan entre árboles dorados.',
      'Mira despacio: la senda muta al caer la tarde.',
    ],
  },
  {
    seal: 'Chispa',
    title: 'Engranajes mudos',
    end: 'El sello de la Chispa gira otra vez. La torre retoma su vigilia.',
    opening: 'El péndulo calló en mitad de la noche; el acero aguarda un pulso exacto.',
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
    opening: 'El hielo sepultó la campana del monte; quien pisa sin tino resbala hasta el borde.',
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
    opening: 'Los cerezos sostienen su último aliento; ni una flor cae sin abrir el cerco.',
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
    opening: 'La brasa duerme bajo piedra negra; las rejas del puerto guardan su calor.',
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
    opening: 'Islas rotas flotan sobre el vacío; las estrellas trazan la única vía firme.',
    cityLines: [
      'La noche envuelve las torres suspendidas.',
      'Cada tablero pesa como un juramento.',
      'Solo la lucidez cruza este abismo.',
    ],
  },
  {
    seal: 'Alba',
    title: 'El trono del sello',
    end: 'El último sello cae en silencio. Los diez fragmentos encienden el Faro del Alba.',
    opening: 'Tras diez reinos rotos aguarda la puerta final. Tri vigila el último umbral.',
    cityLines: [
      'Murallas de oro guardan la cámara final.',
      'Todas las cenizas desembocan aquí.',
      'Abre el paso y devuelve el alba al mundo.',
    ],
  },
];

export const HERO_LORE = {
  lia: {
    chapterLines: [
      'La niebla intenta apagar mi brasa, pero aún camino.',
      'En este puerto quieto, mi llama tiembla sobre el agua.',
      'La arena bebe toda lluvia, mas no toca el fuego que llevo.',
      'Las hojas caen sin dueño; sigo buscando a quien guiaba.',
      'Hierro muerto y relojes mudos. Aun así, un latido persiste.',
      'El hielo muerde la piel, pero protege la última chispa.',
      'Entre flores inmóviles, hasta la ceniza pide volver a vivir.',
      'Este volcán late como una herida antigua. No me detendré.',
      'Arriba, entre estrellas frías, ninguna sombra alcanza mi fe.',
      'Llegué al castillo sin corona, solo con la llama que salvamos.',
    ],
    quote: '«Incluso la ceniza recuerda el calor.»',
    endingLore: 'Lía entrega la última brasa al Faro del Alba. La niebla se disipa y los diez reinos vuelven a respirar.',
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
    endingLore: 'Jean ajusta la última aguja sobre el Faro del Alba. El tiempo detenido vuelve a fluir por las diez tierras.',
    thanksWin: '«Cada paso atrás valió la pena. Devolvimos el mañana a diez reinos.»',
    thanksLoss: '«El péndulo se detiene aquí. Descansa; otro ciclo aún espera su hora.»',
  },
  van: {
    chapterLines: [
      'En mi libro falta la página donde este valle perdió la luz.',
      'Las quillas callan, mas cada farol escribe una señal.',
      'Bajo esta arena yace una palabra que nadie osa pronunciar.',
      'Las hojas caídas ocultan los nombres que Tri borró.',
      'Engranajes fríos repiten una historia escrita sin pulso.',
      'El hielo guarda cicatrices más claras que cualquier tinta.',
      'Entre cerezos mudos, una sola runa anuncia la salida.',
      'Sobre la piedra negra, la ceniza aún revela el rastro.',
      'Las estrellas trazan el margen que faltaba en mi códice.',
      'La última hoja quedó en blanco; hoy la cerramos frente al trono.',
    ],
    quote: '«Lo que no se nombra sigue buscando salida.»',
    endingLore: 'Juth traza el último signo sobre el Faro del Alba. Los nombres olvidados regresan a la memoria del mundo.',
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
    },
    prize: '«Lo guardo entre las páginas.»',
    empty: '«Conviene anotar también este vacío.»',
  },
};
