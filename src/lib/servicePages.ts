// Contenido de cada página de servicio (/servicios/<slug>, variante "01 ·
// Clásica clara" del explorador de diseño). Precio, plazo e "incluye" del
// resumen salen de src/lib/services.ts; aquí va solo lo propio de la página:
// textos para Google, sectores, detalle de lo que incluye, caso real y FAQ.
import type { ImageMetadata } from 'astro';
import canalplad from '../assets/proyectos/canalplad.png';
import citaswassap from '../assets/proyectos/citaswassap.png';
import guionia from '../assets/proyectos/guionia.png';
import apivuelos from '../assets/proyectos/apivuelos.png';
import prezu from '../assets/proyectos/prezu.es.png';

// Trazos de 24×24 para los iconos de "Qué incluye".
const ICON = {
  screen: 'M3 5h18v11H3z M8 20h8 M12 16v4',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  chat: 'M3.5 20.5l1.4-4.2A8.5 8.5 0 1 1 8 19.3z',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z',
  lock: 'M6 10V7a6 6 0 0 1 12 0v3 M5 10h14v11H5z',
  doc: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 21h4',
  card: 'M3 6h18v12H3z M3 10h18',
  layers: 'M12 3l9 5-9 5-9-5z M3 13l9 5 9-5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  calendar: 'M4 6h16v15H4z M4 10h16 M9 3v4 M15 3v4',
};

export interface ServicePage {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  stats?: { value: string; label: string }[];
  sectorsTitle: string;
  sectors: string[];
  includes: { title: string; desc: string; icon: string }[];
  caseStudy: { image: ImageMetadata; alt: string; kicker: string; title: string; text: string; link?: { href: string; label: string } };
  priceNote?: string;
  faqs: { q: string; a: string }[];
}

export const steps = [
  { n: '01', title: 'Me escribes', desc: 'Por WhatsApp o el formulario, en dos líneas.' },
  { n: '02', title: 'Llamada de 20 min', desc: 'Entiendo tu negocio y lo que necesitas.' },
  { n: '03', title: 'Presupuesto cerrado', desc: 'Precio, plazo y entregables por escrito.' },
  { n: '04', title: 'Desarrollo y lanzamiento', desc: 'Ves avances cada semana y lo publicamos.' },
];

export const servicePages: Record<string, ServicePage> = {
  'diseno-web-cordoba': {
    metaTitle: 'Diseño web en Córdoba desde 349 € | Javier Ruiz Molero',
    metaDescription: 'Páginas web a medida para negocios de Córdoba: rápidas, con SEO local y botón de WhatsApp. Desde 349 €, precio cerrado y lista en 2–3 semanas.',
    h1: 'Diseño web en Córdoba para negocios que quieren clientes',
    lead: 'Páginas web a medida, rápidas y preparadas para salir en Google cuando buscan lo tuyo en Córdoba. Desde 349 €, precio cerrado y lista en 2–3 semanas.',
    stats: [
      { value: '+35%', label: 'tráfico orgánico en Canalplad' },
      { value: '62 → 98', label: 'en Lighthouse' },
    ],
    sectorsTitle: 'Para negocios de Córdoba como el tuyo',
    sectors: ['Peluquerías y barberías', 'Clínicas y estética', 'Restaurantes', 'Reformas y oficios', 'Tiendas', 'Academias'],
    includes: [
      { title: 'Diseño a medida', desc: 'Nada de plantillas genéricas: tu marca, tus fotos y tus textos. Perfecta en móvil.', icon: ICON.screen },
      { title: 'SEO local en Córdoba', desc: 'Títulos, datos estructurados y contenido para salir cuando buscan lo tuyo cerca.', icon: ICON.pin },
      { title: 'Ficha de Google Business', desc: 'Te ayudo a crearla u optimizarla para aparecer también en el mapa.', icon: ICON.chart },
      { title: 'WhatsApp y formulario', desc: 'Tus clientes te escriben con un toque, con el mensaje ya preparado.', icon: ICON.chat },
      { title: 'Carga rápida', desc: 'Optimizada para Core Web Vitals: Google la premia y tus clientes no esperan.', icon: ICON.bolt },
      { title: 'Todo a tu nombre', desc: 'Dominio y código son tuyos. Sin permanencias ni ataduras.', icon: ICON.lock },
    ],
    caseStudy: {
      image: canalplad,
      alt: 'Web de Canalplad, empresa de canalones y pladur de Córdoba',
      kicker: 'Caso real · Córdoba',
      title: 'Canalplad: +35% de tráfico orgánico',
      text: 'Web de canalones y pladur en Córdoba. Metadatos, velocidad y contenido pensado para búsquedas locales.',
      link: { href: '/blog/canalplad-seo-tecnico-nextjs/', label: 'Leer el caso completo' },
    },
    faqs: [
      { q: '¿Cuánto cuesta una página web para un negocio en Córdoba?', a: 'Desde 349 € (pago único), con diseño adaptado a móvil, SEO local y botón de WhatsApp. Antes de empezar tienes un presupuesto cerrado y por escrito.' },
      { q: '¿Tengo que pagar algo cada mes?', a: 'No es obligatorio. Si quieres que me encargue de cambios y actualizaciones, el mantenimiento opcional cuesta 19 €/mes. El dominio y el alojamiento se pagan aparte, según el proveedor que elijas.' },
      { q: '¿Haces webs para peluquerías, clínicas o restaurantes?', a: 'Sí. He hecho la web de Canalplad (Córdoba) y CitasWassap, un sistema de reservas por WhatsApp para barberías y peluquerías.' },
      { q: '¿Eres freelance o una agencia?', a: 'Desarrollador web freelance en Córdoba: hablas directamente conmigo, sin intermediarios.' },
      { q: '¿Cuánto se tarda?', a: 'Una web profesional suele estar lista en 2–3 semanas desde que aceptas el presupuesto.' },
    ],
  },

  'agente-ia-whatsapp': {
    metaTitle: 'Agente IA para WhatsApp Business desde 590 € | Javier Ruiz',
    metaDescription: 'Un agente de IA que atiende el WhatsApp de tu negocio: responde, agenda citas y te pasa la conversación cuando hace falta. Desde 590 € + 29 €/mes.',
    h1: 'Agente IA para WhatsApp que atiende a tus clientes por ti',
    lead: 'Responde al momento, agenda citas y toma pedidos a cualquier hora con la API oficial de WhatsApp Business. Cuando hace falta una persona, te pasa la conversación.',
    sectorsTitle: 'Pensado para negocios que viven del WhatsApp',
    sectors: ['Peluquerías y barberías', 'Clínicas y estética', 'Restaurantes', 'Academias', 'Talleres', 'Tiendas'],
    includes: [
      { title: 'API oficial de WhatsApp Business', desc: 'Nada de trucos con la app normal: la integración que permite Meta para empresas.', icon: ICON.chat },
      { title: 'IA entrenada con tu negocio', desc: 'Conoce tus servicios, precios y horarios, y responde con tu tono.', icon: ICON.doc },
      { title: 'Agenda de citas y recordatorios', desc: 'Propone huecos libres, confirma la cita y recuerda al cliente antes de venir.', icon: ICON.calendar },
      { title: 'Te pasa la conversación', desc: 'Una queja o un caso raro: te avisa y sigues tú desde el mismo chat.', icon: ICON.user },
      { title: 'Panel de conversaciones', desc: 'Ves todas las citas y mensajes en un panel, desde el móvil o el ordenador.', icon: ICON.chart },
      { title: 'Datos protegidos', desc: 'Base de datos propia con acceso restringido por negocio.', icon: ICON.lock },
    ],
    caseStudy: {
      image: citaswassap,
      alt: 'Panel de CitasWassap con las citas del día',
      kicker: 'Caso real',
      title: 'CitasWassap: reservas por WhatsApp',
      text: 'Para barberías y peluquerías: un agente con IA gestiona las citas y avisa al dueño cuando hace falta. Varios negocios en la misma plataforma.',
      link: { href: '/blog/cuanto-cuesta-agente-ia-whatsapp-business-2026/', label: 'Cuánto cuesta un agente así' },
    },
    priceNote: 'Meta cobra aparte algunos mensajes (en España, desde 0,0166 € por mensaje a octubre de 2026). Te lo detallo en el presupuesto.',
    faqs: [
      { q: '¿Cuánto cuesta un agente IA para WhatsApp?', a: 'Desde 590 € de puesta en marcha más 29 €/mes de mantenimiento. Los mensajes que cobra Meta van aparte y te los calculo en el presupuesto según tu volumen.' },
      { q: '¿Tengo que cambiar de número?', a: 'Depende de tu caso: se puede usar tu número actual o uno nuevo. Lo vemos en la primera llamada.' },
      { q: '¿Y si la IA no sabe qué responder?', a: 'No se lo inventa: te avisa y te pasa la conversación para que sigas tú.' },
      { q: '¿Cuánto se tarda en tenerlo funcionando?', a: 'Entre 2 y 4 semanas, según las integraciones que necesites (agenda, pagos, CRM…).' },
    ],
  },

  'chatbot-ia': {
    metaTitle: 'Chatbot IA para tu web con tus documentos | Javier Ruiz',
    metaDescription: 'Un chatbot para tu web que responde con la información real de tu empresa: catálogo, tarifas y preguntas frecuentes. Desde 449 €, listo en 2–3 semanas.',
    h1: 'Chatbot IA que responde con la información real de tu negocio',
    lead: 'Un asistente en tu web que contesta con tu catálogo, tus tarifas y tus condiciones, a cualquier hora, y te avisa cuando alguien está interesado.',
    sectorsTitle: 'Útil si te preguntan siempre lo mismo',
    sectors: ['Tiendas online', 'Clínicas', 'Academias', 'Inmobiliarias', 'Asesorías', 'Alojamientos'],
    includes: [
      { title: 'Entrenado con tus documentos', desc: 'Tus PDFs, tu web y tus preguntas frecuentes como única fuente.', icon: ICON.doc },
      { title: 'Respuestas con datos reales', desc: 'Responde a partir de tu información; si no la encuentra, lo dice.', icon: ICON.lock },
      { title: 'Aviso de clientes interesados', desc: 'Cuando alguien quiere presupuesto o reservar, te llega el contacto.', icon: ICON.bell },
      { title: 'Integrado en tu web', desc: 'Se añade como un botón de chat, sin rehacer la web que ya tienes.', icon: ICON.screen },
      { title: 'Con tu tono', desc: 'Formal o cercano: habla como hablaría tu negocio.', icon: ICON.chat },
      { title: 'Fácil de actualizar', desc: 'Cambias un precio en tus documentos y el chatbot lo sabe.', icon: ICON.bolt },
    ],
    caseStudy: {
      image: guionia,
      alt: 'Pantalla de GuionIA',
      kicker: 'Caso real',
      title: 'GuionIA: IA con contexto propio',
      text: 'Genera guiones de vídeo por escenas a partir de una idea, usando su propia base de conocimiento (RAG): la misma técnica que usa el chatbot.',
      link: { href: '/blog/rag-casero-guionia/', label: 'Cómo funciona por dentro' },
    },
    priceNote: 'El uso de IA se paga aparte según volumen; para un negocio pequeño suele ser poco cada mes. Te lo estimo en el presupuesto.',
    faqs: [
      { q: '¿Cuánto cuesta un chatbot IA para mi web?', a: 'Desde 449 € de puesta en marcha, más el uso de la IA según el volumen de conversaciones. El mantenimiento opcional cuesta 19 €/mes.' },
      { q: '¿Puede inventarse respuestas?', a: 'Está limitado a tu información y, si no encuentra la respuesta, lo dice en lugar de inventarla y te pasa el contacto.' },
      { q: '¿Funciona con la web que ya tengo?', a: 'Sí, se añade como un botón de chat en casi cualquier web, sin tener que rehacerla.' },
      { q: '¿Cuánto se tarda?', a: 'Entre 2 y 3 semanas, según cuántos documentos haya que preparar.' },
    ],
  },

  automatizaciones: {
    metaTitle: 'Automatización de tareas e integración de APIs | Javier Ruiz',
    metaDescription: 'Conecto tus herramientas para que las tareas repetitivas se hagan solas: CRM, hojas de cálculo, facturación y APIs. Desde 149 € por automatización.',
    h1: 'Automatizaciones e integraciones para que tu negocio ahorre horas',
    lead: 'Conecto las herramientas que ya usas para que los datos pasen de una a otra sin copiar y pegar: formularios, CRM, hojas de cálculo, facturación y APIs.',
    sectorsTitle: 'Para quien pierde horas en tareas repetitivas',
    sectors: ['Autónomos', 'Pymes', 'Tiendas online', 'Asesorías', 'Clínicas', 'Agencias'],
    includes: [
      { title: 'Análisis de tus procesos', desc: 'Vemos qué tareas se repiten y cuáles merece la pena automatizar.', icon: ICON.chart },
      { title: 'Conexión entre herramientas', desc: 'Formularios, CRM, hojas de cálculo y facturación hablando entre sí.', icon: ICON.link },
      { title: 'Avisos e informes', desc: 'Te llega lo importante por email o WhatsApp, sin tener que buscarlo.', icon: ICON.bell },
      { title: 'Integración de APIs', desc: 'Pagos, reservas, mapas o datos externos conectados a tu web.', icon: ICON.layers },
      { title: 'Documentación', desc: 'Tu equipo sabe qué hace cada automatización y cómo pararla.', icon: ICON.doc },
      { title: '30 días de soporte', desc: 'Si algo falla tras la entrega, lo arreglo sin coste.', icon: ICON.lock },
    ],
    caseStudy: {
      image: apivuelos,
      alt: 'Mapa de vuelos en tiempo real de API Vuelos',
      kicker: 'Caso real',
      title: 'API Vuelos: datos externos en tiempo real',
      text: 'Seguimiento de vuelos con mapa interactivo y estadísticas, combinando varias APIs externas con caché y límites de uso.',
      link: { href: '/blog/integrar-api-en-tu-web-guia/', label: 'Guía: integrar una API en tu web' },
    },
    faqs: [
      { q: '¿Cuánto cuesta automatizar una tarea?', a: 'Desde 149 € por automatización. Si son varias, te hago un presupuesto conjunto. El mantenimiento opcional cuesta 15 €/mes.' },
      { q: '¿Tengo que cambiar de herramientas?', a: 'Normalmente no: conecto las que ya usas, siempre que permitan integrarse (API, webhooks o exportaciones).' },
      { q: '¿Qué se puede automatizar?', a: 'Pasar contactos de la web al CRM, generar facturas, enviar recordatorios, crear informes o avisarte de pedidos, entre otras cosas.' },
      { q: '¿Cuánto se tarda?', a: 'Entre 1 y 2 semanas por automatización.' },
    ],
  },

  'apps-a-medida': {
    metaTitle: 'Desarrollo de apps a medida y SaaS desde 1.490 € | Javier Ruiz',
    metaDescription: 'Apps web y SaaS de principio a fin: usuarios, pagos y panel de administración, con entregas cada semana. Desde 1.490 €, primera versión en 4–8 semanas.',
    h1: 'Apps a medida: de tu idea a una aplicación que usa gente real',
    lead: 'Desarrollo apps web y SaaS completas: usuarios, pagos y panel de administración. Empezamos por una primera versión útil y la mejoramos con uso real.',
    sectorsTitle: 'Para proyectos que no caben en una plantilla',
    sectors: ['Startups', 'Negocios con procesos propios', 'Profesionales', 'Academias', 'Asociaciones', 'Herramientas internas'],
    includes: [
      { title: 'Usuarios y roles', desc: 'Registro, inicio de sesión y permisos por tipo de usuario.', icon: ICON.user },
      { title: 'Pagos y suscripciones', desc: 'Cobros únicos o recurrentes integrados con Stripe.', icon: ICON.card },
      { title: 'Panel de administración', desc: 'Para gestionar clientes, datos y contenido sin tocar código.', icon: ICON.chart },
      { title: 'Base de datos segura', desc: 'Supabase con reglas de acceso por usuario (RLS).', icon: ICON.lock },
      { title: 'Entregas cada semana', desc: 'Ves la app avanzar y decides prioridades conmigo.', icon: ICON.calendar },
      { title: 'Código a tu nombre', desc: 'El repositorio es tuyo desde el primer día.', icon: ICON.layers },
    ],
    caseStudy: {
      image: prezu,
      alt: 'Pantalla de Prezu',
      kicker: 'Caso real',
      title: 'Prezu: presupuestos en segundos',
      text: 'Presupuestos y facturas introduciendo los datos por texto, audio o formulario. Piloto activo con un negocio real.',
      link: { href: '/blog/saas-fin-de-semana-nextjs-supabase-stripe-claude/', label: 'Cómo planteo un SaaS' },
    },
    faqs: [
      { q: '¿Cuánto cuesta desarrollar una app a medida?', a: 'Desde 1.490 € para una primera versión. El precio final depende de las funciones y va cerrado por escrito. El mantenimiento opcional cuesta 49 €/mes.' },
      { q: '¿Con qué tecnologías trabajas?', a: 'Next.js, Supabase y Stripe, entre otras: las mismas que uso en mis productos en producción.' },
      { q: '¿El código es mío?', a: 'Sí, el repositorio y los datos son tuyos.' },
      { q: '¿Cuánto se tarda?', a: 'Una primera versión suele llevar entre 4 y 8 semanas.' },
    ],
  },
};
