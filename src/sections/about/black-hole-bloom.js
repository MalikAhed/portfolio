import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const WORLD_WIDTH = 2048;
const WORLD_HEIGHT = 1152;
const WORLD_CENTER_X = WORLD_WIDTH / 2;
const WORLD_CENTER_Y = WORLD_HEIGHT / 2;
const PATH_LENGTH = 1000;
const MAX_DEVICE_PIXEL_RATIO = 1;

/*
 * Depth-world / transition object contract
 *
 * World position and responsive scale are inherited from the DOM
 * .black-hole-object (2048 × 1152 authored coordinates). This transparent
 * canvas sits above the supplied black-hole image and below the SVG fallback,
 * crosses Hero/About boundaries with its parent, and shares the parent's
 * entrance, focus, absorption, and exit states. Reduced motion holds the dash
 * system at a coherent static frame; visibility and page activity suspend its
 * render loop. Width/density rebuild geometry, while speed and Unreal Bloom
 * parameters remain centralized in black-hole.js editor state.
 */
const vertexShader = /* glsl */ `
  attribute float orbitDistance;
  attribute float edgeFade;
  attribute float lineAcross;

  varying float vOrbitDistance;
  varying float vEdgeFade;
  varying float vLineAcross;

  void main() {
    vOrbitDistance = orbitDistance;
    vEdgeFade = edgeFade;
    vLineAcross = lineAcross;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 innerColor;
  uniform vec3 outerColor;
  uniform vec4 dashPatternA;
  uniform vec2 dashPatternB;
  uniform float dashOffset;
  uniform float lineOpacity;
  uniform vec2 viewport;

  varying float vOrbitDistance;
  varying float vEdgeFade;
  varying float vLineAcross;

  void main() {
    float positionInPattern = mod(
      vOrbitDistance + dashOffset + ${PATH_LENGTH.toFixed(1)},
      ${PATH_LENGTH.toFixed(1)}
    );
    float firstEnd = dashPatternA.x;
    float secondStart = firstEnd + dashPatternA.y;
    float secondEnd = secondStart + dashPatternA.z;
    float thirdStart = secondEnd + dashPatternA.w;
    float thirdEnd = thirdStart + dashPatternB.x;
    float dashDistance = min(
      min(abs(positionInPattern - firstEnd), abs(positionInPattern - secondStart)),
      min(abs(positionInPattern - secondEnd), min(abs(positionInPattern - thirdStart), abs(positionInPattern - thirdEnd)))
    );
    float dashWindow = step(positionInPattern, firstEnd) +
      step(secondStart, positionInPattern) * step(positionInPattern, secondEnd) +
      step(thirdStart, positionInPattern) * step(positionInPattern, thirdEnd);
    float dashEdge = max(1.0, 2.0 / max(viewport.x, 1.0));
    float dashAlpha = dashWindow * (1.0 - smoothstep(0.0, dashEdge, dashDistance));

    float across = abs(vLineAcross);
    float core = 1.0 - smoothstep(0.0, 0.72, across);
    float lineEdge = 1.0 - smoothstep(0.7, 1.0, across);
    float alpha = lineOpacity * vEdgeFade * lineEdge * dashAlpha;
    vec3 color = mix(outerColor, innerColor, core);
    gl_FragColor = vec4(color, alpha);
  }
`;

// UnrealBloomPass intentionally writes opaque blur targets because the
// official example owns its black page background. Here the final pass turns
// the tone-mapped bloom back into premultiplied-alpha pixels. Alpha follows
// the brightest channel, so a dim halo remains a halo instead of becoming an
// opaque grey rectangle around the transparent black-hole image.
const transparentBloomShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      float alpha = max(max(color.r, color.g), color.b);
      if (alpha < 0.001) discard;
      gl_FragColor = vec4(color, alpha);
    }
  `,
};

function transformPoint(point, kind, state) {
  let x = point.x;
  let y = point.y;

  if (kind === "rim") {
    y = WORLD_CENTER_Y + (y - WORLD_CENTER_Y) * state.orbitHeight;
  } else {
    x = WORLD_CENTER_X + (x - WORLD_CENTER_X) * state.topScale + state.topX;
    y =
      WORLD_CENTER_Y +
      (y - WORLD_CENTER_Y) * state.topScale * state.topHeight +
      state.topY;
  }

  return new THREE.Vector2(
    WORLD_CENTER_X + (x - WORLD_CENTER_X) * state.orbitScale + state.orbitX,
    WORLD_CENTER_Y + (y - WORLD_CENTER_Y) * state.orbitScale + state.orbitY,
  );
}

function interpolateEdgeFade(progress) {
  const stops = [
    [0, 0],
    [0.22, 0.72],
    [0.52, 0.9],
    [0.78, 0.66],
    [1, 0],
  ];

  for (let index = 1; index < stops.length; index += 1) {
    const [rightPosition, rightValue] = stops[index];
    if (progress > rightPosition) continue;
    const [leftPosition, leftValue] = stops[index - 1];
    const localProgress =
      (progress - leftPosition) / (rightPosition - leftPosition);
    return THREE.MathUtils.lerp(leftValue, rightValue, localProgress);
  }

  return 0;
}

function createRibbonGeometry(path, kind, state, width) {
  const sourceLength = path.getTotalLength();
  const closed = kind === "rim";
  const segmentCount = THREE.MathUtils.clamp(
    Math.ceil(sourceLength / 14),
    80,
    180,
  );
  const points = [];

  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const sourcePoint = path.getPointAtLength(sourceLength * progress);
    points.push(transformPoint(sourcePoint, kind, state));
  }

  const positions = new Float32Array((segmentCount + 1) * 2 * 3);
  const distances = new Float32Array((segmentCount + 1) * 2);
  const edgeFades = new Float32Array((segmentCount + 1) * 2);
  const lineAcross = new Float32Array((segmentCount + 1) * 2);
  const indices = new Uint32Array(segmentCount * 6);
  const halfWidth = (width * state.orbitScale) / 2;
  let minimumX = Infinity;
  let maximumX = -Infinity;

  points.forEach((point) => {
    minimumX = Math.min(minimumX, point.x);
    maximumX = Math.max(maximumX, point.x);
  });

  for (let index = 0; index <= segmentCount; index += 1) {
    const previousIndex =
      index === 0 ? (closed ? segmentCount - 1 : 0) : index - 1;
    const nextIndex =
      index === segmentCount ? (closed ? 1 : segmentCount) : index + 1;
    const tangent = points[nextIndex]
      .clone()
      .sub(points[previousIndex])
      .normalize();
    const normal = new THREE.Vector2(-tangent.y, tangent.x).multiplyScalar(
      halfWidth,
    );
    const progress = index / segmentCount;
    const xProgress =
      (points[index].x - minimumX) / Math.max(1, maximumX - minimumX);
    const fade = kind === "rim" ? interpolateEdgeFade(xProgress) : 1;

    [normal, normal.clone().multiplyScalar(-1)].forEach((offset, side) => {
      const vertexIndex = index * 2 + side;
      const positionIndex = vertexIndex * 3;
      positions[positionIndex] = points[index].x + offset.x;
      positions[positionIndex + 1] = points[index].y + offset.y;
      positions[positionIndex + 2] = 0;
      distances[vertexIndex] = progress * PATH_LENGTH;
      edgeFades[vertexIndex] = fade;
      lineAcross[vertexIndex] = side === 0 ? 1 : -1;
    });
  }

  for (let index = 0; index < segmentCount; index += 1) {
    const indexOffset = index * 6;
    const vertexOffset = index * 2;
    indices[indexOffset] = vertexOffset;
    indices[indexOffset + 1] = vertexOffset + 1;
    indices[indexOffset + 2] = vertexOffset + 2;
    indices[indexOffset + 3] = vertexOffset + 1;
    indices[indexOffset + 4] = vertexOffset + 3;
    indices[indexOffset + 5] = vertexOffset + 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute(
    "orbitDistance",
    new THREE.BufferAttribute(distances, 1),
  );
  geometry.setAttribute("edgeFade", new THREE.BufferAttribute(edgeFades, 1));
  geometry.setAttribute("lineAcross", new THREE.BufferAttribute(lineAcross, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}

function readDashPattern(path) {
  const value = path.style.getPropertyValue("--orbit-dash-pattern").trim();
  const pattern = value.split(/\s+/).map(Number);
  return pattern.length === 6 && pattern.every(Number.isFinite)
    ? pattern
    : [320, 80, 180, 80, 120, 220];
}

function readDashPhase(path) {
  const phase = Number(path.style.getPropertyValue("--orbit-phase"));
  return Number.isFinite(phase) ? phase : 0;
}

function getLineFactors(path) {
  if (path.classList.contains("black-hole-orbit-line--fine")) {
    return { opacity: 0.7, width: 0.5 };
  }
  if (path.classList.contains("black-hole-orbit-line--semicircle")) {
    return { opacity: 0.86, width: 0.72 };
  }
  return { opacity: 1, width: 1 };
}

function createOrbitMesh(path, kind, state) {
  const factors = getLineFactors(path);
  const width =
    (kind === "rim" ? state.lineWidth : state.topWidth) * factors.width;
  const opacity =
    (kind === "rim" ? state.lineOpacity : state.topOpacity) * factors.opacity;
  const pattern = readDashPattern(path);
  const track = path.closest(".black-hole-orbit-track");
  const direction = path.classList.contains("black-hole-orbit-line--clockwise")
    ? -1
    : 1;
  const baseDuration = Number(track?.dataset.baseDuration) || 8;
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
      innerColor: { value: new THREE.Color(state.lineInnerColor) },
      outerColor: { value: new THREE.Color(state.lineOuterColor) },
      dashPatternA: {
        value: new THREE.Vector4(
          pattern[0],
          pattern[1],
          pattern[2],
          pattern[3],
        ),
      },
      dashPatternB: { value: new THREE.Vector2(pattern[4], pattern[5]) },
      dashOffset: { value: readDashPhase(path) },
      lineOpacity: { value: opacity },
      viewport: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader,
    fragmentShader,
  });
  const mesh = new THREE.Mesh(
    createRibbonGeometry(path, kind, state, width),
    material,
  );
  mesh.frustumCulled = false;
  mesh.userData.baseDuration = baseDuration;
  mesh.userData.basePhase = readDashPhase(path);
  mesh.userData.direction = direction;
  mesh.userData.kind = kind;
  mesh.userData.opacityFactor = factors.opacity;
  return mesh;
}

export function createBlackHoleBloom({
  object,
  rimGroup,
  crownGroup,
  reducedMotion,
}) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    0,
    WORLD_WIDTH,
    0,
    WORLD_HEIGHT,
    -1,
    1,
  );
  camera.position.z = 1;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      // Bloom softens the ribbon edges itself; multisampling only duplicates
      // work and caused a long shader warmup before the lines appeared.
      antialias: true,
      alpha: true,
      depth: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
  } catch (error) {
    console.warn("Black-hole bloom is unavailable; using SVG orbits.", error);
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO),
  );
  renderer.domElement.className = "black-hole-bloom";
  renderer.domElement.setAttribute("aria-hidden", "true");
  object.append(renderer.domElement);

  // The core RenderPass → UnrealBloomPass → OutputPass order and tuning match
  // the official example. One final pass adapts its opaque-page output for
  // this world's transparent overlay contract.
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(Math.max(1, object.clientWidth), Math.max(1, object.clientHeight)),
    1.5,
    0.4,
    0.85,
  );
  bloomPass.threshold = 0;
  bloomPass.strength = 1;
  bloomPass.radius = 0.5;
  const transparentBloomPass = new ShaderPass(transparentBloomShader);
  const outputPass = new OutputPass();
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);
  composer.addPass(transparentBloomPass);

  const orbitMeshes = new THREE.Group();
  scene.add(orbitMeshes);
  let elapsedSeconds = 0;
  let previousTime = 0;
  let animationFrame = 0;
  let active = false;
  let orbitSpeed = 1;
  let geometrySignature = "";
  let appearanceSignature = "";
  let disposed = false;

  function renderFrame() {
    composer.render();
  }

  function resize() {
    // Layout dimensions stay stable while the narrative scales the world
    // object from zero; transformed client rects do not.
    const width = Math.max(1, object.clientWidth);
    const height = Math.max(1, object.clientHeight);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    orbitMeshes.children.forEach((mesh) => {
      mesh.material.uniforms.viewport.value.set(width, height);
    });
    renderFrame();
  }

  function updateDashOffsets() {
    orbitMeshes.children.forEach((mesh) => {
      const travel =
        (elapsedSeconds * orbitSpeed * PATH_LENGTH) /
        mesh.userData.baseDuration;
      mesh.material.uniforms.dashOffset.value =
        mesh.userData.basePhase + mesh.userData.direction * travel;
    });
  }

  function animate(time) {
    animationFrame = 0;
    if (!active || disposed) return;
    if (previousTime) {
      elapsedSeconds += Math.min(0.05, (time - previousTime) / 1000);
    }
    previousTime = time;
    updateDashOffsets();
    renderFrame();
    animationFrame = window.requestAnimationFrame(animate);
  }

  function disposeMeshes() {
    orbitMeshes.children.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    orbitMeshes.clear();
  }

  function sync(state) {
    const rimPaths = Array.from(rimGroup.querySelectorAll("path"));
    const crownPaths = Array.from(crownGroup.querySelectorAll("path"));
    const signature = JSON.stringify([
      rimPaths.length,
      crownPaths.length,
      state.orbitX,
      state.orbitY,
      state.orbitScale,
      state.orbitHeight,
      state.lineWidth,
      state.topX,
      state.topY,
      state.topScale,
      state.topHeight,
      state.topWidth,
    ]);
    const nextAppearanceSignature = JSON.stringify([
      state.lineOpacity,
      state.topOpacity,
      state.lineInnerColor,
      state.lineOuterColor,
      state.glowThreshold,
      state.glowStrength,
      state.glowRadius,
      state.glowExposure,
    ]);
    const appearanceChanged = nextAppearanceSignature !== appearanceSignature;
    appearanceSignature = nextAppearanceSignature;
    orbitSpeed = state.orbitSpeed;
    bloomPass.threshold = state.glowThreshold;
    bloomPass.strength = state.glowStrength;
    bloomPass.radius = state.glowRadius;
    const innerColor = new THREE.Color(state.lineInnerColor);
    const outerColor = new THREE.Color(state.lineOuterColor);
    bloomPass.bloomTintColors.forEach((color) => color.copy(outerColor));
    renderer.toneMappingExposure = Math.pow(state.glowExposure, 4);
    orbitMeshes.children.forEach((mesh) => {
      mesh.material.uniforms.innerColor.value.copy(innerColor);
      mesh.material.uniforms.outerColor.value.copy(outerColor);
      const opacity =
        mesh.userData.kind === "rim" ? state.lineOpacity : state.topOpacity;
      mesh.material.uniforms.lineOpacity.value =
        opacity * mesh.userData.opacityFactor;
    });
    if (signature === geometrySignature) {
      if (appearanceChanged) renderFrame();
      return;
    }
    geometrySignature = signature;
    disposeMeshes();
    rimPaths.forEach((path) =>
      orbitMeshes.add(createOrbitMesh(path, "rim", state)),
    );
    crownPaths.forEach((path) =>
      orbitMeshes.add(createOrbitMesh(path, "crown", state)),
    );
    updateDashOffsets();
    renderFrame();
    object.classList.add("has-black-hole-bloom");
  }

  function setActive(nextActive) {
    active = Boolean(nextActive) && !reducedMotion.matches;
    previousTime = 0;
    if (active && !animationFrame) {
      animationFrame = window.requestAnimationFrame(animate);
    } else if (!active && animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      renderFrame();
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(object);
  resize();

  return {
    sync,
    setActive,
    resize,
    dispose() {
      disposed = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      disposeMeshes();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      object.classList.remove("has-black-hole-bloom");
    },
  };
}
