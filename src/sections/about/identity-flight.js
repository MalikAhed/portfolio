const TEXT_MORPH_START = 0.04;
const TEXT_MORPH_END = 0.24;
const DOT_SCROLL_START = TEXT_MORPH_END;
const DOT_COLLISION_SCROLL = 0.84;
const TRAIL_SPAN = 0.2;

const REVEAL_DURATION = 1.55;
/* Reverse-scroll handoff: the formed black hole collapses between this point
   and DOT_COLLISION_SCROLL. At the collision point the merged dot owns the
   composition, then flightProgress runs backward and splits it upward. */
const BLACK_HOLE_REVERSE_START = 0.92;

const BLACK_HOLE_END = 0.42;
const STATEMENT_START = 0.34;
const STATEMENT_STAGGER = 0.075;
const STATEMENT_DURATION = 0.18;
const HIGHLIGHT_START = 0.82;
const HIGHLIGHT_DURATION = 0.18;
const MAX_CANVAS_PIXEL_COUNT = 1920 * 1080;
const MAX_CANVAS_PIXEL_RATIO = 1.5;

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function easeInOut(value) {
  return value * value * (3 - 2 * value);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function cubicBezier(start, controlA, controlB, end, progress) {
  const inverse = 1 - progress;
  return {
    x:
      inverse ** 3 * start.x +
      3 * inverse ** 2 * progress * controlA.x +
      3 * inverse * progress ** 2 * controlB.x +
      progress ** 3 * end.x,
    y:
      inverse ** 3 * start.y +
      3 * inverse ** 2 * progress * controlA.y +
      3 * inverse * progress ** 2 * controlB.y +
      progress ** 3 * end.y,
  };
}

function prepareCanvas(canvas) {
  const cssPixels = Math.max(1, window.innerWidth * window.innerHeight);
  const requestedRatio = Math.min(
    window.devicePixelRatio || 1,
    MAX_CANVAS_PIXEL_RATIO,
  );
  const pixelRatioLimit = Math.sqrt(MAX_CANVAS_PIXEL_COUNT / cssPixels);
  const ratio = Math.min(requestedRatio, pixelRatioLimit);
  const width = Math.round(window.innerWidth * ratio);
  const height = Math.round(window.innerHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

function drawDot(context, point, radius, color, opacity = 1) {
  if (radius <= 0 || opacity <= 0) return;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fillStyle = `rgb(${color} / ${opacity})`;
  context.shadowColor = `rgb(${color} / ${opacity * 0.32})`;
  context.shadowBlur = 9;
  context.fill();
  context.shadowBlur = 0;
}

function drawCurveTrail(
  context,
  start,
  controlA,
  controlB,
  end,
  travel,
  color,
  direction,
) {
  if (travel <= 0) return;
  const trailStart = direction >= 0 ? Math.max(0, travel - TRAIL_SPAN) : travel;
  const trailEnd = direction >= 0 ? travel : Math.min(1, travel + TRAIL_SPAN);
  const segments = 18;

  for (let index = 1; index <= segments; index += 1) {
    const localStart = (index - 1) / segments;
    const localEnd = index / segments;
    const progressA = trailStart + (trailEnd - trailStart) * localStart;
    const progressB = trailStart + (trailEnd - trailStart) * localEnd;
    const pointA = cubicBezier(start, controlA, controlB, end, progressA);
    const pointB = cubicBezier(start, controlA, controlB, end, progressB);
    const headWeight = direction >= 0 ? localEnd : 1 - localStart;
    const opacity = headWeight ** 2 * 0.34;
    context.beginPath();
    context.moveTo(pointA.x, pointA.y);
    context.lineTo(pointB.x, pointB.y);
    context.lineWidth = 0.5 + headWeight * 2.5;
    context.strokeStyle = `rgb(${color} / ${opacity})`;
    context.stroke();
  }
}

function moveToward(current, target, duration, delta, pace = 1) {
  if (current === target) return current;
  const step = (delta / duration) * pace;
  const distance = target - current;
  if (Math.abs(distance) <= step) return target;
  return current + Math.sign(distance) * step;
}

export function createScrollIdentityFlight({
  canvas,
  anchor,
  object,
  title,
  role,
  statementWords,
  reducedMotion,
  onAboutProgress = () => {},
}) {
  const colors = ["29 29 29", "29 29 29"];
  let previousScrollProgress = 0;
  let flightProgress = 0;
  let movementDirection = 1;
  let compressionProgress = 0;
  let revealProgress = 0;
  let expansionProgress = 0;
  let revealTarget = 0;
  let aboutProgress = 0;
  let hasFormed = false;
  let frame = 0;
  let previousFrameTime = 0;
  let disposed = false;
  let pathGeometry = null;
  let renderedIdentityState = "";
  let renderedRevealProgress = -1;
  let renderedBlackHoleProgress = -1;
  let canvasIsVisible = false;
  let objectIsFormed = false;
  let lastInputProgress = -1;
  let lastInputAboutProgress = -1;
  let lastImmediate = null;

  /*
   * Depth-world ownership:
   * - The fixed Hero identity supplies the two viewport-space starting points.
   * - The sticky black-hole anchor supplies the collision coordinate projected
   *   at DOT_COLLISION_SCROLL. Keeping that endpoint fixed prevents the
   *   anchor's simultaneous upward scroll from cancelling the dots' downward
   *   motion halfway through the flight.
   * - Text morph, dot travel, collision, settle, and their reverse are direct
   *   functions of scroll. Only the black-hole expansion/statement reveal use
   *   elapsed time after the collision has actually happened.
   */
  function capturePathGeometry(force = false) {
    if (pathGeometry && !force) return;

    const identityBounds = title.parentElement.getBoundingClientRect();
    const metrics = [title, role].map((element) => ({
      width: element.offsetWidth,
      height: element.offsetHeight,
      x: identityBounds.left + element.offsetLeft + element.offsetWidth / 2,
      y: identityBounds.top + element.offsetTop + element.offsetHeight / 2,
    }));

    pathGeometry = {
      starts: metrics.map(({ x, y }) => ({ x, y })),
      sizes: metrics.map(({ width, height }) => ({ width, height })),
      journeyDistance:
        anchor.closest(".hero-about-flow")?.querySelector(".hero")
          ?.offsetHeight || window.innerHeight,
    };
  }

  function getCollisionPoint() {
    const bounds = anchor.getBoundingClientRect();
    const remainingScroll =
      Math.max(0, DOT_COLLISION_SCROLL - previousScrollProgress) *
      pathGeometry.journeyDistance;
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2 - remainingScroll,
    };
  }

  function getPaths() {
    const target = getCollisionPoint();
    const splitDistance = Math.min(180, Math.max(80, window.innerWidth * 0.13));
    return pathGeometry.starts.map((origin, index) => {
      const direction = index === 0 ? -1 : 1;
      const start = {
        x: origin.x + splitDistance * direction,
        y: origin.y,
      };
      return {
        start,
        controlA: {
          x: start.x + window.innerWidth * 0.34 * direction,
          y: start.y + window.innerHeight * 0.2,
        },
        controlB: {
          x: target.x + window.innerWidth * 0.38 * direction,
          y: target.y - window.innerHeight * 0.2,
        },
        target,
      };
    });
  }

  function renderComposition() {
    const compression = easeOutCubic(compressionProgress);
    const splitDistance = Math.min(180, Math.max(80, window.innerWidth * 0.13));
    const dotHandoff = easeInOut(clamp((compressionProgress - 0.86) / 0.14));
    const identityState = reducedMotion.matches
      ? `reduced:${previousScrollProgress}`
      : `${compressionProgress}:${flightProgress > 0}`;
    if (identityState !== renderedIdentityState) {
      [title, role].forEach((element, index) => {
        if (reducedMotion.matches) {
          const reducedExit = easeInOut(
            clamp((previousScrollProgress - 0.55) / 0.22),
          );
          element.style.setProperty(
            "opacity",
            String(1 - reducedExit),
            "important",
          );
          element.style.filter = "none";
          element.style.scale = "1";
          element.style.translate = "0 0";
          element.style.transformOrigin = "50% 50%";
          return;
        }

        const direction = index === 0 ? -1 : 1;
        const { width, height } = pathGeometry.sizes[index];
        const finalScaleX = 10 / Math.max(1, width);
        const finalScaleY = 10 / Math.max(1, height);
        const scaleX = 1 + (finalScaleX - 1) * compression;
        const scaleY = 1 + (finalScaleY - 1) * compression;
        const isCanvasOwned = flightProgress > 0;
        element.style.setProperty(
          "opacity",
          isCanvasOwned ? "0" : String(1 - dotHandoff),
          "important",
        );
        element.style.removeProperty("color");
        element.style.removeProperty("background-color");
        element.style.removeProperty("border-radius");
        element.style.filter = "none";
        element.style.scale = `${scaleX} ${scaleY}`;
        element.style.translate = `${direction * splitDistance * compression}px 0`;
        element.style.transformOrigin = "50% 50%";
      });
      renderedIdentityState = identityState;
    }

    const blackHoleProgress = easeInOut(expansionProgress);
    if (blackHoleProgress !== renderedBlackHoleProgress) {
      object.style.opacity = String(blackHoleProgress);
      object.style.transform = `translate3d(0, -50%, 0) scale(${blackHoleProgress})`;
      renderedBlackHoleProgress = blackHoleProgress;
    }

    const nextObjectIsFormed = revealProgress >= 0.999;
    if (nextObjectIsFormed !== objectIsFormed) {
      object.classList.toggle("is-formed", nextObjectIsFormed);
      objectIsFormed = nextObjectIsFormed;
    }

    if (revealProgress !== renderedRevealProgress) {
      statementWords.forEach((word, index) => {
        const reveal = easeInOut(
          clamp(
            (revealProgress - (STATEMENT_START + index * STATEMENT_STAGGER)) /
              STATEMENT_DURATION,
          ),
        );
        word.style.opacity = String(reveal);
        word.style.filter = "none";
        word.style.translate = reducedMotion.matches
          ? "none"
          : `0 ${(1 - reveal) * 0.85}em`;
        word.style.scale = reducedMotion.matches
          ? "1"
          : String(0.94 + reveal * 0.06);
        if (word.hasAttribute("data-about-highlight")) {
          const highlightReveal = easeInOut(
            clamp((revealProgress - HIGHLIGHT_START) / HIGHLIGHT_DURATION),
          );
          word.style.setProperty(
            "--about-highlight-position",
            `${(1 - highlightReveal) * 100}%`,
          );
          word.style.setProperty(
            "--about-highlight-opacity",
            String(highlightReveal * 0.54),
          );
        }
      });
      renderedRevealProgress = revealProgress;
    }

    const dotsReady = flightProgress > 0 ? 1 : dotHandoff;
    const beforeCollision = easeInOut(clamp((1 - flightProgress) / 0.018));
    const dotsVisibility = dotsReady * beforeCollision;
    const mergedVisibility =
      dotsReady *
      easeInOut(clamp((flightProgress - 0.985) / 0.015)) *
      (1 - easeInOut(clamp(blackHoleProgress / 0.58)));

    if (
      reducedMotion.matches ||
      (dotsVisibility < 0.002 && mergedVisibility < 0.002)
    ) {
      if (canvasIsVisible) {
        canvas.style.opacity = "0";
        canvasIsVisible = false;
      }
      return;
    }

    // The flight canvas is only touched while a dot or trail is actually
    // visible. The black-hole expansion no longer clears a full-screen bitmap
    // for frames that contain no canvas artwork.
    const paths = getPaths();
    const context = prepareCanvas(canvas);
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (!canvasIsVisible) {
      canvas.style.opacity = "1";
      canvasIsVisible = true;
    }
    const travel = easeInOut(flightProgress);
    paths.forEach((path, index) => {
      const point = cubicBezier(
        path.start,
        path.controlA,
        path.controlB,
        path.target,
        travel,
      );
      context.globalAlpha = dotsVisibility;
      drawCurveTrail(
        context,
        path.start,
        path.controlA,
        path.controlB,
        path.target,
        travel,
        colors[index],
        movementDirection,
      );
      context.globalAlpha = 1;
      drawDot(context, point, 5, colors[index], dotsVisibility);
    });

    if (mergedVisibility > 0.002) {
      drawDot(
        context,
        paths[0].target,
        5 + blackHoleProgress * 5,
        "29 29 29",
        mergedVisibility,
      );
    }
  }

  function renderFrame(time) {
    frame = 0;
    const delta = previousFrameTime
      ? Math.min((time - previousFrameTime) / 1000, 0.1)
      : 1 / 60;
    previousFrameTime = time;
    if (revealTarget === 1) {
      revealProgress = moveToward(
        revealProgress,
        revealTarget,
        REVEAL_DURATION,
        delta,
      );
      expansionProgress = clamp(revealProgress / BLACK_HOLE_END);
    }

    renderComposition();

    if (revealTarget === 1 && revealProgress < 1) {
      requestFrame();
    } else {
      previousFrameTime = 0;
    }
  }

  function requestFrame() {
    if (frame || disposed) return;
    frame = window.requestAnimationFrame(renderFrame);
  }

  function setProgress(
    progress,
    { aboutProgress: nextAboutProgress = 0, immediate = false } = {},
  ) {
    const nextScrollProgress = clamp(progress);
    const normalizedAboutProgress = clamp(nextAboutProgress);
    if (
      Math.abs(nextScrollProgress - lastInputProgress) < 0.0001 &&
      Math.abs(normalizedAboutProgress - lastInputAboutProgress) < 0.0001 &&
      immediate === lastImmediate
    ) {
      return;
    }

    lastInputProgress = nextScrollProgress;
    lastInputAboutProgress = normalizedAboutProgress;
    lastImmediate = immediate;
    capturePathGeometry();
    movementDirection =
      Math.sign(nextScrollProgress - previousScrollProgress) ||
      movementDirection;
    previousScrollProgress = nextScrollProgress;
    compressionProgress = clamp(
      (nextScrollProgress - TEXT_MORPH_START) /
        (TEXT_MORPH_END - TEXT_MORPH_START),
    );
    flightProgress = clamp(
      (nextScrollProgress - DOT_SCROLL_START) /
        (DOT_COLLISION_SCROLL - DOT_SCROLL_START),
    );
    aboutProgress = normalizedAboutProgress;

    if (immediate) {
      revealTarget = nextScrollProgress >= DOT_COLLISION_SCROLL ? 1 : 0;
      revealProgress = revealTarget;
      expansionProgress = revealTarget;
      hasFormed = revealTarget === 1;
      onAboutProgress(aboutProgress);
      renderComposition();
      return;
    }

    const isReverseCollapse =
      hasFormed &&
      movementDirection < 0 &&
      nextScrollProgress < BLACK_HOLE_REVERSE_START;

    if (isReverseCollapse) {
      /* Begin collapsing before flightProgress leaves the collision point.
         This preserves the handoff black hole -> merged dot -> split dots
         instead of dropping the object to zero after the threshold. */
      revealTarget = 0;
      expansionProgress = clamp(
        (nextScrollProgress - DOT_COLLISION_SCROLL) /
          (BLACK_HOLE_REVERSE_START - DOT_COLLISION_SCROLL),
      );
      revealProgress = expansionProgress;
      if (expansionProgress === 0) hasFormed = false;
    } else if (nextScrollProgress >= DOT_COLLISION_SCROLL) {
      hasFormed = true;
      revealTarget = 1;
    } else if (hasFormed) {
      /* A fast reverse scroll can jump across the complete collapse interval
         in one frame. Resolve that jump at the dot state so the flight can
         continue upward from the correct owner. */
      revealTarget = 0;
      revealProgress = 0;
      expansionProgress = 0;
      hasFormed = false;
    } else {
      revealTarget = 0;
      revealProgress = 0;
      expansionProgress = 0;
    }

    onAboutProgress(aboutProgress);
    renderComposition();
    if (revealTarget === 1 && revealProgress < 1) requestFrame();
  }

  function dispose() {
    disposed = true;
    if (frame) window.cancelAnimationFrame(frame);
    [title, role].forEach((element) => {
      element.style.removeProperty("opacity");
      element.style.removeProperty("color");
      element.style.removeProperty("background-color");
      element.style.removeProperty("border-radius");
      element.style.removeProperty("filter");
      element.style.removeProperty("scale");
      element.style.removeProperty("translate");
      element.style.removeProperty("transform-origin");
    });
    statementWords.forEach((word) => {
      word.style.removeProperty("opacity");
      word.style.removeProperty("filter");
      word.style.removeProperty("translate");
      word.style.removeProperty("scale");
      word.style.removeProperty("--about-highlight-position");
      word.style.removeProperty("--about-highlight-opacity");
    });
    object.style.removeProperty("opacity");
    object.style.removeProperty("transform");
    object.classList.remove("is-formed");
    canvas.style.removeProperty("opacity");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  capturePathGeometry(true);
  renderComposition();
  return {
    dispose,
    refreshLayout: () => {
      capturePathGeometry(true);
      lastInputProgress = -1;
      lastInputAboutProgress = -1;
    },
    setProgress,
  };
}
