---
title: "Varios agentes de IA a la vez: git worktrees con Claude Code paso a paso"
description: "Cómo trabajar con varios agentes en paralelo sin que se pisen: git worktree a mano, claude --worktree, subagentes aislados, .worktreeinclude y Worktrunk, con los comandos exactos."
pubDate: 2026-11-05
category: claude
tags: ["Claude Code", "Git", "Agentes de IA", "Productividad"]
readTime: 8
cover: ./covers/agentes-paralelo-git-worktrees-claude-code.jpg
---

Para que varios agentes de IA programen a la vez sin pisarse, cada uno necesita su propia copia de los archivos. Eso es un **git worktree**: otra carpeta con otra rama del mismo repositorio, que comparte historial y remoto. En Claude Code basta con `claude --worktree nombre` en cada terminal; también puedes crearlos a mano con `git worktree add` o usar Worktrunk. Abajo tienes los tres métodos, con los comandos exactos y los problemas que te vas a encontrar.

## Por qué hace falta

Si abres dos sesiones de un agente en la misma carpeta, las dos editan los mismos archivos. Una cambia `package.json` mientras la otra ejecuta los tests, una hace commit de cambios a medias de la otra y acabas sin saber qué hizo cada una.

Con worktrees cada agente tiene:

- **Su carpeta**, con sus propios archivos.
- **Su rama**, así que sus commits no se mezclan.
- **El mismo repositorio** por debajo: no clonas nada ni duplicas el historial.

Es lo que hacían por dentro herramientas como Conductor, que [cierra su nube el 20 de noviembre](/blog/conductor-cierra-nube-alternativas/). No necesitas ninguna herramienta extra para hacerlo tú.

## Método 1: git worktree a mano

Funciona con cualquier agente, no solo con Claude Code. Desde tu repositorio:

```bash
# Crea una carpeta hermana con una rama nueva
git worktree add ../mi-web-login -b login

# O a partir de una rama que ya existe
git worktree add ../mi-web-bug fix-formulario

# Entra y arranca el agente
cd ../mi-web-login
claude
```

Para ver los que tienes y borrar uno cuando termines:

```bash
git worktree list
git worktree remove ../mi-web-login
```

Si borraste la carpeta a mano, `git worktree prune` limpia el registro. Todo esto está en la [documentación de git worktree](https://git-scm.com/docs/git-worktree).

## Método 2: claude --worktree

Claude Code lo trae de serie. Según su [documentación](https://code.claude.com/docs/en/worktrees):

```bash
claude --worktree login
```

- Crea el worktree en `.claude/worktrees/login/`, en una rama nueva llamada `worktree-login`.
- En otra terminal, `claude --worktree formulario` abre una segunda sesión aislada. Si no pones nombre, se inventa uno.
- Por defecto parte de la rama principal del remoto, no de lo que tengas a medias. Si quieres que parta de tu rama actual, pon `"worktree": { "baseRef": "head" }` en los ajustes.
- También acepta una pull request: `claude --worktree "#1234"` crea el worktree a partir de ella. Las comillas hacen falta para que la terminal no tome `#` como comentario.

Añade `.claude/worktrees/` a tu `.gitignore` para que esas carpetas no salgan como archivos nuevos en tu copia principal.

**Al salir**, si el worktree no tiene cambios, Claude lo borra con su rama. Si tiene trabajo, te pregunta si quieres conservarlo, y te da el comando para volver: `claude --worktree login --resume`.

### Los archivos que no están en Git

Un worktree es una copia limpia: tu `.env` no está. Para que se copie solo, crea un archivo `.worktreeinclude` en la raíz con la misma sintaxis que `.gitignore`:

```text
.env
.env.local
```

Solo copia archivos que estén ignorados por Git, así que no duplica nada que ya esté en el repositorio.

### Subagentes, cada uno en su worktree

Si un agente lanza subagentes que editan archivos, también puedes aislarlos. En la definición del subagente, dentro de `.claude/agents/`, añade `isolation: worktree`:

```markdown
---
name: refactorizador
description: Aplica refactorizaciones mecánicas en muchos archivos
isolation: worktree
---

Aplica el cambio en todos los archivos afectados, ejecuta los tests e informa del resultado.
```

Cada subagente recibe un worktree temporal que se borra solo si termina sin cambios.

## Método 3: Worktrunk

[Worktrunk](https://github.com/max-sixty/worktrunk) es una herramienta de línea de comandos para manejar worktrees como si fueran ramas, pensada para agentes en paralelo. Tiene unas 11.500 estrellas en GitHub a 5 de noviembre de 2026. Se instala con `brew install worktrunk` o, en Windows, con `winget install max-sixty.worktrunk`, y después `wt config shell install` (en Windows, `git-wt config shell install`).

```bash
# Crea rama y worktree, y arranca Claude dentro con la tarea
wt switch -x claude -c login -- 'Añade inicio de sesión con enlace mágico'

wt list     # estado de todos
wt merge    # integra la rama y limpia
wt remove   # borra worktree y rama
```

Compensa si vas a abrir y cerrar muchos worktrees al día. Para dos o tres, el método 2 sobra.

## Lo que nadie te cuenta

- **Las dependencias se instalan en cada worktree.** Cada carpeta necesita su `node_modules`. Con pnpm duele menos, porque reutiliza los paquetes que ya tienes descargados en vez de copiarlos.
- **Los servidores de desarrollo chocan.** Si dos agentes arrancan `pnpm dev` en el mismo puerto, el segundo falla. Dile a cada uno qué puerto usar: `pnpm dev --port 4322`.
- **La base de datos es una sola.** Los worktrees separan archivos, no tu base de datos local. Si dos agentes tocan migraciones a la vez, se pisan igual.
- **Más agentes no es más rápido.** Con más de tres o cuatro a la vez, el cuello de botella eres tú revisando diffs. Empieza con dos: uno para la funcionalidad y otro para bugs o tests.
- **Revisa antes de fusionar.** Cada rama es una pull request más. `/code-review` en cada worktree antes de unirlo ahorra sustos.

Si estás montando tu flujo con Claude Code, te puede servir [mi flujo con CLAUDE.md, skills y hooks](/blog/flujo-trabajo-claude-code-claude-md-skills-hooks/) y [las skills que más uso](/blog/mejores-skills-claude-code-2026/).

*Foto de portada: [Yitzilitt](https://commons.wikimedia.org/wiki/File:Silhouette_of_bare_tree_branches_under_twilight_sky.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), recortada.*
