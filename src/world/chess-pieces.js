import * as THREE from "three";

const PIECE_WORLD_Z = 7.02;
const ACTIVE_DISTANCE = 7;

function createLathePiece(profile, material) {
  const points = profile.map(
    ([radius, height]) => new THREE.Vector2(radius, height),
  );
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 18), material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function createPawn(material) {
  const piece = createLathePiece(
    [
      [0, 0],
      [0.34, 0],
      [0.4, 0.08],
      [0.28, 0.17],
      [0.2, 0.52],
      [0.29, 0.64],
      [0.23, 0.7],
      [0, 0.94],
    ],
    material,
  );
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 16), material);
  head.position.y = 0.92;
  piece.add(head);
  return piece;
}

function createBishop(material) {
  const piece = createLathePiece(
    [
      [0, 0],
      [0.4, 0],
      [0.45, 0.08],
      [0.3, 0.19],
      [0.18, 0.67],
      [0.3, 0.76],
      [0.23, 0.83],
      [0, 1.22],
    ],
    material,
  );
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), material);
  crown.scale.y = 1.35;
  crown.position.y = 1.14;
  piece.add(crown);
  return piece;
}

function createRook(material) {
  const piece = createLathePiece(
    [
      [0, 0],
      [0.42, 0],
      [0.46, 0.09],
      [0.3, 0.2],
      [0.25, 0.78],
      [0.39, 0.88],
      [0.4, 1.03],
      [0, 1.03],
    ],
    material,
  );
  for (let index = 0; index < 4; index += 1) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      material,
    );
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    block.position.set(Math.cos(angle) * 0.27, 1.08, Math.sin(angle) * 0.27);
    piece.add(block);
  }
  return piece;
}

/**
 * Procedural decoration for StockThink.
 * World position: clustered around the first project at Z=7.02.
 * Motion: slow local bob and rotation only while that depth is nearby.
 * Reduced motion: fixed at the authored base transforms.
 * Disposal: world.js traverses and disposes shared geometry/material resources.
 */
export function createStockThinkChessPieces() {
  const group = new THREE.Group();
  group.name = "stockthink-floating-chess";
  group.position.z = PIECE_WORLD_Z;

  const ivory = new THREE.MeshStandardMaterial({
    color: 0xf7efe1,
    metalness: 0.05,
    roughness: 0.42,
  });
  const charcoal = new THREE.MeshStandardMaterial({
    color: 0x82796d,
    metalness: 0.08,
    roughness: 0.48,
  });
  const pieces = [
    { mesh: createRook(charcoal), position: [-5.1, 1.15, 0.12], scale: 0.72 },
    { mesh: createPawn(ivory), position: [5.2, 1.2, -0.12], scale: 0.72 },
    {
      mesh: createBishop(charcoal),
      position: [-4.8, -1.58, -0.04],
      scale: 0.64,
    },
    { mesh: createPawn(ivory), position: [5.08, -1.48, 0.08], scale: 0.58 },
  ];

  pieces.forEach(({ mesh, position, scale }, index) => {
    mesh.position.set(...position);
    mesh.rotation.set(
      0.15 + index * 0.08,
      index * 0.7,
      index % 2 ? 0.24 : -0.2,
    );
    mesh.scale.setScalar(scale);
    mesh.userData.baseY = position[1];
    mesh.userData.phase = index * 1.37;
    group.add(mesh);
  });

  const ambient = new THREE.HemisphereLight(0xfff8eb, 0xb6a999, 2.4);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-2, 4, 4);
  group.add(ambient, key);

  return {
    group,
    isActive(cameraZ) {
      return Math.abs(cameraZ - PIECE_WORLD_Z) < ACTIVE_DISTANCE;
    },
    update(time, reducedMotion) {
      pieces.forEach(({ mesh }, index) => {
        if (reducedMotion) {
          mesh.position.y = mesh.userData.baseY;
          return;
        }
        const seconds = time * 0.001;
        mesh.position.y =
          mesh.userData.baseY +
          Math.sin(seconds * 0.55 + mesh.userData.phase) * 0.16;
        mesh.rotation.y += 0.0015 + index * 0.00025;
        mesh.rotation.z += Math.sin(seconds * 0.32 + index) * 0.00025;
      });
    },
  };
}
