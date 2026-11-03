// Protección compartida por las rutas /api/*: de qué orígenes se aceptan
// peticiones, cuántas por minuto y cómo se responde.

// Orígenes aceptados: evita que otra web use estas rutas (y las cuotas de las
// APIs que hay detrás) como si fueran suyas.
const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?javierm\.dev$/, /^https:\/\/[\w-]+\.vercel\.app$/, /^http:\/\/localhost:\d+$/];

export const isAllowedOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin') ?? '';
  return ALLOWED_ORIGINS.some((re) => re.test(origin));
};

// Límite por IP en memoria: aproximado (cada instancia de la función tiene el
// suyo y se reinicia en frío), pero basta para frenar un abuso puntual.
export function createRateLimiter(limitPerMinute: number) {
  const hits = new Map<string, number[]>();
  return (ip: string): boolean => {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > limitPerMinute;
  };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
