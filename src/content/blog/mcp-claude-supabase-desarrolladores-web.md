---
title: "MCP explicado: conecta Claude Code a tu Supabase"
description: "Qué es el Model Context Protocol, cómo conectar el servidor MCP de Supabase a Claude Code con un solo comando y cómo usarlo sin poner en riesgo producción."
pubDate: 2026-10-23
category: claude
tags: ["MCP", "Claude Code", "Supabase", "Seguridad"]
readTime: 6
cover: ./covers/mcp-claude-supabase-desarrolladores-web.jpg
---

MCP (Model Context Protocol) es un estándar abierto que permite a una IA como Claude Code usar herramientas externas: tu base de datos, tu gestor de tareas o la documentación de un servicio. Con el servidor MCP oficial de Supabase, Claude puede listar tus tablas, ejecutar SQL, generar los tipos de TypeScript o revisar los logs sin que le pegues nada en el chat. Se añade con un comando, pero conviene configurarlo **en modo solo lectura, limitado a un proyecto y nunca contra producción**. Te explico cómo.

## Qué es MCP, sin humo

La [documentación oficial de MCP](https://modelcontextprotocol.io/docs/getting-started/intro) lo compara con un puerto USB-C para aplicaciones de IA: una forma estándar de conectar un modelo con sistemas externos. Hay tres piezas:

- **Host**: la aplicación de IA que usas (Claude Code, por ejemplo).
- **Cliente**: la conexión que el host abre con cada servidor.
- **Servidor**: el programa que expone las capacidades (Supabase, Stripe, GitHub…).

Según la [arquitectura del protocolo](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture.md), un servidor ofrece tres tipos de cosas: **tools** (funciones que la IA puede ejecutar, como una consulta SQL), **resources** (datos de contexto, como el esquema) y **prompts** (plantillas reutilizables). Puede funcionar en local por `stdio` o en remoto por HTTP.

¿Por qué le importa a un desarrollador web? Porque antes, para que la IA entendiera tu base de datos, tenías que copiar el esquema a mano y rezar para que no estuviera desactualizado. Con MCP, Claude lo consulta él mismo cuando lo necesita.

## Cómo se añade un servidor MCP a Claude Code

La [documentación de Claude Code sobre MCP](https://code.claude.com/docs/en/mcp) recomienda los servidores remotos por HTTP. La sintaxis básica es:

```bash
claude mcp add --transport http <nombre> <url>
```

Para servidores locales se usa `stdio` y todo lo que va después de `--` es el comando que arranca el servidor:

```bash
claude mcp add --transport stdio mi-servidor -- npx -y paquete-del-servidor
```

Lo importante es el **ámbito** (`--scope`), que decide dónde se guarda la configuración:

| Ámbito | Dónde aplica | Dónde se guarda |
|---|---|---|
| `local` (por defecto) | Solo este proyecto, solo tú | `~/.claude.json` |
| `project` | Este proyecto, compartido con el equipo | `.mcp.json` en la raíz |
| `user` | Todos tus proyectos | `~/.claude.json` |

Para gestionarlos tienes `claude mcp list`, `claude mcp get <nombre>` y `claude mcp remove <nombre>`. Dentro de una sesión, el comando `/mcp` muestra el estado de cada servidor y lanza el login OAuth cuando hace falta.

## El servidor MCP de Supabase

Existe y es oficial. Según la [guía de Supabase](https://supabase.com/docs/guides/getting-started/mcp), la URL es `https://mcp.supabase.com/mcp` y en Claude Code se añade así:

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp"
```

Después abres Claude Code, ejecutas `/mcp`, eliges `supabase` y te autenticas en el navegador. No necesitas crear un token personal.

Ese comando, tal cual, da acceso a **todos** los proyectos de tu cuenta y con permisos de escritura. Yo no lo dejaría así. La URL admite parámetros para acotarlo:

- `read_only=true`: todas las consultas se ejecutan con un usuario de Postgres de solo lectura.
- `project_ref=<id>`: limita el servidor a un único proyecto y desactiva las herramientas de gestión de cuenta (crear o pausar proyectos).
- `features=database,docs`: activa solo los grupos de herramientas que vayas a usar.

Mi configuración de partida en `.mcp.json` queda así (si necesitas logs o tipos, añade sus grupos con el identificador que te da el panel de configuración de [supabase.com/mcp](https://supabase.com/mcp)):

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=TU_PROYECTO_DEV&read_only=true&features=database,docs"
    }
  }
}
```

A octubre de 2026, [la página del servidor](https://supabase.com/mcp) agrupa las herramientas así:

- **Base de datos**: `list_tables`, `list_extensions`, `list_migrations`, `apply_migration`, `execute_sql`.
- **Depuración**: `query_logs`, `get_advisors`.
- **Desarrollo**: `get_project_url`, `get_publishable_keys`, `generate_typescript_types`.
- **Docs**: `search_docs`.
- También hay grupos de Edge Functions, cuenta, branching (experimental, de pago) y Storage (desactivado por defecto).

## Casos de uso que sí aportan

Estos son los usos en los que MCP me parece útil de verdad, no un truco de demo:

1. **Generar tipos tras cambiar el esquema.** "Regenera los tipos de TypeScript y arregla los errores de compilación que salgan". Claude llama a `generate_typescript_types` y luego toca tu código.
2. **Revisar políticas RLS.** En una app multi-tenant como [CitasWassap](/blog/supabase-rls-citaswassap/), lo que más miedo da es una política mal escrita. Puedes pedirle que liste las tablas, compruebe cuáles no tienen RLS activado y te explique qué ve cada rol.
3. **Pasar los advisors.** `get_advisors` devuelve los avisos de seguridad y rendimiento de Supabase (índices que faltan, tablas expuestas…). Claude los lee y te propone la migración.
4. **Depurar con logs reales.** "Este endpoint devuelve 500 desde ayer, mira los logs". Con `query_logs` deja de adivinar.
5. **Escribir migraciones como archivos.** Prefiero que Claude genere el `.sql` en `supabase/migrations/`, lo revise yo y lo aplique por el flujo normal, en vez de dejarle usar `apply_migration` directamente.

## Los riesgos reales (y cómo acotarlos)

La propia Supabase es bastante clara en su guía. Resumo lo que importa:

**Inyección de prompts.** Es el riesgo principal. Si tu base de datos guarda texto que escriben tus usuarios (un ticket de soporte, un comentario), ese texto puede contener instrucciones que engañen al modelo para que ejecute consultas dañinas. Supabase avisa de que sus mitigaciones no son infalibles. Por eso el modo solo lectura no es opcional para mí.

**Producción.** La recomendación oficial es conectar a producción solo cuando la tarea lo exija, y en ese caso con `project_ref`, `read_only` y los grupos mínimos. Yo voy más allá: el MCP apunta a un **proyecto de desarrollo** con datos de prueba. Si necesito probar cambios de esquema, uso una rama de desarrollo antes de fusionar.

**Aprobación manual.** Deja activada la confirmación de cada llamada a herramienta en sesiones interactivas y léela antes de aceptar. Para tareas desatendidas, Supabase recomienda preaprobar solo herramientas de solo lectura y con el proyecto acotado, y que la rutina pare y avise en vez de escribir.

**No es para tus clientes.** El servidor funciona con tus permisos de desarrollador. Nunca lo conectes a un chatbot de cara al público.

**El `.mcp.json` se comparte.** Si lo subes al repositorio, Claude Code pide aprobación antes de usar servidores definidos ahí. La [documentación de Claude Code](https://code.claude.com/docs/en/mcp) insiste en algo obvio que se olvida: conecta solo servidores en los que confíes, y usa credenciales de solo lectura para bases de datos.

## Checklist rápido

- [ ] URL con `project_ref` de un proyecto de **desarrollo**.
- [ ] `read_only=true`.
- [ ] `features` limitado a lo que uses.
- [ ] Aprobación manual activada.
- [ ] Migraciones como archivos revisados, no aplicadas por el agente.
- [ ] Nada de datos personales reales en el proyecto conectado.

Si quieres ir un paso más allá y que Claude respete estas reglas sin que se las repitas cada vez, apúntalas en tu `CLAUDE.md` o en un hook. Lo cuento en [mi flujo de trabajo con Claude Code](/blog/flujo-trabajo-claude-code-claude-md-skills-hooks/).

Desarrollo aplicaciones a medida con Next.js y Supabase e integro IA en negocios reales, con la seguridad pensada desde el principio. Si tienes un proyecto en mente o quieres conectar tus datos con un asistente sin abrir agujeros, [hablamos](/#contact).
