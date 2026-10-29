// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.javierm.dev', // 👈 muy importante para que el sitemap funcione
  integrations: [sitemap()],
  // El sitio sigue siendo estático: el adaptador solo convierte en función
  // de Vercel las rutas con `prerender = false` (hoy, /api/chat del chatbot).
  adapter: vercel(),
  env: {
    schema: {
      // Clave de Google AI Studio para el chatbot. Secreta: solo existe en el
      // servidor (variable de entorno en Vercel / .env en local), nunca llega
      // al navegador. Opcional para que el build no falle sin ella.
      GEMINI_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
