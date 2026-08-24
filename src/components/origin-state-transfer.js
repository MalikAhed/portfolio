const SOURCE_PORT = import.meta.env.VITE_STATE_SOURCE_PORT ?? "5173";
const LAB_PORT = import.meta.env.VITE_STATE_LAB_PORT ?? "5174";
const TRANSFER_MARKER = "portfolio-lab-state-transfer-v1";
const REQUEST_TYPE = "portfolio:request-origin-state:v1";
const RESPONSE_TYPE = "portfolio:origin-state:v1";
const TRANSFER_TIMEOUT_MS = 3000;
const TRANSFERABLE_KEYS = new Set([
  "portfolio-black-hole-v4",
  "portfolio-black-hole-editor-v2",
  "portfolio-hero-fluid-v4",
  "portfolio-overlay-position-v2",
]);

function getOriginForPort(port) {
  const url = new URL(window.location.href);
  url.port = port;
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.origin;
}

function readStorageEntries() {
  return Array.from(TRANSFERABLE_KEYS, (key) => {
    const value = localStorage.getItem(key);
    return value === null ? null : [key, value];
  }).filter(Boolean);
}

function isStoragePayload(entries) {
  return (
    Array.isArray(entries) &&
    entries.every(
      (entry) =>
        Array.isArray(entry) &&
        entry.length === 2 &&
        typeof entry[0] === "string" &&
        typeof entry[1] === "string",
    )
  );
}

export function installOriginStateResponder() {
  if (window.location.port !== SOURCE_PORT) return () => {};

  const labOrigin = getOriginForPort(LAB_PORT);

  function handleMessage(event) {
    if (
      event.origin !== labOrigin ||
      event.data?.type !== REQUEST_TYPE ||
      !event.source
    ) {
      return;
    }

    event.source.postMessage(
      { type: RESPONSE_TYPE, entries: readStorageEntries() },
      labOrigin,
    );
  }

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}

export function importOriginStateIntoLab() {
  if (window.location.port !== LAB_PORT) return Promise.resolve(false);

  const forceTransfer =
    new URLSearchParams(window.location.search).get("syncPortfolioState") ===
    "1";
  if (!forceTransfer && localStorage.getItem(TRANSFER_MARKER) === "complete") {
    document.documentElement.dataset.editorState = "already-synced";
    return Promise.resolve(false);
  }

  const sourceOrigin = getOriginForPort(SOURCE_PORT);

  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    let settled = false;
    let timeoutId = 0;

    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.src = `${sourceOrigin}/?portfolioStateBridge=1`;

    function finish(result, status) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleMessage);
      frame.remove();
      document.documentElement.dataset.editorState = status;
      resolve(result);
    }

    function handleMessage(event) {
      if (
        event.origin !== sourceOrigin ||
        event.source !== frame.contentWindow ||
        event.data?.type !== RESPONSE_TYPE ||
        !isStoragePayload(event.data.entries)
      ) {
        return;
      }

      event.data.entries.forEach(([key, value]) =>
        TRANSFERABLE_KEYS.has(key)
          ? localStorage.setItem(key, value)
          : undefined,
      );
      localStorage.setItem(TRANSFER_MARKER, "complete");
      finish(true, "synced-from-portfolio");
    }

    window.addEventListener("message", handleMessage);
    frame.addEventListener(
      "load",
      () =>
        frame.contentWindow?.postMessage({ type: REQUEST_TYPE }, sourceOrigin),
      { once: true },
    );
    timeoutId = window.setTimeout(
      () => finish(false, "source-unavailable"),
      TRANSFER_TIMEOUT_MS,
    );
    document.body.append(frame);
  });
}
