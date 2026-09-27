---
title: "Content collections en Astro: un blog sin base de datos"
description: "Markdown, frontmatter tipado y páginas estáticas — por qué no hacía falta Supabase para esto."
pubDate: 2026-02-22
category: nextjs
tags: ["Astro", "Content collections"]
readTime: 5
cover: ./covers/content-collections-astro-blog.jpg
---

Este mismo blog es el ejemplo: cada artículo es un archivo Markdown en el repositorio, sin backend ni tablas.

## Por qué no una base de datos

Un blog personal no necesita comentarios en tiempo real, edición desde fuera del repositorio ni consultas dinámicas. Necesita texto con formato y metadatos — título, fecha, categoría — que se puedan validar y renderizar en build time. Astro resuelve justo eso con las content collections.

## El esquema

Un solo archivo define la forma de cada post con Zod, y Astro avisa en build si un frontmatter no cumple el esquema — nada de campos mal escritos llegando a producción:

```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(['seo-tecnico', 'ia', 'nextjs']),
  }),
});
```

## Ventajas para un portfolio

- Cero servicios nuevos que mantener ni facturar
- Historial de cada artículo en Git, como el resto del código
- Sigue siendo 100% estático: el mismo despliegue de siempre

Si en algún momento hiciera falta un editor visual o comentarios, ahí sí tendría sentido un CMS o una base de datos. Para esto, era matar moscas a cañonazos.
