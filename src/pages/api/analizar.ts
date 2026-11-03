// Analizador web (/analizador-web/): una petición por cada parte del informe
// (`page`: el SEO, que tarda segundos; `mobile` y `desktop`: la velocidad, que
// tarda hasta un minuto) para que los resultados vayan apareciendo según llegan.
import type { APIRoute } from 'astro';
import { PAGESPEED_API_KEY } from 'astro:env/server';
import { createRateLimiter, isAllowedOrigin, json } from '../../lib/apiGuard';
import { PageSpeedError, runPageSpeed } from '../../lib/pageSpeed';
import { describeFetchError, isFatalFetchError, parsePublicUrl } from '../../lib/safeFetch';
import { auditSite } from '../../lib/siteAudit';

export const prerender = false;

// Un análisis son 3 peticiones: 15 por minuto y IP dan para 5 análisis seguidos.
const rateLimited = createRateLimiter(15);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isAllowedOrigin(request)) return json({ error: 'forbidden' }, 403);
  if (rateLimited(clientAddress ?? 'unknown')) {
    return json({ error: 'Has hecho muchos análisis seguidos. Espera un minuto y vuelve a intentarlo.' }, 429);
  }

  const body = await request.json().catch(() => null);
  const part = body?.part;
  if (part !== 'page' && part !== 'mobile' && part !== 'desktop') return json({ error: 'bad_request' }, 400);

  const target = typeof body.url === 'string' ? parsePublicUrl(body.url) : null;
  if (!target) {
    return json({ error: 'Esa dirección no parece válida. Prueba con algo como tuempresa.es.', fatal: true }, 400);
  }

  if (part === 'page') {
    try {
      return json(await auditSite(target));
    } catch (error) {
      // Los errores de red llevan `code` y son de la web analizada. Sin él es un
      // fallo nuestro: al visitante le dice lo mismo, pero tiene que verse.
      if (!(error as { code?: unknown }).code) console.error('[api/analizar]', error);
      return json({ error: describeFetchError(error), fatal: isFatalFetchError(error) }, 422);
    }
  }

  try {
    return json(await runPageSpeed(target.href, part, PAGESPEED_API_KEY));
  } catch (error) {
    if (error instanceof PageSpeedError) return json({ error: error.message }, error.status);
    console.error('[api/analizar]', error);
    return json({ error: 'No hemos podido medir la velocidad. Vuelve a intentarlo en un momento.' }, 502);
  }
};
