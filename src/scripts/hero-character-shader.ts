// hero-character-shader.ts
import * as THREE from 'three';

// ── Vertex Shader ─────────────────────────────────────────────
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// ── Fragment Shader ───────────────────────────────────────────
const fragmentShader = `
  uniform float uReveal;        // 0.0 = normal, 1.0 = full circuit
  uniform float uTime;
  uniform sampler2D uMap;       // textura original del personaje (opcional)
  uniform bool uHasMap;
  uniform vec3 uCircuitColor;   // color de los circuitos (cian/eléctrico)
  uniform vec3 uBaseColor;      // color base del personaje si no hay textura

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  // Noise simple para el patrón de circuito
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Patrón de circuito procedural
  float circuitPattern(vec2 uv) {
    // Grid base
    vec2 grid = uv * 18.0;
    vec2 cell = fract(grid) - 0.5;
    vec2 id = floor(grid);

    // Líneas horizontales y verticales con grosor variable
    float lineH = smoothstep(0.15, 0.0, abs(cell.y));
    float lineV = smoothstep(0.15, 0.0, abs(cell.x));

    // Conexiones aleatorias (nodos del circuito)
    float n = noise(id * 0.7 + 0.5);
    float node = smoothstep(0.75, 0.0, length(cell));

    // Apagar algunas líneas para que parezca un PCB real
    float maskH = step(0.3, noise(id * 1.3));
    float maskV = step(0.3, noise(id * 1.7 + 10.0));

    float circuit = lineH * maskH + lineV * maskV;
    circuit = max(circuit, node * step(0.6, n));

    return circuit;
  }

  void main() {
    // ── Color base del personaje ─────────────────────────────
    vec3 baseColor = uHasMap ? texture2D(uMap, vUv).rgb : uBaseColor;

    // ── Efecto Fresnel para la silueta ───────────────────────
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.0);

    // ── Patrón de circuito ───────────────────────────────────
    float circuit = circuitPattern(vUv * 2.0 + vec2(0.0, uTime * 0.05));

    // Glow pulsante en los circuitos
    float pulse = 0.7 + 0.3 * sin(uTime * 2.0 + circuit * 10.0);
    vec3 circuitGlow = uCircuitColor * circuit * pulse * 2.5;

    // ── Máscara de barrido (de abajo-arriba o diagonal) ──────
    // Usamos coordenada world Y normalizada (ajusta los bounds a tu modelo)
    float worldY = vWorldPosition.y;
    float scanMin = -1.2;  // ajusta según la altura de tu modelo
    float scanMax = 1.8;
    float scanLine = smoothstep(scanMin, scanMax, worldY);

    // La máscara de revelado: uReveal controla dónde está el frente de onda
    float revealEdge = smoothstep(uReveal - 0.15, uReveal, scanLine);
    float revealMask = smoothstep(uReveal - 0.35, uReveal, scanLine);

    // Borde brillante del barrido (línea de escaneo)
    float scanBorder = smoothstep(uReveal - 0.02, uReveal, scanLine) 
                     - smoothstep(uReveal, uReveal + 0.05, scanLine);
    vec3 scanColor = uCircuitColor * scanBorder * 3.0;

    // ── Composición final ────────────────────────────────────
    // En zona revelada: silueta oscura + circuitos brillantes + fresnel
    vec3 xrayColor = vec3(0.02, 0.05, 0.08) + circuitGlow + fresnel * uCircuitColor * 0.5;

    // Mezcla: baseColor en negro, xray en blanco de la máscara
    vec3 finalColor = mix(baseColor, xrayColor, revealMask);
    finalColor += scanColor; // añadimos el borde del barrido

    // Opacidad: puedes hacer que la parte "rayos X" sea ligeramente translúcida
    float alpha = 1.0;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ── Factory ───────────────────────────────────────────────────
export function createXRayMaterial(map?: THREE.Texture | null) {
  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uReveal: { value: 0.0 },
      uTime: { value: 0.0 },
      uMap: { value: map || null },
      uHasMap: { value: !!map },
      uCircuitColor: { value: new THREE.Color('#00d4ff') }, // cian eléctrico
      uBaseColor: { value: new THREE.Color('#e0e0e0') },
    },
    transparent: true,
    side: THREE.DoubleSide, // importante para ver la silueta por detrás
  });
  return mat;
}