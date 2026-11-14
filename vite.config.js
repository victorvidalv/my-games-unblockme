import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// GitHub Pages sirve el sitio en https://<usuario>.github.io/<repo>/. En el workflow se define BASE_PATH=/<repo>/.
// En local (npm run dev) y para un dominio propio queda './' (rutas relativas, funciona en cualquier carpeta).
const base = process.env.BASE_PATH || './';

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version.split('.')[0]) },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    rollupOptions: { input: { main: 'index.html', melodies: 'melodies.html' } }, // melodies.html: visor de las melodías
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: false,
      manifestFilename: 'manifest.webmanifest',
      injectManifest: { globPatterns: ['**/*.{js,css,html,webp,png,gif,m4a,webmanifest}'] },
      manifest: {
        name: 'SLIDE & SLAY',
        short_name: 'SLIDE & SLAY',
        description: 'Abre el camino entre las diez ciudades de Tri. Un puzle de bloques, tres héroes y cien niveles.',
        lang: 'es',
        start_url: './',
        scope: './',
        id: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#111e29',
        theme_color: '#111e29',
        categories: ['games', 'puzzle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { include: ['tests/**/*.test.js'] },
});
