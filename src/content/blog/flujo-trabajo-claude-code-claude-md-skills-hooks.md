---
title: "Claude Code: mi flujo con CLAUDE.md, skills y hooks"
description: "Qué poner en CLAUDE.md, cuándo usar una skill, un hook o un subagente en Claude Code, con el CLAUDE.md real de este portfolio en Astro como ejemplo."
pubDate: 2026-10-09
category: claude
tags: ["Claude Code", "CLAUDE.md", "Hooks", "Subagentes"]
readTime: 7
cover: ./covers/flujo-trabajo-claude-code-claude-md-skills-hooks.jpg
---

Mi regla para organizar Claude Code cabe en cuatro líneas: en **CLAUDE.md** va lo que Claude debe saber en *todas* las sesiones; en una **skill**, un procedimiento que solo hace falta a veces; en un **hook**, lo que tiene que pasar *siempre*, sin depender de que el modelo se acuerde; y un **subagente** se encarga de una tarea lateral que llenaría la conversación de ruido. Abajo lo aterrizo con el `CLAUDE.md` real de este portfolio.

## CLAUDE.md: la memoria del proyecto

Cada sesión de Claude Code empieza con el contexto vacío. `CLAUDE.md` es un Markdown que Claude lee al arrancar, y es la forma de no repetirle lo mismo cada día. Puede vivir en `./CLAUDE.md` (compartido con el equipo vía git), en `~/.claude/CLAUDE.md` (tus preferencias en todos los proyectos) o en `./CLAUDE.local.md` (personal y fuera de git), según la [documentación de memoria](https://code.claude.com/docs/en/memory).

Para empezar, `/init` analiza el repo y genera un borrador; si ya tienes uno, propone mejoras en vez de sobrescribirlo.

### El de este portfolio

Este sitio es un proyecto en Astro sin framework de UI. Su `CLAUDE.md` tiene dos bloques (los fragmentos de abajo están recortados). El primero, comandos:

```markdown
## Commands

Package manager is pnpm (pnpm-lock.yaml is the source of truth;
package-lock.json also present but not authoritative).

- `pnpm dev` — dev server at `localhost:4321`
- `pnpm build` — production build to `./dist/`
- `pnpm astro check` — type-check `.astro`/`.ts` files

There is no test suite, lint script, or CI config in this repo despite
`playwright` being a devDependency.
```

Fíjate en lo que dice además de los comandos: que hay dos lockfiles y cuál manda, y que **no hay tests** aunque Playwright aparezca en las dependencias. Son justo las cosas que Claude deduciría mal leyendo solo el `package.json`.

El segundo bloque, arquitectura y decisiones:

```markdown
The site is a plain white/light theme — no page-level decorative
background layers. Colors live as CSS custom properties on `:root` in
`global.css`; when touching color anywhere, prefer those variables over
hardcoded values.

All scroll-driven animation (GSAP + ScrollTrigger) lives centrally in
the inline `<script>` in `Main.astro`.

Several scripts gate themselves on viewport width or `matchMedia` —
when touching these, keep the JS guard threshold in sync with the
corresponding CSS breakpoint.
```

Y una línea que me parece de las más útiles: avisa de que hay muchos comentarios en español que explican *por qué* existe cada parche (fallos de Safari en iOS, bugs anteriores) y pide leerlos antes de tocar tiempos o posiciones. Incluso deja constancia de lo que se quitó (un hero con Three.js) para que Claude no lo "recupere" por su cuenta.

### Qué meter (y qué no)

La documentación oficial propone añadir algo a `CLAUDE.md` cuando:

- Claude comete el mismo error por segunda vez.
- Una revisión de código detecta algo que Claude debería haber sabido.
- Escribes en el chat la misma aclaración que en la sesión anterior.
- Una persona nueva en el equipo necesitaría ese mismo contexto.

Y da tres criterios de forma que comparto:

- **Concreto y verificable**: "Usa indentación de 2 espacios", no "formatea bien el código".
- **Corto**: por debajo de 200 líneas por archivo. Cuanto más largo, más contexto consume y peor se cumple.
- **Sin contradicciones**: si dos instrucciones chocan, Claude puede elegir una al azar.

Lo que no va: procedimientos largos, documentación de APIs o reglas que solo afectan a una carpeta. Para eso hay [reglas por ruta en `.claude/rules/`](https://code.claude.com/docs/en/memory), que solo se cargan cuando Claude toca archivos que coinciden con un glob, y skills.

A octubre de 2026, `/doctor prompt-audit` revisa tus `CLAUDE.md`, reglas y skills buscando instrucciones obsoletas, referencias a archivos que ya no existen o contradicciones (requiere Claude Code v2.1.283 o posterior).

## Skills: procedimientos bajo demanda

Una skill es un `SKILL.md` con instrucciones que **solo se cargan cuando hacen falta**. Al arrancar, Claude ve únicamente su nombre y descripción; el cuerpo entra cuando la tarea encaja o cuando la invocas con `/nombre`.

En este repo, el candidato obvio es crear posts del blog: hay un esquema Zod con categorías cerradas, una portada obligatoria y un solo post destacado. Es un procedimiento con trampas que no necesito en cada sesión, así que no va en `CLAUDE.md`. La skill completa está en [cómo crear tu propia skill de Claude paso a paso](/blog/crear-skill-claude-paso-a-paso/).

Si prefieres instalar las de otros antes de escribir las tuyas, tienes una selección en [las mejores skills de Claude Code en 2026](/blog/mejores-skills-claude-code-2026/).

## Hooks: lo que no puede depender de la memoria del modelo

Aquí está la diferencia que más gente pasa por alto. La propia documentación lo dice: Claude trata `CLAUDE.md` como **contexto, no como configuración obligatoria**. Si algo tiene que cumplirse siempre, eso es un hook.

Un [hook](https://code.claude.com/docs/en/hooks-guide) es un comando que Claude Code ejecuta en un punto concreto de su ciclo: antes de usar una herramienta (`PreToolUse`), después (`PostToolUse`), al terminar de responder (`Stop`), al iniciar sesión (`SessionStart`)… Se configuran en `.claude/settings.json` (compartido) o en `~/.claude/settings.json` (personal), y `/hooks` te enseña los que tienes activos.

### Formatear tras cada edición

El ejemplo canónico de la documentación: pasar Prettier por cada archivo que Claude edite.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

El hook recibe un JSON por la entrada estándar; `jq` saca la ruta del archivo editado y se la pasa a Prettier. Necesitas `jq` instalado. Este portfolio no tiene Prettier configurado, así que aquí no lo uso tal cual, pero la estructura vale para cualquier formateador o linter.

### Bloquear archivos que no se tocan

Este sí encaja directamente con el `CLAUDE.md` de arriba. Dice que `pnpm-lock.yaml` es la referencia y que `package-lock.json` no lo es. Decírselo está bien; impedir que lo edite es mejor. La documentación trae un script de ejemplo que bloquea `.env`, `package-lock.json` y `.git/`:

```bash
#!/bin/bash
# .claude/hooks/protect-files.sh
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
FILE_PATH="${FILE_PATH//\\//}"

for pattern in ".env" "package-lock.json" ".git/"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Bloqueado: $FILE_PATH coincide con '$pattern'" >&2
    exit 2
  fi
done
exit 0
```

Se registra como `PreToolUse` con el matcher `Edit|Write`. El `exit 2` bloquea la acción y el mensaje de error le llega a Claude, que ajusta lo que estaba haciendo.

Mi criterio: **la instrucción en CLAUDE.md explica el porqué; el hook garantiza el qué.**

## Subagentes: tareas laterales sin ensuciar la conversación

Un [subagente](https://code.claude.com/docs/en/sub-agents) trabaja en su propia ventana de contexto, con su propio prompt y sus herramientas, y devuelve solo un resumen. Sirve cuando una tarea generaría muchos resultados de búsqueda, logs o lecturas de archivos que no vas a volver a mirar.

Claude Code trae algunos de serie, como **Explore** (búsqueda en el código, solo lectura) y **Plan** (investigación antes de planificar). Los tuyos son Markdown en `.claude/agents/`.

Para este repo tendría sentido uno que compruebe la regla más delicada del `CLAUDE.md`, la de mantener sincronizados los breakpoints de JS y CSS:

```markdown
---
name: revisor-breakpoints
description: Comprueba que los umbrales de matchMedia y de ancho de
  viewport en src/scripts coinciden con los breakpoints CSS de la misma
  sección en src/styles. Usar tras cambiar media queries o scripts.
tools: Read, Grep, Glob
model: sonnet
---

Lista cada umbral en JS (matchMedia, innerWidth) y busca el breakpoint
CSS de la misma sección. Devuelve solo los desajustes, con archivo y
línea. No edites nada.
```

Solo lectura (`Read, Grep, Glob`), un modelo más barato y una respuesta corta. Toda la exploración se queda en su contexto; a mí me llega la lista de desajustes.

## Resumen para decidir rápido

| Necesito que Claude… | Herramienta |
|---|---|
| Sepa algo en todas las sesiones | `CLAUDE.md` |
| Sepa algo solo al tocar ciertas carpetas | `.claude/rules/` con `paths` |
| Siga un procedimiento cuando toca | Skill |
| Cumpla una regla sin excepciones | Hook |
| Haga una tarea lateral sin llenar el contexto | Subagente |

## Para tu equipo

Montar esto bien en un repo compartido tiene más de acuerdo de equipo que de técnica: qué va en el `CLAUDE.md`, qué hooks son innegociables, qué skills merecen existir. Es parte de lo que hago cuando integro Claude e IA en proyectos y equipos. Si te encaja, [escríbeme](/#contact).
