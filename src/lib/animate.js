function getLastKeyframe(keyframes) {
  return Array.isArray(keyframes) ? keyframes.at(-1) : keyframes;
}

export async function playElementAnimation(element, keyframes, options) {
  const animation = element.animate(keyframes, {
    fill: "forwards",
    ...options,
  });

  try {
    await animation.finished;
  } catch {
    return;
  }

  const finalKeyframe = getLastKeyframe(keyframes);
  Object.entries(finalKeyframe).forEach(([property, value]) => {
    if (["offset", "easing", "composite"].includes(property)) return;
    element.style[property] = value;
  });
  animation.cancel();
}
