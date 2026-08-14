// Paralaje de las 3 capas de trazas de circuito (ver .circuit-layer en
// global.css): cada una se desplaza verticalmente a una velocidad distinta
// según el scroll — la más lejana (capa 1, patrón más grande/tenue) más
// despacio, la más cercana (capa 3, patrón más pequeño/marcado) más
// rápido. rAF + lectura directa de scrollY, sin listener de scroll (evita
// disparar el cálculo más veces de las necesarias).

const layers = [
  { el: document.querySelector<HTMLElement>(".circuit-layer-1"), speed: 0.03 },
  { el: document.querySelector<HTMLElement>(".circuit-layer-2"), speed: 0.07 },
  { el: document.querySelector<HTMLElement>(".circuit-layer-3"), speed: 0.12 },
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// En táctil no se ejecuta: este bucle escribe un transform en las 3 capas en
// CADA frame mientras se hace scroll, que es justo el momento en el que un
// móvil menos margen tiene. Las capas siguen ahí y se ven igual, solo que
// quietas (mismo criterio que los demás efectos decorativos, ver la nota de
// "Táctil: los efectos decorativos se quedan quietos" en global.css).
const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

if (!reduceMotion && !isTouch && layers.some((l) => l.el)) {
  function tick() {
    requestAnimationFrame(tick);
    const y = window.scrollY;
    for (const layer of layers) {
      if (!layer.el) continue;
      layer.el.style.transform = `translateY(${y * layer.speed}px)`;
    }
  }
  requestAnimationFrame(tick);
}
