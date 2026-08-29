import * as THREE from "three";
import {
  CARD_WORLD_CONFIG,
  FOCUS_WORLD_CONFIG,
  PROJECT_FRAME_ENTRY_CONFIG,
  getCardPreset,
  getJourneyPreset,
  getProjectFrameEntryAtDepth,
  getResponsiveCardScale,
  getWorldExitVisibilityAtDepth,
  getWorldBlurAtDepth,
} from "./config.js";
import { PROJECTS } from "./projects.js";
import {
  createActionIcon,
  createButton,
  createFullscreenIcon,
  createModeIcon,
  createPreviewLoader,
  createTechMarquee,
} from "./project-card-elements.js";

const worldPosition = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const projectedTopLeft = new THREE.Vector3();
const projectedTopRight = new THREE.Vector3();
const projectedBottomLeft = new THREE.Vector3();
const projectedBottomRight = new THREE.Vector3();
const PROJECT_SIDE_NAMES = Object.freeze(["preview", "text"]);
const PREVIEW_LOADER_REVEAL_DELAY_MS = 140;

function cloneSideTransform(projectId, side) {
  const defaults = CARD_WORLD_CONFIG.sideTransforms[side];
  const override = CARD_WORLD_CONFIG.sideTransformOverrides[projectId]?.[side];
  return {
    position: { ...defaults.position, ...override?.position },
    rotation: { ...defaults.rotation, ...override?.rotation },
    width: override?.width ?? defaults.width,
    height: override?.height ?? defaults.height,
    scale: override?.scale ?? defaults.scale,
  };
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

function createTreeChevron() {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("project-card__tree-chevron");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m6 3.5 4.5 4.5L6 12.5");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.6");
  icon.append(path);
  return icon;
}

function createFileTree(project, onSelect) {
  const tree = document.createElement("div");
  tree.className = "project-card__tree";
  tree.setAttribute("role", "tree");
  tree.setAttribute("aria-label", `${project.title} project files`);

  function createFolderNode(name, path = "") {
    return { folders: new Map(), files: [], name, path };
  }

  const root = createFolderNode(project.id);
  Object.keys(project.files).forEach((filename) => {
    const segments = filename.split("/");
    const file = segments.pop();
    let node = root;
    segments.forEach((segment) => {
      if (!node.folders.has(segment)) {
        const path = node.path ? `${node.path}/${segment}` : segment;
        node.folders.set(segment, createFolderNode(segment, path));
      }
      node = node.folders.get(segment);
    });
    node.files.push({ name: file, path: filename });
  });

  const folderButtons = [];
  const fileButtons = [];

  function renderFolder(node, isRoot = false) {
    const folder = document.createElement("div");
    folder.className = `project-card__folder${isRoot ? " project-card__folder--root" : ""}`;

    const folderButton = createButton("", "project-card__folder-button");
    folderButton.setAttribute("role", "treeitem");
    folderButton.setAttribute("aria-expanded", "true");
    folderButton.setAttribute(
      "aria-label",
      `${isRoot ? "Repository" : "Folder"} ${node.path || node.name}, expanded`,
    );
    folderButton.append(
      createTreeChevron(),
      createTreeIcon("folder"),
      document.createTextNode(node.name),
    );

    const children = document.createElement("div");
    children.className = "project-card__tree-children";
    children.setAttribute("role", "group");

    node.folders.forEach((childNode) => {
      children.append(renderFolder(childNode));
    });
    node.files.forEach(({ name, path }) => {
      const button = createButton(name, "project-card__file");
      button.dataset.projectFile = path;
      button.title = path;
      button.setAttribute("role", "treeitem");
      button.setAttribute("aria-label", `File ${path}`);
      button.prepend(createTreeIcon("file"));
      children.append(button);
      fileButtons.push(button);
    });

    function handleFolderClick() {
      const expanded = folderButton.getAttribute("aria-expanded") === "true";
      folderButton.setAttribute("aria-expanded", String(!expanded));
      folderButton.setAttribute(
        "aria-label",
        `${isRoot ? "Repository" : "Folder"} ${node.path || node.name}, ${expanded ? "collapsed" : "expanded"}`,
      );
      children.hidden = expanded;
    }

    folderButton.addEventListener("click", handleFolderClick);
    folderButtons.push({
      button: folderButton,
      handleClick: handleFolderClick,
    });
    folder.append(folderButton, children);
    return folder;
  }

  function handleFileClick(event) {
    onSelect(event.currentTarget.dataset.projectFile);
  }

  tree.append(renderFolder(root, true));

  fileButtons.forEach((button) => {
    button.addEventListener("click", handleFileClick);
  });

  return {
    element: tree,
    fileButtons,
    dispose() {
      folderButtons.forEach(({ button, handleClick }) => {
        button.removeEventListener("click", handleClick);
      });
      fileButtons.forEach((button) => {
        button.removeEventListener("click", handleFileClick);
      });
    },
  };
}

function createProjectCard(project, index) {
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

  const workTransform = document.createElement("div");
  workTransform.className = "project-card__work-transform";

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

  const fullscreenIcon = createFullscreenIcon();
  const fullscreenButton = createButton("", "project-card__fullscreen");
  const fullscreenLabel = document.createElement("span");
  fullscreenLabel.textContent = "Full screen";
  fullscreenButton.append(fullscreenIcon.element, fullscreenLabel);

  const headerActions = document.createElement("div");
  headerActions.className = "project-card__header-actions";
  headerActions.append(modeControls, fullscreenButton);
  header.append(identity, headerActions);

  const viewport = document.createElement("div");
  viewport.className = "project-card__viewport";

  const previewPanel = document.createElement("div");
  previewPanel.className = "project-card__panel project-card__preview";
  previewPanel.dataset.cardPanel = "preview";

  const previewLoader = createPreviewLoader(
    project.title,
    project.previewLoaderTheme,
  );
  const preview = document.createElement("iframe");
  preview.className = "project-card__frame";
  if (project.previewViewportWidth) {
    preview.classList.add("project-card__frame--fitted-website");
  }
  preview.title = `${project.title} interactive preview`;
  preview.allow = "fullscreen";
  if (!project.previewUrl) preview.setAttribute("sandbox", "allow-scripts");
  preview.setAttribute("loading", "lazy");
  preview.hidden = true;
  const previewImage = project.previewImage
    ? document.createElement("img")
    : null;
  if (previewImage) {
    previewImage.className = "project-card__preview-image";
    previewImage.alt = `${project.title} project screenshot`;
    previewImage.decoding = "async";
    previewImage.fetchPriority = "low";
    previewImage.hidden = true;
  }
  previewPanel.append(previewLoader);
  if (previewImage) previewPanel.append(previewImage);

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
  workTransform.append(surface);
  card.append(workTransform, explainer);

  let sourceFiles = project.files ?? null;
  let sourceLoadPromise = null;
  let fileTree = null;
  let disposed = false;

  function setFile(filename) {
    code.textContent = sourceFiles?.[filename] ?? "";
    const breadcrumb = document.createElement("span");
    breadcrumb.className = "project-card__source-breadcrumb";
    filename.split("/").forEach((segment, segmentIndex) => {
      if (segmentIndex > 0) {
        const separator = document.createElement("span");
        separator.className = "project-card__source-separator";
        separator.textContent = "/";
        breadcrumb.append(separator);
      }
      const part = document.createElement("span");
      part.className = "project-card__source-part";
      part.textContent = segment;
      breadcrumb.append(part);
    });
    sourceLabel.replaceChildren(breadcrumb);
    if (project.sourceRevision) {
      const revision = document.createElement("span");
      revision.className = "project-card__source-revision";
      revision.textContent = `GitHub ${project.sourceRevision}`;
      sourceLabel.append(revision);
    }
    fileTree.fileButtons.forEach((button) => {
      const selected = button.dataset.projectFile === filename;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
  }

  function prepareCodeBrowser() {
    if (fileTree || sourceLoadPromise) return sourceLoadPromise;
    codePanel.setAttribute("aria-busy", "true");
    sourceLoadPromise = Promise.resolve(sourceFiles ?? project.loadFiles?.())
      .then((files) => {
        if (disposed) return;
        sourceFiles = files ?? {};
        fileTree = createFileTree({ ...project, files: sourceFiles }, setFile);
        treePanel.append(fileTree.element);
        const firstFile = Object.keys(sourceFiles)[0];
        if (firstFile) setFile(firstFile);
      })
      .catch((error) => {
        if (!disposed) {
          code.textContent = "Source preview unavailable.";
          console.warn(
            `Could not load ${project.title} source preview.`,
            error,
          );
        }
      })
      .finally(() => {
        if (!disposed) codePanel.removeAttribute("aria-busy");
      });
    return sourceLoadPromise;
  }

  let currentMode = "preview";
  let fallbackFullscreen = false;

  function isFullscreen() {
    return document.fullscreenElement === surface || fallbackFullscreen;
  }

  function setMode(mode) {
    currentMode = mode;
    const showPreview = mode === "preview";
    previewPanel.hidden = !showPreview;
    codePanel.hidden = showPreview;
    previewButton.classList.toggle("is-active", showPreview);
    codeButton.classList.toggle("is-active", !showPreview);
    previewButton.setAttribute("aria-pressed", String(showPreview));
    codeButton.setAttribute("aria-pressed", String(!showPreview));
    if (showPreview && isPreviewAvailable()) schedulePreview();
    else if (!showPreview) {
      if (!previewLoadStarted) clearPreviewLoadTimer();
      void prepareCodeBrowser();
    }
    syncPreviewVisibility();
  }

  function handleModeClick(event) {
    setMode(event.currentTarget.dataset.cardMode);
  }

  function syncFullscreenButton() {
    const fullscreen = isFullscreen();
    fullscreenButton.classList.toggle("is-active", fullscreen);
    fullscreenButton.setAttribute("aria-pressed", String(fullscreen));
    fullscreenButton.setAttribute(
      "aria-label",
      `${fullscreen ? "Exit" : "Enter"} ${project.title} full screen`,
    );
    fullscreenLabel.textContent = fullscreen
      ? "Exit full screen"
      : "Full screen";
    fullscreenIcon.path.setAttribute(
      "d",
      fullscreen
        ? "M9 4v5H4 M15 4v5h5 M9 20v-5H4 M15 20v-5h5"
        : "M9 4H4v5 M15 4h5v5 M9 20H4v-5 M15 20h5v-5",
    );
    if (fullscreen && currentMode === "preview") schedulePreview();
    syncPreviewVisibility();
  }

  function setFallbackFullscreen(fullscreen) {
    fallbackFullscreen = fullscreen;
    card.classList.toggle("is-fallback-fullscreen", fullscreen);
    document.body.classList.toggle(
      "has-project-fallback-fullscreen",
      fullscreen || Boolean(document.querySelector(".is-fallback-fullscreen")),
    );
    syncFullscreenButton();
  }

  async function handleFullscreenClick() {
    if (fallbackFullscreen) {
      setFallbackFullscreen(false);
      return;
    }

    if (document.fullscreenElement === surface) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn("Could not exit the project fullscreen state.", error);
      }
      return;
    }

    if (
      document.fullscreenEnabled &&
      typeof surface.requestFullscreen === "function"
    ) {
      try {
        await surface.requestFullscreen();
        return;
      } catch (error) {
        console.warn(
          "Native fullscreen was unavailable; using the viewport fallback.",
          error,
        );
      }
    }

    setFallbackFullscreen(true);
  }

  function handleFullscreenKeydown(event) {
    if (event.key === "Escape" && fallbackFullscreen) {
      setFallbackFullscreen(false);
    }
  }

  let previewLoadTimer = 0;
  let previewLoaderRevealTimer = 0;
  let previewLoadStarted = false;
  let previewReady = false;
  let previewActive = false;
  const previewResizeObserver = project.previewViewportWidth
    ? new ResizeObserver(([entry]) => {
        const panelWidth = entry.contentRect.width;
        const panelHeight = entry.contentRect.height;
        if (!panelWidth || !panelHeight) return;
        const viewportWidth = Math.max(
          panelWidth,
          project.previewViewportWidth,
        );
        const scale = panelWidth / viewportWidth;
        preview.style.inlineSize = `${viewportWidth}px`;
        preview.style.blockSize = `${panelHeight / scale}px`;
        preview.style.transform = `scale(${scale})`;
      })
    : null;
  previewResizeObserver?.observe(previewPanel);

  function setSideTransform(side, transform) {
    if (!PROJECT_SIDE_NAMES.includes(side)) return;
    const target = side === "preview" ? workTransform : explainer;
    target.style.setProperty("--side-position-x", `${transform.position.x}px`);
    target.style.setProperty("--side-position-y", `${transform.position.y}px`);
    target.style.setProperty("--side-position-z", `${transform.position.z}px`);
    target.style.setProperty("--side-rotation-x", `${transform.rotation.x}rad`);
    target.style.setProperty("--side-rotation-y", `${transform.rotation.y}rad`);
    target.style.setProperty("--side-rotation-z", `${transform.rotation.z}rad`);
    target.style.setProperty(
      "--side-scale-x",
      String(transform.scale * transform.width),
    );
    target.style.setProperty(
      "--side-scale-y",
      String(transform.scale * transform.height),
    );
    target.style.setProperty("--side-scale-z", String(transform.scale));
  }

  function clearPreviewLoadTimer() {
    if (!previewLoadTimer) return;
    window.clearTimeout(previewLoadTimer);
    previewLoadTimer = 0;
  }

  function clearPreviewLoaderRevealTimer() {
    if (!previewLoaderRevealTimer) return;
    window.clearTimeout(previewLoaderRevealTimer);
    previewLoaderRevealTimer = 0;
  }

  function schedulePreviewLoaderReveal() {
    if (
      previewReady ||
      previewLoaderRevealTimer ||
      previewLoader.classList.contains("is-visible")
    ) {
      return;
    }
    previewLoaderRevealTimer = window.setTimeout(() => {
      previewLoaderRevealTimer = 0;
      if (!previewReady) previewLoader.classList.add("is-visible");
    }, PREVIEW_LOADER_REVEAL_DELAY_MS);
  }

  function isPreviewAvailable() {
    return previewActive || isFullscreen() || previewLoadStarted;
  }

  function syncPreviewVisibility() {
    const showingPreview = currentMode === "preview";
    const previewVisible = showingPreview && previewLoadStarted && previewReady;
    const previewVisual = previewImage ?? preview;
    if (previewVisual.hidden === previewVisible) {
      previewVisual.hidden = !previewVisible;
    }
    previewPanel.classList.toggle(
      "is-preview-poster-visible",
      showingPreview && !previewVisible,
    );
    const loaderVisible = showingPreview && !previewReady;
    if (previewLoader.hidden === loaderVisible) {
      previewLoader.hidden = !loaderVisible;
    }
  }

  function completePreviewProgress() {
    if (previewReady) return;
    previewReady = true;
    clearPreviewLoaderRevealTimer();
    previewLoader.classList.remove("is-visible");
    previewLoader.setAttribute("aria-label", `${project.title} preview ready`);
    syncPreviewVisibility();
  }

  function hasLoadedPreviewDocument() {
    if (!project.previewUrl) return true;
    try {
      const loadedUrl = preview.contentWindow?.location.href;
      return Boolean(loadedUrl && loadedUrl !== "about:blank");
    } catch {
      // Cross-origin access fails only after the iframe has left about:blank.
      return true;
    }
  }

  function handlePreviewLoad() {
    if (!previewLoadStarted || !hasLoadedPreviewDocument()) return;
    completePreviewProgress();
  }

  function startPreview() {
    if (previewLoadStarted) return;
    previewLoadStarted = true;
    schedulePreviewLoaderReveal();
    if (previewImage) {
      previewImage.src = `${import.meta.env.BASE_URL}${project.previewImage}`;
      if (previewImage.complete && previewImage.naturalWidth) {
        completePreviewProgress();
      }
      return;
    }
    if (project.previewUrl) {
      preview.src = project.previewUrl;
      previewPanel.append(preview);
    }
  }

  function schedulePreview() {
    if (previewLoadStarted) {
      syncPreviewVisibility();
      return;
    }
    clearPreviewLoadTimer();
    previewLoadTimer = window.setTimeout(() => {
      previewLoadTimer = 0;
      startPreview();
    }, 0);
  }

  function updatePreviewActivity(active) {
    if (previewActive === active) return;
    previewActive = active;
    if (isPreviewAvailable() && currentMode === "preview") schedulePreview();
    else clearPreviewLoadTimer();
    syncPreviewVisibility();
  }

  preview.addEventListener("load", handlePreviewLoad);
  previewImage?.addEventListener("load", completePreviewProgress);
  previewImage?.addEventListener("error", completePreviewProgress);
  previewButton.addEventListener("click", handleModeClick);
  codeButton.addEventListener("click", handleModeClick);
  fullscreenButton.addEventListener("click", handleFullscreenClick);
  document.addEventListener("fullscreenchange", syncFullscreenButton);
  document.addEventListener("keydown", handleFullscreenKeydown);
  setMode("preview");
  syncFullscreenButton();

  return {
    element: card,
    isFullscreen,
    setDimensions,
    setSideTransform,
    updatePreviewActivity,
    dispose() {
      disposed = true;
      previewButton.removeEventListener("click", handleModeClick);
      codeButton.removeEventListener("click", handleModeClick);
      fullscreenButton.removeEventListener("click", handleFullscreenClick);
      document.removeEventListener("fullscreenchange", syncFullscreenButton);
      document.removeEventListener("keydown", handleFullscreenKeydown);
      if (fallbackFullscreen) setFallbackFullscreen(false);
      fileTree?.dispose();
      clearPreviewLoadTimer();
      clearPreviewLoaderRevealTimer();
      previewResizeObserver?.disconnect();
      preview.removeEventListener("load", handlePreviewLoad);
      previewImage?.removeEventListener("load", completePreviewProgress);
      previewImage?.removeEventListener("error", completePreviewProgress);
      preview.hidden = true;
      preview.removeAttribute("src");
      previewImage?.removeAttribute("src");
    },
  };
}

/**
 * Interactive HTML project simulations fixed in the shared Three.js world.
 * Three.js anchors supply their camera-space transforms while native DOM owns
 * the continuous visuals, controls, previews, source views, and keyboard
 * behavior.
 */
export function createPortfolioCards(container) {
  const group = new THREE.Group();
  group.name = CARD_WORLD_CONFIG.id;

  const entries = PROJECTS.map((project, index) => {
    const rig = new THREE.Group();
    rig.name = `portfolio-card-rig-${index + 1}`;
    const view = createProjectCard(project, index);
    container.append(view.element);
    const anchor = new THREE.Object3D();
    anchor.name = `portfolio-card-anchor-${index + 1}`;
    rig.add(anchor);
    group.add(rig);
    return {
      anchor,
      baseScale: CARD_WORLD_CONFIG.responsive.authoredScale,
      depth: Number.POSITIVE_INFINITY,
      entryProgress: 0,
      focusDistance: Number.POSITIVE_INFINITY,
      height: CARD_WORLD_CONFIG.height,
      inFront: false,
      projectId: project.id,
      presentation: {
        active: false,
        controlsInteractive: false,
        interactive: false,
        rendered: false,
      },
      rig,
      screenBounds: { bottom: 0, left: 0, right: 0, top: 0 },
      screenTransform: { a: 1, b: 0, c: 0, d: 1, x: 0, y: 0 },
      sideTransforms: {
        preview: cloneSideTransform(project.id, "preview"),
        text: cloneSideTransform(project.id, "text"),
      },
      visibility: 0,
      view,
      width: CARD_WORLD_CONFIG.width,
    };
  });

  let preset = "";
  let viewportHeight = 1;
  let viewportWidth = 1;

  function applyResponsiveScale(entry) {
    entry.anchor.scale.setScalar(
      getResponsiveCardScale(
        viewportWidth,
        viewportHeight,
        entry.width,
        entry.baseScale,
      ),
    );
  }

  function applySideTransform(entry, side) {
    entry.view.setSideTransform(side, entry.sideTransforms[side]);
  }

  function applyPreset(index) {
    const config = getCardPreset(preset)[index];
    const entry = entries[index];
    const { rig, view } = entry;
    rig.position.set(...config.position);
    rig.rotation.set(...config.rotation);
    entry.baseScale = config.scale;
    entry.width = CARD_WORLD_CONFIG.width;
    entry.height = CARD_WORLD_CONFIG.height;
    PROJECT_SIDE_NAMES.forEach((side) => {
      entry.sideTransforms[side] = cloneSideTransform(entry.projectId, side);
      applySideTransform(entry, side);
    });
    view.setDimensions(entry.width, entry.height);
    applyResponsiveScale(entry);
  }

  function resize(width, height) {
    const nextPreset = getJourneyPreset(width, height);
    const presetChanged = nextPreset !== preset;
    viewportWidth = width;
    viewportHeight = height;
    if (presetChanged) {
      preset = nextPreset;
      entries.forEach((_, index) => applyPreset(index));
    } else {
      entries.forEach(applyResponsiveScale);
    }
    return presetChanged;
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

    const cssWidth = entry.width / CARD_WORLD_CONFIG.worldUnitsPerCssPixel;
    const cssHeight = entry.height / CARD_WORLD_CONFIG.worldUnitsPerCssPixel;
    entry.screenTransform.a =
      (projectedTopRight.x - projectedTopLeft.x) / cssWidth;
    entry.screenTransform.b =
      (projectedTopRight.y - projectedTopLeft.y) / cssWidth;
    entry.screenTransform.c =
      (projectedBottomLeft.x - projectedTopLeft.x) / cssHeight;
    entry.screenTransform.d =
      (projectedBottomLeft.y - projectedTopLeft.y) / cssHeight;
    entry.screenTransform.x = projectedTopLeft.x;
    entry.screenTransform.y = projectedTopLeft.y;
  }

  function positionView(entry) {
    const { a, b, c, d, x, y } = entry.screenTransform;
    entry.view.element.style.transform = `matrix(${a.toFixed(6)}, ${b.toFixed(6)}, ${c.toFixed(6)}, ${d.toFixed(6)}, ${x.toFixed(2)}, ${y.toFixed(2)})`;
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

  function update(camera, width, height, scrolling = false) {
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
      entry.worldZ = worldPosition.z;
      entry.focusDistance = focusDistance;
      entry.inFront = inFront;
      entry.visibility = inFront ? getWorldExitVisibilityAtDepth(depth) : 0;
      entry.entryProgress = inFront ? getProjectFrameEntryAtDepth(depth) : 0;
      if (entry.visibility > FOCUS_WORLD_CONFIG.visibilityThreshold) {
        projectEntry(entry, camera, width, height);
      }

      if (
        inFront &&
        entry.visibility > FOCUS_WORLD_CONFIG.visibilityThreshold &&
        focusDistance < activeDistance
      ) {
        activeEntry = entry;
        activeDistance = focusDistance;
      }
    });

    entries.forEach((entry) => {
      const fullscreen = entry.view.isFullscreen();
      const active = entry === activeEntry;
      const rendered =
        fullscreen ||
        (entry.visibility > FOCUS_WORLD_CONFIG.visibilityThreshold &&
          isOnScreen(entry.screenBounds, width, height));
      const controlsInteractive =
        fullscreen ||
        (active &&
          rendered &&
          entry.visibility >= 0.25 &&
          entry.entryProgress >= 0.7);
      const interactive =
        fullscreen ||
        (active &&
          activeDistance <= FOCUS_WORLD_CONFIG.interactionBand &&
          rendered);
      const previewActive =
        !scrolling &&
        active &&
        activeDistance <= FOCUS_WORLD_CONFIG.previewBand &&
        rendered;
      const zIndex = String(Math.round(entry.worldZ * 100));
      if (entry.view.element.style.zIndex !== zIndex) {
        entry.view.element.style.zIndex = zIndex;
      }

      if (rendered) {
        positionView(entry);
        entry.view.element.style.opacity = entry.visibility.toFixed(4);
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
        const depthBlur = getWorldBlurAtDepth(entry.depth);
        entry.view.element.style.setProperty(
          "--card-depth-filter",
          depthBlur < 0.05 ? "none" : `blur(${depthBlur.toFixed(2)}px)`,
        );
        entry.view.element.style.visibility = "visible";
      } else if (entry.presentation.rendered) {
        entry.view.element.style.opacity = "0";
        entry.view.element.style.visibility = "hidden";
      }

      if (entry.presentation.interactive !== interactive) {
        entry.presentation.interactive = interactive;
        entry.view.element.style.pointerEvents = interactive ? "auto" : "none";
        entry.view.element.classList.toggle("is-interactive", interactive);
      }
      if (entry.presentation.controlsInteractive !== controlsInteractive) {
        entry.presentation.controlsInteractive = controlsInteractive;
        entry.view.element.inert = !controlsInteractive;
        entry.view.element.classList.toggle(
          "is-controls-interactive",
          controlsInteractive,
        );
      }
      const visiblyActive = active && rendered;
      if (entry.presentation.active !== visiblyActive) {
        entry.presentation.active = visiblyActive;
        entry.view.element.classList.toggle("is-active", visiblyActive);
      }
      entry.presentation.rendered = rendered;
      entry.view.updatePreviewActivity(previewActive);
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
      size: entry.baseScale,
    };
  }

  function getSideTransform(index, side) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    if (!PROJECT_SIDE_NAMES.includes(side)) {
      throw new RangeError(`Unknown portfolio card side: ${side}`);
    }
    const transform = entry.sideTransforms[side];
    return {
      position: { ...transform.position },
      rotation: { ...transform.rotation },
      width: transform.width,
      height: transform.height,
      scale: transform.scale,
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
    entry.baseScale = value;
    applyResponsiveScale(entry);
  }

  function setFrameDimension(index, dimension, value) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    if (dimension !== "width" && dimension !== "height") return;
    entry[dimension] = value;
    entry.view.setDimensions(entry.width, entry.height);
    applyResponsiveScale(entry);
  }

  function setSideTransformComponent(index, side, type, axis, value) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    if (!PROJECT_SIDE_NAMES.includes(side)) return;
    const transform = entry.sideTransforms[side];

    if (type === "position" || type === "rotation") {
      if (!Object.hasOwn(transform[type], axis)) return;
      transform[type][axis] = value;
    } else if (type === "width" || type === "height" || type === "scale") {
      transform[type] = value;
    } else {
      return;
    }

    applySideTransform(entry, side);
  }

  function resetSideTransform(index, side) {
    const entry = entries[index];
    if (!entry) throw new RangeError(`Unknown portfolio card: ${index}`);
    if (!PROJECT_SIDE_NAMES.includes(side)) return;
    entry.sideTransforms[side] = cloneSideTransform(entry.projectId, side);
    applySideTransform(entry, side);
  }

  function resetCard(index) {
    if (entries[index]) applyPreset(index);
  }

  function resetAllCards() {
    entries.forEach((_, index) => applyPreset(index));
  }

  return {
    group,
    getSideTransform,
    getTransform,
    resetAllCards,
    resetCard,
    resetSideTransform,
    resize,
    setFrameDimension,
    setSize,
    setSideTransformComponent,
    setTransformComponent,
    update,
    dispose() {
      entries.forEach(({ view }) => view.dispose());
      group.removeFromParent();
    },
  };
}
