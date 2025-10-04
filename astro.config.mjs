// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://javierm.dev', // 👈 muy importante para que el sitemap funcione
  integrations: [sitemap()],
});
