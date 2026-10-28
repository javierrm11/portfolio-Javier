---
title: "Mejores skills de Claude Code en 2026 para desarrollo web"
description: "Las skills de Claude Code que de verdad aportan en desarrollo web: qué hace cada una, el comando exacto para instalarla y cuáles conviene evitar."
pubDate: 2026-10-27
category: claude
tags: ["Claude Code", "Agent Skills", "Plugins", "Productividad"]
readTime: 7
cover: ./covers/mejores-skills-claude-code-2026.jpg
featured: true
---

Si solo quieres la lista: para desarrollo web, las skills que más merecen la pena a octubre de 2026 son **Superpowers** (método de trabajo con planificación y TDD), **frontend-design** (interfaces que no parecen plantilla), **skill-creator** (para crear las tuyas), las skills de documentos y **webapp-testing** del repositorio oficial de Anthropic, los plugins de seguridad de **Trail of Bits** y **Context7** para documentación actualizada. Abajo explico qué hace cada una y cómo instalarla, con el comando exacto.

## Qué es una skill (en 30 segundos)

Una skill es una carpeta con un archivo `SKILL.md`: un frontmatter YAML con `name` y `description`, y debajo instrucciones en Markdown. Puede llevar scripts y archivos de referencia al lado.

La gracia está en cómo se cargan. Según la [documentación de Claude Code](https://code.claude.com/docs/en/skills), al arrancar Claude solo ve el nombre y la descripción de cada skill; el cuerpo entra en contexto cuando la tarea encaja o cuando la invocas tú con `/nombre-de-la-skill`. Por eso puedes tener muchas instaladas sin pagar el coste en tokens de todas a la vez.

Las skills viven en tres sitios principales:

- `~/.claude/skills/<nombre>/SKILL.md`: personales, para todos tus proyectos.
- `.claude/skills/<nombre>/SKILL.md`: del proyecto, se suben al repo y le llegan a todo el equipo.
- Dentro de un **plugin**: se instalan desde un marketplace y se invocan como `/plugin:skill`.

Casi todas las de esta lista se instalan como plugin. Si quieres montar la tuya desde cero, lo explico en [cómo crear tu propia skill de Claude paso a paso](/blog/crear-skill-claude-paso-a-paso/).

## Un apunte sobre el estándar: ahora es de una fundación

El 22 de octubre de 2026 Anthropic [anunció que dona Agent Skills a la Agentic AI Foundation](https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation) (AAIF), bajo la Linux Foundation: la especificación, el nombre, la organización de GitHub y el dominio [agentskills.io](https://agentskills.io/specification). Es la misma fundación que ya aloja MCP.

Según el propio anuncio, más de 70 plataformas de agentes han integrado el formato desde que se publicó como estándar en diciembre de 2025. En la práctica, para ti significa algo concreto: una skill bien escrita no te ata a Claude Code. Aun así, es una noticia de hace una semana; habrá que ver cómo evoluciona la gobernanza y la hoja de ruta que proponen (versiones del estándar y guías de seguridad).

## Antes de instalar nada: cómo funcionan los marketplaces

El marketplace oficial, `claude-plugins-official`, [se añade solo la primera vez que abres Claude Code en la terminal](https://code.claude.com/docs/en/plugins/anthropic-marketplaces). Desde ahí instalas con:

```text
/plugin install <plugin>@claude-plugins-official
```

Si te dice que no encuentra el marketplace, lo añades con `/plugin marketplace add anthropics/claude-plugins-official`. Para explorar el catálogo tienes la pestaña **Discover** de `/plugin`.

Una advertencia que hago siempre: un plugin puede ejecutar código en tu máquina (hooks, scripts, servidores MCP). La propia documentación avisa de que Anthropic no revisa los marketplaces de terceros. Lee el repositorio antes de instalar, igual que harías con un paquete de npm con pocas descargas.

## 1. Superpowers: un método de trabajo, no un truco

[Superpowers](https://github.com/obra/superpowers) es de Jesse Vincent (obra) y es lo más parecido a darle a Claude Code una forma de trabajar de equipo senior. Son skills que se encadenan solas: `brainstorming` para aclarar qué quieres antes de tocar código, `writing-plans` para trocear el trabajo en tareas pequeñas con rutas de archivos y verificación, `test-driven-development` con rojo-verde-refactor, `systematic-debugging`, revisión de código entre tareas y `verification-before-completion` para que no dé algo por arreglado sin comprobarlo.

```text
/plugin install superpowers@claude-plugins-official
```

Licencia MIT. Mi consejo: para un script de usar y tirar es demasiado proceso. Para una funcionalidad de varias horas, es justo lo que evita que el agente se lance a escribir código sin entender el problema.

## 2. frontend-design: interfaces que no gritan "hecho con IA"

Es la skill oficial de Anthropic para diseño de interfaces. Empuja a Claude a tomar decisiones deliberadas de paleta, tipografía y composición en lugar de caer en el degradado morado y las tarjetas de siempre.

```text
/plugin install frontend-design@claude-plugins-official
```

Útil cuando partes de cero o quieres replantear una pantalla. Si ya tienes un sistema de diseño con variables CSS definidas (como este portfolio, con todo en `:root`), díselo en el prompt o en tu `CLAUDE.md` para que lo respete en vez de reinventarlo.

## 3. skill-creator: la skill para hacer skills

También oficial. Te guía para crear una skill nueva, mejorar una existente y, lo más interesante, medirla: genera casos de prueba, compara versiones y ajusta la `description` para que se active cuando debe y no cuando no.

```text
/plugin install skill-creator@claude-plugins-official
```

Si vas a escribir skills para tu equipo, empieza por esta.

## 4. Skills de documentos y webapp-testing (repo anthropics/skills)

El repositorio [anthropics/skills](https://github.com/anthropics/skills) funciona como marketplace propio con dos paquetes principales:

```text
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
/plugin install example-skills@anthropic-agent-skills
```

- **document-skills**: `docx`, `pdf`, `pptx` y `xlsx`. Son las mismas que usa Claude para trabajar con documentos. Ojo: el README indica que estas cuatro son *source-available*, no open source.
- **example-skills**: incluye, entre otras, `webapp-testing`, `mcp-builder`, `frontend-design` y `skill-creator`.

La que más uso para web es **webapp-testing**: Claude escribe scripts de Playwright en Python para abrir tu app en local, hacer clic, sacar capturas y leer los logs del navegador. Perfecto para comprobar que un formulario o un flujo de login funciona de verdad después de un cambio. **mcp-builder** es la guía para construir servidores MCP en Python (FastMCP) o TypeScript.

El propio repositorio avisa de que son skills de demostración y que conviene probarlas bien antes de usarlas en tareas críticas.

## 5. Trail of Bits: seguridad de verdad

[trailofbits/skills](https://github.com/trailofbits/skills) es el marketplace de una de las consultoras de seguridad más conocidas. Para una app web, los plugins que más sentido tienen:

- **static-analysis**: CodeQL, Semgrep y lectura de informes SARIF.
- **insecure-defaults**: busca configuraciones que fallan en abierto.
- **supply-chain-risk-auditor**: revisa dependencias de npm, PyPI y Go (avisos de seguridad, proyectos abandonados, scripts de instalación).
- **differential-review**: revisión de seguridad de cambios usando el historial de git.
- **sharp-edges**: APIs y configuraciones propensas a errores.

```text
/plugin marketplace add trailofbits/skills
```

Después abres `/plugin` y eliges qué plugins instalar. Licencia CC-BY-SA-4.0. Si te interesa cómo combinarlos con lo que ya trae Claude Code, lo cuento en [auditar la seguridad de tu app con Claude Code](/blog/auditar-seguridad-app-claude-code/).

## 6. Context7: documentación actualizada en vez de memoria

[Context7](https://github.com/upstash/context7), de Upstash, resuelve un problema muy concreto: que el modelo te escriba código con la API de una versión antigua de una librería. Inyecta documentación y ejemplos de la versión que usas.

Técnicamente hay dos formas de usarlo. En el marketplace oficial es un servidor MCP remoto que funciona sin clave (con `CONTEXT7_API_KEY` tienes límites más altos):

```text
/plugin install context7@claude-plugins-official
```

O con su instalador, que configura una skill más su CLI (`ctx7`) y pide Node.js 22.13 o superior:

```bash
npx ctx7 setup --claude
```

No es una skill "pura" en el primer caso, pero en la práctica cumple el mismo papel y lo pongo en la lista porque es de lo que más errores tontos ahorra con Astro, Next.js o Supabase, que cambian rápido.

## Lo que ya viene de serie (y mucha gente no usa)

Antes de instalar nada, mira lo que trae Claude Code. Según la [referencia de comandos](https://code.claude.com/docs/en/commands), a octubre de 2026:

- `/code-review`: busca bugs en el diff actual; con `--fix` aplica los arreglos.
- `/simplify`: cuatro agentes en paralelo buscando reutilización, simplificación y eficiencia en lo que has cambiado.
- `/security-review`: pasada de seguridad sobre los cambios de tu rama respecto a la rama por defecto de `origin`.

Y para seguridad continua, el plugin oficial [security-guidance](https://code.claude.com/docs/en/security-guidance) revisa lo que Claude escribe mientras trabaja (`/plugin install security-guidance@claude-plugins-official`).

## Mi criterio para no acabar con 40 skills

La documentación explica que, si tienes muchas, Claude Code recorta descripciones para que el listado quepa en su presupuesto de contexto, empezando por las que menos usas. Traducido: instalar por instalar empeora la activación de las que sí importan.

Lo que yo haría en un proyecto web típico:

1. **Siempre**: frontend-design y Context7.
2. **Funcionalidades largas**: Superpowers.
3. **Antes de producción**: webapp-testing y los plugins de Trail of Bits que encajen con tu stack.
4. **Para tu equipo**: skill-creator y skills propias en `.claude/skills/` con vuestras convenciones.

`/skills` te enseña las que tienes cargadas y cuántos tokens ocupa cada una. Si alguna no la has usado en un mes, fuera.

## ¿Quieres llevar esto a tu equipo?

Instalar skills es fácil; lo que cuesta es decidir cuáles encajan con vuestro stack, escribir las propias y que el equipo las use de verdad. Es justo lo que hago: integrar Claude e IA en proyectos y equipos de desarrollo, desde la configuración de Claude Code hasta agentes en producción. Si te interesa, [escríbeme](/#contact) y lo vemos.
