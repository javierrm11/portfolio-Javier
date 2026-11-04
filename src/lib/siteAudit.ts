// Parte SEO del analizador: lee el HTML de la página y comprueba lo que ve
// Google y lo que necesita una web de empresa. Los textos van dirigidos a quien
// no es técnico y a menudo es el dueño: qué pasa, por qué importa y cómo se arregla.
import { DomUtils, ElementType, parseDocument } from 'htmlparser2';
import { isFatalFetchError, safeFetch, type SafeResponse } from './safeFetch';

type HtmlElement = ReturnType<typeof DomUtils.getElementsByTagName>[number];

export type CheckStatus = 'error' | 'warn' | 'info' | 'ok';
export type CheckCategory = 'seo' | 'accesibilidad' | 'practicas' | 'empresa';

export interface Check {
  id: string;
  category: CheckCategory;
  status: CheckStatus;
  title: string;
  detail: string;
  fix?: string;
  link?: { href: string; label: string };
}

export interface SiteAudit {
  url: string;
  title: string | null;
  checks: Check[];
}

// En qué parte del informe sale cada comprobación.
const CHECK_CATEGORY: Record<string, CheckCategory> = {
  status: 'seo',
  noindex: 'seo',
  robots: 'seo',
  sitemap: 'seo',
  head: 'seo',
  title: 'seo',
  description: 'seo',
  h1: 'seo',
  viewport: 'seo',
  canonical: 'seo',
  'structured-data': 'seo',
  'open-graph': 'seo',
  text: 'seo',
  alt: 'accesibilidad',
  lang: 'accesibilidad',
  https: 'practicas',
  'https-redirect': 'practicas',
  contact: 'empresa',
  legal: 'empresa',
  wordpress: 'empresa',
};

// Lo único que admite <head>: cualquier otra etiqueta lo cierra en ese punto.
const HEAD_ELEMENTS = new Set(['title', 'meta', 'link', 'script', 'style', 'base', 'noscript', 'template']);

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();
const shorten = (text: string, max = 80) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type RobotsGroup = { agents: string[]; rules: { field: string; value: string }[] };

function parseRobots(text: string) {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | undefined;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    const colon = line.indexOf(':');
    if (colon < 1) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === 'sitemap') {
      sitemaps.push(value);
    } else if (field === 'user-agent') {
      if (!lastWasAgent || !current) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    } else if (current) {
      current.rules.push({ field, value });
    }
    lastWasAgent = false;
  }
  // Googlebot obedece a su propio grupo si existe; si no, al general.
  const group = groups.find((g) => g.agents.includes('googlebot')) ?? groups.find((g) => g.agents.includes('*'));
  const blocksAll = !!group?.rules.some((r) => r.field === 'disallow' && r.value === '/')
    && !group.rules.some((r) => r.field === 'allow' && r.value === '/');
  return { sitemaps, blocksAll };
}

// Las comprobaciones secundarias no deben tumbar el análisis: si fallan, null.
const tryFetch = (url: URL, maxBytes = 300_000) => safeFetch(url, { timeoutMs: 5_000, maxBytes }).catch(() => null);

const isHtml = (res: { contentType: string }) => /html/i.test(res.contentType);

async function findSitemap(origin: string, declared: string[]): Promise<boolean> {
  const candidates = declared.length ? declared.slice(0, 2) : [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
  for (const candidate of candidates) {
    let url: URL;
    try {
      url = new URL(candidate);
    } catch {
      continue;
    }
    const res = await tryFetch(url, 20_000);
    // Muchas webs devuelven su página de error con un 200: hay que mirar el contenido.
    if (res?.status === 200 && (url.pathname.endsWith('.gz') || /<(urlset|sitemapindex)\b/i.test(res.body))) return true;
  }
  return false;
}

async function redirectsToHttps(host: string): Promise<boolean | null> {
  const res = await tryFetch(new URL(`http://${host}/`), 1);
  return res ? res.url.protocol === 'https:' : null;
}

function inspectHtml(page: SafeResponse) {
  const doc = parseDocument(page.body);
  const tags = (name: string) => DomUtils.getElementsByTagName(name, doc, true);
  const attr = (el: { attribs: Record<string, string> }, name: string) => (el.attribs[name] ?? '').trim();
  const metas = tags('meta');
  const meta = (key: 'name' | 'property', value: string) =>
    metas.find((m) => attr(m, key).toLowerCase() === value)?.attribs.content?.trim() ?? '';

  // Los <title> dentro de un <svg> son rótulos del dibujo, no el de la página.
  const insideSvg = (el: HtmlElement) => {
    for (let p = el.parent; p; p = p.parent) if ('name' in p && p.name === 'svg') return true;
    return false;
  };
  const titleEl = tags('title').find((t) => !insideSvg(t));
  const links = tags('link');
  const anchors = tags('a').map((a) => ({ href: attr(a, 'href'), text: clean(DomUtils.textContent(a)) }));
  const images = tags('img');
  const canonicalHref = links.find((l) => attr(l, 'rel').toLowerCase() === 'canonical')?.attribs.href?.trim() ?? '';
  const scripts = tags('script');
  const hasJsonLd = scripts.some((s) => attr(s, 'type').toLowerCase() === 'application/ld+json' && clean(DomUtils.textContent(s)));
  const hasMicrodata = DomUtils.getElements({ itemtype: (v) => !!v }, doc, true, 1).length > 0;
  const generator = meta('name', 'generator');

  // Este parser respeta el orden del HTML, pero un navegador cierra <head> en la
  // primera etiqueta que no admite y lo que venga detrás pasa a <body>. Google
  // hace lo mismo, así que se ignoraría aunque en el código parezca bien puesto.
  const head = tags('head')[0];
  const headChildren = head ? DomUtils.getChildren(head).filter((n): n is HtmlElement => ElementType.isTag(n)) : [];
  const breakerIndex = headChildren.findIndex((n) => !HEAD_ELEMENTS.has(n.name));
  const losesMetadata = breakerIndex >= 0 && headChildren.slice(breakerIndex + 1).some((n) => ['title', 'meta', 'link'].includes(n.name));

  // El texto se cuenta sin scripts ni estilos, que también son nodos de texto.
  const body = tags('body')[0] ?? doc;
  for (const el of DomUtils.getElementsByTagName((n) => ['script', 'style', 'noscript', 'template', 'svg'].includes(n), body, true)) {
    DomUtils.removeElement(el);
  }
  const words = clean(DomUtils.textContent(body)).split(' ').filter((w) => /[\p{L}\d]/u.test(w)).length;

  return {
    title: titleEl ? clean(DomUtils.textContent(titleEl)) : '',
    description: clean(meta('name', 'description')),
    h1Count: tags('h1').length,
    viewport: meta('name', 'viewport'),
    lang: attr(tags('html')[0] ?? { attribs: {} }, 'lang'),
    canonicalHref,
    noindex: /noindex|none/i.test(`${meta('name', 'robots')} ${meta('name', 'googlebot')}`),
    hasStructuredData: hasJsonLd || hasMicrodata,
    hasOpenGraph: !!(meta('property', 'og:title') && meta('property', 'og:image')),
    imageCount: images.length,
    imagesWithoutAlt: images.filter((i) => i.attribs.alt === undefined).length,
    words,
    hasContact: tags('form').length > 0 || anchors.some((a) => /^(tel:|mailto:)|wa\.me\/|api\.whatsapp\.com/i.test(a.href)),
    hasLegal: anchors.some((a) => /aviso[\s_-]*legal|legal|privacidad|privacy|cookies/i.test(`${a.href} ${a.text}`)),
    wordpress: /wordpress/i.test(generator) || page.body.includes('/wp-content/'),
    wordpressVersion: /wordpress\s*([\d.]+)/i.exec(generator)?.[1] ?? null,
    headBreaker: losesMetadata ? headChildren[breakerIndex].name : null,
  };
}

const sameSite = (a: string, b: string) => a.replace(/^www\./, '') === b.replace(/^www\./, '');

export async function auditSite(target: URL): Promise<SiteAudit> {
  let page: SafeResponse;
  try {
    page = await safeFetch(target);
  } catch (error) {
    // Sin HTTPS, o con el certificado mal, puede responder por HTTP: se analiza
    // igual y el resultado dirá que le falta HTTPS.
    if (target.protocol !== 'https:' || isFatalFetchError(error)) throw error;
    const insecure = new URL(target);
    insecure.protocol = 'http:';
    page = await safeFetch(insecure).catch(() => {
      throw error;
    });
  }

  const checks: Check[] = [];
  const add = (id: string, status: CheckStatus, title: string, detail: string, fix?: string, link?: Check['link']) =>
    checks.push({ id, category: CHECK_CATEGORY[id], status, title, detail, fix, link });
  const url = page.url.href;

  if (page.url.protocol === 'https:') {
    add('https', 'ok', 'Usa conexión segura (HTTPS)', 'Los navegadores no la marcan como «no segura».');
  } else {
    add('https', 'error', 'No usa conexión segura (HTTPS)', 'Los navegadores avisan a tus visitantes de que la web no es segura. Es de lo primero que hay que arreglar.', 'Instalar un certificado en el alojamiento: la mayoría los ofrece gratis.');
  }

  if (page.status >= 400) {
    const blocked = page.status === 401 || page.status === 403 || page.status === 429 || page.status === 503;
    add('status', blocked ? 'warn' : 'error',
      blocked ? `Tu web ha rechazado nuestra visita (error ${page.status})` : `La página responde con un error (${page.status})`,
      blocked
        ? 'Algunos sistemas de protección bloquean a las herramientas de análisis, así que no hemos podido revisar el SEO. Comprueba también que no estén bloqueando a Google.'
        : 'Si Google recibe este error, no mostrará la página en sus resultados.',
      blocked
        ? 'Revisar el cortafuegos o la protección del alojamiento.'
        : 'Comprobar que la dirección es correcta y que la página sigue publicada.');
    return { url, title: null, checks };
  }

  if (!isHtml(page)) {
    add('status', 'error', 'Esa dirección no es una página web', `Devuelve otro tipo de archivo (${shorten(page.contentType || 'desconocido', 40)}).`, 'Probar con la dirección de tu página de inicio.');
    return { url, title: null, checks };
  }

  const html = inspectHtml(page);
  const [robotsRes, httpsRedirect] = await Promise.all([
    tryFetch(new URL('/robots.txt', page.url)),
    page.url.protocol === 'https:' ? redirectsToHttps(page.url.hostname) : Promise.resolve(null),
  ]);
  const robotsFound = robotsRes?.status === 200 && !isHtml(robotsRes);
  const robots = parseRobots(robotsFound ? robotsRes.body : '');
  const sitemapFound = await findSitemap(page.url.origin, robots.sitemaps);

  if (httpsRedirect === false) {
    add('https-redirect', 'warn', 'La versión sin HTTPS no redirige a la segura', 'Quien entre por http:// se queda en la versión no segura, y Google puede ver dos webs en lugar de una.', 'Configurar en el servidor una redirección permanente (301) a https://.');
  } else if (httpsRedirect) {
    add('https-redirect', 'ok', 'La versión sin HTTPS redirige a la segura', 'Todo el mundo acaba en la misma versión de la web.');
  }

  const headerRobots = String(page.headers['x-robots-tag'] ?? '');
  if (html.noindex || /noindex|none/i.test(headerRobots)) {
    add('noindex', 'error', 'Le estás pidiendo a Google que no muestre esta página', 'Lleva la instrucción «noindex». Mientras esté, no aparecerá en los resultados. Es habitual que se quede puesta sin querer al publicar una web.', 'Quitar la instrucción «noindex» de la página o de la configuración de tu gestor de contenidos.');
  } else {
    add('noindex', 'ok', 'Google puede mostrar esta página', 'No hay ninguna instrucción «noindex».');
  }

  if (robots.blocksAll) {
    add('robots', 'error', 'Tu robots.txt bloquea toda la web', 'Hay una regla «Disallow: /» que le impide a Google rastrear tus páginas.', 'Borrar esa línea del archivo robots.txt cuanto antes.');
  } else if (robotsFound) {
    add('robots', 'ok', 'Tiene archivo robots.txt', 'Y no bloquea el rastreo de la web.');
  } else {
    add('robots', 'warn', 'No hemos encontrado robots.txt', 'No es grave, pero es un archivo sencillo que orienta a Google sobre qué rastrear y dónde está tu sitemap.', 'Crear un archivo robots.txt en la raíz de tu web.');
  }

  if (sitemapFound) {
    add('sitemap', 'ok', 'Tiene sitemap', 'Google dispone de una lista de tus páginas.');
  } else {
    add('sitemap', 'warn', 'No hemos encontrado un sitemap', 'Es la lista de páginas que le das a Google. Sin ella tarda más en descubrir las nuevas.', 'Generar el archivo sitemap.xml y enviarlo en Google Search Console.');
  }

  if (html.headBreaker) {
    add('head', 'error', `La etiqueta <${shorten(html.headBreaker, 30)}> corta la cabecera de tu página`, 'No está permitida en el <head>: el navegador y Google lo dan por terminado ahí. Todo lo que viene detrás (a menudo el título, la descripción o la canonical) se ignora, aunque en el código parezca correcto.', 'Moverla al <body>. Suele venir de un script de analítica o de un plugin.');
  }

  if (!html.title) {
    add('title', 'error', 'Falta el título de la página', 'Es el titular que Google enseña en sus resultados. Sin él, escoge uno por su cuenta.', 'Escribir un título que diga qué haces y dónde, de unos 60 caracteres.');
  } else if (html.title.length < 30) {
    add('title', 'warn', `El título es muy corto (${html.title.length} caracteres)`, `«${html.title}». Es el titular que Google enseña en sus resultados, y se puede aprovechar más.`, 'Ampliarlo para decir qué haces y dónde, hasta unos 60 caracteres.');
  } else if (html.title.length > 65) {
    add('title', 'warn', `El título es largo (${html.title.length} caracteres)`, `«${shorten(html.title)}». Google puede cortarlo en sus resultados.`, 'Dejarlo en unos 60 caracteres, con lo importante al principio.');
  } else {
    add('title', 'ok', `Título correcto (${html.title.length} caracteres)`, `«${html.title}»`);
  }

  if (!html.description) {
    add('description', 'warn', 'Falta la descripción de la página', 'Es el texto que suele salir bajo el título en Google, y ayuda a decidir si alguien hace clic.', 'Escribir una frase de 70 a 160 caracteres con lo que ofreces.');
  } else if (html.description.length < 70) {
    add('description', 'warn', `La descripción es muy corta (${html.description.length} caracteres)`, `«${html.description}». Google puede ignorarla y escoger otro texto de tu página.`, 'Ampliarla hasta los 70-160 caracteres.');
  } else if (html.description.length > 165) {
    add('description', 'warn', `La descripción es larga (${html.description.length} caracteres)`, 'Google la cortará en torno a los 160 caracteres.', 'Recortarla, con lo importante al principio.');
  } else {
    add('description', 'ok', `Descripción correcta (${html.description.length} caracteres)`, `«${shorten(html.description, 170)}»`);
  }

  if (html.h1Count === 0) {
    add('h1', 'error', 'No hay titular principal (H1)', 'El H1 le dice a Google y a tus visitantes de qué va la página. Cada página debería tener uno.', 'Añadir un único H1 que diga qué haces y dónde.');
  } else if (html.h1Count > 1) {
    add('h1', 'warn', `Hay ${html.h1Count} titulares principales (H1)`, 'Lo recomendable es uno por página, para dejar claro cuál es el tema principal.', 'Dejar un solo H1 y convertir el resto en H2.');
  } else {
    add('h1', 'ok', 'Tiene un titular principal (H1)', 'Exactamente uno, como debe ser.');
  }

  if (html.viewport) {
    add('viewport', 'ok', 'Está preparada para móvil', 'Tiene la etiqueta que adapta la página a la pantalla.');
  } else {
    add('viewport', 'error', 'No está preparada para móvil', 'Falta la etiqueta «viewport», así que en el móvil se verá diminuta. Google evalúa tu web sobre todo en su versión móvil.', 'Añadir la etiqueta viewport a la cabecera de la página.');
  }

  if (html.lang) {
    add('lang', 'ok', `Indica su idioma (${shorten(html.lang, 10)})`, 'Ayuda a buscadores y lectores de pantalla.');
  } else {
    add('lang', 'warn', 'No indica en qué idioma está', 'Sin ese dato, Google lo tiene que deducir y un lector de pantalla puede leer con la pronunciación equivocada.', 'Añadir el idioma en la etiqueta <html>, por ejemplo lang="es".');
  }

  if (!html.canonicalHref) {
    add('canonical', 'warn', 'No indica su dirección principal (canonical)', 'Le dice a Google cuál es la versión buena cuando el mismo contenido se ve en varias direcciones.', 'Añadir una etiqueta canonical con la dirección definitiva de la página.');
  } else {
    let canonicalHost: string | null = null;
    try {
      canonicalHost = new URL(html.canonicalHref, page.url).hostname;
    } catch {
      // Una canonical mal escrita se trata como si apuntara a otro sitio.
    }
    if (canonicalHost && sameSite(canonicalHost, page.url.hostname)) {
      add('canonical', 'ok', 'Indica su dirección principal (canonical)', shorten(html.canonicalHref));
    } else {
      add('canonical', 'warn', 'La dirección principal apunta a otra web', `Su canonical es ${shorten(html.canonicalHref)}. Le estás diciendo a Google que la página buena es otra.`, 'Cambiarla por la dirección de esta página, salvo que de verdad quieras enviar a Google a esa web.');
    }
  }

  if (html.hasStructuredData) {
    add('structured-data', 'ok', 'Tiene datos estructurados', 'Ayudan a Google y a las IA a entender quién eres y qué ofreces.');
  } else {
    add('structured-data', 'warn', 'No tiene datos estructurados', 'Son datos en un formato que Google y las IA entienden directamente: empresa, dirección, servicios, preguntas frecuentes…', 'Añadir los datos de tu empresa en formato JSON-LD.', { href: '/blog/aparecer-en-chatgpt-ai-overviews-geo/', label: 'Cómo ayudan a aparecer en ChatGPT y Google' });
  }

  if (html.hasOpenGraph) {
    add('open-graph', 'ok', 'Se comparte bien en redes', 'Tiene título e imagen para cuando alguien pega el enlace en WhatsApp o LinkedIn.');
  } else {
    add('open-graph', 'warn', 'No está preparada para compartirse', 'Al enviar el enlace por WhatsApp o LinkedIn puede salir sin imagen ni título.', 'Añadir las etiquetas og:title, og:description y og:image.');
  }

  if (html.imagesWithoutAlt > 0) {
    add('alt', 'warn', `${html.imagesWithoutAlt} de ${plural(html.imageCount, 'imagen', 'imágenes')} sin texto alternativo`, 'El texto alternativo le explica la imagen a Google y a quien usa un lector de pantalla.', 'Describir cada imagen importante en una frase corta.');
  } else if (html.imageCount > 0) {
    add('alt', 'ok', 'Las imágenes tienen texto alternativo', plural(html.imageCount, 'imagen revisada', 'imágenes revisadas') + '.');
  }

  if (html.words < 100) {
    add('text', 'warn', `Hay muy poco texto (${plural(html.words, 'palabra', 'palabras')})`, 'Con tan poco, a Google le cuesta saber de qué va la página. Si tu web carga el contenido con JavaScript, puede que esté ahí pero no en este primer HTML, y Google tardará más en verlo.', 'Añadir texto que explique qué haces, para quién y dónde.');
  } else {
    add('text', 'ok', `Tiene contenido suficiente (${html.words} palabras)`, 'Hay texto para que Google entienda de qué va.');
  }

  if (html.hasContact) {
    add('contact', 'ok', 'Te pueden contactar desde esta página', 'Hay un formulario o un enlace de teléfono, email o WhatsApp.');
  } else {
    add('contact', 'warn', 'No hemos visto cómo contactar desde esta página', 'Ni formulario ni enlaces de teléfono, email o WhatsApp. Si la web busca clientes, ponérselo fácil suele ser lo que más se nota.', 'Poner un botón de llamada o WhatsApp bien visible.');
  }

  if (html.hasLegal) {
    add('legal', 'ok', 'Hemos encontrado enlaces a textos legales', 'Aviso legal, privacidad o cookies. Este análisis no revisa si su contenido es correcto.');
  } else {
    add('legal', 'warn', 'No hemos encontrado textos legales', 'En España, una web de empresa debe identificar a su titular e informar de cómo trata los datos (LSSI y RGPD).', 'Añadir aviso legal, privacidad y cookies, y comprobarlos con tu asesor.', { href: '/blog/cuanto-cuesta-pagina-web-empresa-pequena-2026/', label: 'Qué debería incluir tu web' });
  }

  if (html.wordpress) {
    add('wordpress', 'info', html.wordpressVersion ? `Usa WordPress ${html.wordpressVersion}` : 'Usa WordPress', 'WordPress funciona bien, pero hay que mantenerlo al día: en 2026 INCIBE ha avisado de fallos que ya se están explotando.', 'Actualizar WordPress y revisar sus plugins.', { href: '/blog/wordpress-vulnerabilidades-incibe-empresas/', label: 'Qué revisar en tu WordPress' });
  }

  return { url, title: html.title || null, checks };
}
