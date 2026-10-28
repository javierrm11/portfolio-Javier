---
title: "Cómo integrar una API en tu web: guía práctica"
description: "Qué es una API, ejemplos para negocios (pagos, reservas, mapas, WhatsApp, CRM), los pasos para integrarla bien, código en TypeScript y cuánto cuesta."
pubDate: 2026-09-22
category: apis
tags: ["APIs externas", "TypeScript", "Integraciones"]
readTime: 7
cover: ./covers/integrar-api-en-tu-web-guia.jpg
---

Integrar una API en tu web consiste en conectar tu página con un servicio externo (una pasarela de pago, un sistema de reservas, un mapa, WhatsApp o tu CRM) para que intercambien datos solos, sin que nadie copie y pegue. Bien hecho tiene cinco pasos: conseguir las claves, llamar a la API desde tu servidor (nunca desde el navegador si hay claves secretas), guardar en caché lo que no cambia, respetar los límites de uso y preparar la web para cuando la API falle.

Esta guía sirve para dos tipos de lector. Si tienes un negocio, las primeras secciones te explican qué se puede conectar y cuánto cuesta. Si eres desarrollador, más abajo tienes el código.

## Qué es una API, sin tecnicismos

Una API es la forma que tiene un programa de pedirle cosas a otro. Piensa en la ventanilla de un banco: no entras en la cámara acorazada, pides lo que necesitas por la ventanilla, con tu identificación, y te lo dan siguiendo unas reglas.

Cuando tu web muestra un mapa de Google, cobra con tarjeta o envía un WhatsApp de confirmación, por detrás hay una API: tu web pide algo, el servicio responde y tu web lo muestra.

## Ejemplos útiles para un negocio

| Para qué | Ejemplos de servicio | Qué consigues |
|---|---|---|
| Cobrar online | Stripe, Redsys, PayPal | Pagos con tarjeta sin salir de tu web |
| Reservas y citas | Google Calendar, tu software de reservas | Que el cliente vea huecos reales y reserve solo |
| Mapas | Google Maps Platform | Mapa, cálculo de rutas, autocompletar direcciones |
| Mensajería | API de WhatsApp Business | Confirmaciones, recordatorios y atención automática |
| CRM | HubSpot, Pipedrive, una hoja de cálculo | Que cada contacto de la web quede guardado sin teclearlo |
| Datos en tiempo real | APIs de vuelos, tiempo, cotizaciones | Información siempre actualizada |

Un ejemplo mío: [API Vuelos](/#proyectos) muestra vuelos en tiempo real consultando APIs externas. Sin una buena integración, cada visita gastaría una petición de pago. Te cuento cómo lo resolví en [este artículo sobre caché y límites de uso](/blog/api-vuelos-cache-rate-limit/).

## Los 5 pasos para integrar una API bien

### 1. Consigue las claves y guárdalas como secretos

Casi todas las APIs te dan una **clave** (API key) para saber quién pide y cobrarte. Muchas dan dos: una pública, que puede ir en el navegador, y una secreta, que no debe salir nunca de tu servidor. Stripe, por ejemplo, separa claramente las claves publicables de las secretas.

Las claves secretas van en variables de entorno (`.env`), nunca en el código que subes a GitHub ni en el JavaScript que descarga el visitante.

### 2. Decide qué va en el servidor y qué en el cliente

La regla es sencilla:

- **En el servidor**: todo lo que use una clave secreta, cobre dinero, escriba datos o tenga un coste por petición.
- **En el navegador**: solo lo que la API permite expresamente con una clave pública (por ejemplo, mostrar un mapa con una clave restringida a tu dominio).

Si llamas a una API de pago directamente desde el navegador, cualquiera puede ver tu clave en las herramientas del navegador y usarla a tu costa.

### 3. Guarda en caché lo que no cambia cada segundo

Muchas APIs cobran por petición. Si los datos no cambian cada segundo (un horario, el tiempo, los vuelos de la próxima hora), guarda la respuesta unos minutos y sirve esa copia. Ahorras dinero y tu web va más rápida.

### 4. Respeta los límites de uso

Todas las APIs limitan cuántas peticiones puedes hacer. Cuando te pasas, suelen responder con el código [429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429), a veces con una cabecera `Retry-After` que indica cuánto esperar. Tu código tiene que entenderlo y no reintentar sin parar.

### 5. Prepárate para cuando falle

Las APIs externas fallan: se caen, tardan o cambian. Pon siempre un tiempo máximo de espera, registra los errores y decide qué ve el usuario. Muchas veces es mejor mostrar el último dato bueno con un aviso que una pantalla de error.

## El código: un ejemplo en TypeScript

Un endpoint en el servidor (aquí con el formato de rutas de Astro, pero la idea vale para Next.js o cualquier backend) que llama a una API externa con clave secreta, caché, tiempo máximo y manejo de errores:

```ts
// src/pages/api/tiempo.ts: se ejecuta en el servidor, nunca en el navegador
const cache = new Map<string, { data: unknown; expira: number }>();

export async function GET({ url }: { url: URL }) {
  const ciudad = url.searchParams.get('ciudad') ?? 'Córdoba';
  const guardado = cache.get(ciudad);
  if (guardado && guardado.expira > Date.now()) {
    return Response.json(guardado.data);
  }

  try {
    const res = await fetch(
      `https://api.ejemplo.com/v1/tiempo?q=${encodeURIComponent(ciudad)}`,
      {
        headers: { Authorization: `Bearer ${import.meta.env.API_KEY}` },
        signal: AbortSignal.timeout(5000), // máximo 5 segundos
      },
    );

    if (res.status === 429) {
      return Response.json({ error: 'Demasiadas peticiones' }, { status: 503 });
    }
    if (!res.ok) throw new Error(`La API respondió ${res.status}`);

    const data = await res.json();
    cache.set(ciudad, { data, expira: Date.now() + 5 * 60_000 }); // 5 minutos
    return Response.json(data);
  } catch (err) {
    console.error(err);
    // Mejor un dato algo antiguo que un error en pantalla
    if (guardado) return Response.json(guardado.data);
    return Response.json({ error: 'Servicio no disponible' }, { status: 502 });
  }
}
```

Y desde el navegador solo llamas a **tu** endpoint, que no expone ninguna clave:

```ts
const res = await fetch('/api/tiempo?ciudad=Córdoba');
if (res.ok) {
  const tiempo = await res.json();
  // pintar los datos en la página
}
```

Dos avisos: si tu web corre en un entorno *serverless*, la caché en memoria se pierde entre ejecuciones, y para eso conviene una caché externa (Redis, Vercel KV o similar). Y en producción, valida los datos de entrada y la forma de la respuesta antes de usarlos.

## Cuánto cuesta integrar una API

Hay dos costes distintos: lo que cobra el servicio y lo que cuesta el desarrollo.

**Lo que cobra el servicio.** Algunos ejemplos a octubre de 2026:

- **Stripe** en España: [1,5 % + 0,25 €](https://stripe.com/es/pricing) por pago con tarjeta estándar del Espacio Económico Europeo, sin cuota mensual.
- **Google Maps Platform**: la mayoría de servicios básicos incluyen [10.000 usos gratis al mes](https://developers.google.com/maps/billing-and-pricing/pricing) por servicio; a partir de ahí, por ejemplo, el mapa dinámico cuesta 7 $ por cada 1.000 cargas.
- **WhatsApp Business**: Meta cobra por mensaje según el tipo. Lo desgloso en [cuánto cuesta un agente IA para WhatsApp Business](/blog/cuanto-cuesta-agente-ia-whatsapp-business-2026/).

Para una pyme, muchas integraciones se quedan dentro de los tramos gratuitos o en pocos euros al mes. Lo importante es poner caché y límites para que una visita masiva no dispare la factura.

**Lo que cuesta el desarrollo.** Depende de dónde vaya la integración. Mis precios de lanzamiento, como referencia:

- Si es una **conexión entre herramientas** (formulario de la web al CRM, pagos a una hoja de cálculo): es una automatización, desde 149 € y 1–2 semanas.
- Si va dentro de una **web nueva** (reservas, mapa, pagos): parte de la web profesional, desde 349 € pago único y 2–3 semanas, más la complejidad de la integración.
- Si es una **aplicación con lógica propia** (panel interno, varias APIs combinadas, usuarios): app a medida, desde 1.490 € y 4–8 semanas.

## Integración de APIs en Córdoba y en remoto

Trabajo desde Córdoba y en remoto con negocios de cualquier parte de España. Si tienes un negocio en Córdoba, te pilla cerca; si estás en otra ciudad, lo vemos por videollamada. En los dos casos, el punto de partida es el mismo: revisar qué programas usas y qué tiene sentido conectar.

Una buena pregunta para empezar cualquier integración de API: ¿qué tarea repites a mano cada semana? Normalmente ahí está la integración que más compensa. Si buscas ideas, aquí tienes [7 tareas que tu pyme puede automatizar con IA](/blog/tareas-pyme-automatizar-ia/).

## ¿Qué quieres conectar?

Cuéntame qué servicio quieres integrar en tu web y te digo cómo lo haría y cuánto costaría. [Escríbeme por WhatsApp](https://wa.me/34611434736?text=Hola%20Javier%2C%20vengo%20de%20tu%20blog%20y%20me%20interesa%20integrar%20una%20API%20en%20mi%20web), mira los [servicios y precios](/#servicios) o usa el [formulario de contacto](/#contact).
