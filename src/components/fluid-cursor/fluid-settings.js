export const FLUID_SETTINGS_EVENT = "portfolio:fluid-settings";
export const FLUID_SETTINGS_STORAGE_KEY = "portfolio-fluid-cursor-v1";

export const DEFAULT_FLUID_SETTINGS = Object.freeze({
  color: "#f4f6f8",
  outerColor: "#151719",
  outerRate: 0.035,
  outerSize: 0.48,
  outerDistance: 0.072,
  opacity: 0.6,
  fade: 10.5,
  radius: 0.18,
  force: 5200,
  curl: 3,
});

const FLUID_SETTINGS_LIMITS = Object.freeze({
  opacity: [0.05, 0.9],
  outerRate: [0, 0.25],
  outerSize: [0.1, 1.5],
  outerDistance: [0.01, 0.2],
  fade: [1, 20],
  radius: [0.04, 0.4],
  force: [500, 9000],
  curl: [0, 12],
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeFluidSettings(value = {}) {
  const settings = { ...DEFAULT_FLUID_SETTINGS };

  Object.entries(FLUID_SETTINGS_LIMITS).forEach(
    ([property, [minimum, maximum]]) => {
      const candidate = Number(value[property]);
      if (Number.isFinite(candidate)) {
        settings[property] = clamp(candidate, minimum, maximum);
      }
    },
  );

  if (/^#[0-9a-f]{6}$/i.test(value.color)) settings.color = value.color;
  if (/^#[0-9a-f]{6}$/i.test(value.outerColor)) {
    settings.outerColor = value.outerColor;
  }
  return settings;
}

export function loadFluidSettings() {
  try {
    return normalizeFluidSettings(
      JSON.parse(localStorage.getItem(FLUID_SETTINGS_STORAGE_KEY)) ?? {},
    );
  } catch {
    return { ...DEFAULT_FLUID_SETTINGS };
  }
}

export function saveFluidSettings(settings) {
  const normalized = normalizeFluidSettings(settings);
  localStorage.setItem(FLUID_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function publishFluidSettings(settings) {
  const normalized = normalizeFluidSettings(settings);
  document.documentElement.style.setProperty(
    "--fluid-cursor-opacity",
    String(normalized.opacity),
  );
  window.dispatchEvent(
    new CustomEvent(FLUID_SETTINGS_EVENT, { detail: normalized }),
  );
  return normalized;
}
