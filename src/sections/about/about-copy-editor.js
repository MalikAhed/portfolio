import position from "./about-copy-position.json";

const SAVE_ENDPOINT = "/__about-copy-position";

export function initAboutCopyEditor() {
  const bio = document.querySelector("[data-about-bio]");
  const editor = document.querySelector(".about-copy-editor");
  if (!bio || !editor) return () => {};

  const toggle = editor.querySelector(".about-copy-editor__toggle");
  const panel = editor.querySelector(".about-copy-editor__panel");
  const close = editor.querySelector(".about-copy-editor__close");
  const reset = editor.querySelector(".about-copy-editor__reset");
  const status = editor.querySelector("[data-about-copy-status]");
  const controls = Object.fromEntries(
    Array.from(
      editor.querySelectorAll("[data-about-copy-property]"),
      (input) => [input.dataset.aboutCopyProperty, input],
    ),
  );
  const outputs = Object.fromEntries(
    Array.from(
      editor.querySelectorAll("[data-about-copy-output]"),
      (output) => [output.dataset.aboutCopyOutput, output],
    ),
  );
  const loadedPosition = { ...position };
  let state = { ...loadedPosition };
  let saveTimer = 0;
  let disposed = false;

  function apply() {
    bio.style.setProperty("--about-copy-x", `${state.x}px`);
    bio.style.setProperty("--about-copy-y", `${state.y}px`);
    bio.style.setProperty("--about-copy-width", `${state.width}px`);
    bio.style.setProperty("--about-copy-size-adjust", `${state.size}px`);
    bio.style.setProperty("--about-copy-weight", String(state.weight));
    Object.entries(controls).forEach(([property, control]) => {
      control.value = String(state[property]);
    });
    outputs.x.value = `${Math.round(state.x)}px`;
    outputs.y.value = `${Math.round(state.y)}px`;
    outputs.width.value = `${Math.round(state.width)}px`;
    outputs.size.value =
      state.size === 0
        ? "Base"
        : `${state.size > 0 ? "+" : ""}${Math.round(state.size)}px`;
    outputs.weight.value = String(Math.round(state.weight));
  }

  async function saveToCode() {
    status.textContent = "Saving to code…";
    try {
      const response = await fetch(SAVE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!response.ok) throw new Error("Save endpoint unavailable");
      if (!disposed) status.textContent = "Saved to About position config.";
    } catch {
      if (!disposed) {
        status.textContent =
          "Live position applied. Start the Vite dev server to save to code.";
      }
    }
  }

  function queueSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveToCode, 320);
  }

  function handleInput(event) {
    const property = event.currentTarget.dataset.aboutCopyProperty;
    state[property] = Number(event.currentTarget.value);
    apply();
    queueSave();
  }

  function setOpen(open) {
    panel.hidden = !open;
    toggle.hidden = open;
    toggle.setAttribute("aria-expanded", String(open));
  }

  function handleReset() {
    state = { ...loadedPosition };
    apply();
    queueSave();
  }

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  toggle.addEventListener("click", handleOpen);
  close.addEventListener("click", handleClose);
  reset.addEventListener("click", handleReset);
  Object.values(controls).forEach((control) =>
    control.addEventListener("input", handleInput),
  );
  apply();

  return () => {
    disposed = true;
    window.clearTimeout(saveTimer);
    toggle.removeEventListener("click", handleOpen);
    close.removeEventListener("click", handleClose);
    reset.removeEventListener("click", handleReset);
    Object.values(controls).forEach((control) =>
      control.removeEventListener("input", handleInput),
    );
  };
}
