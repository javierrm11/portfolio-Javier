// Datos del perfil que comparten la home (Proyectos.astro, About.astro) y el
// chatbot (src/lib/chatKnowledge.ts): un solo sitio para que el bot no
// cuente algo distinto de lo que enseña la web.
import canalplad from '../assets/proyectos/canalplad.png';
import guionia from '../assets/proyectos/guionia.png';
import citaswassap from '../assets/proyectos/citaswassap.png';
import prezu from '../assets/proyectos/prezu.es.png';
import apivuelos from '../assets/proyectos/apivuelos.png';

export const projects = [
    {
        key: 'canalplad',
        title: 'Canalplad',
        badge: 'SEO',
        dot: '#F7C948',
        img: canalplad,
        imgTop: true,
        desc: 'Web de canalones y pladur en Córdoba: +35% de tráfico orgánico gracias al SEO técnico.',
        skills: ['Next.js', 'SEO técnico', 'TypeScript'],
        href: 'https://canalonescanalplad.es',
    },
    {
        key: 'guionia',
        title: 'GuionIA',
        badge: 'SaaS · Guionia.es',
        dot: '#C084FC',
        img: guionia,
        imgTop: true,
        desc: 'Convierte ideas en guiones divididos en escenas, con banco de hooks reutilizables y seguimiento de vídeos ya publicados vía TikTok for Developers.',
        skills: ['Next.js', 'Supabase', 'TikTok API'],
        href: 'https://guionia.es',
    },
    {
        key: 'citaswassap',
        title: 'CitasWassap',
        badge: 'SaaS',
        dot: '#34D399',
        img: citaswassap,
        imgTop: true,
        desc: 'Reservas por WhatsApp para barberías y peluquerías: un agente con IA gestiona citas y escala al dueño cuando hace falta. Multi-tenant desde el diseño.',
        skills: ['Next.js', 'WhatsApp API', 'IA'],
        href: 'https://panel-admin-peluqueria.vercel.app',
    },
    {
        key: 'prezu',
        title: 'Prezu',
        badge: 'SaaS · Prezu.es',
        dot: '#4fc3ff',
        img: prezu,
        imgTop: true,
        desc: 'Presupuestos y facturas en segundos, introduciendo los datos por texto, audio o formulario. Piloto activo con un negocio real; en desarrollo continuo.',
        skills: ['Next.js', 'Voz/Audio', 'VeriFactu'],
        href: 'https://prezu.es',
    },
    {
        key: 'apivuelos',
        title: 'API Vuelos',
        badge: 'Tiempo real · Apivuelos.es',
        dot: '#FF9A3D',
        img: apivuelos,
        imgTop: false,
        desc: 'Seguimiento de vuelos en tiempo real con mapa interactivo, estadísticas y APIs externas.',
        skills: ['Next.js', 'APIs externas', 'Chart.js'],
        href: 'https://apivuelos.es/Mapa',
    },
];


export const timeline = [
    { title: 'DAW', desc: 'Formación de base en desarrollo de aplicaciones web.' },
    { title: 'Signlab', desc: 'Experiencia construyendo producto de extremo a extremo.' },
    { title: 'Especialización en IA y Big Data', desc: 'El giro: de construir productos a construir con IA.' },
    { title: 'Weai', desc: 'Aplicando lo aprendido en proyectos full-stack reales.' },
    { title: 'Ingeniería Informática', desc: 'Estudios en curso, compaginados con los proyectos.' },
];
