---
title: "Autenticación y RLS en Supabase para una app multiusuario"
description: "Row Level Security explicado con el caso real de CitasWassap: quién ve qué y por qué."
pubDate: 2026-02-09
category: supabase
tags: ["Supabase", "WhatsApp API", "Seguridad"]
readTime: 7
cover: ./covers/supabase-rls-citaswassap.jpg
---

CitasWassap gestiona citas de varios negocios distintos desde la misma base de datos. Sin Row Level Security, cualquier fallo en el código del servidor podría dejar que un negocio viera las citas de otro.

## El problema de filtrar solo en el cliente

Es tentador filtrar por `negocio_id` en cada consulta desde el frontend y confiar en eso. El problema es que ese filtro vive en JavaScript que corre en el navegador de alguien: basta con manipular la petición para saltárselo. La seguridad real tiene que vivir en la base de datos, no en la interfaz.

## RLS: la política vive en la tabla

Row Level Security de Postgres (que Supabase expone de forma directa) permite definir qué filas puede ver o modificar cada usuario, como parte del propio esquema:

```sql
create policy "Solo tus citas"
on citas for select
using (negocio_id = auth.jwt() ->> 'negocio_id');
```

Con la política activa, da igual qué consulta mande el cliente: Postgres nunca devuelve una fila que no le corresponde. Aunque hubiera un fallo en el backend, el dato sigue protegido en la capa de base de datos.

## Probarlo de verdad

Una política mal escrita puede dar una falsa sensación de seguridad. La forma de comprobarlo es simular una sesión con un JWT de cada negocio y verificar, consulta a consulta, que solo ve lo suyo — no basta con probarlo desde la cuenta que se está usando para desarrollar, que suele tener permisos de más.

Desde que quedó así, añadir un negocio nuevo a CitasWassap no requiere tocar ni una línea de lógica de permisos: la política ya se aplica sola.
