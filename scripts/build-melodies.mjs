/**
 * Genera output/melodias.html: el visor de melodías en UN solo archivo (con el motor de audio dentro) para abrirlo con doble clic,
 * sin servidor. Uso: npm run melodies:html
 */
import { build } from 'vite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = await build({
  root: ROOT, configFile: false, logLevel: 'silent', define: { __APP_VERSION__: '"melodias"' },
  build: { write: false, minify: true, lib: { entry: resolve(ROOT, 'src/tools/melodies.js'), formats: ['iife'], name: 'Melodias' } },
});
const code = (Array.isArray(out) ? out[0] : out).output[0].code.replace(/<\/script/gi, '<\\/script');
const html = readFileSync(resolve(ROOT, 'melodies.html'), 'utf8')
  .replace(/<link rel="icon"[^>]*>\n?/, '')
  .replace('<script type="module" src="/src/tools/melodies.js"></script>', () => `<script>${code}</script>`);
mkdirSync(resolve(ROOT, 'output'), { recursive: true });
const target = resolve(ROOT, 'output/melodias.html');
writeFileSync(target, html);
console.log(`Listo: ${target} (${Math.round(html.length / 1024)} KB)`);
