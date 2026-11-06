// Qué ofrece el bloque del final de cada artículo. El lector de un post sobre
// cuánto cuesta una web no busca lo mismo que el de uno sobre Claude Code: a
// quien llega con un problema de empresa se le ofrece ese servicio, y al resto,
// el analizador, que no le pide ningún compromiso. Los precios salen de `plans`.
import { plans, formatPrice, contactWa, waHref } from './services';
import type { CollectionEntry } from 'astro:content';

type Category = CollectionEntry<'blog'>['data']['category'];

export interface PostCta {
  title: string;
  text: string;
  /** Solo en la variante del analizador: el botón principal lleva allí. */
  analyzerHref?: string;
  whatsappHref: string;
  /** Página del servicio, para quien quiera leer más antes de escribir. */
  serviceHref?: string;
}

const planCopy: Record<string, { title: string; text: (price: string) => string }> = {
  'diseno-web-cordoba': {
    title: '¿Tu empresa necesita una web que traiga clientes?',
    text: (price) => `Te la hago a medida, rápida y con SEO local, desde ${price} en pago único y con el presupuesto cerrado antes de empezar.`,
  },
  'agente-ia-whatsapp': {
    title: '¿Y si tu WhatsApp respondiera solo?',
    text: (price) => `Monto un agente de IA que atiende a tus clientes, agenda citas y toma pedidos, desde ${price} más 29 €/mes de mantenimiento.`,
  },
  'chatbot-ia': {
    title: '¿Quieres un chatbot que responda con los datos de tu empresa?',
    text: (price) => `Lo entreno con tus documentos y tu web para que solo conteste con información real, desde ${price} más el uso de IA según el volumen.`,
  },
  automatizaciones: {
    title: '¿Qué tarea repetitiva le quitarías a tu equipo?',
    text: (price) => `Conecto tus herramientas para que se haga sola, desde ${price} por automatización. Cuéntamela y te digo si merece la pena.`,
  },
  'apps-a-medida': {
    title: '¿Tienes una idea de app o SaaS para tu empresa?',
    text: (price) => `La desarrollo a medida, con usuarios, pagos y panel de administración, desde ${price} por proyecto y con entregas cada semana.`,
  },
};

const ANALYZER = 'analizador';
// La integración de APIs tiene página propia pero no es un plan de services.ts.
const INTEGRATION = 'integracion-apis';
type Offer = keyof typeof planCopy | typeof ANALYZER | typeof INTEGRATION;

const BY_CATEGORY: Record<Category, Offer> = {
  negocios: 'diseno-web-cordoba',
  apis: INTEGRATION,
  'seo-tecnico': ANALYZER,
  ia: ANALYZER,
  nextjs: ANALYZER,
  supabase: ANALYZER,
  claude: ANALYZER,
  carrera: ANALYZER,
};

// Excepciones a la categoría. `null` deja el artículo sin bloque.
const BY_POST: Record<string, Offer | null> = {
  // Nace de un accidente con 69 fallecidos: ahí no se vende nada.
  'via-libre-trenes-renfe-datos-abiertos': null,
  'cuanto-cuesta-agente-ia-whatsapp-business-2026': 'agente-ia-whatsapp',
  'whatsapp-api-ia-generativa': 'agente-ia-whatsapp',
  'supabase-rls-citaswassap': 'agente-ia-whatsapp',
  'ai-act-chatbot-avisar-ia-empresas': 'chatbot-ia',
  'rag-casero-guionia': 'chatbot-ia',
  'tareas-pyme-automatizar-ia': 'automatizaciones',
  'n8n-make-zapier-empresa-pequena-2026': 'automatizaciones',
  'verifactu-2028-factura-electronica-empresas': 'automatizaciones',
  'sustituir-saas-por-herramienta-a-medida': 'apps-a-medida',
  'saas-fin-de-semana-nextjs-supabase-stripe-claude': 'apps-a-medida',
  'api-vuelos-cache-rate-limit': 'apps-a-medida',
  'canalplad-seo-tecnico-nextjs': 'diseno-web-cordoba',
  'webmcp-que-es-empresas': 'diseno-web-cordoba',
  'web-hecha-con-ia-vibe-coding-seguridad': 'diseno-web-cordoba',
};

export function ctaForPost(postId: string, category: Category): PostCta | null {
  const offer = postId in BY_POST ? BY_POST[postId] : BY_CATEGORY[category];
  if (offer === null) return null;

  if (offer === ANALYZER) {
    return {
      title: '¿Tienes web? Mira cómo está en un minuto',
      text: 'Mi analizador gratuito mide su velocidad y su SEO con los datos de Google y te dice qué falla, sin registrarte.',
      analyzerHref: '/analizador-web/',
      whatsappHref: contactWa,
    };
  }

  if (offer === INTEGRATION) {
    return {
      title: '¿Qué quieres conectar a tu web?',
      text: 'Conecto tu web con pagos, reservas, WhatsApp, tu CRM o tu facturación, desde 149 € por integración y con el presupuesto cerrado antes de empezar.',
      whatsappHref: waHref('Hola Javier, vengo de tu blog y me interesa integrar una API en mi web.'),
      serviceHref: '/servicios/integracion-apis/',
    };
  }

  const plan = plans.find((p) => p.slug === offer)!;
  const copy = planCopy[offer];
  return {
    title: copy.title,
    text: copy.text(formatPrice(plan.priceFrom)),
    whatsappHref: plan.href,
    serviceHref: `/servicios/${plan.slug}/`,
  };
}
