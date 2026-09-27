// Colección del blog: cada post es un .md en src/content/blog, sin base de
// datos. Astro los lee en build time (content layer API) y genera páginas
// estáticas, igual que el resto del sitio.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  // El callback recibe el helper `image` de Astro: valida que la ruta exista
  // y deja que astro:assets la optimice (ver Proyectos.astro para el mismo
  // patrón con imágenes fuera de una colección).
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    // Debe coincidir con una clave de CATEGORIES en src/lib/blogCategories.ts.
    category: z.enum(['seo-tecnico', 'ia', 'nextjs', 'supabase', 'apis']),
    tags: z.array(z.string()).default([]),
    readTime: z.number().int().positive(),
    // El post destacado arriba del todo del listado (uno solo debería llevar true).
    featured: z.boolean().default(false),
    author: z.string().default('Javier Ruiz Molero'),
    // Foto de portada (Unsplash, licencia libre), ruta relativa a este
    // mismo archivo .md — ver src/content/blog/covers/.
    cover: image(),
  }),
});

export const collections = { blog };
