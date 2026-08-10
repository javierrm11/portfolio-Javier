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

if (!reduceMotion && layers.some((l) => l.el)) {
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
