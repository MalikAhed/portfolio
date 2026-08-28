import * as THREE from "three";
import {
  CARD_WORLD_CONFIG,
  FOCUS_WORLD_CONFIG,
  getCardPreset,
  getJourneyPreset,
  getWorldBlurAtDepth,
  getWorldVisibilityAtDepth,
} from "./config.js";
import { PROJECTS, createProjectPreviewDocument } from "./projects.js";

const worldPosition = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const projectedTopLeft = new THREE.Vector3();
const projectedTopRight = new THREE.Vector3();
const projectedBottomLeft = new THREE.Vector3();
const projectedBottomRight = new THREE.Vector3();

function createButton(label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

function createTreeIcon(type) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("project-card__tree-icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.8");
  path.setAttribute(
    "d",
    type === "folder"
      ? "M3.5 7.5h6l2 2h9v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z M3.5 7.5v-1a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1"
      : "M6.5 3.5h7l4 4v13h-11z M13.5 3.5v4h4",
  );
  icon.append(path);
  return icon;
}

function createFileTree(project, onSelect) {
  const tree = document.createElement("div");
  tree.className = "project-card__tree";
  tree.setAttribute("role", "tree");
  tree.setAttribute("aria-label", `${project.title} project files`);

  const folder = document.createElement("div");
  folder.className = "project-card__folder";
  folder.setAttribute("role", "treeitem");
  folder.setAttribute("aria-expanded", "true");

  const folderButton = createButton(project.id, "project-card__folder-button");
  folderButton.setAttribute("aria-label", `${project.id} folder`);
  folderButton.prepend(createTreeIcon("folder"));

  const children = document.createElement("div");
  children.className = "project-card__tree-children";
  children.setAttribute("role", "group");

  const fileButtons = Object.keys(project.files).map((filename) => {
    const button = createButton(filename, "project-card__file");
    button.dataset.projectFile = filename;
    button.setAttribute("role", "treeitem");
    button.prepend(createTreeIcon("file"));
    children.append(button);
    return button;
  });

  function handleFolderClick() {
    const expanded = folder.getAttribute("aria-expanded") === "true";
    folder.setAttribute("aria-expanded", String(!expanded));
    children.hidden = expanded;
  }

  function handleFileClick(event) {
    onSelect(event.currentTarget.dataset.projectFile);
  }

  folderButton.addEventListener("click", handleFolderClick);
  fileButtons.forEach((button) => {
    button.addEventListener("click", handleFileClick);
  });
  folder.append(folderButton, children);
  tree.append(folder);

  return {
    element: tree,
    fileButtons,
    dispose() {
      folderButton.removeEventListener("click", handleFolderClick);
      fileButtons.forEach((button) => {
        button.removeEventListener("click", handleFileClick);
      });
    },
  };
}

function createProjectCard(project, index, reducedMotion) {
  const card = document.createElement("article");
  card.className = "project-card";
  card.dataset.projectCard = project.id;
  card.setAttribute("aria-labelledby", `project-card-title-${index + 1}`);
  const cssWidth =
    CARD_WORLD_CONFIG.width / CARD_WORLD_CONFIG.worldUnitsPerCssPixel;
  card.style.inlineSize = `${cssWidth}px`;
  card.style.blockSize = `${cssWidth / CARD_WORLD_CONFIG.aspectRatio}px`;
  card.style.setProperty(
    "--project-card-radius",
    `${CARD_WORLD_CONFIG.cornerRadius / CARD_WORLD_CONFIG.worldUnitsPerCssPixel}px`,
  );

  const surface = document.createElement("div");
  surface.className = "project-card__surface";

  const header = document.createElement("header");
  header.className = "project-card__header";

  const identity = document.createElement("div");
  identity.className = "project-card__identity";

  const title = document.createElement("h2");
  title.id = `project-card-title-${index + 1}`;
  title.textContent = project.title;

  const description = document.createElement("p");
  description.textContent = project.description;
  identity.append(title, description);

  const modeControls = document.createElement("div");
  modeControls.className = "project-card__modes";
  modeControls.setAttribute("aria-label", `${project.title} view`);

  const previewButton = createButton("Preview", "project-card__mode");
  const codeButton = createButton("Code", "project-card__mode");
  previewButton.dataset.cardMode = "preview";
  codeButton.dataset.cardMode = "code";
  modeControls.append(previewButton, codeButton);
  header.append(identity, modeControls);

  const viewport = document.createElement("div");
  viewport.className = "project-card__viewport";

  const previewPanel = document.createElement("div");
  previewPanel.className = "project-card__panel project-card__preview";
  previewPanel.dataset.cardPanel = "preview";

  const preview = document.createElement("iframe");
  preview.className = "project-card__frame";
  preview.title = `${project.title} interactive preview`;
  preview.setAttribute("sandbox", "allow-scripts");
  preview.setAttribute("loading", "lazy");
  if (project.previewUrl) preview.src = project.previewUrl;
  else preview.srcdoc = createProjectPreviewDocument(project);
  previewPanel.append(preview);

  const codePanel = document.createElement("div");
  codePanel.className = "project-card__panel project-card__code";
  codePanel.dataset.cardPanel = "code";

  const treePanel = document.createElement("aside");
  treePanel.className = "project-card__tree-panel";

  const sourcePanel = document.createElement("div");
  sourcePanel.className = "project-card__source-panel";
  const sourceLabel = document.createElement("div");
  sourceLabel.className = "project-card__source-label";
  const codeBlock = document.createElement("pre");
  codeBlock.className = "project-card__source";
  const code = document.createElement("code");
  codeBlock.append(code);
  sourcePanel.append(sourceLabel, codeBlock);
  codePanel.append(treePanel, sourcePanel);
  viewport.append(previewPanel, codePanel);
  surface.append(header, viewport);
  card.append(surface);

  const fileEntries = Object.entries(project.files);
  let fileTree;

  function setFile(filename) {
    code.textContent = project.files[filename] ?? "";
    sourceLabel.textContent = filename;
    fileTree.fileButtons.forEach((button) => {
      const selected = button.dataset.projectFile === filename;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
  }

  fileTree = createFileTree(project, setFile);
  treePanel.append(fileTree.element);

  function setMode(mode) {
    const showPreview = mode === "preview";
    previewPanel.hidden = !showPreview;
    codePanel.hidden = showPreview;
    previewButton.classList.toggle("is-active", showPreview);
    codeButton.classList.toggle("is-active", !showPreview);
    previewButton.setAttribute("aria-pressed", String(showPreview));
    codeButton.setAttribute("aria-pressed", String(!showPreview));
  }

  function handleModeClick(event) {
    setMode(event.currentTarget.dataset.cardMode);
  }

  let pointerBounds = null;
  let tiltAnimationFrameId = 0;
  let nextTiltX = 0;
  let nextTiltY = 0;

  function handlePointerEnter() {
    pointerBounds = card.getBoundingClientRect();
  }

  function handlePointerMove(event) {
    if (reducedMotion.matches || event.pointerType === "touch") return;
    const bounds = pointerBounds ?? card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5;
    const y = (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5;
    nextTiltX = -y * 2.5;
    nextTiltY = x * 3.5;
    if (tiltAnimationFrameId) return;
    tiltAnimationFrameId = window.requestAnimationFrame(() => {
      tiltAnimationFrameId = 0;
      surface.style.setProperty("--card-tilt-x", `${nextTiltX.toFixed(2)}deg`);
      surface.style.setProperty("--card-tilt-y", `${nextTiltY.toFixed(2)}deg`);
    });
  }

  function resetTilt() {
    pointerBounds = null;
    if (tiltAnimationFrameId) {
      window.cancelAnimationFrame(tiltAnimationFrameId);
      tiltAnimationFrameId = 0;
    }
    surface.style.removeProperty("--card-tilt-x");
    surface.style.removeProperty("--card-tilt-y");
  }

  previewButton.addEventListener("click", handleModeClick);
  codeButton.addEventListener("click", handleModeClick);
  card.addEventListener("pointerenter", handlePointerEnter);
  card.addEventListener("pointermove", handlePointerMove);
  card.addEventListener("pointerleave", resetTilt);
  setMode("preview");
  setFile(fileEntries[0][0]);

  return {
    element: card,
    dispose() {
      previewButton.removeEventListener("click", handleModeClick);
      codeButton.removeEventListener("click", handleModeClick);
      fileTree.dispose();
      card.removeEventListener("pointerenter", handlePointerEnter);
      card.removeEventListener("pointermove", handlePointerMove);
      card.removeEventListener("pointerleave", resetTilt);
      if (tiltAnimationFrameId) {
        window.cancelAnimationFrame(tiltAnimationFrameId);
      }
      preview.srcdoc = "";
    },
  };
}

/**
 * Interactive HTML project simulations fixed in the shared Three.js world.
 * Three.js anchors supply their camera-space transforms while native DOM owns
 * the continuous visuals, controls, previews, source views, and keyboard
 * behavior.
 */
export function createPortfolioCards(reducedMotion, container) {
  const group = new THREE.Group();
  group.name = CARD_WORLD_CONFIG.id;

  const entries = PROJECTS.map((project, index) => {
    const rig = new THREE.Group();
    rig.name = `portfolio-card-rig-${index + 1}`;
    const view = createProjectCard(project, index, reducedMotion);
    container.append(view.element);
    const anchor = new THREE.Object3D();
    anchor.name = `portfolio-card-anchor-${index + 1}`;
    rig.add(anchor);
    group.add(rig);
    return {
      anchor,
      depth: Number.POSITIVE_INFINITY,
      focusDistance: Number.POSITIVE_INFINITY,
      inFront: false,
      rig,
      screenBounds: { bottom: 0, left: 0, right: 0, top: 0 },
      visibility: 0,
      view,
    };
  });

  let preset = "";

  function applyPreset(index) {
    const config = getCardPreset(preset)[index];
    const { anchor, rig } = entries[index];
    rig.position.set(...config.position);
    rig.rotation.set(...config.rotation);
    anchor.scale.setScalar(config.scale);
  }

  function resize(width, height) {
    const nextPreset = getJourneyPreset(width, height);
    if (nextPreset === preset) return false;
    preset = nextPreset;
    entries.forEach((_, index) => applyPreset(index));
    return true;
  }

  function projectPoint(anchor, x, y, camera, width, height, target) {
    target.set(x, y, 0).applyMatrix4(anchor.matrixWorld).project(camera);
    target.set(
      (target.x * 0.5 + 0.5) * width,
      (-target.y * 0.5 + 0.5) * height,
      target.z,
    );
  }

  function projectEntry(entry, camera, width, height) {
    const halfWidth = CARD_WORLD_CONFIG.width / 2;
    const halfHeight =
      CARD_WORLD_CONFIG.width / CARD_WORLD_CONFIG.aspectRatio / 2;
    projectPoint(
      entry.anchor,
      -halfWidth,
      halfHeight,
      camera,
      width,
      height,
      projectedTopLeft,
    );
    projectPoint(
      entry.anchor,
      halfWidth,
      halfHeight,
      camera,
      width,
      height,
      projectedTopRight,
    );
    projectPoint(
      entry.anchor,
      -halfWidth,
      -halfHeight,
      camera,
      width,
      height,
      projectedBottomLeft,
    );
    projectPoint(
      entry.anchor,
      halfWidth,
      -halfHeight,
      camera,
      width,
      height,
      projectedBottomRight,
    );

    entry.screenBounds.left = Math.min(
      projectedTopLeft.x,
      projectedTopRight.x,
      projectedBottomLeft.x,
      projectedBottomRight.x,
    );
    entry.screenBounds.right = Math.max(
      projectedTopLeft.x,
      projectedTopRight.x,
      projectedBottomLeft.x,
      projectedBottomRight.x,
    );
    entry.screenBounds.top = Math.min(
      projectedTopLeft.y,
      projectedTopRight.y,
      projectedBottomLeft.y,
      projectedBottomRight.y,
    );
    entry.screenBounds.bottom = Math.max(
      projectedTopLeft.y,
      projectedTopRight.y,
      projectedBottomLeft.y,
      projectedBottomRight.y,
    );
  }

  function positionView(entry, camera, width, height) {
    projectEntry(entry, camera, width, height);

    const cssWidth =
      CARD_WORLD_CONFIG.width / CARD_WORLD_CONFIG.worldUnitsPerCssPixel;
    const cssHeight = cssWidth / CARD_WORLD_CONFIG.aspectRatio;
    const a = (projectedTopRight.x - projectedTopLeft.x) / cssWidth;
    const b = (projectedTopRight.y - projectedTopLeft.y) / cssWidth;
    const c = (projectedBottomLeft.x - projectedTopLeft.x) / cssHeight;
    const d = (projectedBottomLeft.y - projectedTopLeft.y) / cssHeight;
    entry.view.element.style.transform = `matrix(${a.toFixed(6)}, ${b.toFixed(6)}, ${c.toFixed(6)}, ${d.toFixed(6)}, ${projectedTopLeft.x.toFixed(2)}, ${projectedTopLeft.y.toFixed(2)})`;
  }

  function isOnScreen(bounds, width, height) {
    const margin = FOCUS_WORLD_CONFIG.maxBlurPixels * 3;
    return (
      bounds.right > -margin &&
      bounds.left < width + margin &&
      bounds.bottom > -margin &&
      bounds.top < height + margin
    );
  }

  function update(camera, width, height) {
    let activeEntry = null;
    let activeDistance = Number.POSITIVE_INFINITY;

    entries.forEach((entry) => {
      entry.anchor.getWorldPosition(worldPosition);
      cameraPosition
        .copy(worldPosition)
        .applyMatrix4(camera.matrixWorldInverse);
      const depth = -cameraPosition.z;
      const inFront = depth > camera.near && depth < camera.far;
      const focusDistance = Math.abs(depth - FOCUS_WORLD_CONFIG.distance);
      entry.depth = depth;
      entry.focusDistance = focusDistance;
      entry.inFront = inFront;
      entry.visibility = inFront ? getWorldVisibilityAtDepth(depth) : 0;
      if (entry.visibility > FOCUS_WORLD_CONFIG.visibilityThreshold) {
        projectEntry(entry, camera, width, height);
      }

      if (
        inFront &&
        focusDistance <= FOCUS_WORLD_CONFIG.interactionBand &&
        focusDistance < activeDistance
      ) {
        activeEntry = entry;
        activeDistance = focusDistance;
      }
    });

    entries
      .filter((entry) => entry.inFront)
      .sort((first, second) => second.depth - first.depth)
      .forEach((entry, index) => {
        entry.view.element.style.zIndex = String(index + 1);
      });

    entries.forEach((entry) => {
      const active = entry === activeEntry;
      const rendered =
        entry.visibility > FOCUS_WORLD_CONFIG.visibilityThreshold &&
        isOnScreen(entry.screenBounds, width, height);
      const interactive =
        active &&
        activeDistance <= FOCUS_WORLD_CONFIG.interactionBand &&
        rendered;

      if (rendered) {
        positionView(entry, camera, width, height);
        entry.view.element.style.opacity = entry.visibility.toFixed(4);
        entry.view.element.style.setProperty(
          "--card-defocus",
          `${getWorldBlurAtDepth(entry.depth).toFixed(2)}px`,
        );
        entry.view.element.style.visibility = "visible";
      } else {
        entry.view.element.style.opacity = "0";
        entry.view.element.style.visibility = "hidden";
      }

      entry.view.element.style.pointerEvents = interactive ? "auto" : "none";
      entry.view.element.inert = !interactive;
      entry.view.element.classList.toggle("is-active", active && rendered);
      entry.view.element.classList.toggle("is-interactive", interactive);
    });
  }

  function getTransform(index) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    return {
      position: {
        x: entry.rig.position.x,
        y: entry.rig.position.y,
        z: entry.rig.position.z,
      },
      rotation: {
        x: entry.rig.rotation.x,
        y: entry.rig.rotation.y,
        z: entry.rig.rotation.z,
      },
    };
  }

  function setTransformComponent(index, type, axis, value) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    if (type !== "position" && type !== "rotation") return;
    if (axis !== "x" && axis !== "y" && axis !== "z") return;
    entry.rig[type][axis] = value;
  }

  function resetCard(index) {
    if (entries[index]) applyPreset(index);
  }

  function resetAllCards() {
    entries.forEach((_, index) => applyPreset(index));
  }

  return {
    group,
    getTransform,
    resetAllCards,
    resetCard,
    resize,
    setTransformComponent,
    update,
    dispose() {
      entries.forEach(({ view }) => view.dispose());
      group.removeFromParent();
    },
  };
}
