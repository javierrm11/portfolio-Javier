---
title: "Cómo crear una skill de Claude paso a paso (ejemplo real)"
description: "Crea tu propia skill de Claude Code: estructura de SKILL.md, frontmatter, dónde guardarla, cómo escribir la description y un ejemplo real para un blog en Astro."
pubDate: 2026-10-20
category: claude
tags: ["Claude Code", "Agent Skills", "Astro"]
readTime: 7
cover: ./covers/crear-skill-claude-paso-a-paso.jpg
---

Crear una skill de Claude es crear una carpeta con un archivo `SKILL.md` dentro: un frontmatter YAML con `name` y `description`, y debajo las instrucciones en Markdown. Si la guardas en `.claude/skills/<nombre>/SKILL.md`, Claude Code la carga en ese proyecto y la usa cuando tu petición encaja con la descripción, o cuando la llamas con `/nombre`. En este post monto una completa y real: la que crea un artículo nuevo en este mismo blog.

## Cuándo merece la pena una skill

La [documentación de memoria de Claude Code](https://code.claude.com/docs/en/memory) lo deja bastante claro: en `CLAUDE.md` van los hechos que Claude necesita en *todas* las sesiones (comandos, convenciones, estructura). Si lo que quieres contarle es un **procedimiento de varios pasos** o algo que solo importa en una parte del proyecto, eso es una skill.

La señal práctica: te ves pegando el mismo bloque de instrucciones en el chat por tercera vez. Ese bloque es una skill.

## La estructura mínima

```text
.claude/skills/nuevo-post-blog/
├── SKILL.md        # obligatorio
└── plantilla.md    # opcional: se lee solo cuando hace falta
```

Y el `SKILL.md` más pequeño posible:

```markdown
---
name: nuevo-post-blog
description: Qué hace y cuándo usarla.
---

Instrucciones aquí.
```

## Dónde guardarla

Según la [documentación de skills](https://code.claude.com/docs/en/skills), a octubre de 2026:

| Ubicación | Ruta | Alcance |
|---|---|---|
| Personal | `~/.claude/skills/<nombre>/SKILL.md` | Todos tus proyectos |
| Proyecto | `.claude/skills/<nombre>/SKILL.md` | Este repo; se sube a git y la tiene el equipo |
| Plugin | `<plugin>/skills/<nombre>/SKILL.md` | Donde el plugin esté activado, como `/plugin:nombre` |

Si dos se llaman igual, la personal gana a la del proyecto. Para algo tan ligado a un repo como el ejemplo de hoy, va en el proyecto.

## El frontmatter, campo a campo

El estándar abierto ([especificación de Agent Skills](https://agentskills.io/specification)) define pocos campos:

- **`name`**: hasta 64 caracteres, solo minúsculas, números y guiones, sin empezar ni acabar en guion. Debe coincidir con el nombre de la carpeta.
- **`description`**: hasta 1.024 caracteres. Qué hace y cuándo usarla.
- Opcionales: `license`, `compatibility`, `metadata` y `allowed-tools` (experimental).

Claude Code acepta además campos propios. Los que más uso:

- **`disable-model-invocation: true`**: solo se ejecuta si la llamas tú. Imprescindible para cosas como desplegar: como dice la documentación, no quieres que Claude decida desplegar porque el código "parece listo".
- **`argument-hint`**: la pista que sale al autocompletar, por ejemplo `[tema del post]`.
- **`allowed-tools`**: herramientas que puede usar sin pedirte permiso mientras la skill está activa. Ojo: concede permisos, no restringe; el resto de herramientas siguen disponibles.
- **`paths`**: globs que limitan la activación automática a ciertos archivos.

Un detalle: si vas a subir la skill a claude.ai o a la API, allí solo se permiten los campos del estándar; los propios de Claude Code dan error.

## Cómo se dispara una skill

Al arrancar, Claude solo ve el nombre y la descripción de cada skill. Cuando lo que pides encaja con una descripción, carga el cuerpo completo. También puedes invocarla tú con `/nuevo-post-blog`, y lo que escribas detrás llega como argumento en `$ARGUMENTS`.

Esto tiene una consecuencia directa: **la `description` es lo único que Claude lee para decidir**. Si está mal escrita, la skill no existe.

## Cómo escribir una buena description

Las [buenas prácticas de Anthropic](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) se resumen en:

1. **Qué hace + cuándo usarla**, las dos cosas.
2. **En tercera persona**: "Crea artículos…", no "Te ayudo a crear…". La descripción se inyecta en el prompt del sistema y mezclar puntos de vista confunde.
3. **Palabras que diría el usuario**: si tú pides "escribe un post", que aparezca "post", no solo "entrada de la colección de contenido".
4. **Lo importante primero**: Claude Code recorta la descripción (junto con `when_to_use`) a 1.536 caracteres en el listado.

Mal:

```yaml
description: Ayuda con el blog.
```

Bien:

```yaml
description: Crea un artículo nuevo del blog de Astro en src/content/blog con frontmatter válido según el esquema de content.config.ts. Usar cuando se pida escribir, redactar o publicar un post o artículo del blog.
```

## Ejemplo completo: una skill para crear posts en este blog

Este portfolio está hecho con Astro y el blog son archivos Markdown en `src/content/blog/`, validados con un esquema Zod (lo conté en [content collections en Astro](/blog/content-collections-astro-blog/)). El esquema real, en `src/content.config.ts`, exige:

```ts
schema: ({ image }) => z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  category: z.enum(['seo-tecnico', 'ia', 'nextjs', 'supabase', 'apis', 'claude', 'negocios', 'carrera']),
  tags: z.array(z.string()).default([]),
  readTime: z.number().int().positive(),
  featured: z.boolean().default(false),
  author: z.string().default('Javier Ruiz Molero'),
  cover: image(),
}),
```

Hay tres trampas que una skill evita: `category` tiene que ser exactamente uno de esos valores, `cover` usa el helper `image()` de Astro (si la imagen no existe, falla) y solo un post debería llevar `featured: true`. Justo el tipo de detalle que se olvida.

El `SKILL.md`:

```markdown
---
name: nuevo-post-blog
description: Crea un artículo nuevo del blog de Astro en src/content/blog con frontmatter válido según el esquema de src/content.config.ts. Usar cuando se pida escribir, redactar o publicar un post o artículo del blog.
argument-hint: [tema del post]
---

# Nuevo post del blog

Tema: $ARGUMENTS

## Pasos

1. Lee `src/content.config.ts`. Es la fuente de verdad del esquema:
   si difiere de esta skill, manda el esquema.
2. Elige un slug en kebab-case, sin tildes. Comprueba que no existe
   `src/content/blog/<slug>.md`.
3. Comprueba que existe `src/content/blog/covers/<slug>.jpg`.
   Si no existe, NO inventes la ruta: pide la imagen y detente.
4. Escribe el artículo siguiendo [plantilla.md](plantilla.md).
5. Calcula `readTime` = palabras del cuerpo / 200, redondeado, mínimo 1.
6. Ejecuta `pnpm astro check` y corrige cualquier error del frontmatter.

## Reglas del frontmatter

- `title`: 60 caracteres como máximo, palabra clave al principio.
- `description`: entre 140 y 160 caracteres.
- `category`: SOLO un valor del enum de content.config.ts.
- `tags`: entre 2 y 4.
- `pubDate`: formato AAAA-MM-DD.
- `cover`: `./covers/<slug>.jpg` (ruta relativa al .md).
- `featured`: no lo pongas salvo que se pida. Si se pide,
  avisa de qué otro post lo tiene ya en true.
- `author`: omítelo, tiene valor por defecto.

## Estilo

- Español de España, primera persona, párrafos cortos.
- Primer párrafo: responde directamente a lo que se busca.
- Secciones con `##`. Bloques de código solo si aportan.
- Nada de datos inventados: si no se puede verificar, fuera.
```

Y `plantilla.md`, en la misma carpeta:

```markdown
---
title: "…"
description: "…"
pubDate: AAAA-MM-DD
category: …
tags: ["…", "…"]
readTime: N
cover: ./covers/<slug>.jpg
---

Párrafo inicial que responde a la búsqueda en 2-3 frases.

## Primera sección

…

## Cierre

Párrafo breve con enlace a /#contact.
```

Algunas decisiones que tomé y por qué:

- **No uso `disable-model-invocation`**: crear un archivo Markdown es inofensivo y quiero que funcione con "escríbeme un post sobre X". Si la skill publicara o hiciera commit, sí lo activaría.
- **El paso 1 manda leer el esquema real** en vez de fiarse de lo que copié en la skill. Si mañana añado una categoría, la skill no se queda desfasada.
- **La plantilla va aparte** y se referencia a un solo nivel de profundidad, como recomiendan las buenas prácticas: Claude la lee cuando la necesita, no antes.
- **El paso 6 cierra el bucle**: `pnpm astro check` valida los tipos del proyecto, así que un frontmatter roto aparece ahí antes de llegar al build.

## Probarla

1. Abre Claude Code en la raíz del repo y ejecuta `/skills`: debería aparecer `nuevo-post-blog`.
2. Pídelo con lenguaje natural ("escribe un post sobre caché en APIs") y comprueba que se activa sola.
3. Pruébala también con `/nuevo-post-blog caché en APIs`.
4. Pide algo parecido que NO debería activarla ("revisa el CSS del blog"). Si se activa, la descripción es demasiado amplia.

Si no se activa, la [documentación](https://code.claude.com/docs/en/skills) sugiere revisar que la descripción contenga las palabras que usarías de forma natural. Para validar el frontmatter, a octubre de 2026 existe `claude plugin validate .claude/skills` (requiere Claude Code v2.1.233 o posterior). Y si quieres medirlo en serio, la skill oficial **skill-creator** genera casos de prueba y propone mejoras de la descripción; la menciono en [las mejores skills de Claude Code en 2026](/blog/mejores-skills-claude-code-2026/).

## Errores típicos

- **Descripción vaga** ("ayuda con X"): no se activa nunca o se activa siempre.
- **Meter todo en el SKILL.md**: la recomendación es no pasar de 500 líneas y mover el detalle a archivos aparte.
- **Explicar lo obvio**: Claude ya sabe qué es Markdown. Cada línea compite por contexto; dile solo lo específico de tu proyecto.
- **Usar una skill para algo que debe cumplirse siempre**: si una regla no puede fallar (no tocar `.env`, formatear tras editar), eso es un hook, no una instrucción.

## ¿Y en tu equipo?

Una skill bien hecha convierte el "así hacemos las cosas aquí" en algo que Claude aplica sin que nadie lo repita. Si quieres montar las skills de tu equipo o integrar Claude en vuestro flujo de desarrollo, [hablamos](/#contact).
