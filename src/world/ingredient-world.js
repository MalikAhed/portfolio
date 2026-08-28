import * as THREE from "three";
import {
  CUBE_BURGER_INGREDIENT_WORLD_CONFIG,
  FOCUS_WORLD_CONFIG,
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

function getIngredientBlurAtDepth(depth) {
  const defocus = Math.max(
    0,
    Math.abs(depth - FOCUS_WORLD_CONFIG.distance) -
      FOCUS_WORLD_CONFIG.sharpBand,
  );

  return Math.min(
    CUBE_BURGER_INGREDIENT_WORLD_CONFIG.maxBlurPixels,
    defocus * CUBE_BURGER_INGREDIENT_WORLD_CONFIG.blurPixelsPerWorldUnit,
  );
}

export function createCubeBurgerIngredientWorld(container, assetUrl) {
  const group = new THREE.Group();
  group.name = "cube-burger-ingredient-world";
  const spriteUrl = assetUrl(CUBE_BURGER_INGREDIENT_WORLD_CONFIG.asset);

  const entries = CUBE_BURGER_INGREDIENT_WORLD_CONFIG.pieces.map((config) => {
    const anchor = new THREE.Object3D();
    anchor.name = `cube-burger-${config.name}`;
    anchor.position.set(...config.position);
    group.add(anchor);

    const element = document.createElement("div");
    element.className = "cube-burger-ingredient";
    element.setAttribute("aria-hidden", "true");
    element.style.zIndex = String(Math.round(config.position[2] * 100));

    const crop = document.createElement("span");
    crop.style.backgroundImage = `url("${spriteUrl}")`;
    crop.style.backgroundSize = config.backgroundSize;
    crop.style.backgroundPosition = config.backgroundPosition;
    element.append(crop);
    container.append(element);
    return { anchor, config, element };
  });

  function update(camera, width, height) {
    const projectDepth =
      camera.position.z -
      CUBE_BURGER_INGREDIENT_WORLD_CONFIG.projectPosition[2];
    const sectionEntry = THREE.MathUtils.smoothstep(projectDepth, 0.35, 2.4);

    entries.forEach(({ anchor, config, element }) => {
      const depth = camera.position.z - config.position[2];
      const opacity = getWorldExitVisibilityAtDepth(depth);
      const visible =
        depth > camera.near &&
        sectionEntry > 0 &&
        opacity > FOCUS_WORLD_CONFIG.visibilityThreshold;
      if (!visible) {
        element.style.visibility = "hidden";
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
      const blur = getIngredientBlurAtDepth(depth);

      element.style.visibility = "visible";
      element.style.inlineSize = `${renderedWidth.toFixed(2)}px`;
      element.style.blockSize = `${renderedHeight.toFixed(2)}px`;
      element.style.opacity = opacity.toFixed(4);
      element.style.filter =
        blur < 0.05 ? "none" : `blur(${blur.toFixed(2)}px)`;
      element.style.transform = `translate3d(${(projectedCenter.x - renderedWidth / 2).toFixed(2)}px, ${(projectedCenter.y - renderedHeight / 2).toFixed(2)}px, 0) rotate(${config.rotation}deg)`;
    });
  }

  return {
    group,
    update,
    dispose() {
      entries.forEach(({ element }) => element.remove());
      group.clear();
    },
  };
}
