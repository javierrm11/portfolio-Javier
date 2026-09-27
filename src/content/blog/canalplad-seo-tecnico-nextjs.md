---
title: "Cómo subí un 35% el tráfico orgánico de Canalplad con SEO técnico en Next.js"
description: "Metadatos dinámicos, sitemap, Core Web Vitals y una estructura de contenido pensada para búsqueda local — el proceso completo, con los números de antes y después."
pubDate: 2026-03-12
category: seo-tecnico
tags: ["SEO técnico", "Next.js", "Performance"]
readTime: 8
cover: ./covers/canalplad-seo-tecnico-nextjs.jpg
featured: true
---

Cuando empecé con Canalplad, la web ya existía pero apenas aparecía en Google. Tres meses después el tráfico orgánico había subido un 35%. Esto es lo que cambié, en orden de impacto.

## 1. Metadatos que sí describen la página

Cada plantilla de Next.js tenía el mismo `title` y la misma descripción genérica. Google no tenía forma de distinguir "canalones de aluminio" de "reparación de pladur" — dos servicios con búsquedas muy distintas.

> El SEO técnico no arregla contenido malo. Pero un contenido bueno sin metadatos correctos tampoco lo encuentra nadie.

La solución fue generar metadatos dinámicos por página con la API de metadata de Next.js:

```tsx
export async function generateMetadata({ params }) {
  const servicio = await getServicio(params.slug);
  return {
    title: `${servicio.nombre} en Córdoba | Canalplad`,
    description: servicio.resumenSeo,
  };
}
```

## 2. Un sitemap que Google pudiera confiar

El sitemap antiguo listaba páginas que ya no existían. Search Console marcaba errores 404 cada semana, y eso baja la confianza que Google le da al resto del dominio. Con un sitemap generado en cada build a partir de las rutas reales, nunca vuelve a desincronizarse.

## 3. Core Web Vitals: de "necesita mejora" a "bueno"

Las imágenes de los trabajos se servían en PNG sin optimizar, algunas de más de 900 KB. Pasarlas a WebP con tamaños responsive bajó el LCP de 4.1s a 1.6s. Ese solo cambio movió la valoración de Core Web Vitals de "necesita mejora" a "bueno" en Search Console.

- Imágenes en WebP con varios tamaños según el viewport
- Preload de la imagen del hero para adelantar el LCP
- Fuentes con `font-display: swap` para evitar texto invisible

## Resultado a los tres meses

El tráfico orgánico subió un 35% y las páginas de servicio empezaron a aparecer para búsquedas locales como "canalones aluminio Córdoba", que antes ni indexaban. Nada de esto fue magia: fueron tres cambios técnicos concretos, medibles uno por uno en Search Console.
