// Servicios, precios de lanzamiento y preguntas frecuentes. Un solo sitio
// para que la sección Servicios, sus FAQ y el JSON-LD de index.astro
// (ProfessionalService + FAQPage) no se descuadren al cambiar un precio.
export const PHONE = '34611434736';
export const EMAIL = 'javiermdevweb@gmail.com';

export const waHref = (msg: string) =>
  `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;

const waTopic = (topic: string) => waHref(`Hola Javier, vengo de tu web y me interesa ${topic}`);

export interface Plan {
  /** Ruta de su página: /servicios/<slug> (ver src/lib/servicePages.ts). */
  slug: string;
  title: string;
  label: string;
  featured?: boolean;
  /** Precio "desde" en euros, sin formato (para el JSON-LD). */
  priceFrom: number;
  billing: string;
  time: string;
  /** Descripción corta para Google (Offer.description). */
  description: string;
  includes: string[];
  href: string;
  /** Mantenimiento mensual opcional (el agente de WhatsApp ya lo lleva en billing). */
  maintenance?: { price: number; includes: string };
}

export const plans: Plan[] = [
  {
    slug: 'agente-ia-whatsapp',
    title: 'Agente IA para WhatsApp',
    label: 'Recomendado',
    featured: true,
    priceFrom: 590,
    billing: '+ 29 €/mes de mantenimiento',
    time: '2–4 semanas',
    description: 'Agente de inteligencia artificial que atiende el WhatsApp de tu negocio: responde, agenda citas y toma pedidos.',
    includes: ['API oficial de WhatsApp Business', 'IA entrenada con tu negocio', 'Agenda de citas y recordatorios', 'Panel de conversaciones'],
    href: waTopic('un agente IA para WhatsApp.'),
  },
  {
    slug: 'diseno-web-cordoba',
    title: 'Web profesional',
    label: 'Web + SEO',
    priceFrom: 349,
    billing: 'pago único',
    time: '2–3 semanas',
    description: 'Diseño de páginas web a medida para negocios de Córdoba, rápidas y con SEO local incluido.',
    includes: ['Diseño a medida y móvil', 'SEO técnico y local', 'Ficha de Google Business', 'Botón de WhatsApp'],
    href: waTopic('una página web para mi negocio.'),
    maintenance: { price: 19, includes: 'Cambios de textos e imágenes, actualizaciones y revisión mensual de velocidad y SEO.' },
  },
  {
    slug: 'chatbot-ia',
    title: 'Chatbot IA con tus documentos',
    label: 'IA',
    priceFrom: 449,
    billing: '+ uso de IA según volumen',
    time: '2–3 semanas',
    description: 'Chatbot para tu web que responde con la información real de tu empresa: catálogo, tarifas y preguntas frecuentes.',
    includes: ['Entrenado con tus PDFs y web', 'Solo responde con datos reales', 'Aviso de clientes interesados', 'Integrado en tu web'],
    href: waTopic('un chatbot IA para mi web.'),
    maintenance: { price: 19, includes: 'Actualizo sus documentos cuando cambian tus precios o servicios y reviso sus respuestas.' },
  },
  {
    slug: 'automatizaciones',
    title: 'Automatizaciones',
    label: 'Ahorro de tiempo',
    priceFrom: 149,
    billing: 'por automatización',
    time: '1–2 semanas',
    description: 'Automatización de tareas repetitivas e integración de APIs entre las herramientas de tu negocio.',
    includes: ['Análisis de tus procesos', 'Conexión de herramientas', 'Avisos e informes automáticos', 'Documentación para tu equipo'],
    href: waTopic('automatizar tareas de mi negocio.'),
    maintenance: { price: 15, includes: 'Revisión de que todo sigue funcionando y ajustes si alguna herramienta cambia.' },
  },
  {
    slug: 'apps-a-medida',
    title: 'Apps a medida',
    label: 'Startups',
    priceFrom: 1490,
    billing: 'por proyecto',
    time: '4–8 semanas',
    description: 'Desarrollo de aplicaciones web y SaaS a medida: usuarios, pagos y panel de administración.',
    includes: ['Login y roles de usuario', 'Pagos y suscripciones', 'Panel de administración', 'Entregas cada semana'],
    href: waTopic('crear una app.'),
    maintenance: { price: 49, includes: 'Correcciones, actualizaciones de seguridad y pequeñas mejoras cada mes.' },
  },
];

export const formatPrice = (n: number) => `${n.toLocaleString('es-ES', { useGrouping: 'always' })} €`;

export const promises = [
  'Llamada inicial sin compromiso',
  'Presupuesto cerrado antes de empezar',
  'Código y dominio a tu nombre',
  '30 días de soporte tras la entrega',
];

// Preguntas con las búsquedas reales de clientes locales ("página web para
// peluquería en Córdoba", "desarrollador web freelance Córdoba"…). Se
// muestran en Servicios y van también como FAQPage en el JSON-LD.
export const faqs = [
  {
    q: '¿Cuánto cuesta una página web para un negocio en Córdoba?',
    a: 'Una web profesional a medida empieza en 349 € (pago único) con diseño adaptado a móvil, SEO local y botón de WhatsApp. Antes de empezar te doy un presupuesto cerrado y por escrito.',
  },
  {
    q: '¿Haces páginas web para peluquerías, clínicas, restaurantes o reformas?',
    a: 'Sí. He hecho la web de Canalplad, una empresa de canalones y pladur de Córdoba que ganó un 35 % de tráfico orgánico, y CitasWassap, un sistema de reservas por WhatsApp para barberías y peluquerías.',
  },
  {
    q: '¿Eres desarrollador web freelance o una agencia?',
    a: 'Soy desarrollador web freelance en Córdoba (España): hablas directamente conmigo desde la primera llamada hasta la entrega, sin intermediarios.',
  },
  {
    q: '¿Cuánto se tarda en tener la web lista?',
    a: 'Una web profesional suele estar lista en 2–3 semanas, y un agente IA para WhatsApp en 2–4 semanas, según las integraciones que necesites.',
  },
  {
    q: '¿Trabajas solo en Córdoba?',
    a: 'No. Trabajo con negocios de Córdoba y, en remoto, con negocios de toda España.',
  },
];
