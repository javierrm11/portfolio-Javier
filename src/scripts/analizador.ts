// Analizador web (/analizador-web/): pide cada parte del informe a /api/analizar
// y la pinta según llega, para que no haya que esperar a la medición de Google
// (hasta un minuto) para ver el SEO. Lo que devuelve el servidor viene de webs
// ajenas, así que se pinta siempre como texto (textContent), nunca como HTML.
import { waHref } from '../lib/services';
import type { Finding, Metric, PageSpeedCategory, PageSpeedResult, Strategy } from '../lib/pageSpeed';
import type { Check, SiteAudit } from '../lib/siteAudit';

type Category = PageSpeedCategory | 'empresa';
type Severity = 'error' | 'warn' | 'info';
type Tone = 'good' | 'average' | 'poor';

/** Un fallo tal como se enseña, venga de nuestras comprobaciones o de Google. */
interface Item {
  id: string;
  severity: Severity;
  title: string;
  why: string;
  fix: string | null;
  savings: string | null;
  link?: { href: string; label: string };
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fatal: boolean };

const CATEGORIES: Category[] = ['velocidad', 'seo', 'accesibilidad', 'practicas', 'empresa'];
const SCORE_OF: Record<PageSpeedCategory, keyof PageSpeedResult['scores']> = {
  velocidad: 'performance',
  seo: 'seo',
  accesibilidad: 'accessibility',
  practicas: 'bestPractices',
};
const TONE_LABEL: Record<Tone, string> = { good: 'Bien', average: 'Mejorable', poor: 'Mal' };
const SEVERITY: Record<Severity, { label: string; glyph: string }> = {
  error: { label: 'Grave', glyph: '✕' },
  warn: { label: 'Mejorable', glyph: '!' },
  info: { label: 'A tener en cuenta', glyph: 'i' },
};
const SEVERITY_ORDER: Severity[] = ['error', 'warn', 'info'];

const METRIC_NAMES: Record<string, string> = {
  lcp: 'Se ve el contenido principal (LCP)',
  inp: 'Reacciona al tocar (INP)',
  fcp: 'Se ve lo primero (FCP)',
  tbt: 'Tiempo sin responder (TBT)',
  cls: 'Cuánto se mueve al cargar (CLS)',
  si: 'Rapidez al llenar la pantalla',
};
// Los umbrales de Lighthouse para una nota verde: más exigentes en ordenador.
const LAB_TARGETS: Record<Strategy, Record<string, string>> = {
  mobile: { lcp: 'hasta 2,5 s', fcp: 'hasta 1,8 s', tbt: 'hasta 200 ms', cls: 'hasta 0,1', si: 'hasta 3,4 s' },
  desktop: { lcp: 'hasta 1,2 s', fcp: 'hasta 0,9 s', tbt: 'hasta 150 ms', cls: 'hasta 0,1', si: 'hasta 1,3 s' },
};
const FIELD_TARGETS: Record<string, string> = { lcp: 'hasta 2,5 s', inp: 'hasta 200 ms', fcp: 'hasta 1,8 s', cls: 'hasta 0,1' };

const RING_LENGTH = 326.73; // 2π · 52, el radio del círculo en ScoreRing.astro
const CLIENT_TIMEOUT_MS = 70_000;
const GENERIC_ERROR = 'No hemos podido completar esta parte del análisis. Vuelve a intentarlo en un momento.';

const form = document.getElementById('an-form') as HTMLFormElement | null;
const input = document.getElementById('an-url') as HTMLInputElement | null;
const submit = document.getElementById('an-submit') as HTMLButtonElement | null;
const errorBox = document.getElementById('an-error');
const results = document.getElementById('an-results');

const byId = (id: string) => document.getElementById(id) as HTMLElement;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ── Estado del informe ────────────────────────────────────────
const report = {
  device: 'mobile' as Strategy,
  audit: null as SiteAudit | null,
  auditError: null as string | null,
  speed: { mobile: null, desktop: null } as Record<Strategy, PageSpeedResult | null>,
  speedError: { mobile: null, desktop: null } as Record<Strategy, string | null>,
  finished: false,
};
// Lo que se ha abierto o cerrado a mano; lo demás sigue la regla de itemIsOpen.
const toggled = new Map<string, boolean>();
// Lo último pintado en cada tarjeta: sin cambios no se toca, y así no se pierde
// el foco de quien esté leyendo cuando llega la medición de Google.
const painted = new Map<Category, string>();

const speedNow = () => report.speed[report.device];
const speedErrorNow = () => report.speedError[report.device];
const speedPending = () => !speedNow() && !speedErrorNow();

function requestPart<T>(url: string, part: 'page' | Strategy): Promise<ApiResult<T>> {
  return fetch('/api/analizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, part }),
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      return res.ok && data ? { ok: true as const, data: data as T } : { ok: false as const, error: data?.error ?? GENERIC_ERROR, fatal: !!data?.fatal };
    })
    .catch(() => ({ ok: false as const, error: GENERIC_ERROR, fatal: false }));
}

// ── De los datos a lo que se enseña ───────────────────────────
const fromCheck = (c: Check): Item => ({
  id: c.id,
  severity: c.status === 'ok' ? 'info' : c.status,
  title: c.title,
  why: c.detail,
  fix: c.fix ?? null,
  savings: null,
  link: c.link,
});

const fromFinding = (f: Finding): Item => ({ id: f.id, severity: f.severity, title: f.title, why: f.why, fix: f.fix, savings: f.savings });

const checksOf = (cat: Category) => report.audit?.checks.filter((c) => c.category === cat) ?? [];
const findingsOf = (cat: Category) => (cat === 'empresa' ? [] : speedNow()?.findings[cat] ?? []);

// Si nosotros ya señalamos algo, no se repite lo de Google. Si lo damos por bueno
// y Google no, gana Google, que ve la página como un navegador de verdad.
const googleOverrides = (check: Check) => findingsOf(check.category).some((f) => f.ownCheck === check.id);

function itemsOf(cat: Category): Item[] {
  const checks = checksOf(cat);
  const own = checks.filter((c) => c.status !== 'ok').map(fromCheck);
  const google = findingsOf(cat)
    .filter((f) => !f.ownCheck || !checks.some((c) => c.id === f.ownCheck && c.status !== 'ok'))
    .map(fromFinding);
  const items = [...own, ...google];
  return SEVERITY_ORDER.flatMap((severity) => items.filter((i) => i.severity === severity));
}

const passedOf = (cat: Category) => checksOf(cat).filter((c) => c.status === 'ok' && !googleOverrides(c)).map((c) => c.title);

const toneOfScore = (score: number): Tone => (score >= 90 ? 'good' : score >= 50 ? 'average' : 'poor');

function statusOf(cat: Category): { state: Tone | 'pending' | 'empty'; ringValue: number; ringText: string; label: string; aria: string } {
  const name = byId(`an-title-${cat}`).textContent ?? cat;
  if (cat === 'empresa') {
    if (!report.audit) {
      return report.auditError
        ? { state: 'empty', ringValue: 0, ringText: '–', label: 'Sin datos', aria: `${name}: sin datos` }
        : { state: 'pending', ringValue: 0, ringText: '–', label: 'Midiendo…', aria: `${name}: revisando` };
    }
    const pending = itemsOf(cat).filter((i) => i.severity !== 'info').length;
    return pending
      ? { state: 'average', ringValue: 100, ringText: String(pending), label: 'Por revisar', aria: `${name}: ${plural(pending, 'punto', 'puntos')} por revisar` }
      : { state: 'good', ringValue: 100, ringText: '✓', label: 'Todo bien', aria: `${name}: todo bien` };
  }
  const score = speedNow()?.scores[SCORE_OF[cat]] ?? null;
  if (score === null) {
    return speedPending()
      ? { state: 'pending', ringValue: 0, ringText: '–', label: 'Midiendo…', aria: `${name}: midiendo` }
      : { state: 'empty', ringValue: 0, ringText: '–', label: 'Sin datos', aria: `${name}: sin datos` };
  }
  const tone = toneOfScore(score);
  return { state: tone, ringValue: score, ringText: String(score), label: TONE_LABEL[tone], aria: `${name}: ${score} de 100, ${TONE_LABEL[tone]}` };
}

// ── Pintar ────────────────────────────────────────────────────
function paintStatus(cat: Category) {
  const status = statusOf(cat);
  document.querySelectorAll<HTMLElement>(`[data-ring="${cat}"]`).forEach((ring) => {
    ring.dataset.state = status.state;
    ring.setAttribute('aria-label', status.aria);
    ring.style.setProperty('--an-dash', String((status.ringValue / 100) * RING_LENGTH));
    (ring.querySelector('.an-ring-text') as HTMLElement).textContent = status.ringText;
  });
  document.querySelectorAll<HTMLElement>(`[data-status="${cat}"]`).forEach((label) => {
    label.dataset.state = status.state;
    label.textContent = status.label;
  });
}

function metricTile(metric: Metric, target: string | undefined): HTMLElement {
  const tile = el('div', `an-metric an-metric--${metric.status}`);
  tile.append(
    el('span', 'an-metric-name', METRIC_NAMES[metric.id] ?? metric.id),
    el('strong', 'an-metric-value', metric.value),
    el('span', 'an-metric-note', target ? `${TONE_LABEL[metric.status]} · ${target}` : TONE_LABEL[metric.status]),
  );
  return tile;
}

function speedBlock(): HTMLElement[] {
  const speed = speedNow();
  if (!speed) {
    const error = speedErrorNow();
    return [el('p', error ? 'an-notice' : 'an-waiting', error ?? 'Google está midiendo la velocidad: suele tardar entre 20 y 60 segundos.')];
  }
  const blocks: HTMLElement[] = [];
  const lab = el('div', 'an-metrics');
  speed.lab.forEach((m) => lab.append(metricTile(m, LAB_TARGETS[speed.strategy][m.id])));
  blocks.push(lab);
  if (speed.field.length) {
    const scope = speed.fieldIsOrigin ? 'de toda tu web, no solo de esta página' : 'de esta página';
    const field = el('div', 'an-metrics');
    speed.field.forEach((m) => field.append(metricTile(m, FIELD_TARGETS[m.id])));
    blocks.push(
      el('p', 'an-note', 'Esto es una carga de prueba de Google. Los visitantes reales, debajo, son los datos que cuentan.'),
      el('h4', '', 'Visitantes reales'),
      field,
      el('p', 'an-note', `Usuarios de Chrome durante los últimos 28 días, ${scope}.`),
    );
  } else {
    blocks.push(el('p', 'an-note', 'Carga de prueba de Google. Aún no hay datos de visitantes reales de esta web: hace falta más tráfico para tenerlos.'));
  }
  return blocks;
}

const itemIsOpen = (item: Item) => toggled.get(item.id) ?? item.severity === 'error';

function itemRow(item: Item): HTMLElement {
  const row = el('div', 'an-item');
  const button = el('button', 'an-item-head');
  button.type = 'button';
  const panelId = `an-panel-${item.id}`;
  button.setAttribute('aria-controls', panelId);

  const icon = el('span', `an-glyph an-glyph--${item.severity}`, SEVERITY[item.severity].glyph);
  icon.setAttribute('role', 'img');
  icon.setAttribute('aria-label', SEVERITY[item.severity].label);
  button.append(icon, el('span', 'an-item-title', item.title));
  if (item.savings) button.append(el('span', `an-saving an-saving--${item.severity}`, item.savings));

  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chevron.setAttribute('viewBox', '0 0 24 24');
  chevron.setAttribute('class', 'an-chevron');
  chevron.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M6 9l6 6 6-6');
  chevron.append(path);
  button.append(chevron);

  const panel = el('div', 'an-item-panel');
  panel.id = panelId;
  const why = el('div', 'an-explain');
  why.append(el('strong', '', 'Por qué importa'), el('p', '', item.why));
  panel.append(why);
  if (item.fix || item.link) {
    const fix = el('div', 'an-explain');
    fix.append(el('strong', '', 'Cómo se arregla'));
    if (item.fix) fix.append(el('p', '', item.fix));
    if (item.link) {
      const link = el('a', '', `${item.link.label} →`);
      link.href = item.link.href;
      fix.append(link);
    }
    panel.append(fix);
  }

  const setOpen = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    row.classList.toggle('is-open', open);
  };
  setOpen(itemIsOpen(item));
  // Se abre y cierra aquí mismo, sin repintar la tarjeta, para no perder el foco.
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    toggled.set(item.id, open);
    setOpen(open);
  });

  row.append(button, panel);
  return row;
}

function paintCard(cat: Category) {
  const items = itemsOf(cat);
  const passed = passedOf(cat);
  const passedByGoogle = cat === 'empresa' ? 0 : speedNow()?.passed[cat] ?? 0;
  const waitingForGoogle = cat !== 'empresa' && speedPending();
  const googleFailed = cat !== 'empresa' && !speedNow() && !!speedErrorNow();
  // "Nada que arreglar" solo si esta parte se ha podido medir entera: sin la
  // medición de Google no lo sabemos, por bien que salga lo nuestro.
  const fullyMeasured = cat === 'empresa' ? !!report.audit : !!speedNow();

  // Lo único que depende del dispositivo o de los datos: si no cambia, no se repinta.
  const signature = JSON.stringify({ items, passed, passedByGoogle, waitingForGoogle, googleFailed, fullyMeasured, speed: cat === 'velocidad' ? speedNow() : null, error: speedErrorNow(), auditError: report.auditError });
  if (painted.get(cat) === signature) return;
  painted.set(cat, signature);

  const body = document.querySelector<HTMLElement>(`[data-body="${cat}"]`) as HTMLElement;
  const blocks: HTMLElement[] = [];

  if (cat === 'velocidad') blocks.push(...speedBlock());
  if (report.auditError && (cat === 'seo' || cat === 'empresa')) blocks.push(el('p', 'an-notice', report.auditError));

  if (items.length) {
    const list = el('div', 'an-items');
    // WordPress, por ejemplo, es un aviso y no un fallo.
    const onlyNotes = items.every((i) => i.severity === 'info');
    list.append(el('h4', '', onlyNotes ? 'A tener en cuenta' : 'Qué falla'), ...items.map(itemRow));
    blocks.push(list);
  } else if (fullyMeasured) {
    blocks.push(el('p', 'an-all-good', 'Nada que arreglar en esta parte.'));
  }
  if (cat !== 'velocidad') {
    if (waitingForGoogle) blocks.push(el('p', 'an-waiting', 'Google sigue midiendo esta parte.'));
    if (googleFailed) blocks.push(el('p', 'an-waiting', 'Google no ha podido medir esta parte: aquí solo está lo que hemos comprobado nosotros.'));
  }

  if (passed.length || passedByGoogle) {
    const list = el('div', 'an-passed');
    list.append(el('h4', '', 'Lo que está bien'));
    const chips = el('ul', 'an-passed-list');
    for (const title of passed) chips.append(el('li', '', title));
    if (passedByGoogle) chips.append(el('li', 'an-passed-more', plural(passedByGoogle, 'comprobación más de Google', 'comprobaciones más de Google')));
    list.append(chips);
    blocks.push(list);
  }

  body.replaceChildren(...blocks);
}

function verdictText(): string {
  if (!report.audit && !report.auditError) return 'Leyendo tu página…';
  if (speedPending() && !report.finished) return 'Ya hemos revisado tu página. Google está midiendo la velocidad: suele tardar entre 20 y 60 segundos.';
  const all = CATEGORIES.flatMap(itemsOf);
  const graves = all.filter((i) => i.severity === 'error').length;
  const warns = all.filter((i) => i.severity === 'warn').length;
  const noSpeed = !speedNow();
  if (!report.audit && noSpeed) return 'No hemos podido analizar esta página.';
  // "Todo en orden" solo si se ha podido medir todo: si no, sería una falsa buena noticia.
  if (!graves && !warns) {
    if (noSpeed) return 'No hemos encontrado fallos en lo que hemos podido revisar, pero falta medir la velocidad.';
    if (!report.audit) return 'Google no ha encontrado fallos, pero nosotros no hemos podido leer tu página.';
    return 'Todo en orden: no hemos encontrado nada que arreglar.';
  }
  const missing = noSpeed ? ' Falta medir la velocidad.' : '';
  if (!graves) return `No hay problemas graves, pero sí ${plural(warns, 'cosa que mejorar', 'cosas que mejorar')}.${missing}`;
  if (!warns) return `Hemos encontrado ${plural(graves, 'problema grave', 'problemas graves')}.${missing}`;
  return `Hemos encontrado ${plural(graves, 'problema grave', 'problemas graves')} y ${plural(warns, 'cosa que mejorar', 'cosas que mejorar')}.${missing}`;
}

function paint() {
  byId('an-verdict').textContent = verdictText();
  byId('an-hero-label').textContent = `Velocidad en ${report.device === 'mobile' ? 'móvil' : 'ordenador'}`;
  document.querySelectorAll<HTMLButtonElement>('[data-device]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.device === report.device));
  });
  CATEGORIES.forEach((cat) => {
    paintStatus(cat);
    paintCard(cat);
  });
}

// ── Llamada a la acción ───────────────────────────────────────
function showCta(url: string) {
  const measured = report.speed.mobile ?? report.speed.desktop;
  const facts: string[] = [];
  if (measured?.scores.performance != null) facts.push(`velocidad en ${measured.strategy === 'mobile' ? 'móvil' : 'ordenador'} ${measured.scores.performance}/100`);
  if (measured?.scores.seo != null) facts.push(`SEO ${measured.scores.seo}/100`);
  const problems = CATEGORIES.flatMap(itemsOf).filter((i) => i.severity !== 'info').length;
  if (problems) facts.push(plural(problems, 'punto por revisar', 'puntos por revisar'));
  const summary = facts.length ? ` (${facts.join(', ')})` : '';
  const message = `He analizado ${url} con tu analizador${summary}. ${problems ? '¿Me ayudas a mejorarla?' : '¿Hablamos?'}`;

  // Con todo correcto no hay nada que arreglar: el mensaje tiene que decir otra cosa.
  byId('an-cta-title').textContent = problems ? '¿Quieres que te ayude a arreglarlo?' : '¿Necesitas algo más para tu empresa?';
  byId('an-cta-body').textContent = problems
    ? 'Mándame el resultado y te digo qué merece la pena tocar y cuánto costaría, con el presupuesto cerrado antes de empezar.'
    : 'Tu web va bien. Si quieres automatizar tareas o una herramienta a medida, cuéntamelo y te digo precio y plazo.';
  byId('an-cta-wa').textContent = problems ? 'Enviármelo por WhatsApp' : 'Escribirme por WhatsApp';

  (byId('an-cta-wa') as HTMLAnchorElement).href = waHref(`Hola Javier, ${message.charAt(0).toLowerCase()}${message.slice(1)}`);
  const textarea = document.getElementById('mensaje') as HTMLTextAreaElement | null;
  if (textarea && !textarea.value.trim()) textarea.value = message;
  byId('an-cta').hidden = false;
}

// ── Análisis ──────────────────────────────────────────────────
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

// El largo del dominio decide el tamaño del titular (ver .an-summary-host): así
// uno largo cabe en una línea en lugar de partirse a mitad de palabra.
function setHost(url: string) {
  const host = hostOf(url);
  const heading = byId('an-host');
  heading.textContent = host;
  heading.style.setProperty('--an-host-chars', String(host.length));
}

function setBusy(busy: boolean, label: string) {
  if (!submit) return;
  submit.disabled = busy;
  submit.textContent = label;
}

function resetReport() {
  report.audit = null;
  report.auditError = null;
  report.speed = { mobile: null, desktop: null };
  report.speedError = { mobile: null, desktop: null };
  report.finished = false;
  toggled.clear();
  painted.clear();
  byId('an-cta').hidden = true;
}

const REPORT_DATE = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

async function analyze(rawUrl: string) {
  const value = rawUrl.trim();
  if (errorBox) errorBox.hidden = true;
  if (!value) {
    showFormError('Escribe la dirección de tu web, por ejemplo tuempresa.es.');
    input?.focus();
    return;
  }

  setBusy(true, 'Analizando…');
  resetReport();
  setHost(value);
  byId('an-date').textContent = `Informe del ${REPORT_DATE.format(new Date())}`;
  if (results) results.hidden = false;
  paint();

  const pageResult = await requestPart<SiteAudit>(value, 'page');

  // Dominio inexistente o dirección no válida: no hay nada que medir, y es más
  // claro decirlo junto al campo que abrir un informe vacío.
  if (!pageResult.ok && pageResult.fatal) {
    showFormError(pageResult.error);
    setBusy(false, 'Analizar mi web');
    if (results) results.hidden = true;
    input?.focus();
    return;
  }

  // El enlace queda listo para compartir el informe o enviárselo a alguien.
  history.replaceState(null, '', `${location.pathname}?url=${encodeURIComponent(value)}`);

  if (pageResult.ok) report.audit = pageResult.data;
  else report.auditError = pageResult.error;
  const finalUrl = report.audit?.url ?? value;
  setHost(finalUrl);
  paint();

  if (results) {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    results.focus({ preventScroll: true });
  }

  const measure = async (strategy: Strategy) => {
    const res = await requestPart<PageSpeedResult>(finalUrl, strategy);
    if (res.ok) report.speed[strategy] = res.data;
    else report.speedError[strategy] = res.error;
    paint();
  };

  await Promise.all([measure('mobile'), measure('desktop')]);

  report.finished = true;
  paint();
  showCta(finalUrl);
  setBusy(false, 'Analizar otra vez');
}

document.querySelectorAll<HTMLButtonElement>('[data-device]').forEach((button) => {
  button.addEventListener('click', () => {
    report.device = button.dataset.device as Strategy;
    paint();
  });
});

const copy = byId('an-copy');
let copyTimer: ReturnType<typeof setTimeout>;
copy?.addEventListener('click', () => {
  navigator.clipboard?.writeText(location.href).catch(() => {});
  copy.textContent = 'Enlace copiado';
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copy.textContent = 'Copiar enlace';
  }, 2000);
});

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
