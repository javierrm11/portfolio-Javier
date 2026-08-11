import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Escena estática independiente (mismo enfoque que se usó en "Sobre mí"):
// el personaje del hero, de cintura para arriba, sin escritorio, al lado
// del portátil de la sección de proyectos.

const canvas = document.getElementById("projects-canvas") as HTMLCanvasElement | null;
const wrapper = document.querySelector<HTMLElement>(".projects-character");

// Por debajo de 1200px este personaje no se muestra (proyectos.css lo
// oculta, mismo corte que el header): sin esta guarda se seguiría
// descargando el .glb entero y creando un contexto WebGL de más para
// renderizar algo invisible — justo en los dispositivos con menos margen
// de rendimiento. El umbral coincide con el del CSS a propósito.
if (canvas && wrapper && window.innerWidth >= 1200) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xddddee, 1.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(3, 6, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-4, 2, -3);
  scene.add(fillLight);

  // Vista frontal, ligeramente elevada, centrada.
  const viewDir = new THREE.Vector3(0.15, 0.08, 1).normalize();
  let modelRadius = 0;

  function fitCamera() {
    if (!modelRadius) return;
    // Encuadre por altura siempre (no por aspect ratio): el objetivo es un
    // recorte de cintura para arriba consistente, sea cual sea el ancho
    // del contenedor.
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distance = (modelRadius / Math.sin(vFov / 2)) * 0.68;
    camera.position.copy(viewDir).multiplyScalar(distance);
    camera.lookAt(0, modelRadius * 0.05, 0);
  }

  function resize() {
    if (!canvas || !wrapper) return;
    const { clientWidth, clientHeight } = wrapper;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
    fitCamera();
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

  const hiddenNames = [
    "chair_0", "table_107", "laptop_8", "book_5", "book2_6", "headphones_94",
    "lamp_95", "mug_96", "pencil_97", "phone_98", "Cube001_103", "Cube002_104",
    "Cube004_105", "Cube005_106", "Plane002_7", "Plane_93",
  ];

  function poseStanding(model: THREE.Object3D) {
    const rotate = (name: string, axis: THREE.Vector3, angle: number) => {
      const bone = model.getObjectByName(name) as THREE.Bone | undefined;
      if (!bone) return;
      const delta = new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), angle);
      bone.quaternion.multiply(delta);
    };
    const X = new THREE.Vector3(1, 0, 0);
    rotate("ThighL_75", X, 0.5);
    rotate("ThighR_80", X, 0.5);
    rotate("CalfL_74", X, -0.45);
    rotate("CalfR_79", X, -0.45);
    rotate("Torso1_82", X, 0.15);
    rotate("Torso2_71", X, 0.12);
    rotate("Torso3_70", X, 0.1);

    // Brazo señalando hacia el portátil.
    const Y = new THREE.Vector3(0, 1, 0);
    const Z = new THREE.Vector3(0, 0, 1);
    rotate("ShoulderR_68", Z, -1.0);
    rotate("ShoulderR_68", X, -0.3);
    rotate("ForearmR_67", Y, -0.4);

    // Cabeza mirando hacia arriba (no hacia abajo, que parece triste).
    rotate("Head_31", X, -0.5);
    rotate("Neck_33", X, -0.2);
  }

  const loader = new GLTFLoader();
  loader.load(
    "/models/scene.glb",
    (gltf) => {
      const model = gltf.scene;

      for (const name of hiddenNames) {
        const obj = model.getObjectByName(name);
        if (obj) obj.visible = false;
      }

      poseStanding(model);
      model.updateWorldMatrix(true, true);

      const box = computeMeshBounds(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      // Girado hacia la izquierda, mirando hacia el portátil (que queda a
      // ese lado, ya que el personaje está a la derecha de la pantalla).
      model.rotation.y = THREE.MathUtils.degToRad(-35);

      const sphere = box.getBoundingSphere(new THREE.Sphere());
      modelRadius = sphere.radius;

      scene.add(model);
      resize();
    },
    undefined,
    (error) => console.error("No se pudo cargar /models/scene.glb", error)
  );

  resize();
  window.addEventListener("resize", resize);

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}
