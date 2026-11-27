---
title: "Cuánto cuesta un chatbot con IA para la web de tu empresa en 2026"
description: "Precios reales de un chatbot con IA para tu web: coste del modelo, herramientas SaaS por conversación o por resolución y desarrollo a medida, con un ejemplo."
pubDate: 2026-11-18
category: negocios
tags: ["Chatbots", "IA", "Precios", "Pymes"]
readTime: 7
cover: ./covers/cuanto-cuesta-chatbot-ia-web-empresa-2026.jpg
---

Respuesta corta: un chatbot con IA para la web de una empresa pequeña cuesta muy poco en inteligencia artificial (unos pocos dólares al mes con un modelo pequeño) y bastante más en la herramienta que lo envuelve. Con un SaaS pagas por conversación o por pregunta resuelta, y la factura crece con el uso. Con un desarrollo a medida pagas una puesta en marcha y una cuota fija baja. La diferencia entre una opción y otra, con un volumen normal, puede ser de cientos de euros al año.

Te desgloso cada coste con precios publicados a noviembre de 2026 y un ejemplo con números.

## Qué tipo de chatbot estamos presupuestando

Hay dos cosas que se llaman "chatbot" y no cuestan lo mismo:

- **Chatbot de botones.** Un árbol de opciones: "¿Horarios? ¿Precios? ¿Hablar con alguien?". Barato y limitado. Si la pregunta no está en el árbol, no sirve.
- **Chatbot con IA.** Entiende lo que escribe el cliente con sus palabras y responde con la información de tu empresa: catálogo, tarifas, plazos, preguntas frecuentes. Es el que te interesa si recibes muchas preguntas distintas.

Este artículo va del segundo. Y con una condición: que responda **solo con tus datos reales**. Un chatbot que se inventa un precio o un plazo es peor que no tener ninguno. La técnica para evitarlo se llama RAG y la explico con un caso real en [RAG casero](/blog/rag-casero-guionia/).

## Coste 1: el modelo de IA

El chatbot necesita un modelo de lenguaje que lea la pregunta y redacte la respuesta. Se paga por *tokens* (trozos de texto) leídos y escritos.

Como referencia, [Claude Haiku 5.5](https://platform.claude.com/docs/en/about-claude/pricing), un modelo rápido y barato de Anthropic, cuesta 0,10 $ por millón de tokens de entrada y 0,50 $ por millón de salida (para peticiones de hasta 100.000 tokens). OpenAI tiene [modelos pequeños en rangos parecidos](https://developers.openai.com/api/docs/pricing).

Una estimación mía para que tengas el orden de magnitud: si recibes 1.000 conversaciones al mes, con 4 respuestas cada una, y cada respuesta lee unos 4.000 tokens (instrucciones, fragmentos de tus documentos e historial) y escribe unos 200:

- Entrada: 16 millones de tokens × 0,10 $ = **1,60 $**
- Salida: 0,8 millones de tokens × 0,50 $ = **0,40 $**

Unos **2 $ al mes**. Con un modelo más potente puede multiplicarse por diez o por veinte y seguir siendo poco dinero. Para preguntas sobre horarios, precios y servicios, un modelo pequeño bien configurado suele bastar.

Conclusión: la IA en sí no es lo caro. Lo caro es cómo te la cobran.

## Coste 2: una herramienta SaaS

La vía rápida es contratar una plataforma de atención al cliente con agente de IA, pegar un código en tu web y subir tus preguntas frecuentes. Hay dos formas habituales de cobrar:

**Por conversación.** Tidio vende su agente de IA, Lyro, como un complemento. Según su [propio análisis de Lyro](https://www.tidio.com/blog/lyro-review/), cuesta desde 32,50 $/mes con pago anual (39 $ con pago mensual) por **50 conversaciones** con IA, y se suma al plan de la plataforma. Para más volumen hay que subir de tramo.

**Por pregunta resuelta.** Intercom cobra su agente Fin por resultado: según su [centro de ayuda](https://www.intercom.com/help/en/articles/8205718-fin-ai-agent-outcomes), **0,99 $ por cada resolución**, es decir, cada conversación en la que el cliente no pide más ayuda tras la última respuesta de la IA. Si el cliente pide hablar con una persona, esa conversación no se cobra.

Los precios de estas herramientas cambian a menudo. Revísalos en su web el día que vayas a decidir.

Lo bueno de un SaaS: lo tienes funcionando en pocos días, con panel, estadísticas y bandeja para que tu equipo conteste. Lo menos bueno: pagas cada mes por uso, la configuración vive en su plataforma y conectarlo con tu agenda o tu software suele estar limitado a lo que ellos ofrezcan.

## Coste 3: un desarrollo a medida

La otra vía es que alguien construya el chatbot conectado directamente a un modelo de IA y a tus documentos. Pagas una puesta en marcha, el uso de la IA (los pocos dólares del apartado 1) y, si quieres, un mantenimiento.

Mis precios actuales, como referencia:

| Servicio | Precio | Plazo |
|---|---|---|
| [Chatbot IA con tus documentos](/servicios/chatbot-ia/), entrenado con tus PDF y tu web, que solo responde con datos reales y te avisa cuando hay un cliente interesado | Desde 449 € + uso de IA según volumen | 2–3 semanas |
| Mantenimiento opcional: actualizo sus documentos cuando cambian tus precios o servicios y reviso sus respuestas | 19 €/mes | — |

El código queda a tu nombre. Si un día dejas el mantenimiento, el chatbot sigue funcionando.

## Comparativa rápida

| | SaaS por conversación | SaaS por resolución | A medida |
|---|---|---|---|
| Coste inicial | Bajo o nulo | Bajo o nulo | Puesta en marcha |
| Cuota mensual | Sube por tramos de conversaciones | Sube con cada pregunta resuelta | Fija y baja, más el uso de IA |
| Puesta en marcha | Días | Días | 2–3 semanas |
| Panel para tu equipo | Sí | Sí | Lo que necesites |
| Conexión con tus sistemas | Limitada | Limitada | Lo que necesites |
| Si dejas de pagar | Pierdes la configuración | Pierdes la configuración | El código es tuyo |

## Un ejemplo con números: una clínica de fisioterapia

Pongamos una clínica que recibe 300 conversaciones al mes en el chat de su web: precios de sesiones, si trabajan con mutuas, horarios, dónde aparcar. Supón que la IA resuelve sola el 60 %, es decir, 180 conversaciones.

- **SaaS por resolución** (0,99 $): 180 × 0,99 = **178,20 $ al mes**. En un año, unos 2.140 $.
- **SaaS por conversación**: las 300 conversaciones superan el tramo de entrada de 50, así que necesitas un tramo superior. Pide el precio exacto para tu volumen.
- **A medida**: 449 € de puesta en marcha, 19 € al mes de mantenimiento (12 × 19 = 228 €) y menos de 1 $ al mes de IA con un modelo pequeño. El primer año, unos **677 €** más ese uso de IA. A partir del segundo, unos 228 € al año.

Los porcentajes son orientativos, y en las herramientas SaaS hay que sumar el plan base de la plataforma. Pero el patrón se repite: con poco volumen, un SaaS puede salir mejor; con un volumen medio y estable, una cuota fija suele ganar.

## Qué preguntar antes de contratar

Da igual a quién se lo compres. Pregunta esto:

1. **¿De dónde saca las respuestas?** Debe usar tus documentos y decir "no lo sé" cuando algo no está ahí.
2. **¿Qué pasa cuando no sabe?** Lo mínimo es que recoja el contacto del cliente o pase la conversación a una persona.
3. **¿Cómo se actualiza?** Si cambias una tarifa, ¿quién se lo dice al chatbot y cuánto tarda?
4. **¿Qué está incluido en la cuota y qué se paga por uso?**
5. **¿Avisa de que es una IA?** Desde agosto de 2026 es obligatorio en la UE, también para pymes. Lo cuento en [tu chatbot debe avisar de que es una IA](/blog/ai-act-chatbot-avisar-ia-empresas/).
6. **¿Dónde se guardan las conversaciones?** Si recoge nombres, teléfonos o datos de salud, el RGPD sigue aplicando.

## Errores que veo a menudo

- **Ponerlo y olvidarse.** Los precios cambian y el chatbot sigue dando los antiguos. Revisa cada mes qué preguntan y qué responde.
- **Esconder el contacto humano.** Un chatbot que no deja hablar con nadie genera más enfado que ventas.
- **Entrenarlo con la web entera sin revisar.** Si tu web tiene páginas viejas o contradictorias, el chatbot las repetirá. Antes de nada, ordena la información.
- **Elegir solo por el precio de entrada.** Un plan "desde 30 €" puede acabar en 150 € cuando crecen las conversaciones. Haz la cuenta con tu volumen real.

## Cuándo compensa (y cuándo no)

**Compensa** si recibes muchas preguntas repetidas por la web, si te escriben fuera de horario y pierdes esos contactos, o si alguien de tu equipo pasa horas contestando lo mismo. Si un solo cliente extra al mes paga la cuota, las cuentas salen.

**No compensa** si recibes dos mensajes a la semana. Ahí te basta con una buena página de preguntas frecuentes y un botón de WhatsApp. Y si tus clientes ya te escriben sobre todo por WhatsApp, quizá te interesa más un agente en ese canal: lo desgloso en [cuánto cuesta un agente IA para WhatsApp Business](/blog/cuanto-cuesta-agente-ia-whatsapp-business-2026/).

Si quieres ver qué más se puede automatizar en una empresa pequeña, aquí tienes [7 tareas que tu pyme puede automatizar con IA](/blog/tareas-pyme-automatizar-ia/).

*Foto de portada: [Simon Hattinga Verschure webmarbles](https://commons.wikimedia.org/wiki/File:Typing_on_a_laptop_(Unsplash).jpg), [CC0](https://creativecommons.org/publicdomain/zero/1.0/), recortada.*
