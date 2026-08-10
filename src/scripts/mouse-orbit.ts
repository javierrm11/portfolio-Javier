// Estado del parallax de ratón COMPARTIDO entre hero-scene.ts y
// hero-character.ts. Son dos capas (dos <canvas>, dos cámaras) que deben
// verse SIEMPRE desde el mismo ángulo exacto para que la silla pueda
// "relevarse" de una capa a otra sin saltos. Si cada script calculara su
// propio suavizado del ratón en su propio bucle de animación (como se hizo
// al principio), las dos cámaras divergen frame a frame — pequeño, pero
// suficiente para que la silla parezca "teletransportarse" justo en el
// instante del relevo. Con un único módulo que actualiza el valor una vez
// por frame y ambas capas solo LEEN ese valor, quedan siempre sincronizadas.
export const mouseOrbit = { x: 0, y: 0 };

let rawX = 0;
let rawY = 0;
let scrollActive = false;

window.addEventListener("mousemove", (e) => {
  rawX = (e.clientX / window.innerWidth) * 2 - 1;
  rawY = (e.clientY / window.innerHeight) * 2 - 1;
});

// Mientras se hace scroll, el objetivo es 0 (posición neutra) en vez del
// ratón: la órbita se recentra sola y deja de reaccionar al ratón durante
// la secuencia de scroll.
export function setOrbitScrollActive(active: boolean) {
  scrollActive = active;
}

function tick() {
  requestAnimationFrame(tick);
  const targetX = scrollActive ? 0 : rawX;
  const targetY = scrollActive ? 0 : rawY;
  mouseOrbit.x += (targetX - mouseOrbit.x) * 0.05;
  mouseOrbit.y += (targetY - mouseOrbit.y) * 0.05;
}
tick();
