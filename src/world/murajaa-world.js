import * as THREE from "three";
import {
  FOCUS_WORLD_CONFIG,
  MURAJAA_SCREEN_WORLD_CONFIG,
  getWorldExitVisibilityAtDepth,
} from "./config.js";

const SCREEN_ASPECT = 3 / 2;
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

function getScreenBlurAtDepth(depth) {
  const defocus = Math.max(
    0,
    Math.abs(depth - FOCUS_WORLD_CONFIG.distance) -
      FOCUS_WORLD_CONFIG.sharpBand,
  );
  return Math.min(
    MURAJAA_SCREEN_WORLD_CONFIG.maxBlurPixels,
    defocus * MURAJAA_SCREEN_WORLD_CONFIG.blurPixelsPerWorldUnit,
  );
}

export function createMurajaaScreenWorld(container, assetUrl) {
  const group = new THREE.Group();
  group.name = "murajaa-screen-world";

  const entries = MURAJAA_SCREEN_WORLD_CONFIG.screens.map((config, index) => {
    const anchor = new THREE.Object3D();
    anchor.name = `murajaa-screen-${index + 1}`;
    anchor.position.set(...config.position);
    group.add(anchor);

    const image = document.createElement("img");
    image.className = "murajaa-world-screen";
    image.src = assetUrl(config.asset);
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.decoding = "async";
    image.style.zIndex = String(Math.round(config.position[2] * 100));
    container.append(image);
    return { anchor, config, image };
  });

  function update(camera, width, height) {
    const projectDepth =
      camera.position.z - MURAJAA_SCREEN_WORLD_CONFIG.projectPosition[2];
    const sectionEntry = THREE.MathUtils.smoothstep(projectDepth, 0.35, 2.4);

    entries.forEach(({ anchor, config, image }) => {
      const depth = camera.position.z - config.position[2];
      const opacity = getWorldExitVisibilityAtDepth(depth);
      const visible =
        depth > camera.near &&
        sectionEntry > 0 &&
        opacity > FOCUS_WORLD_CONFIG.visibilityThreshold;
      if (!visible) {
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
      const renderedWidth = renderedHeight * SCREEN_ASPECT;
      const blur = getScreenBlurAtDepth(depth);
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
    dispose() {
      entries.forEach(({ image }) => image.remove());
      group.clear();
    },
  };
}
