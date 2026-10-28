---
title: "Desarrollo web junior en 2026: qué aprender con la IA"
description: "Qué fundamentos aprender, cómo usar la IA para aprender sin depender de ella y qué proyectos poner en tu portfolio para conseguir tu primer trabajo en 2026."
pubDate: 2026-10-06
category: carrera
tags: ["Carrera", "Desarrollo web", "IA", "Portfolio"]
readTime: 7
cover: ./covers/desarrollador-web-junior-2026-ia.jpg
---

Si quieres entrar en el desarrollo web como junior en 2026, mi respuesta corta es esta: aprende bien los fundamentos (HTML, CSS, JavaScript/TypeScript, HTTP, SQL y Git), usa la IA como profesor y revisor, no como quien escribe por ti, y demuestra que sabes construir **proyectos reales y desplegados**. Los datos dicen que el primer empleo está más difícil que hace tres años, así que lo que te diferencia ya no es saber escribir código: es saber decidir, comprobar y entregar.

## El mercado junior en 2026, con datos

Prefiero empezar con cifras antes que con opiniones. Tres fuentes recientes:

- **Stanford (agosto de 2026).** El estudio [*Canaries in the Coal Mine?*](https://digitaleconomy.stanford.edu/app/uploads/2025/11/CanariesintheCoalMine_Nov25.pdf) de Brynjolfsson, Chandar y Chen, con datos de nóminas de ADP en EE. UU. hasta junio de 2026, concluye que el empleo de los jóvenes de 22 a 25 años en ocupaciones expuestas a la IA está un **19 % por debajo** de donde estaría si hubiera seguido el ritmo de sus compañeros menos expuestos. En los trabajadores con experiencia no ven esa brecha. El efecto llega sobre todo por **menos contrataciones**, no por despidos. Los propios autores lo presentan como indicadores descriptivos, no como prueba de causalidad, y son datos de EE. UU.
- **Stack Overflow Developer Survey 2026** (más de 30.000 respuestas). Según el [comunicado oficial](https://stackoverflow.co/company/press/archive/stack-overflow-annual-developer-survey-ai-trust-conditional), el 66 % usa asistentes o agentes de código, pero solo el 6,6 % confía en la IA para decisiones importantes. Casi la mitad confía en ella **cuando puede verificar lo que hace**.
- **LinkedIn, Empleos en Auge 2026 en España.** El perfil que más crece es el de ingeniero/a de IA, y entre los puestos de los que vienen esas personas aparece el de ingeniero/a de software, según [la lista publicada](https://www.mastermania.com/noticias_masters/estas-son-las-25-profesiones-que-mas-creceran-en-espana-en-2026-AMP-8980.html).

Mi lectura: la IA hace bien el trabajo de "manual" que antes hacía un junior. Lo que todavía no hace sola es verificar, decidir y hacerse responsable. Hacia ahí tienes que apuntar.

## Fundamentos que siguen importando (más que antes)

Puede parecer que, si la IA escribe el código, los fundamentos sobran. Es al revés: **no puedes revisar algo que no entiendes**. Esto es lo que yo priorizaría:

1. **HTML semántico y accesibilidad.** La IA genera `div` encima de `div` con mucha facilidad. Saber cuándo va un `button`, un `nav` o un `label` es lo que separa una web usable de una que no lo es.
2. **CSS de verdad**: flexbox, grid, cascada y diseño responsive. Es donde más "funciona en mi pantalla" ves en el código generado.
3. **JavaScript y TypeScript.** Asincronía, closures, manejo de errores y tipos. Si no entiendes un `await` que falta, no vas a encontrar el bug que te ha dejado la IA.
4. **HTTP y APIs.** Métodos, códigos de estado, cabeceras, CORS, caché. Casi cualquier proyecto real acaba hablando con una API de terceros, con sus límites y sus errores.
5. **SQL y modelado de datos.** Tablas, relaciones, índices y permisos. Si usas Supabase, aprende Row Level Security pronto: [así protegí los datos de una app multiusuario](/blog/supabase-rls-citaswassap/).
6. **Git.** Ramas, commits con sentido, resolver conflictos y leer un diff. Revisar diffs es, literalmente, lo que más vas a hacer trabajando con agentes.
7. **Un framework, a fondo.** Next.js o Astro, por ejemplo. Mejor uno bien entendido que cinco a medias.
8. **Rendimiento y SEO técnico básicos.** Core Web Vitals, metadatos, imágenes. Es lo que diferencia una web profesional de un ejercicio de curso.

## Cómo usar la IA para aprender, no para depender

En la misma encuesta de Stack Overflow, el 52 % aprendió una habilidad o un lenguaje nuevo este año. De ellos, el 58,9 % tiró de documentación técnica y el 52,7 % de herramientas de IA para generar código. Usar IA para aprender ya es lo normal. La diferencia está en **cómo**. Estas son las reglas que te propongo:

- **Primero tú, luego la IA.** Escribe tu solución, aunque sea fea, y después pide una revisión: "¿qué problemas ves en este código y por qué?".
- **Pide explicaciones, no soluciones.** "Explícame por qué este `useEffect` se ejecuta dos veces" enseña más que "arréglalo".
- **Haz que te examine.** "Hazme cinco preguntas sobre lo que acabas de explicar y corrígeme".
- **Contrasta con la documentación oficial.** La IA se equivoca con APIs que han cambiado. MDN, la documentación del framework y la de cada servicio mandan.
- **Repite sin ayuda.** Si un ejercicio lo resolviste con IA, rehazlo al día siguiente sin ella. Si no puedes, no lo has aprendido.
- **Pide el plan antes que el código.** Si usas un agente como Claude Code, el modo plan te enseña cómo piensa la tarea antes de tocar archivos. Leer esos planes es una clase gratis de arquitectura.
- **Nunca entregues código que no sepas explicar.** En una entrevista técnica te lo van a preguntar línea por línea.

## Qué buscan las empresas en un junior

No voy a inventarme porcentajes de ofertas. Lo que sí dicen las fuentes de arriba encaja con lo que se ve en cualquier proceso de selección:

- **Criterio para verificar.** Si los equipos solo confían en la IA cuando pueden comprobar lo que hace, necesitan gente capaz de comprobarlo: leer código ajeno, escribir tests, detectar un fallo de seguridad.
- **Saber trabajar con herramientas de IA.** Con dos tercios de los desarrolladores usando asistentes, llegar sin haberlos usado nunca es una desventaja. Llegar sabiendo usarlos con cabeza es una ventaja.
- **Algo parecido a experiencia.** Según el estudio de Stanford, la IA afecta menos donde complementa al trabajador con experiencia. Un junior no puede tener años, pero sí puede demostrar que ha resuelto problemas reales de principio a fin.
- **Comunicación.** Explicar una decisión técnica, escribir un buen README, hacer una pregunta clara. Con agentes de por medio, escribir bien es parte del trabajo técnico.

## Un portfolio con proyectos reales

Un portfolio con la quinta app de tareas ya no sirve. Lo que funciona es un proyecto que:

1. **Resuelve un problema concreto de alguien concreto.** Mejor si ese alguien existe: un negocio de tu barrio, una asociación, un familiar.
2. **Está desplegado** y se puede usar, no solo un repositorio.
3. **Tiene un README que explica decisiones**: por qué esa base de datos, qué descartaste, qué harías distinto.
4. **Tiene algún resultado**, aunque sea pequeño: usuarios, tiempo ahorrado, tráfico.

Como referencia, así están planteados los proyectos de mi propio portfolio:

- **Canalplad**: la web de una empresa de canalones y pladur en Córdoba. Cliente real y resultado medible: +35 % de tráfico orgánico con SEO técnico. Lo cuento en [el caso de Canalplad](/blog/canalplad-seo-tecnico-nextjs/).
- **CitasWassap**: reservas por WhatsApp para barberías con un agente de IA, multi-tenant con Supabase RLS. Enseña seguridad y diseño de datos.
- **API Vuelos**: seguimiento de vuelos en tiempo real con APIs externas. Enseña a integrar servicios de terceros con sus límites.
- **GuionIA**: genera guiones de vídeo por escenas con RAG. Enseña IA aplicada, no solo llamar a un chat.

No necesitas cinco. Con **dos proyectos bien hechos**, uno de ellos para un usuario real, tienes más que la mayoría de los portfolios que llegan a un proceso junior.

## Un plan sencillo

- **Meses 1–2:** HTML, CSS y JavaScript sin framework. Una web para un negocio real o inventado, publicada.
- **Meses 3–4:** TypeScript, un framework y una base de datos con autenticación. Un proyecto con usuarios y permisos.
- **Meses 5–6:** un proyecto que integre una API externa o IA, con tests básicos, desplegado y bien documentado. A partir de aquí, a postular.

Durante todo el plan, usa la IA como revisor y profesor, con las reglas de arriba.

Desarrollo aplicaciones web a medida e integro IA en negocios reales desde Córdoba. Si tienes un proyecto y buscas a alguien que lo construya de principio a fin, o quieres comentarme el tuyo, [escríbeme](/#contact).
