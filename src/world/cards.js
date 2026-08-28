import * as THREE from "three";
import {
  CARD_WORLD_CONFIG,
  FOCUS_WORLD_CONFIG,
  PROJECT_FRAME_ENTRY_CONFIG,
  getCardPreset,
  getJourneyPreset,
  getProjectFrameEntryAtDepth,
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

function createModeIcon(type) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("project-card__mode-icon");
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
    type === "preview"
      ? "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z"
      : "m8.5 7-5 5 5 5 M15.5 7l5 5-5 5 M13.5 4l-3 16",
  );
  icon.append(path);
  return icon;
}

function createActionIcon(type) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("project-card__action-icon");
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
    type === "github"
      ? "M9 19c-4.5 1.4-4.5-2.5-6.3-3 M15.3 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.7-1.4 5.7-6.2A4.8 4.8 0 0 0 19.2 6a4.4 4.4 0 0 0-.1-3.3S18 2.4 15.5 4a12.1 12.1 0 0 0-6.5 0C6.5 2.4 5.4 2.7 5.4 2.7A4.4 4.4 0 0 0 5.3 6 4.8 4.8 0 0 0 4 9.3c0 4.8 2.9 5.9 5.7 6.2-.5.5-.6 1.2-.5 2V21"
      : "M14 4h6v6 M20 4 11 13 M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6",
  );
  icon.append(path);
  return icon;
}

function createTechMark(technology) {
  const item = document.createElement("span");
  item.className = "project-card__tech";
  item.setAttribute("aria-label", technology.label);

  const mark = document.createElement("span");
  mark.className = "project-card__tech-mark";
  mark.textContent = technology.mark;

  const label = document.createElement("span");
  label.className = "project-card__tech-label";
  label.textContent = technology.label;
  item.append(mark, label);
  return item;
}

function createTechMarquee(project) {
  const marquee = document.createElement("div");
  marquee.className = "project-card__tech-marquee";
  marquee.setAttribute(
    "aria-label",
    `Technologies used: ${project.technologies.map(({ label }) => label).join(", ")}`,
  );

  const track = document.createElement("div");
  track.className = "project-card__tech-track";
  [false, true].forEach((duplicate) => {
    const group = document.createElement("div");
    group.className = "project-card__tech-group";
    if (duplicate) group.setAttribute("aria-hidden", "true");
    project.technologies.forEach((technology) =>
      group.append(createTechMark(technology)),
    );
    track.append(group);
  });
  marquee.append(track);
  return marquee;
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
  card.className = `project-card project-card--${index % 2 === 0 ? "work-left" : "work-right"}`;
  card.dataset.projectCard = project.id;
  card.setAttribute("aria-labelledby", `project-card-title-${index + 1}`);
  function setDimensions(width, height) {
    card.style.inlineSize = `${width / CARD_WORLD_CONFIG.worldUnitsPerCssPixel}px`;
    card.style.blockSize = `${height / CARD_WORLD_CONFIG.worldUnitsPerCssPixel}px`;
  }

  setDimensions(CARD_WORLD_CONFIG.width, CARD_WORLD_CONFIG.height);
  card.style.setProperty(
    "--project-card-radius",
    `${CARD_WORLD_CONFIG.cornerRadius / CARD_WORLD_CONFIG.worldUnitsPerCssPixel}px`,
  );

  const surface = document.createElement("div");
  surface.className = "project-card__surface";

  const explainer = document.createElement("aside");
  explainer.className = "project-card__explainer";

  const techMarquee = createTechMarquee(project);

  const explainerTitle = document.createElement("h3");
  explainerTitle.textContent = project.title;

  const explainerSummary = document.createElement("p");
  explainerSummary.className = "project-card__summary";
  explainerSummary.textContent = project.summary;

  const highlights = document.createElement("ul");
  highlights.className = "project-card__highlights";
  project.highlights.forEach((highlight) => {
    const item = document.createElement("li");
    item.textContent = highlight;
    highlights.append(item);
  });

  const actions = document.createElement("div");
  actions.className = "project-card__actions";
  const githubLink = document.createElement("a");
  githubLink.href = project.githubUrl;
  githubLink.target = "_blank";
  githubLink.rel = "noreferrer";
  githubLink.append(createActionIcon("github"), "View on GitHub");
  const liveLink = document.createElement("a");
  liveLink.href = project.liveUrl;
  liveLink.target = "_blank";
  liveLink.rel = "noreferrer";
  liveLink.append(createActionIcon("live"), "View live");
  actions.append(githubLink, liveLink);
  explainer.append(
    techMarquee,
    explainerTitle,
    explainerSummary,
    highlights,
    actions,
  );
  [...explainer.children].forEach((child, childIndex) => {
    child.style.setProperty("--reveal-order", String(childIndex));
  });

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
  previewButton.prepend(createModeIcon("preview"));
  codeButton.prepend(createModeIcon("code"));
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
  if (!project.previewUrl) preview.setAttribute("sandbox", "allow-scripts");
  preview.setAttribute("loading", "lazy");
  preview.hidden = true;
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
  card.append(surface, explainer);

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
  let previewLoadTimer = 0;
  let previewLoaded = false;
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

  function unloadPreview() {
    if (previewLoadTimer) window.clearTimeout(previewLoadTimer);
    previewLoadTimer = 0;
    if (!previewLoaded) return;
    previewLoaded = false;
    preview.hidden = true;
    preview.removeAttribute("src");
    preview.srcdoc = "";
  }

  function schedulePreview() {
    if (!project.previewUrl || previewLoaded) return;
    if (previewLoadTimer) window.clearTimeout(previewLoadTimer);
    previewLoadTimer = window.setTimeout(() => {
      previewLoadTimer = 0;
      previewLoaded = true;
      // StockThink measures its canvas during startup. It must have a real
      // viewport before its URL is assigned so its own loader can complete.
      preview.hidden = false;
      preview.src = project.previewUrl;
    }, 700);
  }

  function updatePreviewActivity(active) {
    if (!project.previewUrl) return;
    if (active) schedulePreview();
    else unloadPreview();
  }

  previewButton.addEventListener("click", handleModeClick);
  codeButton.addEventListener("click", handleModeClick);
  card.addEventListener("pointerenter", handlePointerEnter);
  card.addEventListener("pointermove", handlePointerMove);
  card.addEventListener("pointerleave", resetTilt);
  setMode("preview");
  setFile(fileEntries[0][0]);
  if (!project.previewUrl) {
    preview.hidden = false;
    preview.srcdoc = createProjectPreviewDocument(project);
  }

  return {
    element: card,
    setDimensions,
    updatePreviewActivity,
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
      unloadPreview();
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
      entryProgress: 0,
      focusDistance: Number.POSITIVE_INFINITY,
      height: CARD_WORLD_CONFIG.height,
      inFront: false,
      rig,
      screenBounds: { bottom: 0, left: 0, right: 0, top: 0 },
      visibility: 0,
      view,
      width: CARD_WORLD_CONFIG.width,
    };
  });

  let preset = "";

  function applyPreset(index) {
    const config = getCardPreset(preset)[index];
    const entry = entries[index];
    const { anchor, rig, view } = entry;
    rig.position.set(...config.position);
    rig.rotation.set(...config.rotation);
    anchor.scale.setScalar(config.scale);
    entry.width = CARD_WORLD_CONFIG.width;
    entry.height = CARD_WORLD_CONFIG.height;
    view.setDimensions(entry.width, entry.height);
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
    const halfWidth = entry.width / 2;
    const halfHeight = entry.height / 2;
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

    const cssWidth = entry.width / CARD_WORLD_CONFIG.worldUnitsPerCssPixel;
    const cssHeight = entry.height / CARD_WORLD_CONFIG.worldUnitsPerCssPixel;
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
      entry.entryProgress = inFront ? getProjectFrameEntryAtDepth(depth) : 0;
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
        entry.view.element.style.opacity = (
          entry.visibility * entry.entryProgress
        ).toFixed(4);
        entry.view.element.style.setProperty(
          "--frame-entry",
          entry.entryProgress.toFixed(4),
        );
        const direction = entries.indexOf(entry) % 2 === 0 ? -1 : 1;
        entry.view.element.style.setProperty(
          "--frame-work-entry-x",
          `${(
            (1 - entry.entryProgress) *
            PROJECT_FRAME_ENTRY_CONFIG.workHorizontalOffset *
            direction
          ).toFixed(2)}px`,
        );
        entry.view.element.style.setProperty(
          "--frame-work-entry-y",
          `${(
            (1 - entry.entryProgress) *
            PROJECT_FRAME_ENTRY_CONFIG.workVerticalOffset
          ).toFixed(2)}px`,
        );
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
      entry.view.updatePreviewActivity(interactive);
    });
  }

  function getTransform(index) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    return {
      dimensions: {
        height: entry.height,
        width: entry.width,
      },
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
      size: entry.anchor.scale.x,
    };
  }

  function setTransformComponent(index, type, axis, value) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    if (type !== "position" && type !== "rotation") return;
    if (axis !== "x" && axis !== "y" && axis !== "z") return;
    entry.rig[type][axis] = value;
  }

  function setSize(index, value) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    entry.anchor.scale.setScalar(value);
  }

  function setFrameDimension(index, dimension, value) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    if (dimension !== "width" && dimension !== "height") return;
    entry[dimension] = value;
    entry.view.setDimensions(entry.width, entry.height);
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
    setFrameDimension,
    setSize,
    setTransformComponent,
    update,
    dispose() {
      entries.forEach(({ view }) => view.dispose());
      group.removeFromParent();
    },
  };
}
