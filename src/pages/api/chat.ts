// Chatbot del mini-chat (WhatsAppButton.astro): única ruta del sitio que se
// ejecuta en el servidor (función de Vercel). Llama a Gemini con todo el
// conocimiento de la web en las instrucciones de sistema (src/lib/
// chatKnowledge.ts): con tan poco contenido no hace falta un buscador de
// fragmentos (RAG con embeddings) — cabe entero y responde mejor.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { GEMINI_API_KEY } from 'astro:env/server';
import { ApiError, GoogleGenAI, type Content } from '@google/genai';
import { buildSystemPrompt } from '../../lib/chatKnowledge';

export const prerender = false;

const MODEL = 'gemini-3.5-flash-lite';
const MAX_TURNS = 12; // mensajes de historial que se reenvían
const MAX_CHARS = 500; // por mensaje del visitante
const RATE_LIMIT = 8; // mensajes por minuto e IP

// Orígenes desde los que se acepta el chat: evita que otra web use esta ruta
// (y la cuota gratuita de Gemini) como su propio chatbot.
const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?javierm\.dev$/, /^https:\/\/[\w-]+\.vercel\.app$/, /^http:\/\/localhost:\d+$/];

// Límite por IP en memoria: aproximado (cada instancia de la función tiene el
// suyo y se reinicia en frío), pero basta para frenar un abuso puntual.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

let systemPrompt: string | undefined;
async function getSystemPrompt(): Promise<string> {
  if (!systemPrompt) {
    const posts = await getCollection('blog');
    systemPrompt = buildSystemPrompt(
      posts.map((p) => ({ title: p.data.title, description: p.data.description, slug: p.id })),
    );
  }
  return systemPrompt;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const FALLBACK = 'Ahora mismo no puedo responder. Escríbele a Javier por WhatsApp y te contesta él directamente.';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const origin = request.headers.get('origin') ?? '';
  if (!ALLOWED_ORIGINS.some((re) => re.test(origin))) return json({ error: 'forbidden' }, 403);

  if (!GEMINI_API_KEY) return json({ reply: FALLBACK }, 503);
  if (rateLimited(clientAddress ?? 'unknown')) {
    return json({ reply: 'Vas muy rápido. Espera un momento o escríbele a Javier por WhatsApp.' }, 429);
  }

  let messages: { role: 'user' | 'model'; text: string }[];
  try {
    const body = await request.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const clean = messages
    .filter((m) => (m?.role === 'user' || m?.role === 'model') && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, text: m.text.trim().slice(0, MAX_CHARS) }));
  if (!clean.length || clean[clean.length - 1].role !== 'user') return json({ error: 'bad_request' }, 400);

  const contents: Content[] = clean.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: await getSystemPrompt(),
        maxOutputTokens: 400,
        abortSignal: AbortSignal.timeout(15_000),
      },
    });
    const reply = response.text?.trim();
    return json({ reply: reply || FALLBACK });
  } catch (error) {
    // 429 = cuota gratuita agotada (por minuto o por día).
    if (error instanceof ApiError && error.status === 429) {
      return json({ reply: 'Hay muchas consultas ahora mismo. Escríbele a Javier por WhatsApp y te responde enseguida.' }, 429);
    }
    console.error('[api/chat]', error);
    return json({ reply: FALLBACK }, 502);
  }
};
