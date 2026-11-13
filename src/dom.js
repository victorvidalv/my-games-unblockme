/** Atajo para buscar un elemento por id. */
export const $ = (id) => document.getElementById(id);

/**
 * `url("…")` de CSS para una imagen de public/ (backgrounds, heroes…), con ruta ABSOLUTA.
 * Las variables CSS que se asignan desde JavaScript se resuelven respecto al archivo CSS, que en el sitio compilado
 * está en otra carpeta (assets/): una ruta relativa fallaría en producción (GitHub Pages) aunque funcione en desarrollo.
 */
export const cssUrl = (path) => `url("${new URL(path, document.baseURI).href}")`;
