// Analizador web (/analizador-web/): pide cada parte del informe a /api/analizar
// y la pinta según llega, para que no haya que esperar a la medición de Google
// (hasta un minuto) para ver el SEO. Lo que devuelve el servidor viene de webs
// ajenas, así que se pinta siempre como texto (textContent), nunca como HTML.
import { waHref } from '../lib/services';
import type { Metric, PageSpeedResult, Strategy } from '../lib/pageSpeed';
import type { Check, CheckStatus, SiteAudit } from '../lib/siteAudit';

const form = document.getElementById('an-form') as HTMLFormElement | null;
const input = document.getElementById('an-url') as HTMLInputElement | null;
const submit = document.getElementById('an-submit') as HTMLButtonElement | null;
const errorBox = document.getElementById('an-error');
const results = document.getElementById('an-results');

type Part = 'page' | Strategy;
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fatal: boolean };

const CLIENT_TIMEOUT_MS = 70_000;
const GENERIC_ERROR = 'No hemos podido completar esta parte del análisis. Vuelve a intentarlo en un momento.';

async function requestPart<T>(url: string, part: Part): Promise<ApiResult<T>> {
  try {
    const res = await fetch('/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, part }),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data) return { ok: true, data: data as T };
    return { ok: false, error: data?.error ?? GENERIC_ERROR, fatal: !!data?.fatal };
  } catch {
    return { ok: false, error: GENERIC_ERROR, fatal: false };
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const byId = (id: string) => document.getElementById(id) as HTMLElement;

function setStep(part: Part, state: 'pending' | 'running' | 'done' | 'error') {
  byId('an-progress').querySelector<HTMLElement>(`[data-step="${part}"]`)?.setAttribute('data-state', state);
}

const scoreLabel = (score: number) => (score >= 90 ? 'Bien' : score >= 50 ? 'Mejorable' : 'Mal');
const scoreState = (score: number) => (score >= 90 ? 'good' : score >= 50 ? 'average' : 'poor');

function setScore(id: string, score: number | null, pendingText?: string) {
  const card = byId('an-scores').querySelector<HTMLElement>(`[data-score="${id}"]`);
  if (!card) return;
  const value = card.querySelector('.an-ring-value') as HTMLElement;
  const label = card.querySelector('.an-score-label') as HTMLElement;
  const ring = card.querySelector('.an-ring') as HTMLElement;
  if (score === null) {
    card.dataset.state = pendingText ? 'pending' : 'empty';
    value.textContent = '–';
    label.textContent = pendingText ?? 'Sin datos';
    ring.style.removeProperty('--an-score');
    return;
  }
  card.dataset.state = scoreState(score);
  value.textContent = String(score);
  label.textContent = scoreLabel(score);
  ring.style.setProperty('--an-score', String(score));
}

// ── Core Web Vitals ───────────────────────────────────────────
const METRICS: { id: string; label: string; hint: string }[] = [
  { id: 'lcp', label: 'LCP', hint: 'Cuánto tarda en verse el contenido principal' },
  { id: 'inp', label: 'INP', hint: 'Cuánto tarda en reaccionar al tocar' },
  { id: 'cls', label: 'CLS', hint: 'Cuánto se mueve el contenido al cargar' },
  { id: 'fcp', label: 'FCP', hint: 'Cuánto tarda en verse lo primero' },
  { id: 'tbt', label: 'TBT', hint: 'Tiempo que la página no responde mientras carga' },
  { id: 'si', label: 'Speed Index', hint: 'Lo rápido que se va llenando la pantalla' },
];

const STATUS_TEXT: Record<Metric['status'], string> = { good: 'Bien', average: 'Mejorable', poor: 'Mal' };

function metricCell(metric: Metric | undefined, label: string): HTMLTableCellElement {
  const cell = el('td');
  cell.dataset.label = label; // en móvil sustituye a la cabecera (analizador.css)
  if (!metric) {
    cell.className = 'an-cell-empty';
    cell.append('–');
    return cell;
  }
  cell.append(el('span', 'an-metric-value', metric.value), el('span', `an-pill an-pill--${metric.status}`, STATUS_TEXT[metric.status]));
  return cell;
}

function renderVitals(mobile: PageSpeedResult | null, desktop: PageSpeedResult | null) {
  const box = byId('an-vitals');
  box.replaceChildren();
  const source = mobile ?? desktop;
  if (!source) {
    box.hidden = true;
    return;
  }
  const field = mobile?.field ?? desktop?.field ?? [];
  const find = (list: Metric[] | undefined, id: string) => list?.find((m) => m.id === id);
  const rows = METRICS.filter((m) => find(mobile?.lab, m.id) || find(desktop?.lab, m.id) || find(field, m.id));

  box.append(el('h3', '', 'Core Web Vitals y tiempos de carga'));
  const wrap = el('div', 'an-table-wrap');
  const table = el('table', 'an-table an-table--results');
  const headRow = el('tr');
  headRow.append(el('th', '', 'Medida'), el('th', '', 'Móvil'), el('th', '', 'Ordenador'), el('th', '', 'Visitantes reales'));
  const thead = el('thead');
  thead.append(headRow);
  const tbody = el('tbody');
  for (const metric of rows) {
    const row = el('tr');
    const name = el('td');
    name.append(el('strong', '', metric.label), el('span', 'an-metric-hint', metric.hint));
    row.append(
      name,
      metricCell(find(mobile?.lab, metric.id), 'Móvil'),
      metricCell(find(desktop?.lab, metric.id), 'Ordenador'),
      metricCell(find(field, metric.id), 'Visitantes reales'),
    );
    tbody.append(row);
  }
  table.append(thead, tbody);
  wrap.append(table);
  box.append(wrap);

  const note = field.length
    ? `Los visitantes reales son usuarios de Chrome durante los últimos 28 días${(mobile ?? desktop)?.fieldIsOrigin ? ', de toda la web y no solo de esta página' : ''}. Si hay diferencias, esos son los datos que cuentan.`
    : 'Google aún no tiene datos de visitantes reales de esta web: es normal si tiene poco tráfico. Móvil y ordenador son la prueba simulada de Google.';
  box.append(el('p', 'an-source', note));
  box.hidden = false;
}

function renderOpportunities(result: PageSpeedResult | null) {
  const box = byId('an-opportunities');
  box.replaceChildren();
  if (!result?.opportunities.length) {
    box.hidden = true;
    return;
  }
  box.append(el('h3', '', 'Lo que más está frenando tu página'));
  const list = el('ul', 'an-opps');
  for (const opportunity of result.opportunities) {
    const item = el('li');
    item.append(el('span', '', opportunity.title));
    if (opportunity.savings) item.append(el('span', 'an-opp-saving', opportunity.savings));
    list.append(item);
  }
  box.append(list, el('p', 'an-source', 'Según la prueba de Google en móvil. Los ahorros son estimaciones.'));
  box.hidden = false;
}

// ── Comprobaciones SEO ────────────────────────────────────────
const CHECK_ICON: Record<CheckStatus, string> = { error: '✕', warn: '!', info: 'i', ok: '✓' };
const CHECK_NAME: Record<CheckStatus, string> = { error: 'Error', warn: 'Aviso', info: 'Información', ok: 'Correcto' };

function checkItem(check: Check): HTMLLIElement {
  const item = el('li', `an-check an-check--${check.status}`);
  const icon = el('span', 'an-check-icon', CHECK_ICON[check.status]);
  icon.title = CHECK_NAME[check.status];
  icon.setAttribute('role', 'img');
  icon.setAttribute('aria-label', CHECK_NAME[check.status]);
  const body = el('div');
  body.append(el('strong', '', check.title), el('p', '', check.detail));
  if (check.link) {
    const link = el('a', '', `${check.link.label} →`);
    link.href = check.link.href;
    body.append(link);
  }
  item.append(icon, body);
  return item;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function renderChecks(audit: SiteAudit, seoIssues: string[]) {
  const box = byId('an-checks');
  box.replaceChildren();
  const of = (status: CheckStatus) => audit.checks.filter((c) => c.status === status);
  const errors = of('error');
  const warnings = of('warn');
  const notes = of('info');
  const passed = of('ok');

  box.append(el('h3', '', 'Revisión SEO y de tu página'));
  box.append(el('p', 'an-checks-summary', `${plural(errors.length, 'error', 'errores')}, ${plural(warnings.length, 'aviso', 'avisos')} y ${plural(passed.length, 'comprobación correcta', 'comprobaciones correctas')}.`));

  const pending = [...errors, ...warnings, ...notes];
  if (pending.length) {
    const list = el('ul', 'an-checks');
    pending.forEach((c) => list.append(checkItem(c)));
    box.append(list);
  }
  if (seoIssues.length) {
    box.append(el('h4', '', 'Google señala además'));
    const list = el('ul', 'an-google-issues');
    seoIssues.forEach((issue) => list.append(el('li', '', issue)));
    box.append(list);
  }
  if (passed.length) {
    const details = el('details', 'an-passed');
    details.append(el('summary', '', `Ver lo que está bien (${passed.length})`));
    const list = el('ul', 'an-checks');
    passed.forEach((c) => list.append(checkItem(c)));
    details.append(list);
    box.append(details);
  }
  box.hidden = false;
}

function renderPageError(message: string) {
  const box = byId('an-checks');
  box.replaceChildren(el('h3', '', 'Revisión SEO y de tu página'), el('p', 'an-notice', message));
  box.hidden = false;
}

// ── Llamada a la acción ───────────────────────────────────────
function showCta(url: string, mobile: PageSpeedResult | null, audit: SiteAudit | null) {
  const facts: string[] = [];
  if (mobile?.scores.performance != null) facts.push(`velocidad en móvil ${mobile.scores.performance}/100`);
  if (mobile?.scores.seo != null) facts.push(`SEO ${mobile.scores.seo}/100`);
  const problems = audit?.checks.filter((c) => c.status === 'error' || c.status === 'warn').length ?? 0;
  if (problems) facts.push(plural(problems, 'punto por revisar', 'puntos por revisar'));
  const summary = facts.length ? ` (${facts.join(', ')})` : '';
  const message = `He analizado ${url} con tu analizador${summary}. ¿Me ayudas a mejorarla?`;

  (byId('an-cta-wa') as HTMLAnchorElement).href = waHref(`Hola Javier, ${message.charAt(0).toLowerCase()}${message.slice(1)}`);
  const textarea = document.getElementById('mensaje') as HTMLTextAreaElement | null;
  if (textarea && !textarea.value.trim()) textarea.value = message;
  byId('an-cta').hidden = false;
}

// ── Análisis ──────────────────────────────────────────────────
function resetResults() {
  for (const step of ['page', 'mobile', 'desktop'] as Part[]) setStep(step, 'pending');
  byId('an-scores').querySelectorAll<HTMLElement>('[data-score]').forEach((card) => setScore(card.dataset.score as string, null, 'Midiendo…'));
  for (const id of ['an-vitals', 'an-opportunities', 'an-checks', 'an-cta', 'an-speed-error', 'an-page-title']) byId(id).hidden = true;
  byId('an-progress').hidden = false;
  byId('an-wait').hidden = true;
}

const showFormError = (message: string) => {
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.hidden = false;
};

function hostOf(url: string) {
  try {
    return new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

async function analyze(rawUrl: string) {
  const value = rawUrl.trim();
  if (errorBox) errorBox.hidden = true;
  if (!value) {
    showFormError('Escribe la dirección de tu web, por ejemplo tuempresa.es.');
    input?.focus();
    return;
  }

  if (submit) {
    submit.disabled = true;
    submit.textContent = 'Analizando…';
  }

  resetResults();
  byId('an-host').textContent = hostOf(value);
  if (results) results.hidden = false;
  setStep('page', 'running');
  const pageResult = await requestPart<SiteAudit>(value, 'page');

  // Dominio inexistente o dirección no válida: no hay nada que medir, y es más
  // claro decirlo junto al campo que abrir un informe vacío.
  if (!pageResult.ok && pageResult.fatal) {
    showFormError(pageResult.error);
    if (submit) {
      submit.disabled = false;
      submit.textContent = 'Analizar mi web';
    }
    if (results) results.hidden = true;
    input?.focus();
    return;
  }

  // El enlace queda listo para compartir el informe o enviárselo a alguien.
  history.replaceState(null, '', `${location.pathname}?url=${encodeURIComponent(value)}`);

  const audit = pageResult.ok ? pageResult.data : null;
  const finalUrl = audit?.url ?? value;
  byId('an-host').textContent = hostOf(finalUrl);
  if (audit?.title) {
    const pageTitle = byId('an-page-title');
    pageTitle.textContent = audit.title;
    pageTitle.hidden = false;
  }
  if (results) {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    results.focus({ preventScroll: true });
  }

  setStep('page', pageResult.ok ? 'done' : 'error');
  if (pageResult.ok) renderChecks(pageResult.data, []);
  else renderPageError(pageResult.error);

  setStep('mobile', 'running');
  setStep('desktop', 'running');
  byId('an-wait').hidden = false;

  const speed: Record<Strategy, PageSpeedResult | null> = { mobile: null, desktop: null };
  const speedErrors = new Set<string>();

  const measure = async (strategy: Strategy) => {
    const res = await requestPart<PageSpeedResult>(finalUrl, strategy);
    setStep(strategy, res.ok ? 'done' : 'error');
    if (!res.ok) {
      speedErrors.add(res.error);
      setScore(`${strategy}-performance`, null);
      return;
    }
    speed[strategy] = res.data;
    setScore(`${strategy}-performance`, res.data.scores.performance);
    renderVitals(speed.mobile, speed.desktop);
    // Google evalúa la versión móvil: el resto del informe sale de esa medición,
    // y de la de ordenador solo mientras no haya otra.
    if (strategy === 'mobile' || !speed.mobile) {
      setScore('seo', res.data.scores.seo);
      setScore('accessibility', res.data.scores.accessibility);
      setScore('best-practices', res.data.scores.bestPractices);
      renderOpportunities(res.data);
      if (audit) renderChecks(audit, res.data.seoIssues);
    }
  };

  await Promise.all([measure('mobile'), measure('desktop')]);

  const measured = speed.mobile ?? speed.desktop;
  if (!measured) {
    for (const id of ['seo', 'accessibility', 'best-practices']) setScore(id, null);
  }
  if (speedErrors.size) {
    const notice = byId('an-speed-error');
    notice.textContent = [...speedErrors].join(' ');
    notice.hidden = false;
  }
  byId('an-wait').hidden = true;
  byId('an-progress').hidden = true;
  showCta(finalUrl, measured, audit);

  if (submit) {
    submit.disabled = false;
    submit.textContent = 'Analizar otra vez';
  }
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input && !submit?.disabled) analyze(input.value);
});

// Con ?url= en el enlace el análisis arranca solo: sirve para compartir el
// informe, o para enviárselo a una empresa ya preparado.
const shared = new URLSearchParams(location.search).get('url');
if (shared && input) {
  input.value = shared;
  analyze(shared);
}
