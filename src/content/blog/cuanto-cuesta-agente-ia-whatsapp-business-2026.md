---
title: "Cuánto cuesta un agente IA para WhatsApp Business en 2026"
description: "Precios reales a octubre de 2026: tarifas de Meta en España, coste de la IA, desarrollo y cuota mensual. Con tabla SaaS vs a medida y un ejemplo con números."
pubDate: 2026-10-25
category: negocios
tags: ["WhatsApp API", "IA", "Precios", "Pymes"]
readTime: 7
cover: ./covers/cuanto-cuesta-agente-ia-whatsapp-business-2026.jpg
---

Respuesta corta: un agente IA para WhatsApp Business tiene cuatro costes. Lo que cobra Meta por mensaje (en España, 0,0166 € por respuesta de atención al cliente y 0,0585 € por mensaje de marketing, sin IVA), lo que cuesta el modelo de IA (normalmente entre 1 y 20 € al mes para un negocio pequeño), el desarrollo o la suscripción a una herramienta, y el mantenimiento. Para una pyme con un volumen normal, la parte de Meta y de IA suele quedarse en decenas de euros al mes. Donde está la diferencia de verdad es en cómo lo montas.

Te lo desgloso con datos oficiales y un ejemplo con números, para que sepas qué preguntar antes de contratar un agente IA para WhatsApp Business API en tu empresa.

## 1. Lo que cobra Meta: por mensaje, y con un cambio reciente

Desde el 1 de julio de 2025, Meta [cobra por mensaje entregado](https://developers.facebook.com/docs/whatsapp/pricing), no por conversación de 24 horas como antes. El precio depende de la categoría del mensaje y del país del cliente.

Y hay una novedad importante: **desde el 1 de octubre de 2026, Meta vuelve a cobrar los mensajes de servicio**, es decir, las respuestas libres que das dentro de las 24 horas siguientes a que el cliente te escriba. Llevaban gratis desde noviembre de 2024. Lo mismo pasa con los mensajes de utilidad enviados como respuesta dentro de esa ventana, que eran gratis desde julio de 2025. Si leíste en algún sitio que "responder es gratis", ese dato ya no vale.

Estas son las tarifas para números de España, según la hoja de tarifas en euros que publica Meta, vigente desde el 1 de octubre de 2026 (sin IVA):

| Tipo de mensaje | Para qué sirve | Precio por mensaje |
|---|---|---|
| Servicio | Respuestas libres dentro de las 24 h tras el mensaje del cliente | 0,0166 € |
| Utilidad | Plantillas: recordatorios de cita, confirmaciones, avisos de pedido | 0,0166 € |
| Autenticación | Códigos de verificación | 0,0166 € |
| Marketing | Promociones, ofertas, reactivar clientes | 0,0585 € |

Tres matices que bajan bastante la factura:

- **Los mensajes que te envía el cliente no se cobran.** Solo pagas los que envía tu negocio.
- **Cada número tiene 1.000 mensajes de servicio gratis al mes.** A partir del 1.001 se cobran, y los que no gastes no se acumulan.
- **Si el cliente llega desde un anuncio de "clic a WhatsApp"**, se abre una ventana gratuita que puede durar hasta 7 días en la que no pagas ninguna categoría de mensaje.

Además, para enviar plantillas de utilidad hay descuentos por volumen, pero hablamos de cientos de miles de mensajes al mes: a una pyme no le afectan.

Las tarifas cambian cada trimestre, así que antes de presupuestar mira la [página de precios de la plataforma de WhatsApp Business](https://developers.facebook.com/docs/whatsapp/pricing). Los datos de este artículo son a octubre de 2026.

## 2. Lo que cuesta la inteligencia artificial

El agente necesita un modelo de lenguaje que lea el mensaje del cliente y redacte la respuesta. Se paga por *tokens* (trozos de texto) leídos y generados. Dos referencias a octubre de 2026, en dólares por millón de tokens:

- [Claude Haiku 5.5](https://platform.claude.com/docs/en/about-claude/pricing), un modelo rápido y barato: 0,10 $ de entrada y 0,50 $ de salida.
- [Claude Sonnet 5.5](https://platform.claude.com/docs/en/about-claude/pricing), más capaz: 2 $ de entrada y 10 $ de salida.

OpenAI tiene [modelos pequeños en rangos parecidos](https://developers.openai.com/api/docs/pricing). Lo que importa es el orden de magnitud: con un modelo pequeño, mil respuestas cuestan céntimos.

Una estimación mía, para que tengas una referencia: si cada respuesta lee unos 3.000 tokens (instrucciones, información del negocio e historial) y escribe unos 150, **2.400 respuestas al mes salen por menos de 1 $ con Haiku 5.5 y por unos 18 $ con Sonnet 5.5**. Para preguntas sobre horarios, precios y citas, un modelo pequeño bien configurado suele ser suficiente.

Meta también ofrece su propio agente (Meta Business Agent), que se factura aparte a 2 $ por millón de tokens. Si montas tu agente con otro modelo, ese cargo no te aplica.

## 3. Herramienta SaaS o desarrollo a medida

Aquí está la decisión importante. Tienes dos caminos:

**Una herramienta SaaS** (tipo Wati o respond.io): pagas una suscripción mensual, conectas tu número y configuras el agente desde un panel. A octubre de 2026, el plan de [Wati](https://www.wati.io/pricing/) que incluye agentes de IA (Pro) cuesta 119 €/mes con facturación anual, y el plan Growth de [respond.io](https://respond.io/pricing), 159 $/mes también con pago anual. En ambos casos **los mensajes de Meta se pagan aparte**.

**Un desarrollo a medida**: alguien construye el agente conectado directamente a la API de WhatsApp y a tus sistemas (tu agenda, tu catálogo, tu base de datos). Pagas un desarrollo inicial y una cuota de mantenimiento.

| | SaaS | A medida |
|---|---|---|
| Coste inicial | Bajo o nulo | Desarrollo inicial |
| Cuota mensual | Suscripción por plan y usuarios | Mantenimiento, normalmente más bajo |
| Mensajes de Meta | Aparte | Aparte |
| Puesta en marcha | Rápida si tu caso es estándar | 2–4 semanas |
| Integración con tu agenda o tu software | Limitada a lo que ofrezca la herramienta | Lo que necesites |
| Lógica propia (reglas, varios locales, precios variables) | Difícil | Sí |
| Si dejas de pagar | Pierdes la configuración | El código es tuyo |

Ninguna es mejor siempre. Un SaaS compensa si tu caso es muy estándar, tienes varias personas atendiendo desde un panel compartido y no necesitas conectar nada raro. El desarrollo a medida compensa cuando el agente tiene que **hacer cosas**, no solo responder: reservar en tu agenda real, consultar stock o aplicar tus reglas.

## 4. Un ejemplo con números: una barbería

Pongamos una barbería que recibe 600 conversaciones al mes por WhatsApp. El agente envía unas 4 respuestas por conversación y manda 300 recordatorios de cita.

- **Respuestas de servicio**: 2.400 mensajes. Los 1.000 primeros son gratis; quedan 1.400 × 0,0166 € = **23,24 €**.
- **Recordatorios (utilidad)**: 300 × 0,0166 € = **4,98 €**.
- **IA**: entre **1 y 18 $**, según el modelo (estimación del apartado anterior).

Total variable: entre unos 30 y 50 € al mes, más IVA. Es el caso de [CitasWassap](/#proyectos), el sistema de reservas por WhatsApp con agente IA que desarrollé para barberías, donde cada negocio tiene sus datos separados (lo cuento en [este artículo sobre la seguridad multiusuario](/blog/supabase-rls-citaswassap/)).

Este cálculo es orientativo. Si tus clientes escriben mucho más, o si haces campañas de marketing, los números cambian. Por eso conviene estimarlo con tus datos reales antes de decidir.

## 5. Lo que cobro yo, como referencia

Estoy empezando a ofrecer este servicio, así que tengo **precios de lanzamiento**:

- **Agente IA para WhatsApp: desde 590 € + 29 €/mes**, con un plazo de 2–4 semanas.
- **Chatbot IA con tus documentos** (para tu web, responde con tu información): desde 449 € + uso de IA.
- **Automatizaciones sueltas**: desde 149 € cada una.

Comparado con el ejemplo de antes: el primer año con un SaaS de 119 €/mes son 1.428 €. Con un desarrollo a medida desde 590 € + 29 €/mes, el primer año sale por 938 €. En los dos casos se suman los mensajes de Meta. Pero no es solo cuestión de precio: un SaaS te da un panel ya hecho para varios agentes humanos, y el desarrollo a medida te da algo hecho exactamente para tu negocio.

Antes de contratar a nadie, pregunta siempre:

1. ¿Qué incluye la cuota mensual?
2. ¿Los mensajes de Meta y el uso de IA se pagan aparte, o van incluidos?
3. ¿Qué pasa cuando el agente no sabe responder? (Debería pasar la conversación a una persona.)
4. ¿De quién es el número y la configuración si dejo el servicio?

## Cuándo compensa (y cuándo no)

**Compensa** si recibes muchos mensajes repetidos (horarios, precios, disponibilidad), si pierdes clientes porque tardas en contestar o si alguien de tu equipo pasa horas al día con el móvil. Si una sola cita o venta extra al mes paga la cuota, las cuentas salen solas.

**No compensa** si recibes cuatro mensajes al día o si cada conversación es única y delicada. Ahí el WhatsApp Business normal, con respuestas rápidas guardadas, te sirve igual.

Si quieres ver cómo funciona por dentro (webhooks, plantillas y respuestas que no suenan a robot), lo explico en [cómo integrar la API de WhatsApp Business con IA generativa](/blog/whatsapp-api-ia-generativa/). Y si te preguntas qué más se puede automatizar, aquí tienes [7 tareas que tu pyme puede automatizar con IA](/blog/tareas-pyme-automatizar-ia/).

## ¿Hacemos números con tu caso?

Si me cuentas cuántos mensajes recibes y qué preguntan tus clientes, te digo qué opción te sale mejor, aunque no sea la mía. [Escríbeme por WhatsApp](https://wa.me/34611434736?text=Hola%20Javier%2C%20vengo%20de%20tu%20blog%20y%20me%20interesa%20un%20agente%20IA%20para%20WhatsApp) o mira los [servicios y precios](/#servicios). Si lo prefieres, también puedes usar el [formulario de contacto](/#contact).
