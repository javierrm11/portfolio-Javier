// Parte de velocidad del analizador: llama a la API de Google PageSpeed Insights
// y se queda solo con lo que se enseña, porque la respuesta original pesa varios
// megas. Sin clave la cuota compartida suele estar agotada: en producción hace
// falta PAGESPEED_API_KEY (ver astro.config.mjs).
import { AUDIT_COPY, OWN_CHECK_BY_AUDIT } from './auditCopy';

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

export type PageSpeedCategory = 'velocidad' | 'seo' | 'accesibilidad' | 'practicas';

export interface Finding {
  id: string;
  severity: 'error' | 'warn';
  title: string;
  why: string;
  /** null si la auditoría no está traducida: Google no da una solución aparte. */
  fix: string | null;
  savings: string | null;
  /** Comprobación propia con la que coincide (ver OWN_CHECK_BY_AUDIT). */
  ownCheck: string | null;
}

export interface PageSpeedResult {
  strategy: Strategy;
  scores: { performance: number | null; seo: number | null; accessibility: number | null; bestPractices: number | null };
  lab: Metric[];
  /** Datos de visitantes reales (Chrome), solo si la web tiene tráfico suficiente. */
  field: Metric[];
  /** true si los datos reales son de todo el dominio, no solo de esta página. */
  fieldIsOrigin: boolean;
  findings: Record<PageSpeedCategory, Finding[]>;
  /** Cuántas auditorías de Google ha superado cada categoría. */
  passed: Record<PageSpeedCategory, number>;
}

export class PageSpeedError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface Audit {
  id: string;
  title: string;
  description?: string;
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
const NOT_ACTIONABLE = new Set(['largest-contentful-paint-element', 'mainthread-work-breakdown', 'lcp-breakdown-insight', 'lcp-discovery-insight', 'network-dependency-tree-insight', 'forced-reflow-insight']);

const MAX_SPEED_FINDINGS = 6;
// A partir de aquí una mejora se nota al cargar: por debajo es "mejorable".
const GRAVE_SAVINGS_MS = 400;
const GRAVE_SAVINGS_KIB = 1000;

const toScore = (score: number | null | undefined) => (typeof score === 'number' ? Math.round(score * 100) : null);
const toStatus = (score: number): MetricStatus => (score >= 0.9 ? 'good' : score >= 0.5 ? 'average' : 'poor');

function summarizeLab(result: LighthouseResult): Metric[] {
  return Object.entries(LAB_AUDITS).flatMap(([id, auditId]) => {
    const audit = result.audits[auditId];
    if (!audit?.displayValue || audit.score === null) return [];
    return [{ id, value: audit.displayValue, status: toStatus(audit.score) }];
  });
}

// El grupo "hidden" es lo que el propio informe de Lighthouse no enseña: ahí caen
// los duplicados de lo mismo con otro nombre.
function visibleAudits(result: LighthouseResult, category: string): Audit[] {
  return (result.categories[category]?.auditRefs ?? []).flatMap((ref) => {
    const audit = ref.group === 'metrics' || ref.group === 'hidden' ? undefined : result.audits[ref.id];
    return audit ? [audit] : [];
  });
}

const plainText = (text: string) => text.replace(/`/g, '').replace(/\s+/g, ' ').trim();

// Las descripciones de Google son Markdown y acaban con un "Más información" que
// aquí no lleva a ninguna parte: se queda el texto, sin los enlaces.
const plainDescription = (text = '') =>
  plainText(text.replace(/\[([^\]]*)\]\([^)]*\)\.?/g, (_, label: string) => (/^(más información|learn)/i.test(label) ? '' : label)));

function toFinding(audit: Audit, savings: string | null, grave: boolean): Finding {
  const copy = AUDIT_COPY[audit.id];
  return {
    id: audit.id,
    severity: grave || copy?.severity === 'error' ? 'error' : 'warn',
    title: copy?.title ?? plainText(audit.title),
    why: copy?.why ?? plainDescription(audit.description),
    fix: copy?.fix ?? null,
    savings,
    ownCheck: OWN_CHECK_BY_AUDIT[audit.id] ?? null,
  };
}

const uniqueByTitle = (findings: Finding[]) => findings.filter((f, i) => findings.findIndex((o) => o.title === f.title) === i);

function summarizeSpeedFindings(result: LighthouseResult): Finding[] {
  const savedMs = (a: Audit) => a.details?.overallSavingsMs ?? Object.values(a.metricSavings ?? {}).reduce((sum, n) => sum + n, 0);
  // Google solo da los bytes en algunas: en el resto están en el texto (pedimos
  // el informe en español, ver runPageSpeed), como en "Ahorro estimado de 2315 KiB".
  const savedKib = (a: Audit) => {
    if (a.details?.overallSavingsBytes) return a.details.overallSavingsBytes / 1024;
    const text = /Ahorro estimado de ([\d.]+) KiB/.exec(a.displayValue ?? '')?.[1];
    return text ? Number(text.replace(/\./g, '')) : 0;
  };
  const hasSomethingToSave = (a: Audit) => savedMs(a) > 0 || (!!a.displayValue && !/\s0 (KiB|ms)$/.test(a.displayValue));
  const findings = visibleAudits(result, 'performance')
    .filter((a) => !NOT_ACTIONABLE.has(a.id) && a.scoreDisplayMode === 'metricSavings' && a.score !== null && a.score < 0.9 && hasSomethingToSave(a))
    .sort((a, b) => savedMs(b) - savedMs(a) || savedKib(b) - savedKib(a))
    .map((a) => toFinding(a, a.displayValue?.replace('Ahorro estimado de', 'Ahorro de') ?? null, savedMs(a) >= GRAVE_SAVINGS_MS || savedKib(a) >= GRAVE_SAVINGS_KIB));
  return uniqueByTitle(findings).slice(0, MAX_SPEED_FINDINGS);
}

// Las demás categorías son de sí o no: o la página lo cumple, o no.
function summarizeBinaryFindings(result: LighthouseResult, category: string): Finding[] {
  const findings = visibleAudits(result, category)
    .filter((a) => (a.scoreDisplayMode === 'binary' || a.scoreDisplayMode === 'metricSavings') && a.score !== null && a.score < 0.9)
    .map((a) => toFinding(a, null, false));
  return uniqueByTitle(findings);
}

const countPassed = (result: LighthouseResult, category: string) =>
  visibleAudits(result, category).filter((a) => ['binary', 'metricSavings', 'numeric'].includes(a.scoreDisplayMode) && a.score !== null && a.score >= 0.9).length;

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
    findings: {
      velocidad: summarizeSpeedFindings(result),
      seo: summarizeBinaryFindings(result, 'seo'),
      accesibilidad: summarizeBinaryFindings(result, 'accessibility'),
      practicas: summarizeBinaryFindings(result, 'best-practices'),
    },
    passed: {
      velocidad: countPassed(result, 'performance'),
      seo: countPassed(result, 'seo'),
      accesibilidad: countPassed(result, 'accessibility'),
      practicas: countPassed(result, 'best-practices'),
    },
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
