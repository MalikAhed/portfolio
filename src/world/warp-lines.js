import { MathUtils } from "three";
import { FOCUS_WORLD_CONFIG } from "./config.js";

const clamp = (value, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function createWarpLines(canvas, occluders) {
  const context = canvas.getContext("2d", { alpha: true });
  const maximumLineCount = 220;
  const lines = Array.from({ length: maximumLineCount }, () => ({}));
  const measuredOccluders = occluders.map((occluder) => ({
    ...occluder,
    bounds: null,
    opacity: 0,
  }));
  let width = 1;
  let height = 1;
  let maximumRadius = 1;
  let active = false;
  let travel = 0;
  let colorChannel = 16;
  let occludersDirty = true;
  let animationFrameId = 0;
  let previousTime = 0;

  function resetLine(line, distribute = false) {
    line.angle = Math.random() * Math.PI * 2;
    line.cosine = Math.cos(line.angle);
    line.sine = Math.sin(line.angle);
    line.radius = distribute ? Math.random() : Math.random() * 0.075;
    line.speed = 0.45 + Math.random() * 0.9;
    line.brightness = 0.38 + Math.random() * 0.62;
    line.width = 0.45 + Math.random() * 1.25;
  }

  lines.forEach((line) => resetLine(line, true));

  function measureOccluders() {
    occludersDirty = false;
    measuredOccluders.forEach((occluder) => {
      const { element, opacityElement = element } = occluder;
      const opacity = Number.parseFloat(opacityElement.style.opacity || "1");
      if (
        opacity <= FOCUS_WORLD_CONFIG.visibilityThreshold ||
        opacityElement.style.visibility === "hidden"
      ) {
        occluder.bounds = null;
        occluder.opacity = 0;
        return;
      }

      const bounds = element.getBoundingClientRect();
      occluder.bounds =
        bounds.right > 0 &&
        bounds.bottom > 0 &&
        bounds.left < width &&
        bounds.top < height
          ? bounds
          : null;
      occluder.opacity = clamp(opacity);
    });
  }

  function eraseForegroundWork() {
    if (occludersDirty) measureOccluders();
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "#000";

    measuredOccluders.forEach(({ bounds, opacity }) => {
      if (!bounds) return;
      const padding = 12;
      const x = bounds.left - padding;
      const y = bounds.top - padding;
      const occluderWidth = bounds.width + padding * 2;
      const occluderHeight = bounds.height + padding * 2;

      context.globalAlpha = opacity;
      context.beginPath();
      if (typeof context.roundRect === "function") {
        context.roundRect(x, y, occluderWidth, occluderHeight, 32);
      } else {
        context.rect(x, y, occluderWidth, occluderHeight);
      }
      context.fill();
    });

    context.restore();
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    maximumRadius = Math.hypot(width, height) * 0.62;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    occludersDirty = true;
  }

  function render(time) {
    animationFrameId = 0;
    if (!active || !context || document.hidden) return;

    const deltaTime = previousTime
      ? MathUtils.clamp((time - previousTime) / 1000, 0, 0.05)
      : 1 / 60;
    previousTime = time;
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.strokeStyle = `rgb(${colorChannel} ${colorChannel} ${colorChannel})`;

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const visibleLineCount = Math.round(
      MathUtils.lerp(42, maximumLineCount, travel),
    );
    const radialCompression = 1 + travel * 0.7;
    const motionSpeed = 0.14 + travel * 0.72;
    const baseTrail = 0.01 + travel * 0.045;

    for (let index = 0; index < visibleLineCount; index += 1) {
      const line = lines[index];
      line.radius +=
        deltaTime * line.speed * motionSpeed * (0.3 + line.radius * 1.7);
      if (line.radius > 1.04) resetLine(line);

      const headRadius =
        maximumRadius * Math.pow(line.radius, radialCompression);
      const tailProgress = Math.max(
        0,
        line.radius - baseTrail * (0.55 + line.radius),
      );
      const tailRadius =
        maximumRadius * Math.pow(tailProgress, radialCompression);
      const edgeFade = 1 - MathUtils.smoothstep(line.radius, 0.82, 1.04);
      const centerFade = MathUtils.smoothstep(line.radius, 0.015, 0.16);

      context.globalAlpha =
        line.brightness * edgeFade * centerFade * (0.55 + travel * 0.45);
      context.beginPath();
      context.moveTo(
        centerX + line.cosine * tailRadius,
        centerY + line.sine * tailRadius,
      );
      context.lineTo(
        centerX + line.cosine * headRadius,
        centerY + line.sine * headRadius,
      );
      context.lineWidth = line.width * (0.75 + travel * 0.85);
      context.stroke();
    }
    context.globalAlpha = 1;

    eraseForegroundWork();
    animationFrameId = window.requestAnimationFrame(render);
  }

  function setState(nextActive, nextTravel, nextColorChannel = 16) {
    travel = clamp(nextTravel);
    colorChannel = Math.round(clamp(nextColorChannel, 0, 255));
    if (active === nextActive) return;
    active = nextActive;
    previousTime = 0;
    if (active && !animationFrameId && !document.hidden) {
      animationFrameId = window.requestAnimationFrame(render);
    } else if (!active) {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
      context?.clearRect(0, 0, width, height);
    }
  }

  function handleVisibilityChange() {
    if (active && !document.hidden && !animationFrameId) {
      previousTime = 0;
      animationFrameId = window.requestAnimationFrame(render);
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  resize();

  return {
    setState,
    invalidateOccluders() {
      occludersDirty = true;
    },
    dispose() {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.width = 1;
      canvas.height = 1;
    },
  };
}
