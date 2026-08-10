// Cursor de circuito: sustituye el cursor nativo (solo en dispositivos con
// ratón real de verdad — ver el media query, en táctil no se toca nada) por
// un punto azul con una estela de partículas que se desvanece al moverse.
// Al pasar sobre un elemento interactivo, dibuja una línea recta hasta él
// con un nodo en el punto de conexión, como si el cursor "completara un
// circuito" con ese elemento.

const MEDIA = window.matchMedia("(hover: hover) and (pointer: fine)");

if (MEDIA.matches) {
  const canvas = document.createElement("canvas");
  canvas.id = "circuit-cursor";
  canvas.style.cssText = "position:fixed;inset:0;z-index:9997;pointer-events:none;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  type Point = { x: number; y: number; t: number };
  const trail: Point[] = [];
  const MAX_TRAIL = 18;
  const TRAIL_LIFE_MS = 380;

  const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, [role='button']";

  let mouseX = -200;
  let mouseY = -200;
  let visible = false;
  let hoverTarget: Element | null = null;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    visible = true;
    trail.push({ x: mouseX, y: mouseY, t: performance.now() });
    if (trail.length > MAX_TRAIL) trail.shift();

    const el = document.elementFromPoint(mouseX, mouseY);
    hoverTarget = el ? el.closest(INTERACTIVE_SELECTOR) : null;
  });

  document.addEventListener("mouseleave", () => {
    visible = false;
    hoverTarget = null;
  });

  function closestPointOnRect(px: number, py: number, rect: DOMRect) {
    return {
      x: Math.max(rect.left, Math.min(px, rect.right)),
      y: Math.max(rect.top, Math.min(py, rect.bottom)),
    };
  }

  function draw(now: number) {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (!visible) return;

    // Estela: partículas desvaneciéndose (más pequeñas y transparentes
    // cuanto más viejas).
    while (trail.length && now - trail[0].t > TRAIL_LIFE_MS) trail.shift();
    for (const p of trail) {
      const life = 1 - (now - p.t) / TRAIL_LIFE_MS;
      if (life <= 0) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5 * life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(79, 195, 255, ${life * 0.5})`;
      ctx.fill();
    }

    // "Circuito completado": línea punteada animada del cursor al elemento
    // interactivo más cercano bajo el ratón, con un nodo en el destino.
    if (hoverTarget) {
      const rect = hoverTarget.getBoundingClientRect();
      const target = closestPointOnRect(mouseX, mouseY, rect);

      ctx.save();
      ctx.strokeStyle = "rgba(79, 195, 255, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -(now / 20) % 16;
      ctx.beginPath();
      ctx.moveTo(mouseX, mouseY);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#4fc3ff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(target.x, target.y, 6.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(79, 195, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Cursor principal: halo + punto central, un poco más grande cuando
    // hay un elemento interactivo enganchado.
    const haloR = hoverTarget ? 14 : 9;
    const glow = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, haloR);
    glow.addColorStop(0, "rgba(79, 195, 255, 0.9)");
    glow.addColorStop(1, "rgba(79, 195, 255, 0)");
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, haloR, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mouseX, mouseY, hoverTarget ? 4.5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#eafcff";
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
