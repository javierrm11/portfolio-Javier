---
title: "Integrar la API de WhatsApp Business con IA generativa"
description: "Webhooks, plantillas aprobadas y respuestas automáticas que no suenan a robot."
pubDate: 2026-01-03
category: ia
tags: ["WhatsApp API", "IA", "Supabase"]
readTime: 9
cover: ./covers/whatsapp-api-ia-generativa.jpg
---

Automatizar las respuestas de WhatsApp de un negocio suena sencillo hasta que descubres las reglas de Meta: no se puede escribir a alguien sin que haya escrito primero, y fuera de esa ventana de 24 horas solo valen plantillas pre-aprobadas.

## El webhook, primero

Todo empieza cuando Meta manda un mensaje entrante al webhook configurado. Ese endpoint tiene que responder en menos de unos segundos o Meta lo da por caído, así que la respuesta al webhook y la generación de la respuesta con IA van separadas: primero se confirma la recepción, luego se procesa.

```ts
export async function POST(req: Request) {
  const body = await req.json();
  queueReply(body); // no bloquea la respuesta al webhook
  return new Response('EVENT_RECEIVED', { status: 200 });
}
```

## Plantillas para abrir la conversación, IA para el resto

Fuera de la ventana de 24 horas, el primer mensaje tiene que ser una plantilla aprobada por Meta — nada de texto libre generado por IA en ese punto. Una vez el cliente responde, la ventana se abre y ahí sí entra el modelo, con el historial de la conversación como contexto.

## Que no suene a robot

El error más común es un prompt que ignora el tono real del negocio. Dar ejemplos reales de conversaciones anteriores en el prompt del sistema, no solo instrucciones genéricas, es lo que marca la diferencia entre una respuesta que suena a plantilla y una que suena a la persona que atendería ese WhatsApp.

El resultado no sustituye a alguien del equipo en los casos complicados, pero sí resuelve las preguntas repetidas — horarios, precios, disponibilidad — sin que nadie tenga que estar pendiente del móvil todo el día.
