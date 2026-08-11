import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mouseOrbit, setOrbitScrollActive } from "./mouse-orbit";
import { beginLoad, finishLoad } from "./page-loader";

gsap.registerPlugin(ScrollTrigger);

// Capa del ESCRITORIO (todo menos el personaje y su silla): esta capa sí se
// desliza con la tarjeta del hero. Personaje y silla viven en
// hero-character.ts — una capa fija que no se mueve con el scroll.
//
// La silla está SIEMPRE oculta aquí. Vive en la capa del personaje para que
// la oclusión de profundidad tape el culo correctamente al girar, y se
// queda ahí: pasarla a esta capa la haría saltar de golpe, porque cuando
// termina el giro esta capa ya está desplazada cientos de px por el tween
// de Main.astro.

const canvas = document.getElementById("hero-canvas") as HTMLCanvasElement | null;
const wrapper = document.getElementById("hero-visual");

if (canvas && wrapper) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ── Lighting ──────────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight(0xffffff, 0xddddee, 1.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(4, 6, 6);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-5, 2, -3);
  scene.add(fillLight);

  ScrollTrigger.create({
    trigger: "#about",
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      // En cuanto se hace scroll (progress > 0), el parallax de ratón se
      // desactiva: la órbita se recentra sola (ver mouse-orbit.ts).
      setOrbitScrollActive(self.progress > 0);
    }
  });

  // Ángulo 3/4 elevado, desde el lado opuesto al que enfoca la parte
  // trasera del portátil, para ver la pantalla y al personaje trabajando.
  const viewDir = new THREE.Vector3(-0.55, 0.5, -0.85).normalize();
  let modelRadius = 0;

  // ── Parallax de ratón: orbita la cámara, no desplaza la mirada ────
  // Al mover el ratón, la CÁMARA gira ligeramente alrededor de la escena
  // (como una órbita): hacia abajo se ve un poco desde más abajo, hacia
  // arriba desde más arriba. El punto al que mira (lookAt) no cambia, solo
  // la posición de la cámara — así cambia el ÁNGULO en vez de desplazar el
  // encuadre. mouseOrbit.x/y (mouse-orbit.ts) ya vienen suavizados y
  // compartidos con hero-character.ts, así ambas capas orbitan exactamente
  // igual y la silla no "salta" al relevarse entre capas.
  const ORBIT_YAW_MAX = THREE.MathUtils.degToRad(10);
  const ORBIT_PITCH_MAX = THREE.MathUtils.degToRad(7);

  const basePosition = new THREE.Vector3();
  const baseLookAt = new THREE.Vector3();
  // En escritorio el texto vive a la izquierda de la escena, así que la
  // cámara mira un poco a la izquierda de centro para dejarle sitio (ver
  // fitCameraToModel). En móvil/tablet (≤999px, mismo corte que
  // main.css) el texto va ENCIMA de la escena, no al lado — ese sesgo ya
  // no tiene sentido y descentraría el escritorio bajo el nombre.
  let isCompactLayout = window.innerWidth < 1000;
  // Eje "derecha" de la cámara en su pose neutra: eje de giro para el pitch
  // (arriba/abajo). Se calcula una sola vez sobre viewDir, no cada frame,
  // para que el giro sea estable y no realimente sobre sí mismo.
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
      // Menor factor = cámara más cerca = escena más grande.
      // El encuadre va por hFov, que depende del aspect: un móvil estrecho
      // da un hFov pequeño → mucha distancia → escena diminuta, y por eso
      // necesita acercarse. Una tablet tiene el aspect bastante más ancho,
      // así que con ese mismo 0.5 la escena se sale de pantalla: necesita su
      // propio factor. IMPORTANTE: hero-character.ts usa exactamente los
      // mismos valores — son dos capas que deben coincidir píxel a píxel.
      const fit = isCompactLayout ? (window.innerWidth < 600 ? 0.5 : 0.78) : 0.72;
      const distance = (modelRadius / Math.sin(hFov / 2)) * fit;
      camera.position.copy(viewDir).multiplyScalar(distance);
    }
    basePosition.copy(camera.position);
    // Mirar un poco a la izquierda/abajo del centro empuja visualmente al
    // personaje hacia la derecha y arriba del encuadre, dejando aire junto
    // al texto — solo en escritorio (ver isCompactLayout más arriba). En
    // compacto el canvas ya ocupa solo la franja de abajo, así que
    // cualquier sesgo aquí sacaría al modelo de esa franja: se centra.
    // En compacto no hay texto al lado (va encima), así que sin sesgo
    // horizontal; y sesgo vertical POSITIVO: mirar por encima del modelo lo
    // empuja hacia abajo en el encuadre, que es donde debe quedar la escena
    // en el Hero móvil (título en el tercio de arriba).
    baseLookAt.set(
      isCompactLayout ? 0 : modelRadius * 0.32,
      isCompactLayout ? modelRadius * 0.3 : -modelRadius * 0.28,
      0
    );
    camera.lookAt(baseLookAt);
  }

  function resize() {
    if (!canvas || !wrapper) return;
    isCompactLayout = window.innerWidth < 1000;
    const { clientWidth, clientHeight } = wrapper;
    // El canvas sobresale por debajo de la ventana (bottom:-35% en
    // .hero-visual) solo como lienzo extra para los pies/silla. El encuadre
    // se calcula como si terminara donde siempre (12% arriba + 100vh + 1%
    // abajo = 113vh) y setViewOffset extiende el frustum hacia abajo para
    // rellenar el resto sin alterar la parte visible.
    const frameHeight = Math.min(clientHeight, window.innerHeight * 1.13);
    camera.aspect = clientWidth / frameHeight;
    camera.setViewOffset(clientWidth, frameHeight, 0, 0, clientWidth, clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
    fitCameraToModel();
  }

  // Bounding box solo de las mallas: los huesos/empties de una animación de
  // Mixamo pueden inflar muchísimo el box de Box3.setFromObject(model).
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

  const loader = new GLTFLoader();
  beginLoad("hero-scene");
  loader.load(
    "/models/scene.glb",
    (gltf) => {
      const model = gltf.scene;

      // Centrar el modelo en el origen según su bounding box (de la escena
      // completa, personaje incluido, para coincidir con hero-character.ts).
      const box = computeMeshBounds(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      const sphere = box.getBoundingSphere(new THREE.Sphere());
      modelRadius = sphere.radius;

      // El personaje se pinta en su propia capa (hero-character.ts).
      const armature = model.getObjectByName("Armature_92");
      if (armature) armature.visible = false;

      // La silla se pinta siempre en la capa del personaje, nunca aquí
      // (ver comentario de cabecera).
      const chair = model.getObjectByName("chair_0");
      if (chair) chair.visible = false;

      scene.add(model);

      wrapper.classList.add("is-loaded");
      resize();
      finishLoad("hero-scene");
    },
    undefined,
    (error) => {
      console.error("No se pudo cargar /models/scene.glb", error);
      finishLoad("hero-scene");
    }
  );

  resize();
  window.addEventListener("resize", resize);

  let running = true;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    if (modelRadius) {
      // Órbita la posición de la cámara alrededor del origen: ratón abajo
      // (mouseOrbit.y > 0) → pitch negativo → cámara más abajo, mirando un
      // poco hacia arriba; ratón arriba → cámara más arriba, mirando hacia
      // abajo. mouseOrbit ya viene suavizado y compartido (mouse-orbit.ts).
      yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -mouseOrbit.x * ORBIT_YAW_MAX);
      pitchQuat.setFromAxisAngle(orbitRightAxis, -mouseOrbit.y * ORBIT_PITCH_MAX);
      orbitedPosition.copy(basePosition).applyQuaternion(yawQuat).applyQuaternion(pitchQuat);
      camera.position.copy(orbitedPosition);
      camera.lookAt(baseLookAt);
    }
    renderer.render(scene, camera);
  }
  animate();

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) animate();
  });
}
