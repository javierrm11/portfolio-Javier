---
title: "WebMCP: qué es y si tu empresa debe preparar ya su web"
description: "WebMCP permite que los agentes de IA del navegador usen tu web sin adivinarla. Qué es, ejemplos de código, sus riesgos y por qué aún no corre prisa para tu empresa."
pubDate: 2026-11-02
category: ia
tags: ["WebMCP", "Agentes IA", "Desarrollo web"]
readTime: 4
cover: ./covers/webmcp-que-es-empresas.jpg
---

WebMCP es una propuesta de estándar para que una web le diga a los agentes de IA del navegador qué acciones ofrece, como pedir un presupuesto o reservar una cita, para que no tengan que adivinarlo mirando la pantalla. Se puede probar en Chrome desde la versión 149, pero sigue siendo un borrador. Si tienes una empresa pequeña, mi recomendación es no gastar dinero en ello todavía y centrarte en algo que ya te beneficia hoy y te dejará preparado: formularios y contenidos bien hechos.

## Qué problema resuelve

Hoy, cuando un agente de IA usa una web por ti, suele hacerlo como una persona con mala vista: lee el HTML o mira capturas de pantalla, y deduce qué botón pulsar. Funciona, pero se rompe en cuanto cambia un diseño o aparece un anuncio.

Con WebMCP, según [la documentación de Chrome](https://developer.chrome.com/docs/ai/webmcp), la web expone herramientas con un nombre, una descripción y unos parámetros. El agente deja de adivinar y llama a la acción directamente.

No hay que confundirlo con MCP, del que hablé en [este artículo sobre Claude y Supabase](/blog/mcp-claude-supabase-desarrolladores-web/). MCP conecta sobre todo a la IA con servicios en el servidor, mientras que WebMCP, como [explica InfoQ](https://www.infoq.com/news/2026/06/webmcp-web-agent-standard-chrome/), funciona por completo en el navegador, con la página abierta.

## Cómo es, con código

Hay dos formas. La **declarativa** consiste en añadir atributos a un formulario que ya existe. Este ejemplo está adaptado del de la [documentación oficial](https://developer.chrome.com/docs/ai/webmcp/declarative-api):

```html
<form toolname="pedirPresupuesto"
      tooldescription="Solicita un presupuesto para una página web."
      action="/presupuesto">
  <label for="nombre">Nombre</label>
  <input id="nombre" name="nombre" required>

  <label for="servicio">Servicio</label>
  <select id="servicio" name="servicio"
          toolparamdescription="Tipo de web que se necesita.">
    <option>Web de presentación</option>
    <option>Tienda online</option>
  </select>

  <button type="submit">Enviar</button>
</form>
```

La **imperativa** registra la herramienta con JavaScript, para acciones más complejas. También adaptado de [la documentación](https://developer.chrome.com/docs/ai/webmcp/imperative-api):

```js
await document.modelContext.registerTool({
  name: 'consultar_disponibilidad',
  description: 'Devuelve las citas libres para una fecha.',
  inputSchema: {
    type: 'object',
    properties: { fecha: { type: 'string' } },
    required: ['fecha'],
  },
  annotations: { readOnlyHint: true },
  execute: async ({ fecha }) => {
    const huecos = await buscarHuecos(fecha);
    return JSON.stringify(huecos);
  },
});
```

Para probarlo en local, se activa la opción `chrome://flags/#enable-webmcp-testing`. Ten en cuenta que aún puede cambiar: algunas fuentes citan nombres de API distintos, así que fíate de la documentación oficial.

![Mano con un móvil sobre un fondo de circuitos y una barra de búsqueda](./fotos/webmcp-buscador-movil.jpg)
*Foto: [Jernej Furman](https://commons.wikimedia.org/wiki/File:Business_and_technology_concept_hand_holding_smartphone_and_search_bar_%2852917310335%29.jpg), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), redimensionada.*

## En qué punto está

| Cuestión | Situación a noviembre de 2026 |
|---|---|
| Quién lo impulsa | [Google y Microsoft](https://bikain.studio/webmcp/), en un grupo comunitario del W3C |
| Es un estándar | No: es un borrador y [todavía puede cambiar](https://bikain.studio/webmcp/) |
| Dónde se puede usar | [Origin trial desde Chrome 149](https://developer.chrome.com/docs/ai/webmcp) |
| Otros navegadores | [Sin soporte estable](https://bikain.studio/webmcp/) |
| Uso real | Todavía pequeño |

Y hay [una limitación de diseño](https://developer.chrome.com/docs/ai/webmcp): el agente tiene que visitar la página para descubrir sus herramientas. Es decir, WebMCP no sirve para que te encuentren. Sirve para que, una vez allí, puedan hacer algo.

## Los riesgos

Dar a un agente la capacidad de actuar en tu web también abre puertas nuevas:

- **Inyección de instrucciones.** Un texto externo, como una reseña o un comentario, puede contener órdenes dirigidas al agente. Por eso [existen anotaciones](https://www.infoq.com/news/2026/06/webmcp-web-agent-standard-chrome/) como `untrustedContentHint`, para marcar los datos que no son de fiar.
- **Reglas mal explicadas.** Si tu política de devoluciones está desactualizada, un agente puede ejecutar una acción incorrecta con toda seguridad y rapidez.
- **Permisos que nadie había probado.** Un agente puede encontrar agujeros que antes pasaban desapercibidos.

Para acciones delicadas, como una compra, [Chrome recomienda pedir confirmación](https://developer.chrome.com/docs/ai/webmcp) a la persona. Y la validación debe seguir en tu servidor: un agente tampoco es de fiar por el mero hecho de usar la herramienta correcta.

## Entonces, ¿qué hago con mi web?

| Ahora | Más adelante |
|---|---|
| Formularios con `label` y campos claros | Añadir atributos de WebMCP si el estándar se asienta |
| Precios, servicios y condiciones en texto, no en una imagen | Herramientas imperativas para reservas o stock |
| Datos estructurados con JSON-LD | Medir si llegan visitas de agentes |
| Validar todo en el servidor | |

Lo bueno de la columna izquierda es que te sirve hoy, con o sin agentes: mejora la accesibilidad, el SEO y la forma en la que te leen las IA. Lo cuento en [cómo aparecer en ChatGPT y AI Overviews](/blog/aparecer-en-chatgpt-ai-overviews-geo/). Además, la forma declarativa se apoya en esos mismos formularios, así que el trabajo no se pierde.

## Mi recomendación, según tu caso

- **Empresa de servicios con web informativa:** no hagas nada específico aún. Cuida los formularios y los contenidos.
- **Tienda online o reservas con volumen:** síguelo de cerca, y haz una prueba cuando tu plataforma lo soporte.
- **Empresa de software o equipo técnico:** merece la pena un experimento pequeño en un entorno de pruebas para entender los límites.

Lo que no haría es pagar a nadie por "preparar tu web para agentes" como si ya fuera urgente. Hoy el retorno es muy incierto.

## ¿Tu web está lista para lo básico?

Si quieres saber si tu web se entiende bien, para personas, buscadores e IA, pásame la dirección y te digo qué le falta. [Escríbeme por WhatsApp](https://wa.me/34611434736?text=Hola%20Javier%2C%20vengo%20de%20tu%20blog%20y%20quiero%20preparar%20la%20web%20de%20mi%20empresa%20para%20buscadores%20e%20IA), mira la [web profesional](/servicios/diseno-web-cordoba/), desde 349 € con precio de lanzamiento, o usa el [formulario de contacto](/#contact).

*Foto de portada: [osde8info](https://commons.wikimedia.org/wiki/File:Google_chrome_store_%287527514626%29.jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/), redimensionada.*
