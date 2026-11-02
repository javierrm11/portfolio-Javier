---
title: "¿Web o app hecha con IA en tu empresa? Revísala antes de publicar"
description: "Lovable, Bolt o v0 permiten crear una app en un fin de semana. Qué dicen los estudios sobre su seguridad y 9 comprobaciones para tu empresa, aunque no programes."
pubDate: 2026-11-02
category: ia
tags: ["Vibe coding", "Seguridad", "Empresas"]
readTime: 5
cover: ./covers/web-hecha-con-ia-vibe-coding-seguridad.jpg
---

Crear una web o una app con IA es hoy muy fácil, y para muchas cosas está bien. El problema empieza cuando esa app guarda datos de clientes, tiene usuarios o cobra pagos, porque el código generado suele funcionar sin ser seguro. Los datos de 2026 son claros: alrededor del 44 % de las tareas de código generadas con IA contienen alguna vulnerabilidad conocida. No hace falta renunciar a estas herramientas, solo revisar lo importante antes de publicar. Te dejo qué comprobar aunque no sepas programar.

Yo uso IA para programar todos los días, así que esto no es un alegato en contra. Es lo que miraría antes de poner en internet algo con datos reales de tu empresa.

## Qué dicen los datos

Conviene ir con cuidado, porque muchas cifras que circulan vienen de empresas que venden seguridad. Estas tres son las que me parecen más útiles:

| Fuente | Qué analizó | Resultado |
|---|---|---|
| [Veracode](https://www.veracode.com/news/llms-are-getting-smarter-but-not-safer-veracode-2026-genai-code-security-report-finds-ai-generated-code-security-has-stalled-at-56%25-pass-rate/), julio de 2026 | Modelos de IA en 80 tareas de programación | Pasan la prueba de seguridad en un 56 % de los casos, casi igual que el año anterior |
| [Escape](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/), octubre de 2025 | Más de 5.600 apps públicas, sobre todo de Lovable | Más de 2.000 vulnerabilidades, más de 400 secretos expuestos y 175 casos con datos personales |
| [CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/), marzo de 2025 | 1.645 proyectos de Lovable | 170 con reglas de acceso a datos inadecuadas |

Tres matices honestos. Veracode y Escape venden productos de seguridad. Escape advierte de sesgos en su muestra y dice que sus cifras son mínimas. Y el autor del tercer análisis trabaja en Replit, un competidor de Lovable. Aun así, todos apuntan en la misma dirección.

El dato que más me llama la atención es otro de Veracode: el código generado **compila casi siempre**. Es decir, funciona. Por eso el problema no se ve hasta que alguien lo busca.

![Candado con sus llaves sobre una mesa de madera](./fotos/vibe-coding-candado.jpg)
*Foto: [Trougnouf](https://commons.wikimedia.org/wiki/File:Solex_99_30_padlock_with_keys_%28DSCF2659%29.jpg), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), redimensionada.*

## El error típico, explicado sin tecnicismos

Muchas de estas apps usan Supabase como base de datos. La página web habla directamente con la base de datos usando una clave pública, y eso es normal. Lo que protege los datos son unas reglas llamadas RLS, que dicen quién puede ver qué.

Si esas reglas faltan o están mal, cualquiera que abra las herramientas del navegador puede pedir la tabla entera de clientes. En el caso de Linkable, una web hecha con Lovable, [los autores del análisis lograron incluso insertar un registro marcado como pagado](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/), saltándose Stripe.

Y ojo: [el escáner de Lovable](https://en.wikipedia.org/wiki/Lovable_(company)) comprobaba que hubiera reglas, no que fueran correctas. Lo explico con un caso propio en [RLS en Supabase](/blog/supabase-rls-citaswassap/).

## ¿Necesito revisar la mía?

Depende de lo que haga, no de cómo se hizo:

| Lo que has creado | Riesgo | Qué haría |
|---|---|---|
| Página informativa sin formularios ni usuarios | Bajo | Adelante, cuida los textos legales |
| Formulario de contacto | Bajo-medio | Protégelo del spam y revisa dónde se guardan los datos |
| App interna con datos de la empresa | Medio-alto | Revisión antes de usarla |
| Usuarios, datos de clientes o pagos | Alto | Revisión seria antes de publicar |
| Salud, menores o datos sensibles | Muy alto | No lo publiques sin un profesional |

## 9 comprobaciones, aunque no programes

**Las puedes hacer tú:**

1. **Crea dos cuentas de prueba.** Con la cuenta A, abre un pedido, un perfil o un documento y copia la dirección. Pégala con la sesión de la cuenta B. Si lo ves, tienes un problema grave.
2. **Cambia un número en la dirección.** Si estás en `/factura/123`, prueba `/factura/124`. Es el fallo de autorización más común.
3. **Busca el panel sin iniciar sesión.** Abre una ventana privada y escribe `/admin` o `/dashboard`.
4. **Prueba a pagar mal.** Con Stripe en modo de pruebas, cancela el pago a mitad y mira si la app te da acceso igualmente.
5. **Pregúntale a la propia herramienta.** Pídele a tu IA que revise las reglas de acceso de cada tabla y dónde hay claves secretas. No sustituye una revisión, pero encuentra lo más evidente.

**Para estas probablemente necesites a alguien técnico:**

6. **Claves secretas.** La de Stripe, la de tu IA o la de servicio de Supabase no pueden aparecer nunca en el código del navegador.
7. **Permisos en el servidor.** Ocultar un botón no protege nada: la comprobación tiene que hacerse en el servidor.
8. **Copias de seguridad probadas.** Una copia que nunca has restaurado es una suposición.
9. **Dependencias.** Que alguien revise las librerías que usa y sus actualizaciones.

Si usas Claude Code, te cuento mi proceso en [cómo auditar la seguridad de una app](/blog/auditar-seguridad-app-claude-code/).

## Lo que no se ve en la demo

Más allá de la seguridad, antes de depender de esa app pregúntate:

- **¿De quién es el código?** ¿Puedes llevártelo si la plataforma sube de precio?
- **¿Quién lo arregla un domingo** si deja de funcionar?
- **¿Cumple lo legal?** Aviso legal, privacidad y, si hay datos personales, RGPD.
- **¿Qué pasará cuando cambie algo?** Las modificaciones sobre un código que nadie entiende cuestan cada vez más.

## Mi recomendación

Usa estas herramientas para validar la idea. Es lo mejor que tienen: en un fin de semana sabes si tiene sentido, sin gastar miles de euros. Pero si la idea funciona y va a manejar datos de clientes o dinero, trátala como lo que es, un prototipo, y dale una revisión o una reconstrucción antes de abrirla al público.

## ¿Ya tienes algo hecho?

Cuéntame qué has creado y con qué herramienta, y te digo si le veo riesgo y qué haría. [Escríbeme por WhatsApp](https://wa.me/34611434736?text=Hola%20Javier%2C%20vengo%20de%20tu%20blog%20y%20tengo%20una%20app%20hecha%20con%20IA%20que%20quiero%20revisar) o usa el [formulario de contacto](/#contact). Si prefieres construirla bien desde el principio, mira las [apps a medida](/servicios/apps-a-medida/), desde 1.490 € con precio de lanzamiento.

*Foto de portada: [Markus Spiske](https://commons.wikimedia.org/wiki/File:Colorful_code_%28Unsplash%29.jpg), [CC0](https://creativecommons.org/publicdomain/zero/1.0/), redimensionada.*
