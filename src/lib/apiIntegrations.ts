// Opciones del selector de /servicios/integracion-apis/. Lo usan el HTML que
// se genera al compilar (lo que ve Google y quien no tiene JavaScript) y el
// script de la página al elegir: así los dos dicen siempre lo mismo.
// Los precios son los de la guía de integración de APIs y de services.ts.

export interface Integration {
  id: string;
  label: string;
  title: string;
  text: string;
  /** Nota cuando ya tiene web (null: ninguna). */
  note: string | null;
  /** Herramienta interna: no depende de si ya tiene web. */
  standalone?: boolean;
}

export const INTEGRATIONS: Integration[] = [
  { id: 'formularios', label: 'Formularios y CRM', title: 'Cada contacto, directo a tu CRM', text: 'Lo que alguien rellena en tu web entra solo en tu CRM, tu correo o una hoja de cálculo, con todos sus datos.', note: 'Funciona con la mayoría de CRM y con Google Sheets.' },
  { id: 'pagos', label: 'Pagos', title: 'Cobra en tu web y que se apunte solo', text: 'Pago con tarjeta en tu web y cada cobro anotado en tu hoja de cálculo o tu facturación.', note: 'Stripe cobra aparte: 1,5 % + 0,25 € por pago con tarjeta europea estándar (octubre de 2026).' },
  { id: 'reservas', label: 'Reservas y citas', title: 'Reservas con tu agenda real', text: 'Tus clientes ven los huecos libres de tu calendario y reservan solos, con confirmación.', note: 'Depende de cómo esté hecha tu web: si no lo permite, te lo digo y vemos la opción de web nueva.' },
  { id: 'whatsapp', label: 'Avisos por WhatsApp', title: 'Avisos por WhatsApp, por la API oficial', text: 'Confirmaciones, recordatorios y avisos automáticos por WhatsApp Business, sin apps no oficiales.', note: 'Si además quieres que responda solo, mira el agente IA para WhatsApp: desde 590 € + 29 €/mes.' },
  { id: 'facturacion', label: 'Pedidos y facturación', title: 'Pedidos que pasan solos a facturación', text: 'Las ventas de tu web llegan a tu programa de facturación o a una hoja de cálculo sin teclear nada.', note: 'Lo vemos según el programa que ya uses.' },
  { id: 'varias', label: 'Varias APIs y un panel', title: 'Una herramienta interna a medida', text: 'Un panel para tu equipo que junta datos de varios servicios, con usuarios y permisos.', note: 'Es una app a medida, con entregas cada semana.', standalone: true },
];

export const DEFAULT_INTEGRATION = 'formularios';

export interface Quote {
  price: string;
  time: string;
  note: string;
  whatsapp: string;
}

export function quote(id: string, hasWeb: boolean, phone: string): Quote {
  const item = INTEGRATIONS.find((i) => i.id === id) ?? INTEGRATIONS[0];
  const needsWeb = !item.standalone && !hasWeb;
  const price = item.standalone ? 'desde 1.490 €' : needsWeb ? 'desde 349 €' : 'desde 149 €';
  const time = item.standalone ? '4–8 semanas' : needsWeb ? '2–3 semanas' : '1–2 semanas';
  const note = needsWeb
    ? 'Incluye la web profesional; la integración puede sumar según lo compleja que sea.'
    : item.note ?? '';
  const context = item.standalone ? '' : needsWeb ? ', y necesito web nueva' : ', para conectarlo a mi web';
  const message = `Hola Javier, vengo de tu web. Me interesa la integración de APIs: «${item.label}»${context}.`;
  return { price, time, note, whatsapp: `https://wa.me/${phone}?text=${encodeURIComponent(message)}` };
}
