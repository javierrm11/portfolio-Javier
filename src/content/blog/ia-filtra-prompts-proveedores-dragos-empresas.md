---
title: "Lo que escribes a una IA puede filtrarse: el estudio de Dragos"
description: "Dragos metió 2 millones de datos cebo en mensajes a servicios de IA y halló tres proveedores hackeados. Qué supone para tu empresa y qué no darle a una IA."
pubDate: 2026-11-23
category: ia
tags: ["Ciberseguridad", "IA", "Privacidad", "Pymes"]
readTime: 7
cover: ./covers/ia-filtra-prompts-proveedores-dragos-empresas.jpg
---

Sí, lo que escribes a una IA puede acabar en manos de otros, y no hace falta que falle OpenAI o Google: basta con que falle cualquier intermediario por el que pasa tu mensaje. Es la conclusión del estudio que la empresa de ciberseguridad Dragos [publicó el 19 de noviembre de 2026](https://www.dragos.com/blog/ai-supply-chain-security-canary-tokens): durante cuatro meses metió unos dos millones de datos cebo en mensajes a servicios de IA y descubrió **tres proveedores hackeados** que ni siquiera lo sabían. Para una empresa pequeña la lección es práctica: no pegues contraseñas ni datos de clientes en una IA, y si tienes un chatbot o un agente, entérate de por dónde viajan sus mensajes.

## Qué ha hecho Dragos

El estudio lo firma HD Moore, [director de investigación de Dragos](https://www.dragos.com/leadership/hd-moore) y un nombre muy conocido en el sector de la seguridad. La idea es sencilla y se llama "canario": un dato falso que nadie tiene motivo para usar. Si alguien lo usa, sabes que se ha filtrado.

Entre julio y noviembre de 2026, su equipo envió unos dos millones de mensajes a servicios de IA muy usados. Cada mensaje llevaba su propio cebo: direcciones web únicas y credenciales falsas, como claves de acceso a Amazon Web Services (AWS). Después, esperaron a ver qué cebos aparecían donde no debían.

Lo que encontraron, según [el propio informe de Dragos](https://www.dragos.com/blog/ai-supply-chain-security-canary-tokens):

- **Tres proveedores de alojamiento de modelos hackeados.** Los atacantes estaban robando los mensajes de sus clientes. En el caso más grande usaron un par de centenares de las claves falsas de AWS. Ninguno de los tres sabía que lo habían atacado hasta que Dragos se lo dijo.
- **Revendedores que leen lo que pasa por ellos.** En un mercado de servicios de IA, varios revendedores podían ver y guardar los mensajes de los clientes con las herramientas normales de registro. Sin hackear nada.
- **Ajustes de privacidad que no se respetan.** Algunos proveedores no cumplían la opción de "no guardar datos" (lo que en inglés llaman *Zero Data Retention*). Los sistemas de un laboratorio chino de IA visitaron las direcciones cebo de más de la mitad de los mensajes que recibieron, y muchos iban marcados como "no guardar".

Dragos no ha publicado los nombres de los proveedores. Y reconoce un límite del método: el canario dice que un mensaje se ha filtrado, pero no siempre en qué punto de la cadena.

## Por qué hay tantos intermediarios

Cuando usas ChatGPT en el navegador, hablas directamente con OpenAI. Pero muchas herramientas no funcionan así. Un chatbot de tu web, un agente de WhatsApp o una automatización pueden pasar por varios intermediarios:

1. **La herramienta que usas** (el chatbot, la extensión, la app).
2. **Un "router" de IA**, un servicio que da acceso a decenas de modelos con una sola cuenta y elige a quién mandar cada mensaje.
3. **El proveedor que ejecuta el modelo**, que no siempre es quien lo creó. Los modelos abiertos los alojan muchas empresas distintas, a precios distintos.

Dragos señala que algunos routers abiertos mandan cada petición al vendedor que ofrece el precio más bajo en ese momento. Así, el mismo mensaje puede acabar en un proveedor diferente cada vez, y cada uno tiene su propia seguridad y su propia política de datos. Cuanto más barato y más largo es el camino, más sitios hay donde se puede quedar una copia.

## Qué significa para una empresa pequeña

No hace falta dejar de usar la IA. Hace falta usarla sabiendo esto: **todo lo que escribes en un mensaje sale de tu empresa**. Si el servicio es serio, se queda ahí. Si en la cadena hay alguien descuidado o hackeado, no.

Los casos que más veo en negocios pequeños:

- **Pegar contraseñas o claves** para que la IA "arregle algo". Por ejemplo, la configuración del correo o el archivo de ajustes de la web, con la clave dentro.
- **Pegar datos de clientes**: un Excel con nombres y teléfonos para que lo ordene, o el historial de un paciente para redactar un informe.
- **Instalar extensiones o apps de IA gratuitas** sin saber qué empresa hay detrás ni a quién mandan el texto.
- **Un chatbot montado con el modelo más barato** del router que tocara, sin mirar dónde se procesan las conversaciones de tus clientes.

Lo último importa también por la ley. Si tu chatbot recibe datos personales de clientes, tú eres responsable de saber quién los trata y dónde. El [Reglamento General de Protección de Datos](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807) te pide elegir proveedores que ofrezcan garantías suficientes (artículo 28). "Lo eligió el router" no es una respuesta.

## Qué hacer esta semana

1. **No pegues nunca contraseñas, claves de API ni datos de tarjetas** en una IA. Si necesitas ayuda con un archivo de configuración, borra antes los secretos y pon `XXXX` en su lugar.
2. **Quita los datos personales antes de pegar.** Para ordenar un listado o redactar un correo, la IA no necesita el nombre ni el teléfono reales del cliente.
3. **Usa la versión de empresa de la herramienta.** OpenAI, por ejemplo, [no usa para entrenar](https://openai.com/business-data/) lo que se envía desde ChatGPT Business, Enterprise ni su API. En las cuentas personales tienes que revisar tú los [controles de datos](https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt).
4. **Haz inventario de las herramientas de IA** que usa tu equipo: extensiones del navegador, apps del móvil, plugins de la web. Quita las que nadie sabe de dónde salen.
5. **Si una clave pudo pegarse en algún sitio, cámbiala.** Es lo mismo que haces cuando pierdes unas llaves: no esperas a ver si alguien abre la puerta.

## Si tienes un chatbot o un agente de IA

Aquí la responsabilidad es mayor, porque los mensajes no son tuyos: son de tus clientes. Pregúntale a quien te lo montó, o revísalo tú:

- **¿Qué proveedor procesa los mensajes?** Debería haber un nombre concreto, no "el más barato disponible".
- **¿Pasa por un router?** No es malo en sí. Pero si es así, hay que configurarlo para que solo use proveedores que no guardan datos. OpenRouter, por ejemplo, permite [exigir proveedores sin retención de datos](https://openrouter.ai/docs/projects/docs/guides/features/zdr) en cada petición o en toda la cuenta.
- **¿Dónde están las claves?** Las claves de la API deben estar en el servidor, nunca en el código que se descarga el navegador, y con un límite de gasto. Lo explico en [qué revisar en una web hecha con IA](/blog/web-hecha-con-ia-vibe-coding-seguridad/).
- **¿Filtra los secretos?** Es una de las recomendaciones de Dragos: activar filtros que detecten contraseñas y claves antes de que el mensaje salga hacia el modelo. Si un cliente pega su DNI o su tarjeta en el chat, que no viaje tal cual.
- **¿Avisa de que es una IA?** No tiene que ver con la filtración, pero sí con la confianza. Lo conté en [el AI Act y los chatbots](/blog/ai-act-chatbot-avisar-ia-empresas/).

Dragos añade una tercera idea para quien ya tiene sistemas en marcha: sembrar sus propios canarios. Es decir, poner datos falsos en tus flujos y vigilar si aparecen fuera. Para una pyme suele ser más de lo necesario, pero a quien te mantiene la herramienta no le cuesta mucho.

## Lo barato puede salir caro

Los routers y los modelos abiertos alojados por terceros han abaratado mucho la IA, y eso es bueno para las empresas pequeñas. Pero el precio por mensaje no es lo único que cuenta. Un agente de WhatsApp que atiende a tus clientes maneja nombres, teléfonos y a veces datos de salud. Ahorrar unos euros al mes mandando esas conversaciones a un proveedor desconocido no compensa.

Si estás pensando en montar uno, en [cuánto cuesta un agente IA para WhatsApp Business](/blog/cuanto-cuesta-agente-ia-whatsapp-business-2026/) tienes las cuentas con un proveedor claro. Y si quieres un chatbot para tu web con los datos bien controlados desde el principio, es lo que hago en el servicio de [chatbot con IA](/servicios/chatbot-ia/).

*Foto de portada: [Nikowsk](https://commons.wikimedia.org/wiki/File:Old_key_and_laptop.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), recortada.*
