---
title: "Consumir una API de vuelos en tiempo real sin quemar la cuota"
description: "Caché, rate limiting y un fallback silencioso: cómo aguanta el tráfico la API Vuelos."
pubDate: 2026-01-28
category: apis
tags: ["APIs externas", "Next.js", "Chart.js"]
readTime: 6
cover: ./covers/api-vuelos-cache-rate-limit.jpg
---

La mayoría de APIs de vuelos en tiempo real cobran por petición, y su cuota gratuita se agota rápido si cada visita a la página dispara una llamada nueva.

## El caché es la primera defensa

Los datos de un vuelo no cambian cada segundo. Guardar la respuesta durante un margen razonable (60-120 segundos según el endpoint) reduce las llamadas reales a la API en más de un 90% sin que el usuario note diferencia:

```ts
const cacheKey = `vuelo:${id}`;
const cached = await kv.get(cacheKey);
if (cached) return cached;

const fresh = await fetchVuelo(id);
await kv.set(cacheKey, fresh, { ex: 90 });
```

## Rate limiting propio, antes que el de terceros

Confiar solo en el límite que impone la API externa significa enterarte del problema cuando ya te han cortado el acceso. Un rate limiter propio por IP, delante de la ruta que llama a la API, corta el abuso antes de que llegue a consumir cuota real.

## Qué pasa cuando la cuota se agota igual

Ningún caché evita el pico raro. Para esos casos, la app cae a los últimos datos válidos guardados, con un aviso discreto de "datos no en tiempo real" en vez de un error en pantalla. Es mejor mostrar algo ligeramente desactualizado que romper la página entera.

Con estas tres capas, la API Vuelos aguanta picos de tráfico sin sorpresas en la factura del proveedor.
