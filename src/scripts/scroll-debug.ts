// Panel de diagnóstico del scroll. NO se carga nunca en una visita normal:
// solo si la URL lleva ?debug (ver index.astro), y en ese caso llega como un
// chunk aparte. Sirve para cazar el fallo de "la página se va sola a otra
// sección" en el móvil real, que no se reproduce en el emulador.
//
// Qué vigila, frame a frame:
//   - scrollY, y cualquier salto grande de golpe (lo que se ve como que la
//     página se va sola);
//   - innerHeight y visualViewport.height (barra de direcciones);
//   - el alto del documento (si encoge cerca del final, el navegador tiene
//     que recortar la posición y eso empuja hacia arriba);
//   - si el dedo está en la pantalla en ese momento: un salto SIN dedo y sin
//     inercia reciente es un desplazamiento provocado por la página, no por
//     el usuario. Eso es exactamente lo que hay que distinguir.

const JUMP_PX = 90; // salto en un solo frame que ya se considera sospechoso
const MAX_LINES = 9;

const box = document.createElement("div");
box.setAttribute("aria-hidden", "true");
box.style.cssText = [
  "position:fixed", "top:0", "left:0", "z-index:99999",
  "max-width:min(94vw,430px)", "box-sizing:border-box",
  "padding:6px 8px", "margin:6px",
  "background:rgba(0,0,0,.82)", "color:#7CFFB2",
  "font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace",
  "border:1px solid rgba(124,255,178,.35)", "border-radius:6px",
  "white-space:pre", "pointer-events:none",
  "text-shadow:0 1px 2px #000",
].join(";");
document.body.appendChild(box);

const log: string[] = [];
let touching = false;
let lastTouchEnd = 0;

addEventListener("touchstart", () => { touching = true; }, { passive: true });
addEventListener("touchend", () => { touching = false; lastTouchEnd = performance.now(); }, { passive: true });
addEventListener("touchcancel", () => { touching = false; lastTouchEnd = performance.now(); }, { passive: true });

const t0 = performance.now();
const stamp = () => ((performance.now() - t0) / 1000).toFixed(1).padStart(5) + "s";

function add(line: string) {
  log.push(`${stamp()} ${line}`);
  if (log.length > MAX_LINES) log.shift();
}

// Marca los cambios de tamaño con su origen, para poder correlacionarlos con
// los saltos: si un salto va justo detrás de un cambio de innerHeight, la
// culpa es del reajuste por la barra de direcciones.
addEventListener("resize", () => add(`RESIZE win  ih=${innerHeight}`));
visualViewport?.addEventListener("resize", () => add(`RESIZE vv   vh=${Math.round(visualViewport!.height)}`));

let pY = Math.round(scrollY);
let pIH = innerHeight;
let pDocH = document.documentElement.scrollHeight;

add("iniciado — reproduce el fallo");

function tick() {
  requestAnimationFrame(tick);

  const y = Math.round(scrollY);
  const ih = innerHeight;
  const docH = document.documentElement.scrollHeight;
  const vv = visualViewport ? Math.round(visualViewport.height) : ih;
  const maxY = docH - ih;

  if (docH !== pDocH) {
    add(`DOC  ${pDocH} -> ${docH}  (${docH > pDocH ? "+" : ""}${docH - pDocH})`);
  }
  if (ih !== pIH) {
    add(`ALTO ${pIH} -> ${ih}  maxY=${maxY}`);
  }

  const d = y - pY;
  if (Math.abs(d) >= JUMP_PX) {
    // Inercia: iOS sigue desplazando un rato tras levantar el dedo, así que
    // un salto poco después de soltar puede ser legítimo.
    const sinceTouch = performance.now() - lastTouchEnd;
    const quien = touching ? "dedo" : sinceTouch < 1200 ? "inercia?" : "*** SOLA ***";
    add(`SALTO ${d > 0 ? "+" : ""}${d}px -> y=${y}  [${quien}]`);
  }

  pY = y; pIH = ih; pDocH = docH;

  box.textContent =
    `y=${y}/${maxY}  ih=${ih} vv=${vv}  doc=${docH}\n` +
    `dedo=${touching ? "SI" : "no"}\n` +
    log.join("\n");
}
requestAnimationFrame(tick);
