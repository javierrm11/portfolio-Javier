---
title: "Cómo aparecer en ChatGPT y en AI Overviews (GEO)"
description: "Qué es el GEO y qué funciona de verdad para que ChatGPT y Google te citen: contenido citable, schema, autoría, ficha de Google y el estado real de llms.txt."
pubDate: 2026-10-12
category: seo-tecnico
tags: ["GEO", "SEO técnico", "AI Overviews"]
readTime: 6
cover: ./covers/aparecer-en-chatgpt-ai-overviews-geo.jpg
---

Para aparecer en ChatGPT y en los AI Overviews de Google no hay un truco nuevo: tu página tiene que estar indexada, ser fácil de rastrear y decir algo útil que no diga todo el mundo, de forma clara y con datos que se puedan citar. Eso es, en la práctica, el GEO (*Generative Engine Optimization*). Google lo dice sin rodeos en su guía oficial: optimizar para la búsqueda con IA "sigue siendo SEO".

Aun así, hay acciones concretas que ayudan más que otras, y mitos que conviene descartar. Aquí van las dos cosas, con fuentes, y sin prometer lo que nadie puede garantizar: ni yo ni ninguna agencia controlamos qué cita una IA.

## Qué es el GEO

El término viene de un [artículo académico de 2023](https://arxiv.org/abs/2311.09735) (presentado en la conferencia KDD 2024) que estudió cómo conseguir que los motores generativos, los que responden con un texto en vez de con una lista de enlaces, usen y citen tu contenido.

Hoy se usa para hablar de tres sitios donde la gente ya busca:

- **AI Overviews** ("Vista creada con IA" en español): el resumen que Google muestra encima de los resultados.
- **Modo IA de Google**: una búsqueda tipo chat, que [llegó a España en octubre de 2025](https://www.xataka.com/robotica-e-ia/google-lanza-espana-su-modo-ia-ello-nueva-forma-realizar-busquedas-web-asi-puedes-activarlo).
- **ChatGPT, Perplexity, Gemini**: asistentes que buscan en la web y enlazan sus fuentes.

## Cómo eligen las fuentes

Cada sistema funciona a su manera, pero los principios se parecen.

**Google.** Según su [documentación sobre funciones de IA](https://developers.google.com/search/docs/appearance/ai-features), para aparecer como enlace en AI Overviews o en el Modo IA la página solo tiene que estar indexada y poder mostrarse con fragmento en la búsqueda normal. No hay requisitos técnicos adicionales. Los AI Overviews se apoyan en los mismos sistemas de calidad y posicionamiento que el resto de Google, así que, si no posicionas, difícilmente te citarán.

**ChatGPT.** OpenAI usa un rastreador propio, [OAI-SearchBot](https://developers.openai.com/api/docs/bots), para mostrar webs en sus resultados de búsqueda. Si lo bloqueas en tu `robots.txt`, le pones muy difícil citarte. Es distinto de GPTBot, que rastrea contenido para entrenar modelos: puedes bloquear uno y permitir el otro.

**El estudio de GEO.** El artículo académico probó varias técnicas. Las que mejor funcionaron fueron añadir citas textuales, datos y estadísticas, y referencias a fuentes, con mejoras de visibilidad de hasta un 40 % en sus pruebas. Repetir palabras clave, en cambio, no ayudó, y en algún motor empeoró los resultados. Es un experimento de laboratorio, no una garantía, pero apunta en la misma dirección que Google.

## 7 acciones que sí puedes hacer

### 1. Escribe contenido que se pueda citar

Una IA cita frases que responden algo concreto. Escribe así:

- **Responde en el primer párrafo.** Si alguien busca "cuánto cuesta X", la cifra debe estar arriba, no en el quinto párrafo.
- **Da datos con fecha y fuente**, como hago en [este artículo sobre el coste de un agente IA para WhatsApp](/blog/cuanto-cuesta-agente-ia-whatsapp-business-2026/), con las tarifas oficiales de Meta.
- **Aporta lo que no tiene nadie**: tu experiencia, tus casos, tus precios, tus números. Google lo llama contenido *non-commodity*, y en su [guía de optimización para IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) es la primera recomendación.

No hace falta trocear el texto en fragmentos minúsculos "para la IA". Google lo dice expresamente: no hay longitud ideal y no es necesario dividir el contenido en piezas pequeñas.

### 2. Usa datos estructurados, sin esperar milagros

El *schema* (datos estructurados) describe tu página en un formato que entienden las máquinas: quién eres, qué negocio tienes, dónde estás, quién escribe el artículo.

Google es claro: los datos estructurados **no son obligatorios** para la búsqueda con IA y no existe un schema especial para ella. Pero sí recomienda mantenerlos porque te hacen elegible para resultados enriquecidos, y pide que coincidan con lo que se ve en la página. Para una pyme, los básicos son `LocalBusiness` u `Organization`, `Article` en el blog y `Person` para el autor.

### 3. Deja claro quién escribe y por qué sabe

Firma los artículos con nombre real, una biografía corta y enlaces a tu trabajo. En los míos aparece mi nombre y enlazo a proyectos reales, como el [SEO técnico de Canalplad](/blog/canalplad-seo-tecnico-nextjs/), donde el tráfico orgánico subió un 35 %. La experiencia demostrable es una de las señales que Google describe en su documentación sobre [contenido útil](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

### 4. Consigue menciones de verdad

Que te nombren medios locales, asociaciones, proveedores o clientes ayuda a que los sistemas te asocien con tu tema. Pero ojo: Google advierte de que buscar "menciones" artificiales por toda la web no sirve tanto como parece. Una entrevista en un medio local vale más que cien comentarios en foros.

### 5. Cuida tu ficha de Google Business Profile

Si tienes un negocio local, esta es probablemente la acción con más retorno. La guía de Google menciona expresamente los perfiles de empresa (y Merchant Center, si vendes productos) como forma de aparecer tanto en las respuestas de IA como en los resultados normales. Categorías correctas, horario actualizado, fotos reales, servicios con descripción y reseñas respondidas.

### 6. No bloquees a quien quieres que te cite

Revisa tu `robots.txt`. Hay webs que bloquean a todos los bots de IA "por si acaso" y luego se preguntan por qué ChatGPT no las menciona. Decide conscientemente: puedes permitir OAI-SearchBot (búsqueda) y bloquear GPTBot (entrenamiento), por ejemplo.

Y si no quieres que Google use un fragmento concreto en sus resúmenes, existen controles como `nosnippet` o `data-nosnippet`, pero úsalos con cuidado porque afectan también a tu fragmento en la búsqueda normal.

### 7. Haz que tu web sea rápida y rastreable

Nada de esto sirve si la web tarda en cargar o el contenido importante solo aparece después de ejecutar mucho JavaScript. Es la base de todo, y lo cuento con un caso práctico en [Core Web Vitals con Astro y Lighthouse](/blog/core-web-vitals-astro-lighthouse/).

## ¿Y llms.txt? Su estado real

`llms.txt` es una [propuesta de septiembre de 2024](https://llmstxt.org/) de Jeremy Howard: un archivo de texto en la raíz de tu web que resume su contenido para que lo lean los modelos de IA.

A octubre de 2026, su estado es este:

- **Google no lo usa para la búsqueda.** Su guía oficial dice que no necesitas crear archivos de texto para IA, Markdown ni marcado especial para aparecer en Google, y que tenerlos no te ayuda ni te perjudica.
- **No es un estándar.** Es una propuesta. Algunas herramientas y agentes lo leen, sobre todo para documentación técnica, pero ningún buscador grande ha confirmado que lo use para elegir fuentes.

Mi recomendación: si ya lo tienes, déjalo; no hace daño. Si no lo tienes, no es una prioridad para un negocio local. Dedica ese tiempo a tu ficha de Google y a escribir contenido útil.

## Cómo saber si está funcionando

En Search Console, el tráfico que llega desde AI Overviews y el Modo IA aparece **mezclado** con el resto del tráfico web, sin un filtro propio. Para ChatGPT, mira en tu analítica las visitas con origen `chatgpt.com`. Y hay una prueba sencilla que puedes hacer cada mes: pregunta a ChatGPT y a Google lo que preguntaría tu cliente ("mejor fontanero en Córdoba", "cuánto cuesta X") y apunta si sales y quién sale en tu lugar.

Si aparecer en el resumen te preocupa porque te quita clics, lo analizo con datos en [AI Overviews te quita clics: qué hacer en 2026](/blog/ai-overviews-menos-clics-que-hacer/).

## ¿Revisamos tu web?

Si quieres saber qué le falta a tu web para que Google y ChatGPT la entiendan y la recomienden, [escríbeme por WhatsApp](https://wa.me/34611434736?text=Hola%20Javier%2C%20vengo%20de%20tu%20blog%20y%20me%20interesa%20mejorar%20mi%20web%20para%20aparecer%20en%20ChatGPT%20y%20Google) y lo vemos. También puedes ver mis [servicios y precios](/#servicios) (web profesional desde 349 €, precio de lanzamiento) o usar el [formulario de contacto](/#contact).
