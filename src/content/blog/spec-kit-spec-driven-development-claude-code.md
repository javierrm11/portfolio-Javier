---
title: "Spec-driven development con Spec Kit de GitHub y Claude Code"
description: "Qué es el desarrollo guiado por especificaciones, cómo se instala Spec Kit, qué hace cada comando (constitution, specify, plan, tasks, implement) y cuándo compensa usarlo."
pubDate: 2026-11-05
category: claude
tags: ["Claude Code", "Spec Kit", "Metodología", "Agentes de IA"]
readTime: 7
cover: ./covers/spec-kit-spec-driven-development-claude-code.jpg
---

El *spec-driven development* consiste en escribir primero qué quieres construir y por qué (la especificación), sacar de ahí un plan técnico y una lista de tareas, y solo entonces dejar que el agente programe. [Spec Kit](https://github.com/github/spec-kit) es la herramienta de GitHub para hacerlo con agentes como Claude Code, y a 5 de noviembre de 2026 tiene unas 147.800 estrellas, de lo más visto en GitHub estas semanas. Se instala con `uv tool install specify-cli` y se trabaja con seis comandos dentro del agente. Compensa en funcionalidades medianas o grandes; para un arreglo de diez minutos sobra.

## El problema que resuelve

Cuando le pides a un agente "hazme un sistema de reservas", rellena él solo todo lo que no le dijiste: cuántas plazas hay por hora, qué pasa si alguien cancela, si hace falta registrarse. Muchas veces acierta. Cuando no acierta, lo descubres con el código ya escrito.

Spec Kit cambia el orden. Las decisiones quedan por escrito antes de programar, en archivos que puedes revisar, corregir y guardar en el repositorio. El agente programa contra esa especificación, no contra lo que recuerde de la conversación.

## Instalación

Necesitas Python 3.11 o superior, [uv](https://docs.astral.sh/uv/) y un agente compatible. Según el [README](https://github.com/github/spec-kit):

```bash
uv tool install specify-cli
specify init mi-proyecto --integration claude
cd mi-proyecto
```

El ejemplo oficial usa `--integration copilot`. La [documentación](https://github.github.com/spec-kit/) habla de 43 integraciones posibles, entre ellas Claude, Codex, Gemini o Kiro. Si tu versión usa otra clave para Claude, la lista de integraciones de la documentación te la dice.

## Los comandos, en orden

Se ejecutan dentro del agente, no en la terminal. En el README aparecen como `/speckit-constitution`; en otras partes de la documentación, como `/speckit.specify`. Escribe `/speckit` en Claude Code y el autocompletado te enseña cómo se llaman en tu versión.

1. **`/speckit-constitution`**: los principios del proyecto, como calidad de código, tests o accesibilidad. Se hace una vez por proyecto.
2. **`/speckit-specify`**: qué vas a construir y por qué, sin hablar de tecnología.
3. **`/speckit-plan`**: el plan técnico: stack, estructura y datos.
4. **`/speckit-tasks`**: la lista de tareas que sale del plan.
5. **`/speckit-implement`**: el agente programa las tareas.
6. **`/speckit-converge`**: comprueba el avance. Se repite con `implement` hasta que responde `Converged`.

La regla del README es la clave de todo: **revisa cada resultado antes de pasar al siguiente**. Si te saltas la revisión de la especificación, has añadido burocracia sin ganar nada.

Hay extensiones opcionales, por ejemplo una para bugs (`specify extension add bug`) y otra para evaluar ideas (`specify extension add assess`).

## Un ejemplo real: reservas para una peluquería

Así lo usaría en un encargo típico de una web de negocio.

- **Constitución:** la web tiene que funcionar bien en móvil, cumplir lo básico de accesibilidad y no guardar más datos personales de los necesarios.
- **Especificación:** el cliente elige servicio, día y hora libre; recibe una confirmación; la peluquería ve las citas del día y puede cancelar. Sin registro.
- **Plan:** Astro para la web, una tabla de citas en Supabase con sus reglas de acceso y un aviso por WhatsApp.
- **Tareas e implementación:** el agente las va haciendo y tú revisas cada una.

Lo valioso es que la especificación se la puedes enseñar al cliente antes de escribir una línea de código. Si dice "las cancelaciones solo hasta 24 horas antes", lo cambias en un párrafo y no en tres archivos.

## Cuándo compensa y cuándo no

| Situación | ¿Spec Kit? |
|---|---|
| Funcionalidad nueva de varios días | Sí |
| Proyecto nuevo desde cero | Sí, empezando por la constitución |
| Varias personas o agentes en el mismo proyecto | Sí: la especificación es la referencia común |
| Corregir un bug concreto | No, o la extensión de bugs |
| Cambiar un texto o un color | No |

## Alternativas más ligeras

Si te parece mucho proceso, la misma idea existe en versión skill. Las [skills de Matt Pocock](https://github.com/mattpocock/skills) incluyen `to-spec`, que convierte la conversación en una especificación, y `to-tickets`, que la parte en tareas. Las comento en [las mejores skills de Claude Code](/blog/mejores-skills-claude-code-2026/).

Y si quieres que varios agentes implementen tareas distintas a la vez, combínalo con [git worktrees](/blog/agentes-paralelo-git-worktrees-claude-code/): una especificación y un worktree por tarea.

*Foto de portada: Wayne Chandler, [copia de planos de 1925](https://commons.wikimedia.org/wiki/File:Wayne_Chandler,_Photographer,_November_1992_Photographic_copy_of_blueprint_copy_of_original_plans,_dated_1925,_by_McMahon_and_Clark._Blueprint_copy_in_possession_of_WisDOT,_HAER_WIS,70-MENA.V,1-27.tif), dominio público, recortada.*
