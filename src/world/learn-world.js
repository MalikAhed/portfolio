import * as THREE from "three";
import {
  FOCUS_WORLD_CONFIG,
  LEARN_OBJECT_WORLD_CONFIG,
  getWorldExitVisibilityAtDepth,
} from "./config.js";

const projectedCenter = new THREE.Vector3();
const projectedTop = new THREE.Vector3();
const projectedBottom = new THREE.Vector3();

function project(point, camera, width, height) {
  point.project(camera);
  point.set(
    (point.x * 0.5 + 0.5) * width,
    (-point.y * 0.5 + 0.5) * height,
    point.z,
  );
}

export function createLearnObjectWorld(container, assetUrl) {
  const group = new THREE.Group();
  group.name = "learn-object-world";
  const entries = LEARN_OBJECT_WORLD_CONFIG.objects.map((config) => {
    const anchor = new THREE.Object3D();
    anchor.name = `learn-${config.name}`;
    anchor.position.set(...config.position);
    group.add(anchor);
    const image = document.createElement("img");
    image.className = "learn-world-object";
    image.src = assetUrl(config.asset);
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.decoding = "async";
    image.style.zIndex = String(Math.round(config.position[2] * 100));
    container.append(image);
    return {
      anchor,
      config,
      image,
      initialPosition: anchor.position.clone(),
      visible: true,
    };
  });

  function update(camera, width, height) {
    const projectDepth =
      camera.position.z - LEARN_OBJECT_WORLD_CONFIG.projectPosition[2];
    const sectionEntry = THREE.MathUtils.smoothstep(projectDepth, 0.35, 2.4);
    entries.forEach(({ anchor, config, image, visible: objectVisible }) => {
      if (!objectVisible) {
        image.style.visibility = "hidden";
        return;
      }
      const depth = camera.position.z - anchor.position.z;
      const opacity = getWorldExitVisibilityAtDepth(depth);
      if (
        depth <= camera.near ||
        sectionEntry <= 0 ||
        opacity <= FOCUS_WORLD_CONFIG.visibilityThreshold
      ) {
        image.style.visibility = "hidden";
        return;
      }
      anchor.getWorldPosition(projectedCenter);
      projectedTop.copy(projectedCenter);
      projectedTop.y += config.height / 2;
      projectedBottom.copy(projectedCenter);
      projectedBottom.y -= config.height / 2;
      project(projectedCenter, camera, width, height);
      project(projectedTop, camera, width, height);
      project(projectedBottom, camera, width, height);
      const renderedHeight = Math.abs(projectedBottom.y - projectedTop.y);
      const renderedWidth = renderedHeight * config.aspect;
      const defocus = Math.max(
        0,
        Math.abs(depth - FOCUS_WORLD_CONFIG.distance) -
          FOCUS_WORLD_CONFIG.sharpBand,
      );
      const blur = Math.min(
        LEARN_OBJECT_WORLD_CONFIG.maxBlurPixels,
        defocus * LEARN_OBJECT_WORLD_CONFIG.blurPixelsPerWorldUnit,
      );
      image.style.visibility = "visible";
      image.style.inlineSize = `${renderedWidth.toFixed(2)}px`;
      image.style.blockSize = `${renderedHeight.toFixed(2)}px`;
      image.style.opacity = opacity.toFixed(4);
      image.style.filter = blur < 0.05 ? "none" : `blur(${blur.toFixed(2)}px)`;
      image.style.transform = `translate3d(${(projectedCenter.x - renderedWidth / 2).toFixed(2)}px, ${(projectedCenter.y - renderedHeight / 2).toFixed(2)}px, 0) rotate(${config.rotation}deg)`;
    });
  }

  return {
    group,
    update,
    getObjects() {
      return entries.map(({ config }) => ({ name: config.name }));
    },
    getObjectState(index) {
      const entry = entries[index];
      return {
        name: entry.config.name,
        position: entry.anchor.position.clone(),
        visible: entry.visible,
      };
    },
    setObjectPosition(index, axis, value) {
      const entry = entries[index];
      entry.anchor.position[axis] = value;
      if (axis === "z") {
        entry.image.style.zIndex = String(Math.round(value * 100));
      }
    },
    setObjectVisible(index, visible) {
      entries[index].visible = visible;
      if (!visible) entries[index].image.style.visibility = "hidden";
    },
    resetObject(index) {
      const entry = entries[index];
      entry.anchor.position.copy(entry.initialPosition);
      entry.image.style.zIndex = String(
        Math.round(entry.initialPosition.z * 100),
      );
      entry.visible = true;
    },
    resetAllObjects() {
      entries.forEach((entry) => {
        entry.anchor.position.copy(entry.initialPosition);
        entry.image.style.zIndex = String(
          Math.round(entry.initialPosition.z * 100),
        );
        entry.visible = true;
      });
    },
    dispose() {
      entries.forEach(({ image }) => image.remove());
      group.clear();
    },
  };
}
