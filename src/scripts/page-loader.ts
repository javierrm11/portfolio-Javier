// Pantalla de carga a pantalla completa mientras se descargan los modelos 3D
// del hero (escritorio + personaje). No usamos el progreso real de bytes de
// GLTFLoader (xhr.total suele venir a 0 en dev/con compresión, así que el
// porcentaje "real" se queda pegado o salta de golpe) — en su lugar
// simulamos un avance suave que se acerca a un 90% mientras algo sigue
// cargando y solo llega a 100% cuando TODO ha terminado de verdad.
const pending = new Set<string>();
let started = false;
let startedAt = 0;
let doneAt = -1;
let displayed = 0;
let rafId = 0;

const MIN_VISIBLE_MS = 900;
const LABELS = [
  "Inicializando escena",
  "Cargando geometría",
  "Compilando shaders",
  "Ensamblando personaje",
  "Calibrando cámara"
];

let root: HTMLElement | null = null;
let countEl: HTMLElement | null = null;
let labelEl: HTMLElement | null = null;
let ringEl: SVGCircleElement | null = null;
let labelIndex = 0;
let labelTimer = 0;

function ensureRefs() {
  if (root) return;
  root = document.getElementById("page-loader");
  countEl = document.getElementById("page-loader-count");
  labelEl = document.getElementById("page-loader-label");
  ringEl = document.querySelector(".ring-progress");
}

function cycleLabel() {
  if (!labelEl) return;
  labelIndex = (labelIndex + 1) % LABELS.length;
  labelEl.style.opacity = "0";
  window.setTimeout(() => {
    if (!labelEl) return;
    labelEl.textContent = LABELS[labelIndex];
    labelEl.style.opacity = "1";
  }, 220);
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

function tick() {
  const now = performance.now();
  const elapsed = now - startedAt;

  const target = pending.size > 0
    ? Math.min(90, (elapsed / 4200) * 90)
    : 100;
  displayed += (target - displayed) * 0.12;
  if (target === 100 && 100 - displayed < 0.4) displayed = 100;

  if (countEl) countEl.textContent = String(Math.round(displayed));
  if (ringEl) {
    const offset = RING_CIRCUMFERENCE * (1 - displayed / 100);
    ringEl.style.strokeDashoffset = String(offset);
  }

  if (pending.size === 0) {
    if (doneAt < 0) doneAt = now;
    const visibleFor = now - startedAt;
    if (displayed >= 99.8 && visibleFor >= MIN_VISIBLE_MS) {
      hide();
      return;
    }
  }

  rafId = requestAnimationFrame(tick);
}

function hide() {
  if (rafId) cancelAnimationFrame(rafId);
  window.clearInterval(labelTimer);
  if (!root) return;
  root.classList.add("is-done");
  window.setTimeout(() => {
    root?.remove();
  }, 700);
}

export function beginLoad(id: string) {
  ensureRefs();
  if (!root) return;
  pending.add(id);
  if (!started) {
    started = true;
    startedAt = performance.now();
    labelTimer = window.setInterval(cycleLabel, 1600);
    rafId = requestAnimationFrame(tick);
  }
}

export function finishLoad(id: string) {
  pending.delete(id);
}