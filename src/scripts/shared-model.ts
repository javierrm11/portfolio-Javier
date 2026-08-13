import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// hero-scene.ts (escritorio) y hero-character.ts (personaje + silla) son dos
// capas separadas que cargaban CADA UNA su propia copia de /models/scene.glb
// — dos peticiones de red y dos copias completas de geometría/texturas
// residentes en GPU a la vez, solo para mostrar/ocultar partes distintas del
// mismo modelo. Aquí se descarga y parsea UNA sola vez (promesa cacheada,
// compartida entre los dos scripts) y cada capa clona su propia jerarquía de
// objetos con SkeletonUtils.clone (ver hero-scene.ts/hero-character.ts):
// geometría y materiales se reutilizan por referencia, solo se duplican los
// nodos ligeros (huesos incluidos) — cada capa sigue pudiendo ocultar/mover/
// animar su copia de forma independiente.
export type SharedModel = { scene: THREE.Group; animations: THREE.AnimationClip[] };

let modelPromise: Promise<SharedModel> | null = null;

export function loadSharedModel(): Promise<SharedModel> {
  if (!modelPromise) {
    const loader = new GLTFLoader();
    modelPromise = new Promise((resolve, reject) => {
      loader.load(
        "/models/scene.glb",
        (gltf) => resolve({ scene: gltf.scene, animations: gltf.animations }),
        undefined,
        reject
      );
    });
  }
  return modelPromise;
}