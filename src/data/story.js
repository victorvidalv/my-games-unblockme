/* The ten fragments form a complete story. Each city has one brief chapter. */
export const CHAPTERS=[
 {
  "seal": "Corazón",
  "title": "La llave que despertó",
  "end": "El fragmento del Corazón vuelve a latir. El valle recupera su luz.",
  "opening": "Tri apagó el Faro; la llave aún recuerda el alba."
 },
 {
  "seal": "Marea",
  "title": "Las velas sin viento",
  "end": "El fragmento de la Marea despierta. Las velas vuelven a hincharse.",
  "opening": "Tri encadenó el viento bajo un mar que ya no duerme."
 },
 {
  "seal": "Agua",
  "title": "El pozo de las estrellas",
  "end": "El fragmento del Agua vuelve al cielo. El oasis renace bajo la arena.",
  "opening": "Tri enterró una estrella; el agua olvidó el camino."
 },
 {
  "seal": "Memoria",
  "title": "El árbol que olvidó su nombre",
  "end": "El fragmento de la Memoria vuelve a cantar. La aldea recuerda su nombre.",
  "opening": "Tri robó los nombres, pero las raíces siguen susurrando."
 },
 {
  "seal": "Chispa",
  "title": "La ciudad sin mañana",
  "end": "El fragmento de la Chispa despierta los relojes. La ciudad vuelve a avanzar.",
  "opening": "Tri detuvo los relojes; alguien permanece al otro lado del mañana."
 },
 {
  "seal": "Valor",
  "title": "La canción bajo el hielo",
  "end": "El fragmento del Valor rompe el silencio. Las campanas vuelven a sonar.",
  "opening": "Tri selló la canción bajo un hielo que respira."
 },
 {
  "seal": "Vida",
  "title": "La primavera detenida",
  "end": "El fragmento de la Vida despierta el jardín. Los pétalos vuelven a bailar.",
  "opening": "Tri negó la primavera; un pétalo todavía espera caer."
 },
 {
  "seal": "Fuego",
  "title": "La fragua del volcán",
  "end": "El fragmento del Fuego vuelve a la llave. El volcán protege de nuevo al puerto.",
  "opening": "Tri encerró el fuego; las cenizas conservan su juramento."
 },
 {
  "seal": "Cielo",
  "title": "El puente entre las estrellas",
  "end": "El fragmento del Cielo une las islas. La ruta al castillo vuelve a existir.",
  "opening": "Tri quebró el puente; las estrellas recuerdan dónde estaban sus pasos."
 },
 {
  "seal": "Alba",
  "title": "La puerta del amanecer",
  "end": "Los diez fragmentos se unen. El Faro del Alba vuelve a iluminar las diez ciudades.",
  "opening": "Tri guarda la última puerta, pero ya no es dueño del alba."
 }
];
export const HERO_LORE={
 lia:{chapterLines:["Mi corazón late por una luz que todavía no veo.", "Juré traer de vuelta a quienes no llegaron al puerto.", "Una promesa aún arde bajo esta arena.", "Aunque olvide mi nombre, reconoceré a quien necesita mi mano.", "Mi cristal conserva un latido que Tri no pudo detener.", "Hay manos que siguen buscando calor al otro lado del hielo.", "Guardaré esta flor hasta que el viento se atreva a volver.", "La llama no distingue entre una herida y un hogar.", "Daré el primer paso, aunque el vacío no me devuelva la mirada.", "No he traído una espada, sino las luces que dejaste atrás."],quote:'«Mientras quede una luz, seguiremos.»',thanksWin:'«Gracias por caminar conmigo. Hoy devolvimos la luz a diez ciudades. ¿Buscamos juntos otro amanecer?»',thanksLoss:'«Gracias por no soltar mi mano. Mi luz necesita descansar, pero nuestra historia puede empezar otra vez. ¿Volvemos a intentarlo?»'},
 jean:{chapterLines:["Mi reloj se detuvo antes de que naciera la noche.", "La marea regresa; mis horas perdidas, no.", "La arena siempre cae, incluso donde el tiempo fue enterrado.", "Una voz sin nombre todavía sabe cuándo debo regresar.", "He visto esta hora antes, pero nunca su final.", "El invierno guarda un segundo que todavía no he vivido.", "Algunos instantes florecen solo después de perderlos.", "Mi reloj cuenta golpes de forja, no latidos.", "Un paso que aún no he dado ya me espera en la otra orilla.", "Tri olvidó que hasta la noche debe llegar tarde alguna vez."],quote:'«El futuro aún puede cambiar.»',thanksWin:'«Gracias por darme tu tiempo. Juntos encontramos un mañana para estas ciudades. ¿Qué futuro descubriremos en la próxima aventura?»',thanksLoss:'«Gracias por cada intento. Este reloj se ha detenido, pero todavía quedan otros futuros. ¿Me acompañas a buscar uno más?»'},
 van:{chapterLines:["En mi libro falta la página donde Tri aprendió su nombre.", "Dos luces bastan para leer lo que el mar se tragó.", "La estrella cayó sobre una palabra que nadie se atreve a pronunciar.", "Las hojas vacías pesan más que los libros cerrados.", "Alguien escribió el mañana con tinta que aún no existe.", "No toda canción necesita una voz para seguir esperando.", "El último pétalo guarda una historia que todavía no termina.", "Entre las cenizas, una letra sigue encendida.", "El cielo dejó un margen para quien no encontrara el puente.", "La última página está vacía porque Tri nunca pudo escribir nuestro final."],quote:'«Siempre queda una página por escribir.»',thanksWin:'«Gracias por escribir esta leyenda conmigo. Las diez ciudades recordarán nuestro viaje. ¿Abrimos el libro de una aventura nueva?»',thanksLoss:'«Gracias por llegar hasta aquí conmigo. Hoy cerramos el libro para descansar. Cuando quieras, abriremos juntos una página nueva.»'}
};
export const HERO_TALK={
 lia:{win:['Otra puerta menos.','Vamos, queda camino.','Lo sabía. Casi.'],bonus:{cards:'«Esta la abro yo.»',wheel:'«Que gire. Nosotros seguimos.»',slots:'«A ver si esta vez se ponen de acuerdo.»'},prize:'«Para la puerta difícil. La de después.»',empty:'«Bueno. Nadie dijo que fuera fácil.»'},
 jean:{win:['Justo a tiempo.','Llegamos antes que ayer.','Un problema menos.'],bonus:{cards:'«Las cartas nunca llegan tarde.»',wheel:'«Un reloj sin agujas. Sospechoso.»',slots:'«Tres relojes y ninguno da la hora.»'},prize:'«Nos ahorra unos cuantos errores.»',empty:'«Nos debe una.»'},
 van:{win:['Encaja. Sigamos.','Lo anoto.','Había una salida.'],bonus:{cards:'«Las marcas se repiten. Observa.»',wheel:'«La aguja también cuenta una historia.»',slots:'«Tres ecos. Escuchemos.»'},prize:'«Lo guardo para cuando haga falta.»',empty:'«También conviene anotar lo que no funciona.»'}
};
