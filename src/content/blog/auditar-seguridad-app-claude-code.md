---
title: "Auditar la seguridad de tu app con Claude Code en 4 pasos"
description: "Revisa RLS en Supabase, secretos en el repo, dependencias vulnerables y validación de entradas con Claude Code: comandos reales, prompts y qué no delegar."
pubDate: 2026-09-30
category: claude
tags: ["Claude Code", "Seguridad", "Supabase"]
readTime: 7
cover: ./covers/auditar-seguridad-app-claude-code.jpg
---

Para auditar la seguridad de una app web con Claude Code, yo combino cuatro cosas: el comando `/security-review` sobre los cambios de la rama, una revisión dirigida de las políticas RLS si usas Supabase, un escáner de secretos sobre todo el historial de git y `pnpm audit` para dependencias, más prompts concretos para la validación de entradas. Claude acelera mucho la revisión, pero no sustituye una auditoría profesional si manejas datos sensibles.

## Lo que trae Claude Code para seguridad

A octubre de 2026, la documentación oficial describe varias capas que conviene no confundir:

- **`/security-review`**: viene de serie. Según la [referencia de comandos](https://code.claude.com/docs/en/commands), analiza el diff entre tu rama y la rama por defecto de `origin` buscando inyecciones, problemas de autenticación y exposición de datos. Necesita un remoto `origin`. Importante: **solo mira los cambios**, no todo el repo.
- **Plugin security-guidance**: revisa lo que Claude escribe mientras trabaja. Un chequeo de patrones en cada edición (`eval(`, `innerHTML =`, `dangerouslySetInnerHTML`…), una revisión del diff al final de cada turno y otra más profunda en cada commit que hace Claude. Se instala con `/plugin install security-guidance@claude-plugins-official` ([documentación](https://code.claude.com/docs/en/security-guidance)).
- **Plugin Claude Security**: un escaneo multiagente del repositorio completo o de un diff, con los hallazgos verificados por agentes independientes y parches que nunca se aplican solos. Se instala con `/plugin install claude-security@claude-plugins-official` y se lanza con `/claude-security`. Requiere plan de pago, acceso a la API o un proveedor como Bedrock, y Python 3.9+ ([documentación](https://code.claude.com/docs/en/claude-security)).

Para código que ya existe, la documentación sugiere pedirle a Claude que revise un archivo o directorio concreto, o usar Claude Security. Y un matiz que se olvida: todas estas revisiones leen **el código de tu checkout**, no la web desplegada. Si el fallo está en la configuración de producción, no lo verán.

## 1. RLS en Supabase: lo primero si tienes multiusuario

En una app con Supabase, la clave `anon` está en el navegador por diseño. Lo único que separa los datos de un usuario de los de otro es Row Level Security. En CitasWassap, donde varios negocios comparten base de datos, es literalmente lo que impide que una barbería vea las citas de otra; lo conté en detalle en [autenticación y RLS en Supabase](/blog/supabase-rls-citaswassap/).

### Paso 1: ¿qué tablas no tienen RLS?

Una consulta de Postgres que puedes lanzar en el editor SQL de Supabase:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;
```

Cualquier `false` en `public` es una tabla abierta a la API. El [Security Advisor de Supabase](https://supabase.com/docs/guides/database/database-advisors) hace esta comprobación y más. Los avisos que más me importan:

- `0013_rls_disabled_in_public`: tabla en un esquema expuesto sin RLS.
- `0007_policy_exists_rls_disabled`: has escrito políticas, pero RLS está apagado, así que no se aplican.
- `0010_security_definer_view`: una vista que se ejecuta con los permisos de quien la creó y se salta RLS.

### Paso 2: que Claude lea los advisors y las políticas

Si conectas el servidor MCP de Supabase, Claude puede consultar esos avisos con la herramienta `get_advisors`. Para auditar, configúralo limitado a un proyecto y en solo lectura, como recomienda Supabase:

```bash
claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=TU_PROJECT_REF&read_only=true"
```

Y luego un prompt cerrado, que no deje margen a "arreglos" no pedidos:

```text
Usa get_advisors con type "security" y lee las migraciones de
supabase/migrations/. Para cada tabla de public dime:
1. si tiene RLS activado,
2. qué políticas tiene para select, insert, update y delete,
3. políticas con using (true) o sin with check en insert/update,
4. vistas o funciones security definer que puedan saltarse RLS.
No modifiques nada. Devuélveme una tabla con los hallazgos
ordenados por gravedad.
```

### Paso 3: probarlo como un atacante

Una política que "parece" correcta no basta. Pídele a Claude que te escriba pruebas que simulen sesiones de dos usuarios (o dos negocios) distintos y verifiquen que cada uno solo ve lo suyo. Y revisa que la clave `service_role`, que se salta RLS, no aparece en ningún archivo que llegue al cliente.

## 2. Secretos en el repositorio

Aquí no me fío de que el modelo "vea" las claves leyendo archivos: uso una herramienta determinista. [Gitleaks](https://github.com/gitleaks/gitleaks) escanea el historial completo de git, no solo el estado actual:

```bash
gitleaks git -v          # todo el historial del repo
gitleaks dir -v ./src    # solo archivos, sin historial
```

Donde Claude sí aporta es en el contexto, con un prompt así:

```text
Busca en el código variables de entorno con prefijo público
(PUBLIC_ en Astro, NEXT_PUBLIC_ en Next.js, VITE_ en Vite) y dime
si alguna contiene algo que debería ser secreto: claves de API de
pago, service_role de Supabase, tokens de WhatsApp o de terceros.
```

Las variables con esos prefijos acaban en el JavaScript del navegador. Es un fallo muy común y un escáner de patrones no siempre lo detecta, porque el valor no está en el código: está en el `.env` de producción.

Dos medidas más:

- **Que Claude no lea tus `.env`**. La [documentación de configuración](https://code.claude.com/docs/en/settings) trae este ejemplo para `settings.json`:

```json
{
  "permissions": {
    "deny": ["Read(./.env)", "Read(./.env.*)"]
  }
}
```

- **Si una clave llegó a un commit, rótala.** Borrarla del historial no sirve de nada si alguien ya clonó el repo.

## 3. Dependencias vulnerables

El punto de partida sigue siendo el gestor de paquetes:

```bash
pnpm audit --prod                # solo dependencias de producción
pnpm audit --audit-level high    # solo altas y críticas
```

Lo que cuesta no es ejecutarlo, sino interpretar el resultado. Ahí Claude es útil:

```text
Este es el resultado de pnpm audit. Para cada aviso dime: si la
dependencia llega al bundle de producción o es solo de desarrollo,
si nuestro código usa la parte vulnerable y cuál es la actualización
mínima que lo resuelve sin cambios de versión mayor.
```

Si quieres ir más allá de los CVE conocidos (paquetes abandonados, un solo mantenedor, scripts de instalación), el plugin `supply-chain-risk-auditor` del marketplace de [Trail of Bits](https://github.com/trailofbits/skills) está hecho para eso. Lo incluyo junto a otras en [las mejores skills de Claude Code en 2026](/blog/mejores-skills-claude-code-2026/).

## 4. Validación de entradas

La regla es la de siempre: todo lo que llega del cliente o de un webhook se valida en el servidor, con un esquema, y antes de tocar la base de datos. Lo que Claude hace bien es el inventario, que a mano es tedioso:

```text
Lista todos los endpoints, API routes, server actions y webhooks del
proyecto. Para cada uno indica:
- qué datos recibe y de dónde (body, query, headers, params),
- si se validan con un esquema (Zod u otro) antes de usarse,
- si comprueba que el usuario autenticado tiene permiso sobre ese
  recurso concreto, no solo que hay sesión,
- si construye SQL, HTML o comandos con datos sin escapar.
Devuelve una tabla y marca en rojo lo que no cumple.
```

El tercer punto es el que más hallazgos da: endpoints que comprueban que hay sesión pero no que el recurso pertenece a quien lo pide. Y en webhooks, comprueba que se verifica la firma; en el caso de Meta, la cabecera `X-Hub-Signature-256`.

## El orden que sigo

1. `gitleaks git -v`: lo más grave y lo más rápido.
2. RLS y advisors de Supabase, si aplica.
3. `pnpm audit --prod` e interpretación con Claude.
4. Inventario de entradas y autorización.
5. `/security-review` antes de cada merge, y el plugin security-guidance activo mientras desarrollo.

Y una advertencia honesta: estas revisiones no son deterministas. La documentación de Claude Security lo dice claro: dos escaneos del mismo código pueden encontrar cosas distintas. Úsalas como una capa más, junto a tus escáneres de CI y una revisión humana, no como un sello de "seguro".

## ¿Lo revisamos juntos?

Si tu app maneja datos de clientes y no tienes claro si RLS, permisos y secretos están bien atados, puedo ayudarte a revisarlo y a montar este flujo con Claude Code en tu equipo. [Escríbeme](/#contact) y lo hablamos.
