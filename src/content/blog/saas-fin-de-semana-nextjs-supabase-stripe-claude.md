---
title: "SaaS en un fin de semana: Next.js, Supabase, Stripe y Claude"
description: "Plan realista de viernes a domingo para lanzar un SaaS que cobra: Next.js 16, Supabase con RLS, Stripe Checkout, webhooks y Claude Code. Y lo que no cabe."
pubDate: 2026-09-25
category: nextjs
tags: ["Next.js", "Supabase", "Stripe", "Claude Code"]
readTime: 7
cover: ./covers/saas-fin-de-semana-nextjs-supabase-stripe-claude.jpg
---

¿Se puede lanzar un SaaS en un fin de semana? Sí, si "lanzar" significa esto: una funcionalidad que resuelve un problema, login, un único plan de suscripción que se cobra de verdad y una URL pública. Con Next.js, Supabase, Stripe Checkout y Vercel, más Claude Code para ir rápido en lo repetitivo, cabe en tres días. Lo que **no** cabe lo dejo claro al final, porque es justo lo que hace que un producto aguante con clientes reales.

## Antes del viernes: recortar

La mitad del éxito es lo que decides no hacer. Antes de abrir el editor:

- **Un problema, una funcionalidad.** Si necesitas una lista para explicar qué hace, es demasiado.
- **Un precio.** Un único plan mensual. Nada de planes gratis, anuales ni cupones.
- **Cuentas listas:** proyecto en Supabase, cuenta de Stripe en modo de prueba, cuenta en Vercel y el dominio comprado.

## Viernes por la tarde: esqueleto y autenticación

La forma más rápida de empezar es la plantilla oficial, que ya trae Supabase Auth con cookies configurado ([quickstart de Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)):

```bash
npx create-next-app@latest mi-saas -e with-supabase
```

Rellenas `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y tienes registro, login y rutas protegidas.

Dos detalles de 2026 que conviene saber:

- Desde Next.js 16, el antiguo `middleware.ts` se llama `proxy.ts`. La plantilla lo usa para refrescar la sesión en cada petición. A octubre de 2026, la versión actual es [Next.js 16.4](https://nextjs.org/blog/next-16-4).
- Para proteger páginas, la [guía de Supabase para SSR](https://supabase.com/docs/guides/auth/server-side/nextjs) recomienda `supabase.auth.getClaims()`, no `getSession()`, porque valida el token en vez de fiarse de lo que hay en la cookie.

El viernes termina cuando puedes registrarte, entrar y ver una página privada vacía.

## Sábado por la mañana: datos y RLS

Una tabla para la suscripción y otra (o varias) para tu funcionalidad. La regla de oro: **Row Level Security activado en todas las tablas** desde el minuto uno.

```sql
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Cada usuario ve su suscripción"
on public.subscriptions for select
to authenticated
using ( (select auth.uid()) = user_id );
```

Fíjate en lo que **no** hay: ninguna política de `insert` ni `update`. El usuario puede leer su estado, pero no cambiarlo. Solo lo escribe el webhook de Stripe desde el servidor con la clave secreta. Envolver `auth.uid()` en un `select` es una recomendación de rendimiento de la [documentación de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), igual que indexar las columnas que filtran las políticas.

Si nunca has escrito políticas, aquí explico [cómo funciona RLS con un caso real multi-tenant](/blog/supabase-rls-citaswassap/).

## Sábado por la tarde: Stripe Checkout

Crea en Stripe un producto con un precio recurrente y guarda su ID (`price_...`). Después, un Route Handler que crea la sesión de Checkout:

```ts
// lib/stripe.ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

```ts
// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return new Response('No autenticado', { status: 401 });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: userId, // así el webhook sabe de quién es el pago
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/precios`,
  });

  return NextResponse.redirect(session.url!, 303);
}
```

Un `<form action="/api/checkout" method="post">` con un botón y ya tienes la página de pago alojada por Stripe. Los parámetros están en la [referencia de Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create).

## Sábado por la noche: el webhook

**La página de éxito no confirma nada.** El usuario puede cerrarla antes de llegar. La fuente de verdad son los [webhooks](https://docs.stripe.com/webhooks). Stripe exige el cuerpo sin procesar para verificar la firma, por eso se usa `req.text()`:

```ts
// app/api/stripe/webhook/route.ts
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin'; // cliente con SUPABASE_SECRET_KEY

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('Firma no válida', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    await supabaseAdmin.from('subscriptions').upsert({
      user_id: session.client_reference_id,
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      status: sub.status,
    });
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await supabaseAdmin.from('subscriptions')
      .update({ status: sub.status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.id);
  }

  return new Response('ok', { status: 200 });
}
```

El `supabaseAdmin` es un `createClient` de `@supabase/supabase-js` con la clave secreta (`sb_secret_...`). Esa clave [se salta RLS](https://supabase.com/docs/guides/api/api-keys) y no puede acabar nunca en el navegador.

Tres cosas de la documentación de Stripe que no te puedes saltar:

- **Los eventos pueden llegar duplicados** y **no llegan en orden garantizado**. Por eso uso `upsert` y leo el estado real de la suscripción en vez de suponerlo. Si quieres ir fino, guarda los IDs de evento procesados.
- **Responde 2xx rápido.** Nada de lógica pesada antes de contestar.
- **Pruébalo en local** con la CLI de Stripe: `stripe listen --forward-to localhost:3000/api/stripe/webhook`. El comando te da el secreto `whsec_...` para desarrollo.

Stripe recomienda ahora los eventos "ligeros" (*thin events*) para muchas integraciones nuevas. Los eventos clásicos de este ejemplo siguen siendo compatibles y son los más sencillos para un primer SaaS.

## Domingo: desplegar y pulir

- **Vercel**: importas el repositorio, copias las variables de entorno y despliegas. Ojo: según la [documentación de Vercel](https://vercel.com/docs/plans/hobby), el plan Hobby es solo para uso personal y no comercial. Si vas a cobrar, cuenta con el plan Pro.
- **Webhook de producción**: crea el endpoint en el dashboard de Stripe apuntando a tu dominio y usa su `whsec_` propio, distinto del de la CLI.
- **Portal de cliente**: con `stripe.billingPortal.sessions.create({ customer, return_url })` el usuario cancela o cambia la tarjeta sin que programes nada más.
- **Landing, precios y textos legales.** Aviso legal, privacidad y condiciones. No los copies de otra web.
- **Una prueba completa en modo test**: registro, pago con tarjeta de prueba, acceso, cancelación desde el portal y pérdida de acceso.

## Dónde ayuda Claude Code (y dónde no)

Donde más tiempo me ahorra un agente es en lo que ya está claro y solo falta escribir:

- **Un `CLAUDE.md` con el stack y las reglas** (RLS siempre activado, nada de claves secretas en el cliente, `getClaims` para proteger rutas). Así no repites las mismas instrucciones en cada sesión.
- **El modo plan** (`Shift+Tab`) antes de cada bloque: revisas el plan del webhook antes de que toque un archivo.
- **MCP de Supabase y de Stripe.** Con el [servidor MCP de Supabase](/blog/mcp-claude-supabase-desarrolladores-web/) en solo lectura contra el proyecto de desarrollo, Claude ve tu esquema real. Stripe tiene su [propio servidor MCP](https://docs.stripe.com/mcp) y pide confirmación humana para acciones sensibles como los reembolsos.
- **Tests de las políticas** y del webhook con eventos simulados.

Donde no ayuda: decidir qué construir, a qué precio y para quién. Y la revisión final de seguridad sigue siendo tuya.

## Lo que no cabe en un fin de semana

Siendo honesto, esto se queda fuera y alguien te lo va a pedir pronto:

- **Facturación legal e impuestos.** En España, emitir facturas conforme a la normativa (VeriFactu incluido) y gestionar el IVA es un proyecto en sí. Prezu, mi app de presupuestos y facturas, tiene que contemplar VeriFactu, y eso no se resuelve en un domingo.
- **Equipos y multi-tenant**: invitaciones, roles y datos compartidos por organización.
- **Emails transaccionales** cuidados, recuperación de pagos fallidos y avisos de renovación.
- **Tests, monitorización y copias de seguridad** en serio.
- **Validación con usuarios reales.** Prezu, por ejemplo, está en piloto con un negocio real, y eso enseña más que cualquier fin de semana de código.

El fin de semana sirve para comprobar si alguien paga. Todo lo demás viene después.

Si tienes una idea de SaaS o necesitas una aplicación a medida con pagos, IA y una base sólida para crecer, la desarrollo contigo. [Cuéntame tu proyecto](/#contact).
