// Parte de velocidad del analizador: llama a la API de Google PageSpeed Insights
// y se queda solo con lo que se enseña, porque la respuesta original pesa varios
// megas. Sin clave la cuota compartida suele estar agotada: en producción hace
// falta PAGESPEED_API_KEY (ver astro.config.mjs).
const API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
// La función de Vercel se corta a los 60 s (astro.config.mjs): se responde antes.
const TIMEOUT_MS = 55_000;

export type Strategy = 'mobile' | 'desktop';
export type MetricStatus = 'good' | 'average' | 'poor';

export interface Metric {
  id: string;
  value: string;
  status: MetricStatus;
}

export interface PageSpeedResult {
  strategy: Strategy;
  scores: { performance: number | null; seo: number | null; accessibility: number | null; bestPractices: number | null };
  lab: Metric[];
  /** Datos de visitantes reales (Chrome), solo si la web tiene tráfico suficiente. */
  field: Metric[];
  /** true si los datos reales son de todo el dominio, no solo de esta página. */
  fieldIsOrigin: boolean;
  opportunities: { title: string; savings: string | null }[];
  seoIssues: string[];
}

export class PageSpeedError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface Audit {
  id: string;
  title: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue?: string;
  metricSavings?: Record<string, number>;
  details?: { overallSavingsMs?: number; overallSavingsBytes?: number };
}

interface LighthouseResult {
  categories: Record<string, { score: number | null; auditRefs: { id: string; group?: string }[] } | undefined>;
  audits: Record<string, Audit | undefined>;
}

const LAB_AUDITS: Record<string, string> = {
  lcp: 'largest-contentful-paint',
  fcp: 'first-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbt: 'total-blocking-time',
  si: 'speed-index',
};

// Lighthouse los lista junto a las mejoras, pero describen el problema sin decir
// qué hacer con él, y no aportan nada a quien no es técnico.
const NOT_ACTIONABLE = new Set(['largest-contentful-paint-element', 'mainthread-work-breakdown', 'lcp-breakdown-insight', 'lcp-discovery-insight', 'network-dependency-tree-insight']);

const toScore = (score: number | null | undefined) => (typeof score === 'number' ? Math.round(score * 100) : null);
const toStatus = (score: number): MetricStatus => (score >= 0.9 ? 'good' : score >= 0.5 ? 'average' : 'poor');

function summarizeLab(result: LighthouseResult): Metric[] {
  return Object.entries(LAB_AUDITS).flatMap(([id, auditId]) => {
    const audit = result.audits[auditId];
    if (!audit?.displayValue || audit.score === null) return [];
    return [{ id, value: audit.displayValue, status: toStatus(audit.score) }];
  });
}

function summarizeOpportunities(result: LighthouseResult) {
  // El grupo "hidden" es lo que el propio informe de Lighthouse no enseña: ahí
  // caen los duplicados de lo mismo con otro nombre.
  const refs = result.categories.performance?.auditRefs ?? [];
  const savedMs = (a: Audit) => a.details?.overallSavingsMs ?? Object.values(a.metricSavings ?? {}).reduce((sum, n) => sum + n, 0);
  return refs
    .filter((ref) => ref.group !== 'metrics' && ref.group !== 'hidden' && !NOT_ACTIONABLE.has(ref.id))
    .flatMap((ref) => {
      const audit = result.audits[ref.id];
      if (!audit || audit.scoreDisplayMode !== 'metricSavings' || audit.score === null || audit.score >= 0.9) return [];
      if (!savedMs(audit) && !audit.details?.overallSavingsBytes) return [];
      return [audit];
    })
    .sort((a, b) => savedMs(b) - savedMs(a) || (b.details?.overallSavingsBytes ?? 0) - (a.details?.overallSavingsBytes ?? 0))
    .slice(0, 5)
    .map((audit) => ({ title: audit.title, savings: audit.displayValue ?? null }));
}

function summarizeSeo(result: LighthouseResult): string[] {
  const refs = result.categories.seo?.auditRefs ?? [];
  return refs.flatMap((ref) => {
    const audit = result.audits[ref.id];
    return audit && audit.scoreDisplayMode === 'binary' && audit.score === 0 ? [audit.title] : [];
  });
}

interface CruxMetric {
  percentile?: number;
  category?: string;
}

const CRUX_STATUS: Record<string, MetricStatus> = { FAST: 'good', AVERAGE: 'average', SLOW: 'poor' };
const decimal = (n: number, digits: number) => n.toFixed(digits).replace('.', ',');

function summarizeField(experience: { metrics?: Record<string, CruxMetric> } | undefined): Metric[] {
  const m = experience?.metrics ?? {};
  const fields: [string, CruxMetric | undefined, (p: number) => string][] = [
    ['lcp', m.LARGEST_CONTENTFUL_PAINT_MS, (p) => `${decimal(p / 1000, 1)} s`],
    ['inp', m.INTERACTION_TO_NEXT_PAINT, (p) => `${p} ms`],
    ['cls', m.CUMULATIVE_LAYOUT_SHIFT_SCORE, (p) => decimal(p / 100, 2)],
    ['fcp', m.FIRST_CONTENTFUL_PAINT_MS, (p) => `${decimal(p / 1000, 1)} s`],
  ];
  return fields.flatMap(([id, metric, format]) => {
    if (typeof metric?.percentile !== 'number' || !metric.category || !CRUX_STATUS[metric.category]) return [];
    return [{ id, value: format(metric.percentile), status: CRUX_STATUS[metric.category] }];
  });
}

/** Solo convierte: separada de la llamada para poder comprobarla con un informe real. */
export function summarizePageSpeed(data: {
  lighthouseResult: LighthouseResult;
  loadingExperience?: { metrics?: Record<string, CruxMetric>; origin_fallback?: boolean };
}, strategy: Strategy): PageSpeedResult {
  const result = data.lighthouseResult;
  const c = result.categories;
  return {
    strategy,
    scores: {
      performance: toScore(c.performance?.score),
      seo: toScore(c.seo?.score),
      accessibility: toScore(c.accessibility?.score),
      bestPractices: toScore(c['best-practices']?.score),
    },
    lab: summarizeLab(result),
    field: summarizeField(data.loadingExperience),
    fieldIsOrigin: !!data.loadingExperience?.origin_fallback,
    opportunities: summarizeOpportunities(result),
    seoIssues: summarizeSeo(result),
  };
}

export async function runPageSpeed(url: string, strategy: Strategy, apiKey?: string): Promise<PageSpeedResult> {
  const params = new URLSearchParams({ url, strategy, locale: 'es' });
  for (const category of ['PERFORMANCE', 'SEO', 'ACCESSIBILITY', 'BEST_PRACTICES']) params.append('category', category);

  let res: Response;
  try {
    res = await fetch(`${API}?${params}`, {
      // En cabecera y no en la URL, para que la clave no acabe en ningún registro.
      headers: apiKey ? { 'X-Goog-Api-Key': apiKey } : {},
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new PageSpeedError('Google está tardando demasiado en medir esta página. Vuelve a intentarlo en un momento.', 504);
  }

  if (res.status === 429) {
    throw new PageSpeedError('Ahora mismo no podemos medir la velocidad porque se ha agotado la cuota de Google. El análisis SEO de abajo sí es válido; prueba la velocidad más tarde.', 429);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // Una clave mal puesta es cosa del dueño de la web, no del visitante: se ve en el registro.
    console.error('[api/analizar] PageSpeed', res.status, detail.slice(0, 300));
    throw new PageSpeedError('Google no ha podido medir esta página. Suele pasar si la web está caída, tarda demasiado en cargar o bloquea a los robots.', 502);
  }

  return summarizePageSpeed(await res.json(), strategy);
}
