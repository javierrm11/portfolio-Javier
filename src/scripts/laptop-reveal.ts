import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const wrap = document.querySelector<HTMLElement>(".laptop-wrap");
const screen = document.querySelector<HTMLElement>(".laptop-screen");
const browserUI = document.querySelector<HTMLElement>(".browser-ui");
const tabs = document.querySelectorAll<HTMLButtonElement>(".browser-tab");
const panels = document.querySelectorAll<HTMLElement>(".browser-panel");
const addressUrl = document.querySelector<HTMLElement>(".browser-address-url");

// Una vez el portátil está del todo abierto (fin de la fase de scroll de
// abajo) se considera "listo": a partir de ahí cualquier scroll con el
// ratón por ENCIMA del portátil (bisecel, pestañas, barra de dirección,
// panel bloqueado...) queda contenido dentro de él en vez de mover la
// página — ver el listener de wheel más abajo. Antes de estar listo, el
// scroll tiene que seguir pasando de largo: es lo que mueve la página para
// ir abriendo la pantalla.
let laptopReady = false;

if (wrap && screen && browserUI) {
  // Por debajo de 900px no hay marco de portátil (ver proyectos.css): la
  // tarjeta es plana, así que no tiene sentido un giro de bisagra — se abre
  // con un fade + slide-up simple en su lugar. Comprobado una sola vez al
  // cargar (mismo criterio que el resto del sitio, p.ej. la coreografía de
  // Contacto en Main.astro): no es reactivo a un resize en caliente.
  const isCompactBrowser = window.innerWidth < 900;

  if (isCompactBrowser) {
    // Entrada simple que se reproduce UNA vez y se queda puesta. A
    // diferencia de la de escritorio NO va atada al scroll (scrub): aquí lo
    // que se anima es la OPACIDAD, y un scrub la rebobina también al subir
    // — al volver un poco hacia arriba desde Proyectos la tarjeta se
    // quedaba a medio opacar, translúcida sobre el fondo de circuitos, con
    // pinta de estar rota. El giro de bisagra de escritorio sí puede
    // rebobinar sin problema: "cerrarse un poco" al subir se lee como algo
    // físico, no como un fallo de pintado.
    gsap.set(screen, { opacity: 0, y: 24 });
    gsap.set(browserUI, { opacity: 0 });

    gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top 85%",
        toggleActions: "play none none none",
        onEnter: () => {
          laptopReady = true;
        },
      },
    })
      .to(screen, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
      .to(browserUI, { opacity: 1, duration: 0.45, ease: "none" }, 0.25);
  } else {
    // Cerrada: la pantalla cae hacia delante (casi tumbada sobre el teclado).
    // Abierta: casi vertical, con una ligera reclinación natural.
    gsap.set(screen, { rotationX: -96, transformPerspective: 1800 });
    gsap.set(browserUI, { opacity: 0 });

    // Timeline scrubbed de una sola fase: se abre y se queda abierta — antes
    // se volvía a cerrar al seguir bajando hacia Contacto, pero al salir de
    // Proyectos el portátil ya no vuelve a verse, así que cerrarla solo
    // aportaba un parpadeo/salto justo antes de desaparecer. transform-origin
    // en el borde inferior de la pantalla, como una bisagra real.
    gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top 95%", // antes 75%: arranca en cuanto asoma por abajo, se abre antes
        end: "middle 50%", // antes 25%: se queda abierta hasta que el centro de la pantalla llega al centro del viewport
        // scrub con número: pequeño retraso/inercia respecto al scroll real en
        // vez del seguimiento exacto de scrub:true, se ve más fluido al abrir
        // la pantalla. laptopReady se basa en self.progress, que sigue
        // llegando a 1 igual, solo con un poco más de retardo tras parar de
        // hacer scroll.
        scrub: 0.5,
        onUpdate: (self) => {
          laptopReady = self.progress >= 0.999;
        },
        onLeaveBack: () => {
          laptopReady = false;
        },
      },
    })
      .to(screen, { rotationX: -6, ease: "none", duration: 1 }, 0) // abrir: 0 → 1
      .fromTo(browserUI, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.5 }, 0.4);
  }
}

// Cualquier píxel dentro del portátil debe hacer scroll DENTRO de él, nunca
// fuera: antes, pasar el ratón por el bisel, las pestañas, la barra de
// dirección o el panel bloqueado (sin contenido propio que desplazar)
// dejaba que la rueda del ratón se "escapara" y moviera la página entera —
// una zona sí scrolleaba la página, la de al lado no, sensación de
// inconsistencia. Los <iframe> (las webs reales) ya gestionan su propio
// scroll interno de forma aislada por el navegador — no hace falta (ni se
// puede, son de otro origen) tocarlos aquí; esto solo contiene el resto.
wrap?.addEventListener(
  "wheel",
  (e) => {
    if (!laptopReady) return; // deja pasar: es lo que abre el portátil
    if ((e.target as HTMLElement | null)?.closest("iframe")) return;
    e.preventDefault();
  },
  { passive: false }
);

// Pestañas: cada una carga la web real (iframe con carga diferida — el src
// solo se asigna la primera vez que se abre esa pestaña).
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("is-active")) return;

    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");

    const targetId = `panel-${tab.dataset.target}`;
    panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === targetId));

    if (addressUrl && tab.dataset.url) {
      addressUrl.textContent = tab.dataset.url;
    }

    const panel = document.getElementById(targetId);
    const iframe = panel?.querySelector<HTMLIFrameElement>("iframe[data-src]");
    if (iframe) {
      iframe.src = iframe.dataset.src!;
      iframe.removeAttribute("data-src");
    }
  });
});

// Precargar la pestaña activa por defecto.
const firstIframe = document.querySelector<HTMLIFrameElement>(".browser-panel.is-active iframe[data-src]");
if (firstIframe) {
  firstIframe.src = firstIframe.dataset.src!;
  firstIframe.removeAttribute("data-src");
}
