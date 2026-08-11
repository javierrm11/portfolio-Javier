import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mouseOrbit, setOrbitScrollActive } from "./mouse-orbit";
import { beginLoad, finishLoad } from "./page-loader";

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════════════════════
//  X-RAY NEON  — uniforms compartidos por todos los meshes
//  Se activa SOLO cuando el personaje ya está de pie (about-me)
// ═══════════════════════════════════════════════════════════════
const xRayUniforms = {
  uReveal: { value: 0.0 },      // 0 = normal  |  1 = full neon
  uTime: { value: 0.0 },
  uCircuitColor: { value: new THREE.Color("#00d4ff") },
  uScanMin: { value: -1.2 },
  uScanMax: { value: 1.8 },
  // Centro y semi-ancho (eje X, mundo) del torso: define la zona con el
  // patrón denso tipo placa de circuito; fuera de ella (brazos/piernas) se
  // usa un patrón de costuras más simple y espaciado.
  uCenterX: { value: 0.0 },
  uTorsoHalfWidth: { value: 0.4 },
};

const scanBounds = { min: -1.2, max: 1.8 };

/** Inyecta el shader X-Ray/Neon en un MeshStandardMaterial existente.
 *  Conserva skinning, iluminación PBR, sombras y texturas del modelo. */
function applyXRayToMesh(mesh: THREE.Mesh) {
  const mat = mesh.material as THREE.MeshStandardMaterial;
  if (!mat) return;

  // El cuerpo revelado es translúcido (efecto holograma): sin esto WebGL
  // ignora el canal alpha que escribe el fragment shader y todo saldría
  // opaco. depthWrite se deja en su valor por defecto (true) a propósito:
  // desactivarlo movería al personaje a una cola de render distinta
  // durante TODA la página (no solo en el tramo revelado), arriesgando el
  // orden ya resuelto con la silla (setChairBehind, más abajo).
  mat.transparent = true;

  mat.onBeforeCompile = (shader) => {
    // Exponer uniforms
    shader.uniforms.uReveal = xRayUniforms.uReveal;
    shader.uniforms.uTime = xRayUniforms.uTime;
    shader.uniforms.uCircuitColor = xRayUniforms.uCircuitColor;
    shader.uniforms.uScanMin = xRayUniforms.uScanMin;
    shader.uniforms.uScanMax = xRayUniforms.uScanMax;
    shader.uniforms.uCenterX = xRayUniforms.uCenterX;
    shader.uniforms.uTorsoHalfWidth = xRayUniforms.uTorsoHalfWidth;

    // ── Vertex: varyings propios (prefijo xray para evitar colisiones) ──
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
      varying vec3 vXRayWorldPos;
      varying vec3 vXRayNormal;
      varying vec3 vXRayViewPos;
      varying vec2 vXRayUv;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>
      vXRayWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vXRayNormal   = normalize(normalMatrix * normal);
      vXRayViewPos  = (modelViewMatrix * vec4(transformed, 1.0)).xyz;
      vXRayUv       = uv;`
    );

    // ── Fragment: funciones + uniforms + varyings ──
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
      uniform float uReveal;
      uniform float uTime;
      uniform vec3 uCircuitColor;
      uniform float uScanMin;
      uniform float uScanMax;
      uniform float uCenterX;
      uniform float uTorsoHalfWidth;
      varying vec3 vXRayWorldPos;
      varying vec3 vXRayNormal;
      varying vec3 vXRayViewPos;
      varying vec2 vXRayUv;

      float xrayHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float xrayNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(xrayHash(i), xrayHash(i + vec2(1.0, 0.0)), f.x),
          mix(xrayHash(i + vec2(0.0, 1.0)), xrayHash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }`
    );

    // ── Fragment: composición final (después del tone-mapping) ──
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <dithering_fragment>",
      `#include <dithering_fragment>

      // Fresnel: aquí es el elemento PRINCIPAL (el "borde" que se ve en la
      // referencia), no un detalle sutil — exponente bajo = banda ancha.
      vec3 xrayViewDir = normalize(-vXRayViewPos);
      vec3 xrayN = normalize(vXRayNormal);
      float xrayFresnel = pow(1.0 - abs(dot(xrayN, xrayViewDir)), 2.2);

      // Máscara de barrido vertical (world Y): 0 = abajo (pies), 1 = arriba (cabeza)
      float worldY = vXRayWorldPos.y;
      float scanLine = smoothstep(uScanMin, uScanMax, worldY);

      // ═══════════════════════════════════════════════════════════════
      //  BARRIDO DE PIES A CABEZA
      //  scanLine = 0 en los pies, 1 en la cabeza
      //  Cuando uReveal sube, el frente de onda SUBE desde los pies
      // ═══════════════════════════════════════════════════════════════
      // uReveal sube de 0→1: el frente de onda ASCIENDE desde los pies.
      // Cuando uReveal=0 → nada revelado (todo normal).
      // Cuando uReveal=1 → todo revelado (full holograma).
      float revealMask = 1.0 - smoothstep(uReveal - 0.12, uReveal, scanLine);

      // Borde brillante del barrido (línea de escaneo ascendente)
      float scanBorder = smoothstep(uReveal - 0.025, uReveal, scanLine)
                       - smoothstep(uReveal, uReveal + 0.025, scanLine);
      vec3 scanColor = uCircuitColor * scanBorder * 3.0;

      // Líneas de escaneado horizontales (efecto holograma/proyección),
      // en vez del patrón de circuito: bandas que se desplazan con uTime.
      float scanFreq = 55.0;
      float hLines = 0.5 + 0.5 * sin(worldY * scanFreq - uTime * 1.8);
      hLines = smoothstep(0.35, 0.85, hLines);
      // Ruido fino para que no sea un degradado perfecto (textura sutil).
      float innerNoise = xrayNoise(vXRayUv * 45.0 + uTime * 0.08) * 0.12;

      // Cuerpo translúcido: color cian uniforme de base + líneas + fresnel.
      vec3 xrayColor = uCircuitColor * (0.22 + hLines * 0.4 + innerNoise)
                      + xrayFresnel * uCircuitColor * 1.1;

      // Alpha bajo en el cuerpo (se ve el fondo a través, como un
      // holograma) y casi opaco en el borde/fresnel y en las líneas.
      float xrayAlpha = clamp(0.16 + hLines * 0.22 + xrayFresnel * 0.6, 0.0, 0.95);

      // Mezcla: color/alpha original del PBR donde revealMask=0, holograma
      // donde =1.
      gl_FragColor.rgb = mix(gl_FragColor.rgb, xrayColor, revealMask);
      gl_FragColor.a = mix(gl_FragColor.a, xrayAlpha, revealMask);
      gl_FragColor.rgb += scanColor;
      `
    );
  };

  mat.needsUpdate = true;
}

// Capa fija con el personaje Y su silla (comparten escena para que la silla
// pueda taparlo con oclusión real de profundidad — en capas separadas el
// personaje siempre quedaría pintado encima). Misma cámara y encuadre que
// hero-scene.ts para que a scroll 0 se solape píxel a píxel con el
// escritorio; pero esta capa NO se desliza con la tarjeta del hero (no está
// en el tween de Main.astro), así que personaje y silla siguen visibles y
// en el mismo sitio mientras el resto de la escena se va con la caja.

const canvas = document.getElementById("hero-character-canvas") as HTMLCanvasElement | null;
const wrapper = document.getElementById("hero-character");

if (canvas && wrapper) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Misma iluminación que hero-scene.ts para que el personaje no cambie de
  // tono al pasar de una capa a otra.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xddddee, 1.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(4, 6, 6);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-5, 2, -3);
  scene.add(fillLight);

  // ── Base holográfica (tarima 3D a los pies) ─────────────────────────
  // Geometría unitaria (radio/alto 1), se reescala con modelRadius en
  // cuanto se conoce (al cargar el modelo) y cada frame según el personaje
  // encoge. Opacidad ligada a uReveal: invisible hasta que empieza la
  // transformación. Un cilindro con altura real (no un disco plano) para
  // que tenga volumen: MeshStandardMaterial capta las luces ya existentes
  // en la escena (keyLight/fillLight) y sombrea el lateral curvo solo, sin
  // shader propio — más "objeto 3D", menos "pegatina plana".
  const PLATFORM_HEIGHT = 0.56;
  const platformGroup = new THREE.Group();

  // MeshPhysicalMaterial (no Standard): el clearcoat da un brillo
  // especular nítido que se mueve con la luz — eso es lo que realmente
  // vende la curvatura de la pared lateral, más que la altura en sí. Menos
  // emissive (antes aplanaba el sombreado, un objeto que "brilla desde
  // dentro" por igual en toda su superficie no puede lucir volumen) y más
  // metalness/menos roughness para que capte keyLight/fillLight con un
  // highlight definido.
  const platformBody = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, PLATFORM_HEIGHT, 64, 1, false),
    new THREE.MeshPhysicalMaterial({
      // Antes se veía gris/blanco: incluso con metalness/clearcoat bajos,
      // la cara de arriba (mirando directo a la key light) sigue
      // reflejando bastante luz blanca — el emissive es lo único que NO
      // depende de las luces de la escena, así que se sube fuerte para que
      // el azul domine de verdad sobre ese reflejo en vez de competir con
      // él. Metalness a 0 y clearcoat fuera: nada de reflejo especular
      // blanco, todo el brillo lo pone el emissive azul.
      color: 0x0a3350, emissive: 0x1e90ff, emissiveIntensity: 0.85,
      metalness: 0, roughness: 0.7,
      clearcoat: 0, clearcoatRoughness: 0,
      transparent: true, opacity: 0, depthWrite: false,
    })
  );

  // Sombra de contacto: gradiente vertical negro sobre el lateral (más
  // oscuro abajo, transparente hacia arriba) que vende volumen/profundidad
  // sin depender de las luces de la escena — como el ambient occlusion que
  // tendría un objeto real apoyado en el suelo. Textura de 1px de ancho
  // (solo hace falta el gradiente vertical) sobre un cilindro ligeramente
  // mayor que el cuerpo para que no compita en z-fighting con él.
  function createPlatformShadowTexture() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, size, 0, 0);
    gradient.addColorStop(0, "rgba(0,0,0,0.9)");
    gradient.addColorStop(0.5, "rgba(0,0,0,0.28)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  const platformShadow = new THREE.Mesh(
    new THREE.CylinderGeometry(1.005, 1.005, PLATFORM_HEIGHT, 64, 1, true),
    new THREE.MeshBasicMaterial({
      map: createPlatformShadowTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  );

  // Textura con tramos brillantes repartidos alrededor del anillo (blanco
  // = mucho más luminoso que el resto, casi todo dim): al desplazar
  // texture.offset.x cada frame (ver animate()) esos tramos "recorren" el
  // aro en vez de quedarse quietos — como pulsos de datos circulando por
  // un circuito. 1px de alto porque el gradiente es solo horizontal.
  function createRidgeGlowTexture(segments: number, seed: number) {
    const width = 256;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgb(140,140,140)";
    ctx.fillRect(0, 0, width, 1);
    const segW = width / segments;
    for (let i = 0; i < segments; i++) {
      // Ancho y posición con algo de variación (seed) para que no todos
      // los anillos tengan el mismo patrón y se vea más orgánico.
      const jitter = Math.sin(i * 12.9898 + seed * 78.233) * 0.5 + 0.5;
      const x = i * segW + jitter * segW * 0.3;
      const w = segW * (0.18 + jitter * 0.12);
      const gradient = ctx.createLinearGradient(x - w, 0, x + w, 0);
      gradient.addColorStop(0, "rgb(140,140,140)");
      gradient.addColorStop(0.5, "rgb(255,255,255)");
      gradient.addColorStop(1, "rgb(140,140,140)");
      ctx.fillStyle = gradient;
      ctx.fillRect(Math.max(0, x - w), 0, w * 2, 1);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const ridgeGeo = new THREE.CylinderGeometry(1.002, 1.002, 0.03, 64, 1, true);
  // Antes solo dos surcos; ahora una tira de líneas repartidas por toda la
  // altura (más "anillos apilados", menos vacío en el lateral). Se
  // desvanecen de arriba (más brillante) a abajo (más tenue), a juego con
  // platformShadow oscureciendo esa misma zona.
  const RIDGE_FRACTIONS = [0.3, 0, -0.3];
  // De reposo (parado el scroll) son líneas sólidas de azul uniforme — sin
  // textura, mat.color se ve tal cual. Al hacer scroll se les mete la
  // textura con tramos brillantes (ver createRidgeGlowTexture) y esos
  // tramos recorren la línea; al parar el scroll se les quita la textura
  // otra vez y vuelven a verse sólidas (ver bloque de scroll-activity en
  // animate()). mat.userData.glowMap guarda la textura para poder
  // ponerla/quitarla sin recrearla cada vez.
  const ridges = RIDGE_FRACTIONS.map((frac, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00779a, // un poco más brillante, sin exagerar
      transparent: true, opacity: 0, depthWrite: false,
    });
    mat.userData.glowMap = createRidgeGlowTexture(5, i);
    // Al hacer scroll no solo se le mete la textura de tramos: el color
    // base también cambia a un azul más vivo/brilloso (ver bloque de
    // scroll-activity en animate()) — de reposo usa mat.color tal cual
    // (el azul de arriba), en movimiento pasa a este otro más saturado.
    mat.userData.baseColor = mat.color.clone();
    mat.userData.scrollColor = new THREE.Color(0x22e0ff);
    const mesh = new THREE.Mesh(ridgeGeo, mat);
    mesh.position.y = PLATFORM_HEIGHT * frac;
    return mesh;
  });

  // Reflejo de luz sobre la cara de arriba: una mancha de brillo blanca,
  // descentrada (no un degradado simétrico), como el reflejo que dejaría
  // una luz puntual sobre una superficie pulida — no depende de las luces
  // de la escena (igual que platformShadow/el halo del aro), es una
  // textura ya "hecha" pintada encima con AdditiveBlending.
  function createTopGlareTexture() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(
      size * 0.36, size * 0.32, 0,
      size * 0.36, size * 0.32, size * 0.5
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.35, "rgba(210,240,255,0.35)");
    gradient.addColorStop(1, "rgba(210,240,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  const platformTopGlare = new THREE.Mesh(
    new THREE.CircleGeometry(0.96, 64),
    new THREE.MeshBasicMaterial({
      map: createTopGlareTexture(),
      color: 0xffffff,
      transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  platformTopGlare.rotation.x = -Math.PI / 2;
  platformTopGlare.position.y = PLATFORM_HEIGHT / 2 + 0.2;

  // Borde brillante arriba (el "aro" que más destaca en la referencia).
  const platformTopRing = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 0.918, 10),
    new THREE.MeshBasicMaterial({
      color: 0x00e8ff, transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  platformTopRing.rotation.x = -Math.PI / 2;
  platformTopRing.position.y = PLATFORM_HEIGHT / 2 + 0.002;

  // Halo de neón: no hay pipeline de postproceso (bloom) en esta escena,
  // así que el "brillo" se simula a la manera clásica de shaders sin
  // postproceso — dos aros más anchos y difusos DETRÁS del aro nítido, con
  // AdditiveBlending (suman luz en vez de taparse) y opacidad decreciente
  // hacia fuera, como el halo que dejaría un tubo de neón sobreexpuesto.
  const platformTopRingGlow = [
    { inner: 0.86, outer: 0.96, opacity: 0.45 },
    { inner: 0.8, outer: 1.02, opacity: 0.22 },
  ].map(({ inner, outer, opacity }, i) => {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 80),
      new THREE.MeshBasicMaterial({
        color: 0x00e8ff, transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    // Un pelín más alto que el aro nítido para que no compitan por el
    // mismo plano (z-fighting) y quede el halo justo por encima.
    mesh.position.y = PLATFORM_HEIGHT / 2 + 0.003 + i * 0.001;
    mesh.userData.baseOpacity = opacity;
    return mesh;
  });

  platformGroup.add(
    platformBody,
    platformShadow,
    ...ridges,
    platformTopGlare,
    ...platformTopRingGlow,
    platformTopRing
  );
  platformGroup.visible = false;
  scene.add(platformGroup);

  // Onda de escáner: cilindro translúcido que sube desde el aro de la base
  // hasta la altura del personaje, con una textura de bandas horizontales
  // que se desplaza hacia arriba sin parar (uTime, no scroll — es un
  // efecto ambiente del holograma, no ligado a la posición de scroll como
  // las líneas de la base). Va FUERA de platformGroup (no como sus hijos)
  // porque su altura debe escalar con modelRadius (llega hasta la cabeza),
  // no con platformFrozenRadius (el radio, mucho más pequeño, de la base).
  function createScanBeamTexture() {
    const height = 128;
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const bands = 12;
    const bandH = height / bands;
    for (let i = 0; i < bands; i++) {
      const cy = i * bandH + bandH * 0.5;
      const gradient = ctx.createLinearGradient(0, cy - bandH * 0.4, 0, cy + bandH * 0.4);
      gradient.addColorStop(0, "rgba(120,235,255,0)");
      gradient.addColorStop(0.5, "rgba(150,240,255,0.85)");
      gradient.addColorStop(1, "rgba(120,235,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, cy - bandH * 0.4, 1, bandH * 0.8);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 7);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  // Antes llegaba por encima de la cabeza (1.85 casi cubría los 2×
  // modelRadius de alto real del cuerpo) — ahora se queda justo a la
  // altura de la cabeza, no más arriba.
  const SCAN_BEAM_HEIGHT_FACTOR = 1.3;
  const SCAN_BEAM_RADIUS_FACTOR = 0.9;
  const SCAN_BEAM_SPEED = 0.28;
  // Cuántas bandas caben en la altura COMPLETA del haz (3 del canvas × 2
  // repeticiones = 6 en total, antes eran 9×7=63 — se veía demasiado
  // denso). Al crecer solo hasta una fracción de esa altura se reduce este
  // número en la misma proporción (ver animate()), así las bandas
  // visibles mantienen su tamaño real en vez de estirarse/comprimirse al
  // crecer.
  const SCAN_BEAM_REPEAT_FULL = 2;
  const SCAN_BEAM_REVEAL_DURATION_S = 0.9;
  const platformScanBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 1, 48, 1, true),
    new THREE.MeshBasicMaterial({
      map: createScanBeamTexture(),
      color: 0x00d4ff,
      transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  platformScanBeam.visible = false;
  // No arranca a la vez que la base: espera a que esta termine de subir
  // (enterEased llega a 1, ver animate()) y AHÍ empieza a crecer desde
  // abajo hacia arriba — nunca aparece de golpe con todas las bandas ya
  // puestas. Al revés (scroll hacia arriba) se oculta atado directamente
  // al % del contador entre 10 y 0 (ver REVEAL_HIDE_BAND en animate()), no
  // por tiempo. scanBeamProgress guarda el valor ACTUAL (no solo el
  // objetivo) para que, si se cambia de sentido a mitad de animación de
  // crecida, la reversa arranque desde donde iba de verdad en vez de saltar.
  let scanBeamGrowing = false;
  let scanBeamPhaseStart = 0;
  let scanBeamPhaseFrom = 0;
  let scanBeamProgress = 0;
  // Solo se usa el tramo "atado a revealed" (10%→0%) para OCULTAR una vez
  // que la onda ya llegó a estar del todo visible al menos una vez — si no,
  // en un scroll rápido revealed pasa de 0 a >10% antes de que enterEased
  // (con su propio delay de tiempo real) llegue a 1, y sin esta guarda el
  // tramo de abajo mostraba una vista previa a medias que luego la rama de
  // arriba "corregía" de golpe hacia 0 (por baseFullyUp aún false) y volvía
  // a crecer al rato — el parpadeo de aparece/desaparece/reaparece.
  let scanBeamHasBeenFull = false;
  scene.add(platformScanBeam);

  // Detección de "scroll activo" para las líneas de la base: si en este
  // frame ridgeScrollPos (ver animate()) no se ha movido nada respecto al
  // anterior, y así sigue durante RIDGE_SCROLL_IDLE_MS, se considera que
  // el scroll paró — las líneas sueltan la textura de tramos brillantes y
  // vuelven a verse sólidas. Se resetea el timer en cuanto vuelve a moverse.
  const RIDGE_SCROLL_IDLE_MS = 220;
  let prevRidgeScrollPos = 0;
  let ridgeLastMoveTime = 0;
  let ridgesScrolling = false;

  let mixer: THREE.AnimationMixer | null = null;

  // ── Reacción al empezar a hacer scroll (en sincronía con la silla) ──
  // Suavizado tipo smoothstep en vez de interpolación lineal: arranca y
  // termina cada fase con velocidad cero en vez de a golpe, más fluido.
  function smoothstep(t: number) {
    return t * t * (3 - 2 * t);
  }
  let frozen = false;
  // La silla solo GIRA, no se desliza hacia atrás (ni ella ni el
  // personaje): chairT (usado para el relevo entre capas) sigue
  // directamente al giro, así que la silla queda fija en cuanto termina de
  // rotar.
  let chairRotateT = 0;
  let chairT = 0;
  // Momento en que la silla se clava en su punto de pantalla: cuando el
  // personaje empieza a levantarse, no cuando se detiene el tecleo.
  let chairPinActive = false;
  // Desde ese mismo punto, la silla se va hacia arriba con la página de
  // inicio en vez de quedarse flotando en pantalla (ver bloque de anclaje).
  let chairSlideAway = 0;
  // Orden de dibujado: la silla debe pasar a dibujarse "detrás" en cuanto
  // EMPIEZA A GIRAR, mucho antes de clavarse en pantalla (0.17). En ese
  // tramo barre 90º alrededor del personaje, que sigue congelado inclinado
  // hacia delante, y con profundidad normal el asiento/respaldo lo
  // atraviesan y lo tapan. Es un estado aparte del pin, por eso no se
  // deduce de chairPinActive.
  let chairBehindActive = false;
  let chairBehind = false;
  const CHAIR_TURN_ANGLE = THREE.MathUtils.degToRad(-90);
  // Fase siguiente: en cuanto el giro termina, el personaje encoge un poco.
  let scaleT = 0;
  const SHRINK_AMOUNT = 0.35;
  // Encogido adicional mientras se transforma en holograma (uReveal
  // 0→1, ver xRayUniforms): más pequeño = más "figurita sobre la base",
  // como en la referencia.
  const HOLOGRAM_SHRINK_AMOUNT = 0;
  // Factor de escala actual del personaje (1 = tamaño base), guardado para
  // que la base holográfica encoja al mismo ritmo (ver animate()).
  let currentShrinkFactor = 1;
  // Radio de la base holográfica (fracción de modelRadius) y sesgo de
  // centrado hacia el lado alejado de la cámara para compensar que un
  // círculo en este ángulo no se PERCIBE centrado aunque lo esté en 3D
  // (ver comentario junto a platformGroup.position.set en animate()).
  const PLATFORM_RADIUS_FACTOR = 0.28;
  const PLATFORM_CENTER_BIAS = -0.45;
  // Entrada "desde abajo": en vez de aparecer de golpe en su sitio final,
  // la base arranca por debajo y sube hasta su posición en
  // PLATFORM_ENTER_DURATION_S segundos, en tiempo real (no ligado al
  // scroll) — se relanza cada vez que pasa de invisible a visible.
  const PLATFORM_ENTER_DURATION_S = 0.7;
  const PLATFORM_RISE_DISTANCE_FACTOR = 1.2;
  // Umbral de "personaje ya lo bastante de pie" que enciende/apaga la base:
  // más alto = aparece más tarde (y, al subir, empieza a irse más tarde).
  const PLATFORM_FACE_T = 1.5;
  let platformWasActive = false;
  let platformEnterStart = 0;
  let platformSettled = false;
  // Posición/escala se capturan UNA sola vez, la primera vez que la base
  // se activa, y no se vuelven a tocar nunca más — así se queda fija en
  // ese sitio en vez de seguir a los pies del personaje después (al subir
  // el scroll, al sentarse de nuevo, etc.). Solo la animación de entrada
  // (el "sube desde abajo") se sigue calculando cada frame, sobre ese
  // objetivo ya congelado.
  let platformFrozenX = 0;
  let platformFrozenY = 0;
  let platformFrozenZ = 0;
  let platformFrozenRadius = 0;
  // Al hacer scroll hacia arriba y desactivarse (platformActive → false),
  // en vez de desaparecer se clava en el punto de PANTALLA (NDC) que
  // ocupaba justo en ese instante — igual que chairPinNdc más abajo — y
  // desde ahí se desproyecta cada frame con la cámara actual, así se queda
  // fija a ojos del usuario aunque la cámara siga moviéndose (scroll
  // dentro de Hero/About sigue animando la cámara).
  let platformScreenPinned = false;
  const platformPinNdc = new THREE.Vector3();
  const platformPinWorld = new THREE.Vector3();
  // Cuánto tarda en deslizarse hacia abajo (y desaparecer del todo) una
  // vez se clava en pantalla — tiempo real, ver comentario junto a
  // platformSlideAway en animate().
  const PLATFORM_SLIDE_AWAY_DURATION_S = 1.3;
  let platformSlideAwayStart = 0;
  // Última fase: justo después de encoger, la cámara centra el encuadre
  // (elimina el sesgo hacia la derecha pensado para el texto).
  let centerT = 0;
  // Se solapa con el giro de la silla: el personaje sigue girando hasta
  // quedar mirando hacia delante.
  let faceT = 0;
  const FACE_TURN_ANGLE = THREE.MathUtils.degToRad(-50);
  // Fases repartidas en un tramo más largo del scroll (antes toda la
  // secuencia terminaba a un 20% de scroll de #about; ahora ocupa hasta un
  // ~85%, así hace falta más scroll y cada fase dura más = más fluido).
  // La silla termina de girar y hacer el relevo (chairT llega a 1) ANTES de
  // que el personaje empiece a levantarse (faceT/scaleT arrancan en el
  // mismo punto, 0.17): si se solapan, el personaje ya está de pie mientras
  // la silla todavía está a medio relevo entre capas y se ve un glitch de
  // oclusión (la silla atraviesa el cuerpo).
  ScrollTrigger.create({
    trigger: "#about",
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      // Con el mínimo scroll, el tecleo se detiene: personaje y silla se
      // quedan en la pose que tuvieran en ese instante. No hay salto porque
      // simplemente se deja de avanzar el reloj del clip (no se fuerza
      // ningún frame concreto).
      frozen = self.progress > 0.005;
      // La silla se clava en su punto de pantalla más tarde, cuando el
      // personaje empieza a levantarse — no al detenerse el tecleo. Desde
      // ahí se va hacia arriba con la página. Lineal (no smoothstep) porque
      // el tween de #hero-card/#hero-visual usa ease "none".
      chairPinActive = self.progress > 0.17;
      chairSlideAway = THREE.MathUtils.clamp(self.progress - 0.17, 0, 1);
      // Mismo punto en el que arranca el giro (y en el que se congela la
      // pose): a partir de aquí la silla ya no puede tapar al personaje.
      chairBehindActive = self.progress > 0.005;
      // La silla solo gira (0 → 0.17); chairT sigue directamente al giro,
      // así que queda fija en cuanto termina de rotar, sin deslizarse.
      chairRotateT = smoothstep(THREE.MathUtils.clamp(self.progress / 0.17, 0, 1));
      chairT = chairRotateT;
      // El centrado no es una fase aparte después de ponerse de pie: pasa
      // A LA VEZ que faceT/scaleT (mismo inicio, 0.17), justo cuando la
      // silla termina de girar — así se percibe como un solo movimiento
      // continuo en vez de un barrido de cámara aparte al final.
      faceT = smoothstep(THREE.MathUtils.clamp((self.progress - 0.17) / 0.36, 0, 1));
      scaleT = smoothstep(THREE.MathUtils.clamp((self.progress - 0.17) / 0.20, 0, 1));
      centerT = smoothstep(THREE.MathUtils.clamp((self.progress - 0.17) / 0.36, 0, 1));
      // En cuanto se hace scroll, el parallax de ratón se desactiva: la
      // órbita se recentra sola (ver mouse-orbit.ts).
      setOrbitScrollActive(self.progress > 0);
    }
  });

  let character: THREE.Object3D | null = null;
  let characterBaseRotationY = 0;
  let characterBaseScale: THREE.Vector3 | null = null;
  let characterCenterY = 0;

  // ── Pose de pie: bind pose del esqueleto ──────────────────────────
  // En vez de adivinar deltas por hueso (los ejes locales dependen de la
  // pose del clip y es un pozo sin fondo), se interpola cada hueso desde la
  // pose congelada hacia su BIND POSE: la pose de descanso guardada en el
  // archivo, que es de pie con los brazos en T. Es exacta por construcción.
  // Sobre ella solo se aplica un delta extra en los hombros para bajar los
  // brazos de la T a los lados del cuerpo.
  type BindBone = {
    bone: THREE.Bone;
    bindPos: THREE.Vector3;
    bindQuat: THREE.Quaternion;
    basePos: THREE.Vector3;
    baseQuat: THREE.Quaternion;
  };
  const bindBones: BindBone[] = [];
  let standCaptured = false;
  const scratchQ = new THREE.Quaternion();
  const scratchM = new THREE.Matrix4();
  const scratchV = new THREE.Vector3();

  // Bajar los brazos de la T-pose a los lados (eje/signo a verificar por
  // captura, pero sobre una base por fin determinista).
  const ARM_DOWN_AXIS = new THREE.Vector3(1, 0, 0);
  let armDownAngleL = 1.3;
  let armDownAngleR = 1.3;
  const armBones: { bone: THREE.Bone; angle: () => number }[] = [];

  // La bind pose deja la cabeza ligeramente inclinada hacia abajo (no
  // exactamente mirando al frente): se corrige con un giro extra, mismo
  // patrón que ARM_DOWN_AXIS.
  const HEAD_UP_AXIS = new THREE.Vector3(1, 0, 0);
  let headUpAngle = -0.35;
  let headBone: THREE.Bone | null = null;
  // Huesos de los pies para posicionar la base holográfica: más fiables
  // que un bounding box, que refleja la bind pose (rest pose) en vez de la
  // pose de pie actual y da una altura de "pies" incorrecta.
  let feetBoneL: THREE.Bone | null = null;
  let feetBoneR: THREE.Bone | null = null;
  const feetWorldL = new THREE.Vector3();
  const feetWorldR = new THREE.Vector3();

  // ── Callouts de la sección "Sobre mí" ──────────────────────────────
  // Etiquetas HTML (About.astro) ancladas a puntos del cuerpo: cada frame
  // se proyecta el hueso a coordenadas de pantalla (mismo patrón que el
  // anclaje de la silla, más abajo) y se mueve el elemento con
  // transform: translate(). Corre siempre, sea o no visible la sección —
  // la visibilidad la controla el CSS/GSAP de About.astro/Main.astro.
  // Nombres de anclaje en términos de lado de PANTALLA (comprobado por
  // proyección real, no por el sufijo L/R del hueso): con el personaje de
  // cara al usuario, ForearmR_67/CalfR_79 caen del lado izquierdo de la
  // pantalla y ForearmL_49/CalfL_74 del derecho — el rig usa L/R anatómico
  // del propio personaje, que queda espejado al mirar de frente.
  const CALLOUT_ANCHORS: { anchor: string; boneName: string }[] = [
    { anchor: "head", boneName: "Head_31" },
    { anchor: "elbow-left", boneName: "ForearmR_67" },
    { anchor: "elbow-right", boneName: "ForearmL_49" },
    { anchor: "hip", boneName: "HipL_76" },
    { anchor: "leg-left", boneName: "CalfR_79" },
    { anchor: "leg-right", boneName: "CalfL_74" },
  ];
  type Callout = { bone: THREE.Bone; el: HTMLElement; dot: HTMLElement; line: HTMLElement; label: HTMLElement };
  const callouts: Callout[] = [];
  const calloutScreen = new THREE.Vector3();
  // Cada etiqueta se revela atada al contador de "% transformado" (mismo
  // uReveal que el holograma), no a un tween de scroll aparte: la primera
  // (Sobre mí) entra al 10%, la siguiente al 20%, etc. — coherente con el
  // propio contador y reversible sin más (uReveal ya va y vuelve con el
  // scroll). REVEAL_FADE_BAND suaviza el cambio en vez de un corte seco.
  const REVEAL_STEP = 0.15;
  const REVEAL_FADE_BAND = 0.04;
  // Posición/tamaño del wrapper respecto al viewport (ver resize()).
  const wrapperRect = { left: 0, top: 0, width: 0, height: 0 };

  // Contador "% transformado" (About.astro): mismo mecanismo de proyección
  // que los callouts, pero anclado a un punto a los pies (no a un hueso) y
  // con la opacidad ligada a uReveal en vez de al scroll-stagger de GSAP.
  const counterEl = document.getElementById("about-counter");
  const counterValueEl = counterEl?.querySelector<HTMLElement>(".counter-value") ?? null;
  const counterAnchorWorld = new THREE.Vector3();

  let chair: THREE.Object3D | null = null;
  let chairBaseRotationY = 0;

  // Nota: la silla cuelga de "Empty_1", al que el clip de tecleo también
  // anima — por eso acompaña al personaje cuando se inclina. No hace falta
  // tratarlo aparte: basta con dejar de avanzar el reloj del mixer para
  // congelarlo donde esté (ver animate()).

  // ── Silla clavada en pantalla al levantarse ───────────────────────
  // A partir del congelado, la cámara sigue moviéndose (centra al
  // personaje), así que dejar la silla quieta en el MUNDO no basta: se
  // desplazaría por pantalla acompañando al personaje. Se guarda su
  // posición proyectada en pantalla (NDC) en el instante del congelado y
  // cada frame se recoloca en el mundo para que siga proyectando ahí:
  // queda clavada en ese punto de la pantalla, ajena al paneo de cámara.
  const chairPinNdc = new THREE.Vector3();
  const chairPinWorld = new THREE.Vector3();
  const chairBaseLocalPos = new THREE.Vector3();
  let chairPinned = false;
  // Equivalente en NDC del tween de la sección (Main.astro), recorrido a lo
  // largo de todo el rango de scroll: yPercent -100 sobre un elemento de
  // 100vh → +2 en NDC Y (la pantalla mide 2 en NDC); xPercent 25 sobre un
  // elemento de 110vw (left/right: -5%) → 27.5vw → 0.55 en NDC X.
  const PAGE_SLIDE_Y_NDC = 2;
  const PAGE_SLIDE_X_NDC = 0.55;

  const lookBias = new THREE.Vector3();
  const lookCenter = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  // ── Parallax de ratón: orbita la cámara (mismo criterio que
  // hero-scene.ts, ver comentario ahí) — mouseOrbit.x/y viene ya suavizado
  // y compartido con hero-scene.ts (mouse-orbit.ts) para que ambas capas
  // orbiten exactamente igual y la silla no salte al relevarse entre capas.
  const ORBIT_YAW_MAX = THREE.MathUtils.degToRad(10);
  const ORBIT_PITCH_MAX = THREE.MathUtils.degToRad(7);

  const viewDir = new THREE.Vector3(-0.55, 0.5, -0.85).normalize();
  let modelRadius = 0;
  // Mismo criterio que hero-scene.ts: en escritorio el texto va a la
  // izquierda de la escena y la cámara mira un poco a la izquierda de
  // centro para dejarle sitio; en móvil/tablet (≤999px) el texto va
  // ENCIMA, no al lado, así que ese sesgo horizontal se anula.
  let isCompactLayout = window.innerWidth < 1000;

  const basePosition = new THREE.Vector3();
  const orbitRightAxis = new THREE.Vector3()
    .crossVectors(viewDir, new THREE.Vector3(0, 1, 0))
    .normalize();
  const orbitedPosition = new THREE.Vector3();
  const yawQuat = new THREE.Quaternion();
  const pitchQuat = new THREE.Quaternion();

  function fitCameraToModel() {
    if (!modelRadius) return;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    if (camera.aspect >= 1) {
      const distance = (modelRadius / Math.sin(vFov / 2)) * 0.62;
      camera.position.copy(viewDir).multiplyScalar(distance);
    } else {
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      // Mismos valores que hero-scene.ts (ver el porqué del corte en 600px
      // allí): las dos capas DEBEN usar el mismo factor o el personaje
      // saldría a otra escala que su escritorio.
      const fit = isCompactLayout ? (window.innerWidth < 600 ? 0.5 : 0.78) : 0.72;
      const distance = (modelRadius / Math.sin(hFov / 2)) * fit;
      camera.position.copy(viewDir).multiplyScalar(distance);
    }
    basePosition.copy(camera.position);
    // El lookAt se recalcula cada frame en animate() (depende de centerT),
    // pero se llama aquí también para tener un encuadre correcto ya en el
    // primer frame, antes de que el scroll haya actualizado nada.
    // Debe coincidir EXACTAMENTE con baseLookAt de hero-scene.ts: son dos
    // capas/canvas distintos que a scroll 0 tienen que solaparse píxel a
    // píxel (personaje aquí, escritorio allí).
    camera.lookAt(
      isCompactLayout ? 0 : modelRadius * 0.32,
      isCompactLayout ? modelRadius * 0.3 : -modelRadius * 0.28,
      0
    );
  }

  function resize() {
    if (!canvas || !wrapper) return;
    isCompactLayout = window.innerWidth < 1000;
    const { clientWidth, clientHeight } = wrapper;
    // Mismo truco que hero-scene.ts: el canvas sobresale por abajo y el
    // encuadre se calcula como si terminara en 113vh (setViewOffset).
    const frameHeight = Math.min(clientHeight, window.innerHeight * 1.13);
    camera.aspect = clientWidth / frameHeight;
    camera.setViewOffset(clientWidth, frameHeight, 0, 0, clientWidth, clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
    fitCameraToModel();
    // El wrapper es más grande que la ventana (insets negativos) y NDC se
    // proyecta relativo a él (setViewOffset usa su tamaño como "sub-view").
    // #about-callouts en cambio es fixed+inset:0 (cubre la ventana), así
    // que hace falta la posición del wrapper respecto al viewport para
    // convertir NDC → píxeles de ventana. Solo cambia con el resize.
    const rect = wrapper.getBoundingClientRect();
    wrapperRect.left = rect.left;
    wrapperRect.top = rect.top;
    wrapperRect.width = rect.width;
    wrapperRect.height = rect.height;
  }

  function computeMeshBounds(model: THREE.Object3D) {
    const box = new THREE.Box3();
    model.updateWorldMatrix(true, true);
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      box.union(mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld));
    });
    return box;
  }

  // Fuerza (o restaura) que la silla se dibuje SIEMPRE detrás del resto:
  // se desactiva su escritura en el depth buffer, así nada que se dibuje
  // después (el personaje, con renderOrder por defecto) puede quedar oculto
  // por ella aunque su profundidad real diga lo contrario. renderOrder
  // negativo asegura que se dibuja antes que todo lo demás.
  function setChairBehind(object: THREE.Object3D, behind: boolean) {
    object.renderOrder = behind ? -1 : 0;
    object.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      // renderOrder va en CADA mesh, no solo en el nodo raíz: three.js
      // ordena la lista de render por objeto y no hereda el valor del
      // padre, así que ponerlo únicamente en el grupo no hacía nada. Es
      // imprescindible aquí porque los materiales de la silla vienen del
      // .glb con transparent:true, igual que los del personaje (X-Ray se
      // lo activa): ambos caen en la MISMA cola de transparentes, que se
      // ordena por distancia a cámara — y el cojín del asiento, al quedar
      // más cerca, se pintaba después y tapaba las piernas. Con
      // renderOrder -1 la silla se dibuja siempre primero, y sin escribir
      // profundidad (depthWrite) el personaje pinta encima donde solapen.
      mesh.renderOrder = behind ? -1 : 0;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        mat.depthWrite = !behind;
      }
    });
  }

  // Todo lo que NO es el personaje ni su silla (el resto del escritorio
  // vive en hero-scene.ts).
  const hiddenNames = [
    "table_107", "laptop_8", "book_5", "book2_6", "headphones_94",
    "lamp_95", "mug_96", "pencil_97", "phone_98", "Plane_93",
  ];

  const loader = new GLTFLoader();
  beginLoad("hero-character");
  loader.load(
    "/models/scene.glb",
    (gltf) => {
      const model = gltf.scene;

      // Centrado con el bounding box de la ESCENA COMPLETA (antes de ocultar
      // nada): así el resultado es idéntico al de hero-scene.ts y las dos
      // capas coinciden.
      const box = computeMeshBounds(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      const sphere = box.getBoundingSphere(new THREE.Sphere());
      modelRadius = sphere.radius;

      for (const name of hiddenNames) {
        const obj = model.getObjectByName(name);
        if (obj) obj.visible = false;
      }

      scene.add(model);

      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
      }

      character = model.getObjectByName("Armature_92") ?? null;
      characterBaseRotationY = character ? character.rotation.y : 0;
      // Clonar la escala base (puede no ser 1 en modelos exportados de
      // Sketchfab/Blender) en vez de sobreescribirla con setScalar.
      characterBaseScale = character ? character.scale.clone() : null;
      // Centro vertical REAL del personaje (bounding box de sus propias
      // mallas), para poder centrarlo en pantalla apuntando la cámara ahí
      // en vez de a un valor a ojo.
      if (character) {
        characterCenterY = computeMeshBounds(character).getCenter(new THREE.Vector3()).y;
      }

      // ═══════════════════════════════════════════════════════════════
      //  APLICAR X-RAY/NEON AL PERSONAJE (no a la silla ni objetos ocultos)
      // ═══════════════════════════════════════════════════════════════
      // Calcular bounds verticales del personaje para el barrido del shader
      const charBox = new THREE.Box3();
      model.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (obj.name === "chair_0") return;
        if (hiddenNames.includes(obj.name)) return;
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        charBox.expandByObject(mesh);
      });
      const charSize = charBox.getSize(new THREE.Vector3());
      const charCenter = charBox.getCenter(new THREE.Vector3());
      scanBounds.min = charCenter.y - charSize.y * 0.55;
      scanBounds.max = charCenter.y + charSize.y * 0.55;
      xRayUniforms.uScanMin.value = scanBounds.min;
      xRayUniforms.uScanMax.value = scanBounds.max;
      // Eje central y semi-ancho aproximado del torso (fracción del ancho
      // total, más estrecho que los brazos extendidos a los lados) para
      // distinguir la zona de placa densa del resto en el shader.
      xRayUniforms.uCenterX.value = charCenter.x;
      xRayUniforms.uTorsoHalfWidth.value = charSize.x * 0.16;

      // Inyectar shader en cada mesh del personaje
      model.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (obj.name === "chair_0") return;
        if (hiddenNames.includes(obj.name)) return;
        applyXRayToMesh(mesh);
      });

      // ═══════════════════════════════════════════════════════════════
      //  SCROLLTrigger X-RAY: SOLO cuando ya está de pie (#about-me)
      //  El 100% de la transformación (personaje "parado", ya del todo
      //  holograma) coincide con el FINAL de #about-me ("bottom top": el
      //  borde inferior de la sección llega arriba del todo), no con un
      //  punto intermedio — así el personaje sigue "formándose" durante
      //  toda la sección en vez de quedarse completo a medias.
      // ═══════════════════════════════════════════════════════════════
      gsap.to(xRayUniforms.uReveal, {
        value: 1.0,
        ease: "none",
        scrollTrigger: {
          trigger: "#about-me",
          start: "top 100%",
          end: "bottom 110%",
          scrub: true,
          onUpdate: (self) => {
            // El trigger de #about (más arriba) desactiva el parallax de
            // ratón mientras el personaje se pone de pie (coreografía de
            // scroll, no debe interferir el ratón) y lo deja así porque no
            // se vuelve a actualizar una vez su progreso se queda fijo en
            // 1. Aquí se reactiva en cuanto se entra de verdad en
            // #about-me (self.isActive): personaje/base/etiquetas ya están
            // quietos esperando el scroll del holograma, así que el ratón
            // puede volver a orbitar la cámara como en el Hero. Al salir
            // de #about-me (hacia #about o hacia Proyectos) se desactiva
            // otra vez.
            setOrbitScrollActive(!self.isActive);
          },
        },
      });

      // Bind pose local de cada hueso, reconstruida desde skeleton
      // .boneInverses (matrices mundo→hueso en la pose de descanso):
      // local_bind(i) = bindWorld(padre)^-1 * bindWorld(i).
      let skinnedMesh: THREE.SkinnedMesh | null = null;
      model.traverse((o) => {
        if (!skinnedMesh && (o as THREE.SkinnedMesh).isSkinnedMesh) {
          skinnedMesh = o as THREE.SkinnedMesh;
        }
      });
      if (skinnedMesh) {
        const skeleton = (skinnedMesh as THREE.SkinnedMesh).skeleton;
        const bindWorld = skeleton.boneInverses.map((m) => m.clone().invert());
        skeleton.bones.forEach((bone, i) => {
          const parentIdx = skeleton.bones.indexOf(bone.parent as THREE.Bone);
          // Los huesos raíz (sin padre dentro del esqueleto) se dejan como
          // están: su transform lo maneja la animación/armature.
          if (parentIdx < 0) return;
          scratchM.copy(bindWorld[parentIdx]).invert().multiply(bindWorld[i]);
          const bindPos = new THREE.Vector3();
          const bindQuat = new THREE.Quaternion();
          scratchM.decompose(bindPos, bindQuat, scratchV);
          bindBones.push({
            bone,
            bindPos,
            bindQuat,
            basePos: new THREE.Vector3(),
            baseQuat: new THREE.Quaternion(),
          });
        });

        const shoulderL = model.getObjectByName("ShoulderL_50") as THREE.Bone | undefined;
        const shoulderR = model.getObjectByName("ShoulderR_68") as THREE.Bone | undefined;
        if (shoulderL) armBones.push({ bone: shoulderL, angle: () => armDownAngleL });
        if (shoulderR) armBones.push({ bone: shoulderR, angle: () => armDownAngleR });

        headBone = (model.getObjectByName("Head_31") as THREE.Bone | undefined) ?? null;
        feetBoneL = (model.getObjectByName("FootL_73") as THREE.Bone | undefined) ?? null;
        feetBoneR = (model.getObjectByName("FootR_78") as THREE.Bone | undefined) ?? null;
      }

      for (const { anchor, boneName } of CALLOUT_ANCHORS) {
        const bone = model.getObjectByName(boneName) as THREE.Bone | undefined;
        const el = document.querySelector<HTMLElement>(`.about-callout[data-anchor="${anchor}"]`);
        const dot = el?.querySelector<HTMLElement>(".callout-dot");
        const line = el?.querySelector<HTMLElement>(".callout-line");
        const label = el?.querySelector<HTMLElement>(".callout-label");
        if (bone && el && dot && line && label) callouts.push({ bone, el, dot, line, label });
      }

      chair = model.getObjectByName("chair_0") ?? null;
      chairBaseRotationY = chair ? chair.rotation.y : 0;
      // Posición local original: a la que se vuelve si se hace scroll hacia
      // arriba y la silla deja de estar clavada en pantalla.
      if (chair) chairBaseLocalPos.copy(chair.position);

      wrapper.classList.add("is-loaded");
      resize();
      finishLoad("hero-character");
    },
    undefined,
    (error) => {
      console.error("No se pudo cargar /models/scene.glb", error);
      finishLoad("hero-character");
    }
  );

  resize();
  window.addEventListener("resize", resize);

  let running = true;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    // El clip corre con el reloj real mientras la silla gira, y se congela
    // DONDE ESTÉ justo cuando el personaje empieza a levantarse: no se
    // fuerza ningún frame concreto, simplemente se deja de avanzar el
    // reloj. Así no hay salto (la pose de partida es la del último frame
    // vivo) y la silla queda clavada en su posición de ese instante. Las
    // correcciones de huesos no dependen de que sea un frame concreto:
    // interpolan desde la pose que haya hacia la bind pose (ver faceT).
    if (mixer && !frozen) {
      mixer.setTime(performance.now() / 1000);
    }
    if (character) {
      character.rotation.y = characterBaseRotationY + chairRotateT * CHAIR_TURN_ANGLE + faceT * FACE_TURN_ANGLE;
      // Ni la silla ni el personaje se deslizan hacia atrás: la silla solo
      // gira y el personaje no se mueve del sitio, su viaje hacia el centro
      // lo hace la cámara (centerT), no una traslación física del cuerpo.
      if (characterBaseScale) {
        const scaleFactor = (1 - scaleT * SHRINK_AMOUNT) * (1 - xRayUniforms.uReveal.value * HOLOGRAM_SHRINK_AMOUNT);
        character.scale.copy(characterBaseScale).multiplyScalar(scaleFactor);
        currentShrinkFactor = scaleFactor;
      }

      // Ponerse de pie: interpola cada hueso desde la pose congelada (t=0
      // del clip, determinista) hacia su bind pose (de pie, brazos en T),
      // y sobre ella baja los brazos de la T a los lados.
      if (faceT > 0) {
        if (!standCaptured) {
          for (const bb of bindBones) {
            bb.basePos.copy(bb.bone.position);
            bb.baseQuat.copy(bb.bone.quaternion);
          }
          standCaptured = true;
        }
        for (const bb of bindBones) {
          bb.bone.position.lerpVectors(bb.basePos, bb.bindPos, faceT);
          bb.bone.quaternion.copy(bb.baseQuat).slerp(bb.bindQuat, faceT);
        }
        for (const ab of armBones) {
          scratchQ.setFromAxisAngle(ARM_DOWN_AXIS, ab.angle() * faceT + 0.15);
          ab.bone.quaternion.multiply(scratchQ);
        }
        if (headBone) {
          scratchQ.setFromAxisAngle(HEAD_UP_AXIS, headUpAngle * faceT);
          headBone.quaternion.multiply(scratchQ);
        }
      } else if (standCaptured) {
        // Scroll hacia arriba: restaurar la pose congelada.
        for (const bb of bindBones) {
          bb.bone.position.copy(bb.basePos);
          bb.bone.quaternion.copy(bb.baseQuat);
        }
        standCaptured = false;
      }
    }
    // La silla vive SIEMPRE en esta capa (la del personaje), que no se
    // desliza con el scroll. Antes había un "relevo" a la capa del
    // escritorio al terminar el giro, pero esa capa ya está desplazada
    // cientos de px por el tween de Main.astro en ese momento, así que la
    // silla saltaba de golpe al heredar ese transform. Quedándose aquí,
    // permanece exactamente donde termina de girar.
    if (chair) {
      chair.rotation.y = chairBaseRotationY + chairRotateT * CHAIR_TURN_ANGLE;
    }
    // Centra progresivamente el encuadre: pasa del sesgo original (a la
    // derecha, para dejar sitio al texto) a apuntar directamente a la
    // posición real del personaje — así queda centrado exacto sin importar
    // cómo giren/se muevan las demás fases, en vez de un valor fijo a ojo.
    if (modelRadius && character) {
      // Punto de partida (Hero). En compacto: sin sesgo horizontal (el
      // texto va encima, no al lado) y sesgo vertical positivo para empujar
      // la escena hacia abajo — mismo valor que hero-scene.ts, que ambas
      // capas deben coincidir píxel a píxel a scroll 0.
      lookBias.set(
        isCompactLayout ? 0 : modelRadius * 0.32,
        isCompactLayout ? modelRadius * 0.3 : -modelRadius * 0.28,
        0
      );
      // Punto de llegada (Sobre mí, personaje ya de pie).
      // characterCenterY es el centro vertical REAL de sus mallas (no un
      // valor a ojo), así el centrado vertical es exacto.
      // Ajustes finos a ojo sobre el centrado real: hacia la derecha en
      // pantalla (comprobado por captura: era al revés) y un poco más
      // arriba en el encuadre (characterCenterY solo, el centro real de las
      // mallas, dejaba al personaje demasiado abajo/cortado). El +0.17 va
      // TAMBIÉN en compacto: no es el hueco para el texto (de eso se ocupa
      // lookBias) sino la corrección de centrado real — character.position
      // es local al modelo, que a su vez está desplazado para centrar la
      // escena entera, así que sin este término el personaje sale a la
      // izquierda. En compacto solo se sube algo menos: aquí abajo está el
      // panel de etiquetas y el personaje no debe montarse encima.
      // Más negativo = personaje más arriba en pantalla. La tablet necesita
      // más que el móvil: con su pantalla más alta el mismo valor lo dejaba
      // demasiado bajo, casi tocando el panel de etiquetas.
      const centerLift = isCompactLayout
        ? (window.innerWidth < 600 ? 0.36 : 0.44)
        : 0.36;
      lookCenter.set(
        character.position.x + modelRadius * 0.17,
        characterCenterY - modelRadius * centerLift,
        character.position.z
      );
      lookTarget.lerpVectors(lookBias, lookCenter, centerT);
      // Órbita la posición de la cámara (no el punto al que mira): cambia
      // el ÁNGULO desde el que se ve la escena en vez de desplazar el
      // encuadre. mouseOrbit ya viene suavizado y compartido con
      // hero-scene.ts (mouse-orbit.ts), incluido el recentrado durante el
      // scroll — mismo criterio de signos que hero-scene.ts.
      yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -mouseOrbit.x * ORBIT_YAW_MAX);
      pitchQuat.setFromAxisAngle(orbitRightAxis, -mouseOrbit.y * ORBIT_PITCH_MAX);
      orbitedPosition.copy(basePosition).applyQuaternion(yawQuat).applyQuaternion(pitchQuat);
      camera.position.copy(orbitedPosition);
      camera.lookAt(lookTarget);
    }
    // Cámara ya colocada de este frame: a partir de aquí, proyectar/
    // desproyectar da resultados correctos (usado por callouts y silla).
    camera.updateMatrixWorld();
    // Etiquetas de "Sobre mí" anclada a huesos del cuerpo: proyecta cada
    // hueso a NDC, lo pasa a píxeles dentro del wrapper (que puede ser más
    // grande que la ventana, ver resize()) y suma el offset del wrapper
    // respecto al viewport, ya que #about-callouts es fixed+inset:0 (cubre
    // la ventana entera, no el wrapper).
    if (callouts.length && modelRadius) {
      // En compacto (móvil/tablet) las etiquetas no se anclan a huesos: el
      // CSS las apila todas en un mismo panel bajo el personaje y aquí solo
      // se decide CUÁL se ve — la última cuyo umbral ya se ha alcanzado, de
      // forma que se van relevando conforme sube el % de transformación.
      let activeIdx = -1;
      if (isCompactLayout) {
        for (let i = 0; i < callouts.length; i++) {
          const threshold = (i + 1) * REVEAL_STEP;
          if (xRayUniforms.uReveal.value >= threshold - REVEAL_FADE_BAND) activeIdx = i;
        }
      }
      for (let i = 0; i < callouts.length; i++) {
        const c = callouts[i];
        // Umbral propio por etiqueta: la 1ª (Sobre mí) al 10% de uReveal, la
        // 2ª al 20%, etc. — mismo valor que mueve el contador "% transformado".
        const threshold = (i + 1) * REVEAL_STEP;
        const t = THREE.MathUtils.clamp(
          (xRayUniforms.uReveal.value - (threshold - REVEAL_FADE_BAND)) / REVEAL_FADE_BAND,
          0,
          1
        );
        const op = smoothstep(t);

        if (isCompactLayout) {
          // Sin transform: la posición la fija el CSS (panel bajo el
          // personaje). Se limpia el que pudiera haber quedado escrito
          // desde el modo escritorio (al reducir la ventana), o el panel
          // se quedaría desplazado en la última posición del hueso.
          if (c.el.style.transform) c.el.style.transform = "";
          // 1/0 seco: el fundido lo hace la transición CSS. Usar aquí la
          // rampa `op` del umbral dejaba un hueco sin ninguna etiqueta
          // visible justo al relevarse una con la siguiente (la entrante
          // aún valía ~0 y la saliente ya estaba a 0).
          c.label.style.opacity = i === activeIdx ? "1" : "0";
          continue;
        }

        c.bone.getWorldPosition(calloutScreen);
        calloutScreen.project(camera);
        const x = (calloutScreen.x * 0.5 + 0.5) * wrapperRect.width + wrapperRect.left;
        const y = (1 - (calloutScreen.y * 0.5 + 0.5)) * wrapperRect.height + wrapperRect.top;
        c.el.style.transform = `translate(${x}px, ${y}px)`;
        c.dot.style.opacity = String(op);
        c.line.style.opacity = String(op);
        c.label.style.opacity = String(op);
      }
    }
    // Base holográfica + contador de "% transformado": ambos ligados
    // directamente a uReveal (no al scroll-stagger de los callouts), y la
    // base se posiciona a los pies del personaje cada frame (que se mueven
    // al encoger con HOLOGRAM_SHRINK_AMOUNT).
    if (character && modelRadius) {
      const revealed = xRayUniforms.uReveal.value;
      // También visible mientras el personaje se está levantando (faceT>0,
      // fase de #about), no solo cuando ya arrancó el holograma (revealed,
      // fase de #about-me) — así la base ya está ahí desde que se pone de
      // pie, en vez de aparecer de golpe más tarde. Umbral único (sin
      // histéresis): un umbral con dos velocidades de disparo distintas
      // (uno para bajar, otro para subir) provocaba parpadeo — con el scrub
      // de GSAP el scroll no es perfectamente monótono, así que cualquier
      // microoscilación entre ambos umbrales hacía que se reactivase y
      // desactivase varias veces seguidas.
      const platformActive = revealed > 0.001 || faceT > PLATFORM_FACE_T;
      if (platformActive && !platformWasActive) {
        platformEnterStart = performance.now();
      }
      if (platformActive && !platformSettled) {
        // Se recalcula cada frame MIENTRAS el personaje sigue en pleno
        // movimiento de ponerse de pie (faceT < 1): en ese tramo los huesos
        // de los pies todavía están interpolando entre la pose sentada y la
        // de pie, así que su posición varía frame a frame. Si se capturase
        // solo en el primer frame en que platformActive se vuelve true, el
        // valor congelado dependería de en qué punto exacto de esa
        // transición cayó ese frame (que varía con la velocidad de scroll:
        // scrolleando despacio se captura casi sentado → base pequeña y muy
        // abajo; scrolleando rápido se salta casi al final → base grande y
        // arriba), dando un resultado distinto cada vez que se reactiva.
        // En vez de eso, se sigue el objetivo en vivo hasta que la pose se
        // asienta del todo (faceT >= 1) y AHÍ SÍ se congela para siempre —
        // así el valor final es siempre el mismo, sea cual sea la
        // velocidad de scroll con la que se llegó.
        let feetY = characterCenterY - modelRadius * 0.9;
        let feetCenterX = character.position.x;
        let feetCenterZ = character.position.z;
        if (feetBoneL && feetBoneR) {
          feetBoneL.getWorldPosition(feetWorldL);
          feetBoneR.getWorldPosition(feetWorldR);
          feetY = Math.min(feetWorldL.y, feetWorldR.y);
          // Centrado en el punto medio ENTRE los pies reales, no en
          // character.position (que no cae exactamente entre las piernas).
          feetCenterX = (feetWorldL.x + feetWorldR.x) / 2 - 0.1;
          feetCenterZ = (feetWorldL.z + feetWorldR.z) / 2;
        }
        // El centro GEOMÉTRICO 3D ya cae exacto en los pies (comprobado
        // proyectando ambos a NDC), pero un círculo visto en este ángulo
        // tan cerrado no se PERCIBE centrado: el borde cercano a la cámara
        // ocupa más pantalla que el lejano, así que el "centro visual" del
        // óvalo queda desplazado hacia el borde lejano. Se compensa
        // desplazando el centro real hacia el lado ALEJADO de la cámara
        // (-viewDir en XZ), lo que sí se percibe centrado.
        const platformRadius = modelRadius * PLATFORM_RADIUS_FACTOR * currentShrinkFactor;
        platformFrozenX = feetCenterX - viewDir.x * platformRadius * PLATFORM_CENTER_BIAS;
        // El pivote del grupo es el CENTRO del cilindro, pero la cara de
        // arriba (platformTopRing, donde deben apoyar los pies) está a
        // +PLATFORM_HEIGHT/2 de ese pivote. Si el pivote se pone justo en
        // la suela (feetY), la mitad de arriba del cilindro queda enterrada
        // en el tobillo/zapato. Se compensa bajando el pivote esa media
        // altura (ya escalada por platformRadius, que es la escala uniforme
        // del grupo) para que la cara de arriba quede exactamente en feetY.
        platformFrozenY = feetY - (PLATFORM_HEIGHT / 2) * platformRadius;
        platformFrozenZ = feetCenterZ - viewDir.z * platformRadius * PLATFORM_CENTER_BIAS;
        platformFrozenRadius = platformRadius;
        if (faceT >= 1) platformSettled = true;
      }
      // Al desactivarse (scroll hacia arriba) NO desaparece: se clava en el
      // punto de PANTALLA que ocupaba justo en ese instante (para no saltar
      // de sitio) y ahí se queda parada para siempre, a la misma altura
      // exacta en la que apareció. Si se reactiva (se vuelve a bajar), se
      // suelta el pin y retoma el comportamiento normal (con
      // platformSettled a cero para volver a asentarse desde cero).
      if (platformActive) {
        platformScreenPinned = false;
      } else {
        platformSettled = false;
        if (platformWasActive && !platformScreenPinned) {
          platformPinWorld.set(platformFrozenX, platformFrozenY, platformFrozenZ);
          platformPinNdc.copy(platformPinWorld).project(camera);
          platformScreenPinned = true;
          platformSlideAwayStart = performance.now();
        }
      }
      platformWasActive = platformActive;

      // Cuánto lleva "irse con la página" desde que se desactivó: 0 justo
      // en ese instante, 1 al cabo de PLATFORM_SLIDE_AWAY_DURATION_S. Por
      // TIEMPO real, no ligado a faceT/scroll — antes usaba faceT, pero
      // desde que revealed (no faceT) es quien dispara la desactivación,
      // faceT ya podía estar a mitad de su rango en ese instante y el
      // deslizamiento arrancaba a mitad de camino en vez de desde 0 (salto
      // visible). Así siempre es lento y arranca igual, pase lo que pase
      // con faceT en ese momento.
      const platformSlideAway = platformScreenPinned
        ? smoothstep(
            Math.min(
              (performance.now() - platformSlideAwayStart) / 1000 / PLATFORM_SLIDE_AWAY_DURATION_S,
              1
            )
          )
        : 0;

      platformGroup.visible = platformActive || (platformScreenPinned && platformSlideAway < 1);

      if (platformGroup.visible) {
        let renderX = platformFrozenX;
        let renderY = platformFrozenY;
        let renderZ = platformFrozenZ;
        if (platformScreenPinned) {
          // Mismo patrón que la silla (chairPinNdc): se clava en el punto de
          // PANTALLA que ocupaba al desactivarse y desde ahí se DESLIZA HACIA
          // ABAJO al ritmo al que el contenido de la página baja mientras se
          // sube el scroll, hasta salir por abajo — en vez de quedarse pegada
          // a la pantalla para siempre. Se desproyecta con la cámara DE ESTE
          // frame para que el paneo de cámara no la mueva por su cuenta.
          platformPinWorld
            .set(
              platformPinNdc.x,
              platformPinNdc.y - platformSlideAway * PAGE_SLIDE_Y_NDC,
              platformPinNdc.z
            )
            .unproject(camera);
          renderX = platformPinWorld.x;
          renderY = platformPinWorld.y;
          renderZ = platformPinWorld.z;
        }
        const enterT = Math.min(
          (performance.now() - platformEnterStart) / 1000 / PLATFORM_ENTER_DURATION_S,
          1
        );
        const enterEased = smoothstep(enterT);
        // Desplazamiento vertical de la entrada: por debajo del todo al
        // arrancar (enterEased=0), en su sitio exacto al terminar (=1).
        const riseOffset = (1 - enterEased) * platformFrozenRadius * PLATFORM_RISE_DISTANCE_FACTOR;
        platformGroup.position.set(renderX, renderY - riseOffset, renderZ);
        // Radio pequeño a propósito: con la cámara en ángulo elevado, un
        // anillo ancho "sube" visualmente por perspectiva (su borde lejano
        // se proyecta mucho más arriba en pantalla que el cercano) y acaba
        // pareciendo que corta por las rodillas en vez de rodear los pies.
        platformGroup.scale.setScalar(platformFrozenRadius);

        // Onda de escáner: no arranca hasta que la base termina de subir
        // (enterEased llega a 1) — desde ahí crece de abajo hacia arriba
        // durante SCAN_BEAM_REVEAL_DURATION_S en vez de aparecer de golpe.
        // El tramo final de bajada (scroll hacia arriba) va atado
        // DIRECTAMENTE al contador (revealed, el mismo % que se ve en la
        // base): entre 10% y 0% las bandas se van ocultando en proporción
        // exacta a ese porcentaje, no por tiempo — así siempre terminan de
        // esconderse justo cuando el contador llega a 000, sea cual sea la
        // velocidad de scroll.
        const REVEAL_HIDE_BAND = 0.1;
        let growT: number;
        if (revealed <= REVEAL_HIDE_BAND && scanBeamHasBeenFull) {
          // Solo aplica de verdad "bajando" desde una onda ya formada — si
          // no, en un scroll rápido esto daría una vista previa a medias
          // ANTES de que la base termine de subir (ver comentario junto a
          // scanBeamHasBeenFull).
          growT = THREE.MathUtils.clamp(revealed / REVEAL_HIDE_BAND, 0, 1);
          scanBeamGrowing = false;
          scanBeamProgress = growT;
          if (growT <= 0) scanBeamHasBeenFull = false; // lista para crecer de cero la próxima vez
        } else {
          // Por encima del 10%: crecimiento normal por tiempo, gateado a
          // que la base ya esté del todo arriba (enterEased=1). OJO: usa
          // platformActive, no solo enterEased — enterEased, una vez llega
          // a 1, ya no vuelve a bajar (platformEnterStart solo se resetea
          // al reactivarse la base), así que por sí solo no serviría para
          // detectar que la base se ha desactivado.
          const baseFullyUp = platformActive && enterEased >= 0.999;
          if (baseFullyUp !== scanBeamGrowing) {
            // Cambio de sentido: se arranca la animación desde el valor
            // ACTUAL (scanBeamProgress), no desde 0 ni desde 1 — así si se
            // invierte el scroll a mitad de la animación no hay salto.
            scanBeamGrowing = baseFullyUp;
            scanBeamPhaseStart = performance.now();
            scanBeamPhaseFrom = scanBeamProgress;
          }
          const phaseT = Math.min(
            (performance.now() - scanBeamPhaseStart) / 1000 / SCAN_BEAM_REVEAL_DURATION_S,
            1
          );
          scanBeamProgress = THREE.MathUtils.lerp(
            scanBeamPhaseFrom,
            scanBeamGrowing ? 1 : 0,
            smoothstep(phaseT)
          );
          growT = scanBeamProgress;
          if (growT >= 0.999) scanBeamHasBeenFull = true;
        }
        // Mismo X/Z que la base, arrancando justo en el aro de arriba
        // (renderY - riseOffset + PLATFORM_HEIGHT/2 * radio, la cara de
        // arriba real del cilindro). Solo crece hacia arriba desde ahí: la
        // geometría en sí mide growT de su altura final, no toda de
        // entrada, y el número de bandas (repeat.y) baja en la misma
        // proporción para que no se compriman/estiren al crecer.
        const platformTopY =
          renderY - riseOffset + (PLATFORM_HEIGHT / 2) * platformFrozenRadius;
        const beamHeight = modelRadius * SCAN_BEAM_HEIGHT_FACTOR * currentShrinkFactor;
        const beamRadius = platformFrozenRadius * SCAN_BEAM_RADIUS_FACTOR;
        const beamVisibleHeight = beamHeight * growT;
        platformScanBeam.visible = growT > 0.001;
        if (platformScanBeam.visible) {
          platformScanBeam.position.set(renderX, platformTopY + beamVisibleHeight / 2, renderZ);
          platformScanBeam.scale.set(beamRadius, beamVisibleHeight, beamRadius);
          const beamMat = platformScanBeam.material as THREE.MeshBasicMaterial;
          beamMat.opacity = 0.16;
          beamMat.map!.repeat.y = SCAN_BEAM_REPEAT_FULL * growT;
          beamMat.map!.offset.y = (performance.now() / 1000) * SCAN_BEAM_SPEED;
        }

        // Sin fundido progresivo: en cuanto la base es visible aparece
        // directamente a su opacidad final.
        (platformBody.material as THREE.MeshPhysicalMaterial).opacity = 0.72;
        (platformShadow.material as THREE.MeshBasicMaterial).opacity = 0.9;
        (platformTopGlare.material as THREE.MeshBasicMaterial).opacity = 0.25;
        (platformTopRing.material as THREE.MeshBasicMaterial).opacity = 0.95;
        for (const glow of platformTopRingGlow) {
          (glow.material as THREE.MeshBasicMaterial).opacity = glow.userData.baseOpacity as number;
        }
        // De más brillante (arriba, junto al aro) a más tenue (abajo, ya
        // fundida con platformShadow) — sigue el mismo orden que RIDGE_FRACTIONS.
        // El offset de la textura (los tramos brillantes) se ata al scroll
        // (faceT + revealed cubren todo el recorrido, de pie a holograma
        // completo), no al reloj: solo se mueven mientras se hace scroll,
        // no de forma autónoma. Sentido alterno y velocidad distinta por
        // anillo para que no se vea como un solo bloque girando a la vez.
        const ridgeScrollPos = faceT + revealed;
        const now = performance.now();
        if (Math.abs(ridgeScrollPos - prevRidgeScrollPos) > 0.00001) {
          ridgeLastMoveTime = now;
        }
        prevRidgeScrollPos = ridgeScrollPos;
        const shouldScroll = now - ridgeLastMoveTime < RIDGE_SCROLL_IDLE_MS;
        if (shouldScroll !== ridgesScrolling) {
          ridgesScrolling = shouldScroll;
          for (const ridge of ridges) {
            const mat = ridge.material as THREE.MeshBasicMaterial;
            mat.map = ridgesScrolling ? (mat.userData.glowMap as THREE.Texture) : null;
            mat.color.copy(
              (ridgesScrolling ? mat.userData.scrollColor : mat.userData.baseColor) as THREE.Color
            );
            mat.needsUpdate = true;
          }
        }
        ridges.forEach((ridge, i) => {
          const t = i / (ridges.length - 1);
          const mat = ridge.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.85 - t * 0.14;
          if (ridgesScrolling && mat.map) {
            const dir = i % 2 === 0 ? 1 : -1;
            const speed = 0.6 + t * 0.5;
            mat.map.offset.x = ridgeScrollPos * speed * dir;
          }
        });

        if (counterEl && counterValueEl && !platformScreenPinned) {
          // El contador solo se muestra mientras la base está activa
          // (siguiendo/asentándose); se oculta en cuanto se clava en
          // pantalla, no tiene sentido un "%" sin holograma activo.
          counterAnchorWorld.set(renderX, renderY - modelRadius * 0.12, renderZ);
          counterAnchorWorld.project(camera);
          const cx = (counterAnchorWorld.x * 0.5 + 0.5) * wrapperRect.width + wrapperRect.left;
          const cy = (1 - (counterAnchorWorld.y * 0.5 + 0.5)) * wrapperRect.height + wrapperRect.top;
          counterEl.style.transform = `translate(${cx}px, ${cy}px)`;
          counterEl.style.opacity = "1";
          counterValueEl.textContent = String(Math.round(revealed * 100)).padStart(3, "0");
        } else if (counterEl) {
          counterEl.style.opacity = "0";
        }
      } else {
        platformScanBeam.visible = false;
        scanBeamGrowing = false;
        scanBeamProgress = 0;
        scanBeamHasBeenFull = false;
        if (counterEl) counterEl.style.opacity = "0";
      }
    }
    // Con la cámara ya colocada de este frame: cuando el personaje empieza
    // a levantarse, la silla se ancla al punto de pantalla que ocupaba en
    // ese instante (así deja de seguir al personaje aunque la cámara siga
    // centrándolo) y desde ahí se desplaza hacia arriba/derecha igual que el
    // tween de la sección, hasta salir de pantalla con el resto.
    // Se hace DESPUÉS del bloque de cámara: proyectar/desproyectar necesita
    // la cámara ya final de este frame.
    if (chair && chair.parent && modelRadius) {
      // El personaje debe quedar visualmente POR ENCIMA de la silla desde
      // que esta empieza a girar: durante el giro barre 90º alrededor del
      // cuerpo (congelado, inclinado hacia delante) y con profundidad real
      // el asiento y el respaldo lo atraviesan y lo tapan. Se fuerza
      // dibujando la silla sin escribir en el depth buffer, así el
      // personaje pinta siempre encima donde se solapen. Va aparte del pin
      // (0.17) justo porque el giro empieza mucho antes (0.005).
      if (chairBehindActive !== chairBehind) {
        setChairBehind(chair, chairBehindActive);
        chairBehind = chairBehindActive;
      }
      if (chairPinActive) {
        if (!chairPinned) {
          // Primer frame: guardar dónde cae en pantalla (NDC).
          chair.getWorldPosition(chairPinWorld);
          chairPinNdc.copy(chairPinWorld).project(camera);
          chairPinned = true;
        }
        // Recolocar en el mundo para que proyecte en el punto anclado más
        // el tramo de deslizamiento de la página que le queda por recorrer.
        chairPinWorld
          .set(
            chairPinNdc.x + chairSlideAway * PAGE_SLIDE_X_NDC,
            chairPinNdc.y + chairSlideAway * PAGE_SLIDE_Y_NDC,
            chairPinNdc.z
          )
          .unproject(camera);
        chair.parent.updateWorldMatrix(true, false);
        chair.position.copy(chair.parent.worldToLocal(chairPinWorld));
      } else if (chairPinned) {
        // Scroll hacia arriba: la silla vuelve a su sitio en la escena. La
        // profundidad normal la recupera aparte (chairBehindActive), al
        // volver por debajo del punto en que empieza a girar.
        chair.position.copy(chairBaseLocalPos);
        chairPinned = false;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    //  ACTUALIZAR UNIFORM DE TIEMPO (pulso de los circuitos)
    // ═══════════════════════════════════════════════════════════════
    xRayUniforms.uTime.value = performance.now() / 1000;

    renderer.render(scene, camera);
  }

  animate();

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) animate();
  });
}