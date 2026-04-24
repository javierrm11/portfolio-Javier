# Plan: Rediseño completo del portfolio — Cyberpunk → Premium Dark Minimal

## Context
El portfolio actual tiene un estilo cyberpunk (neon, partículas, cursor holográfico, efectos matriz) con colores púrpura/cian y tipografía Orbitron. El objetivo es reemplazarlo con un diseño "Premium Dark Minimal" inspirado en Apple/Linear/Vercel — oscuro, limpio y elegante — apropiado para un desarrollador web especializado en IA. El contenido también se actualiza para reflejar el CV actual (se añade experiencia en Weai, proyectos freelance reales, formación en IA, certificación Python).

**Decisiones tomadas:**
- Dark-only (sin toggle claro/oscuro)
- Proyectos: canalplad.es + apivuelos.es + plataforma ocio nocturno

---

## Nuevo Design System

| Token | Valor |
|---|---|
| `--bg-primary` | `#050505` |
| `--bg-surface` | `rgba(255,255,255,0.04)` |
| `--bg-surface-hover` | `rgba(255,255,255,0.07)` |
| `--border-subtle` | `rgba(255,255,255,0.08)` |
| `--accent-from` | `#6366F1` (indigo) |
| `--accent-to` | `#0EA5E9` (sky blue) |
| `--accent-ai` | `#10B981` (emerald) |
| `--text-primary` | `#F9FAFB` |
| `--text-secondary` | `#6B7280` |
| Font | `Plus Jakarta Sans` (400/500/600/700/800) |
| Cards | glassmorphism: `backdrop-filter: blur(24px)` + `rgba(255,255,255,0.04)` bg |
| Radios | 8px / 16px / 24px / 9999px |
| Background | 3 aurora orbs animados (opacity 0.07) — sin estrellas, sin nebulosas |
| Animaciones | GSAP fade+slideUp en scroll — sin 3D, sin partículas, sin cursor |

---

## Archivos a modificar (orden de ejecución)

### 1. `src/styles/global.css` — REESCRITURA COMPLETA
- Reemplazar todas las variables CSS con el nuevo design system
- Quitar: fuentes Orbitron/Exo2, starfield, nebulas, connection lines, grid overlay, light pulses, clase `.claro`
- Añadir: aurora orbs `.aurora-bg`, noise overlay, utilidades `.glass-card`, `.text-gradient`, `.section-eyebrow`, `.container`, `.reveal`
- Fuente: `Plus Jakarta Sans` vía Google Fonts

### 2. `src/pages/index.astro` — EDICIONES DIRIGIDAS
- Reemplazar Google Fonts link (Orbitron/Exo2 → Plus Jakarta Sans)
- Actualizar meta description para reflejar especialización en IA
- **Eliminar** el inline script de tema (cookie, getThemeFromCookie, setTheme) — ya no hay modo claro
- **Eliminar** el inline script del DOMContentLoaded de theme-toggle
- **Reemplazar** todo el bloque DOM del fondo (stars, nebula, connection-lines, grid, pulses, canvas) por:
  ```html
  <div class="aurora-bg">
    <div class="aurora-orb aurora-orb-1"></div>
    <div class="aurora-orb aurora-orb-2"></div>
    <div class="aurora-orb aurora-orb-3"></div>
  </div>
  <div class="noise-overlay"></div>
  ```
- **Eliminar** el bloque de script final con `createStars`, `createConnectionLines`, `initParticles`
- Los scripts de menú ya existen en `menu.js` — quitar el duplicado inline

### 3. `src/styles/header.css` — REESCRITURA COMPLETA
- Header transparente → con `backdrop-filter` solo cuando se hace scroll (clase `.scrolled` via GSAP ScrollTrigger)
- Nav links: `color: var(--text-secondary)` con underline gradient animado en hover
- Mobile: overlay fullscreen con fondo `rgba(5,5,5,0.97)`
- Eliminar: `.logo-glow`, `.nav-decoration`, `.theme-icon`, variables `.claro`

### 4. `src/components/Header.astro` — CAMBIOS MENORES
- Envolver en `<div class="header-inner">` para centrado con max-width
- Eliminar botón `#theme-toggle`
- Eliminar `.logo-glow` y `.nav-decoration`
- Añadir `<script>import '../scripts/menu.js'</script>`

### 5. `src/styles/main.css` — REESCRITURA COMPLETA
- Quitar `position: fixed` del botón CV (pasa a ser inline)
- Añadir: `.hero-badge` (pastilla verde "Disponible"), `.hero-metrics` (3 stats), `.scroll-indicator`
- Tipografía hero: `clamp(3rem, 8vw, 6rem)`, `font-weight: 800`, `letter-spacing: -0.04em`
- Eliminar: `.floating-bg`, variables `.claro`

### 6. `src/components/Main.astro` — REESCRITURA HTML + SCRIPT
**HTML del article `#about`:**
- Añadir `.hero-badge` con dot pulsante y texto "Disponible para nuevas oportunidades"
- Actualizar `h2`: "Desarrollador Web\n**Full Stack**" (span.accent con gradient)
- Añadir párrafo de descripción con mención a IA
- Añadir `.hero-metrics` con 3 métricas: 80% reducción IA, +35% tráfico, 3+ proyectos en producción
- Mover `#curriculum` a inline (no fixed)
- Añadir `.scroll-indicator`

**Script block:** Reemplazar los ~1500 líneas de GSAP cyberpunk con ~200 líneas de animaciones limpias:
- Timeline hero entrance (fade+slideUp en elementos, sin 3D)
- `revealSection()` utility para secciones con ScrollTrigger
- Timeline line `scaleY` animado en Experiencia
- Per-card `.job`, `.project-card`, `.skill-category` fade-in en scroll
- Subtle parallax en project cards (±20px, max 5%)
- `ScrollTrigger` para clase `.scrolled` en header
- Pause on `visibilitychange`

### 7. `src/styles/about.css` — REESCRITURA COMPLETA
- Grid 1col → 2col en 900px+ (texto izquierda, imagen derecha)
- `.tech-pill` con `border-radius: 9999px`, background glass
- Imagen: `border-radius: var(--radius-lg)`, box-shadow sutil, hover lift
- Eliminar: `.image-glow`, `.floating-elements`, `.title-decoration`, variables `.claro`

### 8. `src/components/About.astro` — CAMBIOS DE CONTENIDO
- Añadir `<span class="section-eyebrow">Sobre mí</span>` antes del h2
- Actualizar `.intro-text`: mencionar IA, React/Next.js/Supabase, Córdoba
- Añadir pill "Integración IA" y "Metodologías Ágiles" en tech-stack
- Eliminar `.image-glow`, `.floating-elements`

### 9. `src/styles/experiencia.css` — REESCRITURA COMPLETA
- Timeline vertical izquierda (no centrado) con línea gradient
- `.job-indicator` dot de 11px con glow sutil
- `.job-card` glassmorphism, hover lift + border indigo
- `.date-badge` pastilla con fondo rgba(99,102,241,0.08)
- `.job-achievements` bullet list con dot indigo
- Eliminar: `.reverse`, `.logo-container`, `.logo-glow`, `.indicator-pulse`, variables `.claro`

### 10. `src/components/Experiencia.astro` — REESCRITURA DE CONTENIDO
**Añadir experiencia Weai** (primera, más reciente):
- Desarrollador Web Full Stack — Ene 2026 – Feb 2026
- React/Next.js SSR, Supabase, API REST IA (80% reducción), Scrum

**Mantener Signlab** (actualizar bullets):
- Vue.js + SASS, SEO técnico, CI/CD, Git

**Actualizar Freelance** (actualizar bullets):
- canalplad.es (Next.js, +35% tráfico), apivuelos.es, plataforma ocio (en curso)

**Añadir sección Educación** al final del componente (sin nuevo archivo):
- Curso IA y Big Data — IES Gran Capitán (Actualmente)
- Técnico DAW — IES Gran Capitán (Jun 2025)
- Técnico MR — IES Medina Azahara (Jun 2023)
- Certificación Python Udemy 59h (Mar 2026)

### 11. `src/styles/proyectos.css` — REESCRITURA COMPLETA
- Grid cards glassmorphism, 1→2→3 columnas
- Project image: 220px, hover scale(1.04) + brightness up
- Project links en overlay, visibles en hover (opacity 0→1)
- `.project-badge` pastilla con categoría (SEO / Real-time / En curso)
- Eliminar: `.project-glow`, variables `.claro`

### 12. `src/components/Proyectos.astro` — REESCRITURA DE CONTENIDO
**Proyectos (en orden):**
1. **canalplad.es** — Badge: SEO | Imagen: `/canalplad.webp` | Tags: Next.js, SEO técnico, Vercel | Link: canalplad.es
2. **apivuelos.es** — Badge: Real-time | Imagen: `/apivuelos.png` | Tags: Next.js, APIs externas, Leaflet, Chart.js | Link: apivuelos.es
3. **Plataforma Ocio Nocturno** — Badge: En curso | Imagen: placeholder o fondo gradient | Tags: Next.js, Node.js, PostgreSQL, Geolocalización

### 13. `src/styles/skills.css` — REESCRITURA COMPLETA
- Grid 1→2→3 columnas
- `.skill-category` glassmorphism con `.category-icon` 40px
- Nueva categoría `category-ai` con emerald accent
- `.skill-tag` pastilla glass sutil, hover leve
- Eliminar: shimmer `::before`, `nth-child` color overrides, variables `.claro`

### 14. `src/components/Skills.astro` — ACTUALIZACIÓN DE CONTENIDO
- Frontend: añadir `Next.js`
- Backend: añadir `Python`, `Supabase`, `Prisma`; quitar `Java`
- **Nueva categoría "IA & Automatización"**: Python, API REST IA, Supabase AI, Integración LLMs, Automatización flujos, Prompt Engineering
- Metodologías: Agile, Scrum, TDD, Code Review (sin cambios)

### 15. `src/styles/contacto.css` — REESCRITURA COMPLETA
- Grid 1col → 2col (info + form) en 900px+
- `.contact-card` glassmorphism, hover lift
- `.form-input` con foco border indigo + ring sutil
- `.submit-btn` gradient indigo→sky, hover lift + shadow
- `.success-message` con fondo emerald sutil
- Eliminar: `.floating-contact`, variables `.claro`

### 16. `src/styles/footer.css` — REESCRITURA COMPLETA
- Grid 1col → 4col en 1024px+ (logo, nav, servicios, contacto)
- `border-top: 1px solid var(--border-subtle)`
- Links: hover solo color (sin x-shift)
- Eliminar: `.footer-floating`, `.logo-glow`, gradient de fondo, variables `.claro`

### 17. `src/components/Footer.astro` — CAMBIOS MENORES
- Eliminar `.footer-floating` divs y `.logo-glow`
- Corregir links sociales (GitHub: javierrm11, LinkedIn: javierrm11)
- Actualizar copyright a 2025 – 2026

---

## Contenido nuevo a añadir (resumen)

| Sección | Añadir |
|---|---|
| Hero | Badge "Disponible", métricas 80%/+35%/3+, botón CV inline |
| Experiencia | Weai (Ene–Feb 2026), sección Educación + Certificación Python |
| Proyectos | canalplad.es, apivuelos.es, ocio nocturno (quitar MVC/MoleroFit) |
| Skills | Next.js, Python, Supabase, Prisma, categoría IA |
| About | Mención IA, pills "Integración IA" y "Metodologías Ágiles" |

---

## Lo que se elimina (limpieza)

- Toda la lógica de tema claro/oscuro (JS + `.claro` CSS en 7 archivos)
- DOM background: `.stars`, `.star`, `.nebula`, `.connection-lines`, `.grid-overlay`, `.light-pulse`, `<canvas id="particles-canvas">`
- ~1500 líneas GSAP: ParticleSystem, HolographicCursor, matrix rain, scan lines, digital grid, glitch text, Konami code, 3D rotations
- Fuentes: Orbitron, Exo 2
- Proyectos: MVC Portfolio (reemplazado por canalplad.es), MoleroFit movido fuera

---

## Verificación

1. `pnpm dev` → abrir `localhost:4321`
2. Comprobar hero: badge visible, métricas, botón CV inline (no fijo)
3. Scroll: fade-in secciones suave sin saltos 3D
4. Experiencia: 3 jobs en orden correcto (Weai primero), educación al final
5. Proyectos: canalplad.es / apivuelos.es / ocio nocturno
6. Skills: categoría IA visible
7. Menú móvil: overlay fullscreen funciona
8. No hay botón de tema en header
9. Aurora orbs visibles como fondo sutil (no overpower el contenido)
10. `pnpm build` sin errores
