---
title: "Core Web Vitals en Astro: de 62 a 98 en Lighthouse"
description: "Imágenes optimizadas, preload del LCP y menos JavaScript del necesario."
pubDate: 2026-01-14
category: seo-tecnico
tags: ["Performance", "Astro", "SEO técnico"]
readTime: 5
cover: ./covers/core-web-vitals-astro-lighthouse.jpg
---

Un portfolio no necesita ser lento para verse bien. Estos fueron los cambios que más movieron la aguja en Lighthouse.

## Imágenes: el mayor peso de la página

Las capturas de proyecto y los fondos de sección eran el 80% del peso total. Servirlas en WebP con `astro:assets`, en varios tamaños según el viewport, bajó el peso de las imágenes de más de 2 MB a poco más de 500 KB sin perder calidad visible.

## Preload de la imagen que más tarda en pintar

El LCP (Largest Contentful Paint) suele ser la imagen de fondo del hero. Si va solo en el CSS, el navegador no la descubre hasta que termina de leer la hoja de estilos:

```html
<link rel="preload" as="image" href="/hero-desk.webp" fetchpriority="high">
```

Con esto, el navegador empieza a descargarla en paralelo desde el primer instante, no varios cientos de milisegundos después.

## Menos JavaScript, no más rápido

Astro ya ayuda aquí por defecto: sin un framework de UI, no hay que hidratar nada. Los únicos scripts son los imprescindibles — el desplazamiento suave, el menú móvil, las animaciones de scroll — cargados como módulos nativos, sin bundle de runtime de por medio.

Con estos tres cambios la puntuación pasó de 62 a 98, y lo más importante: la página se siente instantánea, no solo puntúa bien.
