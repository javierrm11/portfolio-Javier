// Descarga de páginas de terceros para el analizador (/api/analizar). La
// dirección la escribe cualquier visitante y la pide nuestro servidor, así que
// no puede servir para llegar a direcciones internas (SSRF). Por eso no usa
// fetch(): con http.request la comprobación de IP va dentro del propio `lookup`,
// en el momento de conectar. Comprobar el DNS antes y dejar que fetch lo vuelva
// a resolver permitiría cambiar la respuesta entre medias (DNS rebinding).
import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { request as httpRequest, type IncomingHttpHeaders, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';

const MAX_REDIRECTS = 5;
const USER_AGENT = 'Mozilla/5.0 (compatible; AnalizadorWebJavierM/1.0; +https://www.javierm.dev/analizador-web/)';

// Redes que no son internet pública: privadas, locales, enlace local (incluida
// la de metadatos de la nube, 169.254.169.254), documentación y multidifusión.
const blockedIps = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) blockedIps.addSubnet(net, prefix, 'ipv4');
for (const [net, prefix] of [
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32], ['2002::', 16],
  ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
] as const) blockedIps.addSubnet(net, prefix, 'ipv6');

const isBlockedIp = (ip: string) => blockedIps.check(ip, isIP(ip) === 6 ? 'ipv6' : 'ipv4');

const NON_PUBLIC_TLD = /\.(local|localhost|internal|intranet|lan|home|corp|test|invalid|example|arpa|onion)$/i;

class UnsafeUrlError extends Error {
  code = 'UNSAFE_URL';
}

function isPublicUrl(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  // Sin credenciales ni puertos raros: no es un escáner de puertos.
  if (url.username || url.password || url.port) return false;
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  // Una IP escrita a mano se saltaría `lookup`: solo se aceptan dominios.
  if (isIP(host)) return false;
  return /^([a-z\d-]+\.)+[a-z][a-z\d-]+$/i.test(host) && !NON_PUBLIC_TLD.test(host);
}

/** Convierte lo que escribe el visitante en una URL pública, o null si no lo es. */
export function parsePublicUrl(input: string): URL | null {
  const text = input.trim();
  if (!text || text.length > 2048) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    return isPublicUrl(url) ? url : null;
  } catch {
    return null;
  }
}

// `lookup` de http.request: rechaza la conexión si el dominio resuelve a una IP
// no pública. Node la llama con `all: true` o sin él según la versión, y cada
// forma espera una respuesta distinta.
const safeLookup = ((hostname: string, options: { all?: boolean }, callback: (...args: unknown[]) => void) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
    if (error) return callback(error);
    if (!addresses.length || addresses.some((a) => isBlockedIp(a.address))) {
      return callback(new UnsafeUrlError(`${hostname} no es una dirección pública`));
    }
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}) as never;

function readBody(res: IncomingMessage, maxBytes: number): Promise<Buffer> {
  const encoding = res.headers['content-encoding'];
  const stream =
    encoding === 'gzip' || encoding === 'x-gzip' ? res.pipe(createGunzip())
    : encoding === 'br' ? res.pipe(createBrotliDecompress())
    : encoding === 'deflate' ? res.pipe(createInflate())
    : res;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    const finish = () => resolve(Buffer.concat(chunks));
    const fail = (error: Error) => (chunks.length ? finish() : reject(error));
    // El tope se cuenta después de descomprimir: un archivo pequeño comprimido
    // no puede inflarse hasta llenar la memoria. Con el principio de la página
    // ya basta para el análisis, así que no es un error.
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      total += chunk.length;
      if (total >= maxBytes) {
        finish();
        res.destroy();
      }
    });
    stream.on('end', finish);
    stream.on('error', fail);
    res.on('error', fail);
  });
}

function decodeBody(body: Buffer, contentType: string): string {
  const head = body.subarray(0, 2048).toString('latin1');
  const charset = /charset=["']?([\w-]+)/i.exec(contentType)?.[1] ?? /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ?? 'utf-8';
  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    return new TextDecoder().decode(body);
  }
}

export interface SafeResponse {
  url: URL;
  status: number;
  headers: IncomingHttpHeaders;
  contentType: string;
  body: string;
}

function requestOnce(url: URL, signal: AbortSignal, maxBytes: number): Promise<Omit<SafeResponse, 'url'>> {
  const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: 'GET',
        lookup: safeLookup,
        signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const contentType = String(res.headers['content-type'] ?? '');
        if (status >= 300 && status < 400 && res.headers.location) {
          res.destroy();
          return resolve({ status, headers: res.headers, contentType, body: '' });
        }
        readBody(res, maxBytes)
          .then((body) => resolve({ status, headers: res.headers, contentType, body: decodeBody(body, contentType) }))
          .catch(reject);
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/** GET siguiendo redirecciones, comprobando cada salto (una redirección también podría apuntar dentro). */
export async function safeFetch(start: URL, { timeoutMs = 8_000, maxBytes = 2_000_000 } = {}): Promise<SafeResponse> {
  const signal = AbortSignal.timeout(timeoutMs);
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isPublicUrl(url)) throw new UnsafeUrlError(`${url.hostname} no es una dirección pública`);
    const res = await requestOnce(url, signal, maxBytes);
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      url = new URL(res.headers.location, url);
      continue;
    }
    return { ...res, url };
  }
  throw Object.assign(new Error('Demasiadas redirecciones'), { code: 'TOO_MANY_REDIRECTS' });
}

const errorCode = (error: unknown) => String((error as { code?: string })?.code ?? (error as { name?: string })?.name ?? '');

/** El dominio no existe o no es público: no tiene sentido seguir midiendo. */
export const isFatalFetchError = (error: unknown) => /^(ENOTFOUND|EAI_AGAIN|UNSAFE_URL)$/.test(errorCode(error));

export function describeFetchError(error: unknown): string {
  const code = errorCode(error);
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return 'No encontramos ese dominio. Revisa que esté bien escrito.';
  if (code === 'UNSAFE_URL') return 'Esa dirección no es una web pública, así que no podemos analizarla.';
  if (code === 'TimeoutError' || code === 'ABORT_ERR' || code === 'AbortError' || code === 'ETIMEDOUT') {
    return 'Tu web ha tardado demasiado en responder (más de 8 segundos) al intentar leerla.';
  }
  if (/CERT|TLS|SSL/.test(code)) return 'El certificado de seguridad (HTTPS) de tu web da un error, así que no hemos podido leerla.';
  if (code === 'TOO_MANY_REDIRECTS') return 'Tu web redirige demasiadas veces seguidas y no llega a cargar ninguna página.';
  return 'No hemos podido conectar con tu web. Puede que esté caída o que bloquee este tipo de visitas.';
}
