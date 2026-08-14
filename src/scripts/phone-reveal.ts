// Tilt 3D del móvil de Contacto: sigue al ratón como una tarjeta de
// producto (Apple-style), pero es un transform CSS real sobre un elemento
// con transform-style:preserve-3d (mismo patrón que .laptop-screen en
// proyectos.css), no una simulación. La entrada (fade+lift al hacer
// scroll) la anima Main.astro sobre .phone-wrap con GSAP; este script solo
// toca .phone (el hijo), así ninguno de los dos pisa la misma propiedad.

const wrap = document.querySelector<HTMLElement>(".phone-wrap");
const phone = document.querySelector<HTMLElement>(".phone");

// Solo dispositivos con ratón real: en móvil/tablet no hay "mousemove" que
// lo mueva y el marco del móvil ya se desmonta por CSS (contacto.css), así
// que este bucle de rAF no hacía nada salvo escribir un transform en cada
// frame para siempre.
if (wrap && phone && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const MAX_TILT = 9; // grados
  const LERP = 0.08;

  let targetRX = 0;
  let targetRY = 0;
  let currentRX = 0;
  let currentRY = 0;

  window.addEventListener("mousemove", (e) => {
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
    const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
    targetRY = dx * MAX_TILT;
    targetRX = -dy * MAX_TILT;
  });

  window.addEventListener("mouseleave", () => {
    targetRX = 0;
    targetRY = 0;
  });

  let running = true;
  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    currentRX += (targetRX - currentRX) * LERP;
    currentRY += (targetRY - currentRY) * LERP;
    phone!.style.transform = `rotateX(${currentRX}deg) rotateY(${currentRY}deg)`;
  }
  animate();

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) animate();
  });
}
