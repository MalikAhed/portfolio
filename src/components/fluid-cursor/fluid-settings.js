export const FLUID_SETTINGS_EVENT = "portfolio:fluid-settings";
export const FLUID_SETTINGS_STORAGE_KEY = "portfolio-hero-fluid-v4";
const LEGACY_FLUID_SETTINGS_STORAGE_KEY = "portfolio-hero-fluid-v3";

export const DEFAULT_FLUID_SETTINGS = Object.freeze({
  enabled: false,
  colorMode: "original",
  color: "#ff0000",
  secondaryColor: "#0000ff",
  colorStrength: 0.24,
  opacity: 0.8,
  fadeTime: 0.9,
  radius: 0.22,
  force: 6200,
  curl: 3,
  reach: 1.25,
  emissionRate: 8,
  originX: 0.5,
  emitterGap: 0.07,
  emitterY: 0.14,
  emitterSpread: 0.08,
});

const FLUID_SETTINGS_LIMITS = Object.freeze({
  opacity: [0.05, 1],
  colorStrength: [0.02, 0.5],
  fadeTime: [0.15, 4],
  radius: [0.04, 0.4],
  force: [500, 9000],
  curl: [0, 12],
  reach: [0.2, 2.5],
  emissionRate: [1, 20],
  originX: [0.1, 0.9],
  emitterGap: [0.02, 0.5],
  emitterY: [0.08, 0.92],
  emitterSpread: [0, 0.35],
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeFluidSettings(value = {}) {
  const settings = { ...DEFAULT_FLUID_SETTINGS };

  settings.enabled = value.enabled === true || value.enabled === "true";

  Object.entries(FLUID_SETTINGS_LIMITS).forEach(
    ([property, [minimum, maximum]]) => {
      const candidate = Number(value[property]);
      if (Number.isFinite(candidate)) {
        settings[property] = clamp(candidate, minimum, maximum);
      }
    },
  );

  if (/^#[0-9a-f]{6}$/i.test(value.color)) settings.color = value.color;
  if (/^#[0-9a-f]{6}$/i.test(value.secondaryColor)) {
    settings.secondaryColor = value.secondaryColor;
  }
  if (value.colorMode === "custom") settings.colorMode = "custom";
  return settings;
}

export function loadFluidSettings() {
  try {
    const stored = localStorage.getItem(FLUID_SETTINGS_STORAGE_KEY);
    if (stored) return normalizeFluidSettings(JSON.parse(stored));

    const legacy = JSON.parse(
      localStorage.getItem(LEGACY_FLUID_SETTINGS_STORAGE_KEY) ?? "null",
    );
    if (!legacy) return { ...DEFAULT_FLUID_SETTINGS };

    // Preserve visual tuning from the former edge-emitter version while
    // adopting the new bottom-center origin and tighter source spread.
    return normalizeFluidSettings({
      ...legacy,
      emitterY: DEFAULT_FLUID_SETTINGS.emitterY,
      emitterSpread: DEFAULT_FLUID_SETTINGS.emitterSpread,
    });
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
    normalized.enabled ? String(normalized.opacity) : "0",
  );
  window.dispatchEvent(
    new CustomEvent(FLUID_SETTINGS_EVENT, { detail: normalized }),
  );
  return normalized;
}
