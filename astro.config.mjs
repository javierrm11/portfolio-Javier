// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Índice del buscador del blog. Se genera al terminar la compilación sobre las
// páginas ya escritas (dist/client) y antes de que el adaptador de Vercel las
// copie a .vercel/output/static: las integraciones propias corren antes que la
// del adaptador. Solo entra lo marcado con data-pagefind-body (los artículos).
/** @type {import('astro').AstroIntegration} */
const pagefindIndex = {
  name: 'pagefind-index',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const pagefind = await import('pagefind');
      const site = fileURLToPath(dir);
      const { index } = await pagefind.createIndex({});
      const { page_count } = await index.addDirectory({ path: site });
      await index.writeFiles({ outputPath: path.join(site, 'pagefind') });
      await pagefind.close();
      logger.info(`Buscador: ${page_count} páginas indexadas`);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://www.javierm.dev', // 👈 muy importante para que el sitemap funcione
  integrations: [sitemap({ filter: (page) => !page.includes('/og/') && !page.endsWith('/404/') }), pagefindIndex],
  // El CSS va dentro del HTML en vez de en archivos aparte: cada hoja externa
  // bloqueaba el primer pintado en móvil mientras se descargaba.
  build: { inlineStylesheets: 'always' },
  // El sitio sigue siendo estático: el adaptador solo convierte en función
  // de Vercel las rutas con `prerender = false` (hoy, /api/chat del chatbot y
  // /api/analizar del analizador). PageSpeed tarda hasta un minuto en responder,
  // y según el modo de la cuenta el límite por defecto puede ser de solo 10 s.
  adapter: vercel({ maxDuration: 60 }),
  env: {
    schema: {
      // Clave de Google AI Studio para el chatbot. Secreta: solo existe en el
      // servidor (variable de entorno en Vercel / .env en local), nunca llega
      // al navegador. Opcional para que el build no falle sin ella.
      GEMINI_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Clave de Google Cloud con la API de PageSpeed Insights activada (mismo
      // tratamiento). Sin ella el analizador solo da la parte SEO en cuanto se
      // agota la cuota anónima de Google, que suele estarlo.
      PAGESPEED_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
