import * as THREE from "three";
import { FOCUS_WORLD_CONFIG, getWorldExitVisibilityAtDepth } from "./config.js";

const ASSET_PRELOAD_DISTANCE = 6;
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

function createImageElement(config, className, assetUrl) {
  const image = document.createElement("img");
  image.className = className;
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  image.decoding = "async";
  image.fetchPriority = "low";

  return {
    element: image,
    load() {
      image.src = assetUrl(config.asset);
      if (config.fallbackAsset) {
        image.addEventListener(
          "error",
          () => {
            image.src = assetUrl(config.fallbackAsset);
          },
          { once: true },
        );
      }
    },
  };
}

/**
 * Shared projection and lifecycle for decorative DOM objects anchored in the
 * Three.js world. Assets begin loading one project interval before entry, and
 * each wrapper owns only its project-specific element and configuration.
 */
export function createProjectedObjectWorld({
  anchorPrefix,
  assetUrl,
  className,
  container,
  createElement,
  defaultAspect,
  groupName,
  objects,
  worldConfig,
}) {
  const group = new THREE.Group();
  group.name = groupName;
  let assetsLoaded = false;

  const entries = objects.map((config, index) => {
    const anchor = new THREE.Object3D();
    anchor.name = `${anchorPrefix}-${config.name ?? index + 1}`;
    anchor.position.set(...config.position);
    group.add(anchor);

    const projectedElement = createElement
      ? createElement(config, assetUrl)
      : createImageElement(config, className, assetUrl);
    const { element } = projectedElement;
    element.style.zIndex = String(Math.round(config.position[2] * 100));
    container.append(element);

    return {
      anchor,
      config,
      element,
      initialPosition: anchor.position.clone(),
      load: projectedElement.load,
      visible: true,
    };
  });

  function loadAssets() {
    if (assetsLoaded) return;
    assetsLoaded = true;
    entries.forEach(({ load }) => load());
  }

  function update(camera, width, height) {
    const projectDepth = camera.position.z - worldConfig.projectPosition[2];
    if (projectDepth >= -ASSET_PRELOAD_DISTANCE) loadAssets();

    const sectionEntry = THREE.MathUtils.smoothstep(projectDepth, 0.35, 2.4);
    entries.forEach(({ anchor, config, element, visible: objectVisible }) => {
      const depth = camera.position.z - anchor.position.z;
      const depthVisibility = getWorldExitVisibilityAtDepth(depth);
      const opacity = depthVisibility * (config.opacity ?? 1);
      const visible =
        objectVisible &&
        assetsLoaded &&
        depth > camera.near &&
        sectionEntry > 0 &&
        opacity > FOCUS_WORLD_CONFIG.visibilityThreshold;

      if (!visible) {
        if (element.style.visibility !== "hidden") {
          element.style.visibility = "hidden";
        }
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
      const renderedWidth = renderedHeight * (config.aspect ?? defaultAspect);
      const defocus = Math.max(
        0,
        Math.abs(depth - FOCUS_WORLD_CONFIG.distance) -
          FOCUS_WORLD_CONFIG.sharpBand,
      );
      const blur = Math.min(
        worldConfig.maxBlurPixels,
        defocus * worldConfig.blurPixelsPerWorldUnit,
      );
      const flip = config.flip ? -1 : 1;

      element.style.visibility = "visible";
      element.style.inlineSize = `${renderedWidth.toFixed(2)}px`;
      element.style.blockSize = `${renderedHeight.toFixed(2)}px`;
      element.style.opacity = opacity.toFixed(4);
      element.style.filter =
        blur < 0.05 ? "none" : `blur(${blur.toFixed(2)}px)`;
      element.style.transform = `translate3d(${(projectedCenter.x - renderedWidth / 2).toFixed(2)}px, ${(projectedCenter.y - renderedHeight / 2).toFixed(2)}px, 0) rotate(${config.rotation}deg) scaleX(${flip})`;
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
        entry.element.style.zIndex = String(Math.round(value * 100));
      }
    },
    setObjectVisible(index, visible) {
      entries[index].visible = visible;
      if (!visible) entries[index].element.style.visibility = "hidden";
    },
    resetObject(index) {
      const entry = entries[index];
      entry.anchor.position.copy(entry.initialPosition);
      entry.element.style.zIndex = String(
        Math.round(entry.initialPosition.z * 100),
      );
      entry.visible = true;
    },
    resetAllObjects() {
      entries.forEach((entry) => {
        entry.anchor.position.copy(entry.initialPosition);
        entry.element.style.zIndex = String(
          Math.round(entry.initialPosition.z * 100),
        );
        entry.visible = true;
      });
    },
    dispose() {
      entries.forEach(({ element }) => element.remove());
      group.clear();
    },
  };
}
