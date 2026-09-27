// Metadatos visuales de cada categoría del blog: color de acento e icono de
// la portada (las portadas son ilustraciones CSS, no fotos — no hay capturas
// reales de artículo todavía). Un solo sitio para no repetir esto en el
// listado y en la página de post.
export const CATEGORIES = {
  'seo-tecnico': {
    label: 'SEO técnico',
    color: '#3b9eff',
    icon: '<path d="M8 4L3 12l5 8M16 4l5 8-5 8M13 3l-2 18"/>',
  },
  ia: {
    label: 'IA',
    color: '#10B981',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
  },
  nextjs: {
    label: 'Next.js',
    color: '#0066CC',
    icon: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 10h16M10 10v10"/>',
  },
  supabase: {
    label: 'Supabase',
    color: '#8B5CF6',
    icon: '<path d="M4 17l6-6 4 4 6-8"/><circle cx="20" cy="7" r="2"/>',
  },
  apis: {
    label: 'APIs',
    color: '#F5A623',
    icon: '<path d="M12 3v12M6 9l6-6 6 6"/><path d="M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3"/>',
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
