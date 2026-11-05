---
title: "Conductor cierra su nube el 20 de noviembre: qué hacer y alternativas"
description: "Meta compra Conductor y su nube pasa a solo lectura el 13 de noviembre y cierra el 20. Cómo salvar tu código a tiempo y con qué sustituirlo: Claude Code, Worktrunk o Copilot."
pubDate: 2026-11-05
category: ia
tags: ["Agentes de IA", "Claude Code", "Git"]
readTime: 5
cover: ./covers/conductor-cierra-nube-alternativas.jpg
---

Si usas Conductor en la nube, tienes dos fechas: **el 13 de noviembre pasa a solo lectura y el 20 de noviembre se apaga**, y después empiezan a borrar los datos. La app local para Mac sigue funcionando hasta principios de 2027. Lo urgente es subir a tu repositorio (GitHub, GitLab…) todas las ramas que tengas en la nube antes del 13. Después puedes seguir con la app local o pasarte a Claude Code con worktrees, a Worktrunk o a los proyectos de Copilot.

## Qué ha pasado

Meta [ha comprado Conductor](https://techcrunch.com/2026/11/04/meta-acquires-ai-coding-startup-conductor/), la startup que permitía lanzar varios agentes de programación en paralelo, cada uno en su espacio de trabajo. Los agentes no eran suyos: usaba los de Anthropic, OpenAI y otros, como Claude Code o Codex, uno al lado del otro. El anuncio lo hizo su CEO, Charlie Holtz, el 4 de noviembre de 2026. Meta no ha dado el precio.

Las fechas, según [TechCrunch](https://techcrunch.com/2026/11/04/meta-acquires-ai-coding-startup-conductor/) y el resumen de [daily.dev](https://daily.dev/posts/meta-acquires-conductor-the-coding-agent-platform-conductor-cloud-shuts-down-8hfjivbqp):

| Fecha | Qué pasa |
|---|---|
| Ya | No se admiten cuentas nuevas |
| 13 de noviembre | La nube pasa a solo lectura |
| 20 de noviembre | La nube se apaga y empiezan a borrar los datos |
| Principios de 2027 | La app local de Mac deja de recibir modelos nuevos y arreglos |

Holtz ha prometido "algo nuevo" para sus usuarios a principios de año, sin más detalles.

## Qué hacer antes del 13 de noviembre

1. **Sube todas las ramas a tu remoto.** Es lo único que no depende de ninguna herramienta de exportación: si el código está en GitHub, no se pierde. Desde cada espacio de trabajo, `git push` de su rama.
2. **Copia lo que no está en Git:** archivos `.env`, notas, scripts sueltos y, si te importa, el historial de conversaciones.
3. **Pregunta por la migración.** Según daily.dev, para pasar los espacios de la nube a local hay que escribir a support@conductor.build. Algunas webs mencionan una opción para exportar desde la propia app; compruébalo en la tuya antes de contar con ella.

No esperes al 19: a partir del 13 ya no podrás escribir.

## Alternativas

Conductor resolvía un problema real: varios agentes trabajando a la vez sin pisarse los archivos. La técnica de fondo son los **git worktrees**, y hoy hay varias formas de usarlos.

| Opción | Dónde corre | Para quién |
|---|---|---|
| App local de Conductor | Tu Mac | Si te va bien y solo usabas la nube de forma puntual |
| Claude Code con `--worktree` | Tu máquina (terminal o app de escritorio) | Si ya pagas Claude Pro o Max |
| Worktrunk | Tu máquina, cualquier agente | Si quieres gestionar worktrees con comandos cortos |
| Proyectos de GitHub Copilot | Nube de GitHub | Si tu equipo ya vive en GitHub |

**Claude Code** trae los worktrees de serie. Con `claude --worktree nombre` abre una sesión en su propia carpeta y su propia rama, y puedes lanzar otra en otra terminal. Está en su [documentación oficial](https://code.claude.com/docs/en/worktrees).

**[Worktrunk](https://github.com/max-sixty/worktrunk)** es una herramienta de línea de comandos (unas 11.500 estrellas en GitHub a 5 de noviembre) que hace los worktrees tan fáciles como las ramas. Con `wt switch -x claude -c mi-rama` crea la rama, el worktree y arranca el agente dentro.

**GitHub Copilot** presentó en su Universe del 28 de octubre la [app de Copilot y los proyectos](https://github.blog/news-insights/company-news/github-universe-2026-evolving-every-layer-of-the-stack/), que lanzan sesiones de agentes en paralelo sobre varios repositorios desde la nube de GitHub. Es lo más parecido a la nube de Conductor.

Explico el método paso a paso, con los comandos, en [varios agentes de IA a la vez con git worktrees y Claude Code](/blog/agentes-paralelo-git-worktrees-claude-code/).

## La lección

Es la segunda compra de herramientas para agentes en la misma semana: OpenAI también [va a comprar Pierre](/blog/openai-compra-pierre-codex/) para reforzar Codex. Las herramientas cambian de dueño y cierran; tu código no debería depender de ellas. Mantén siempre tu repositorio en un remoto que controles y que cualquier agente pueda abrir.

*Foto de portada: [Fotografiamerlin](https://commons.wikimedia.org/wiki/File:Orchestra_conductor_in_a_chuj.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), recortada.*
