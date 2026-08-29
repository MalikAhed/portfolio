import { getRequiredElement } from "../lib/dom.js";

export function initLearnObjectEditor(objectWorld, onChange) {
  const editor = getRequiredElement("[data-learn-object-editor]");
  const select = getRequiredElement("[data-learn-object-select]", editor);
  const visibleInput = getRequiredElement(
    "[data-learn-object-visible]",
    editor,
  );
  const copyButton = getRequiredElement("[data-learn-object-copy]", editor);
  const resetButton = getRequiredElement("[data-learn-object-reset]", editor);
  const resetAllButton = getRequiredElement(
    "[data-learn-object-reset-all]",
    editor,
  );
  const positionInputs = ["x", "y", "z"].map((axis) => ({
    axis,
    input: getRequiredElement(`[data-learn-object-position="${axis}"]`, editor),
    output: getRequiredElement(
      `[data-learn-object-position-value="${axis}"]`,
      editor,
    ),
  }));

  objectWorld.getObjects().forEach(({ name }, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = name.replaceAll("-", " ");
    select.append(option);
  });

  const selectedIndex = () => Number(select.value);

  function refresh() {
    const state = objectWorld.getObjectState(selectedIndex());
    visibleInput.checked = state.visible;
    positionInputs.forEach(({ axis, input, output }) => {
      const value = state.position[axis].toFixed(2);
      input.value = value;
      output.value = value;
    });
  }

  function handlePositionInput(event) {
    const field = positionInputs.find(
      ({ input }) => input === event.currentTarget,
    );
    const value = Number(field?.input.value);
    if (!field || !Number.isFinite(value)) return;
    objectWorld.setObjectPosition(selectedIndex(), field.axis, value);
    field.output.value = value.toFixed(2);
    onChange();
  }

  function handleVisibilityInput() {
    objectWorld.setObjectVisible(selectedIndex(), visibleInput.checked);
    onChange();
  }

  function handleReset() {
    objectWorld.resetObject(selectedIndex());
    refresh();
    onChange();
  }

  function handleResetAll() {
    objectWorld.resetAllObjects();
    refresh();
    onChange();
  }

  async function handleCopy() {
    const settings = objectWorld.getObjects().map((_, index) => {
      const state = objectWorld.getObjectState(index);
      const position = state.position;
      return `${state.name}: x ${position.x.toFixed(2)}, y ${position.y.toFixed(2)}, z ${position.z.toFixed(2)}, visible ${state.visible}`;
    });
    try {
      await navigator.clipboard.writeText(settings.join("\n"));
      copyButton.textContent = "Copied";
      window.setTimeout(() => {
        copyButton.textContent = "Copy all objects";
      }, 1200);
    } catch (error) {
      console.warn("Could not copy Full-Stack Quest object settings.", error);
      copyButton.textContent = "Copy failed";
    }
  }

  select.addEventListener("change", refresh);
  visibleInput.addEventListener("change", handleVisibilityInput);
  positionInputs.forEach(({ input }) =>
    input.addEventListener("input", handlePositionInput),
  );
  resetButton.addEventListener("click", handleReset);
  resetAllButton.addEventListener("click", handleResetAll);
  copyButton.addEventListener("click", handleCopy);
  refresh();
  editor.hidden = false;

  return {
    dispose() {
      select.removeEventListener("change", refresh);
      visibleInput.removeEventListener("change", handleVisibilityInput);
      positionInputs.forEach(({ input }) =>
        input.removeEventListener("input", handlePositionInput),
      );
      resetButton.removeEventListener("click", handleReset);
      resetAllButton.removeEventListener("click", handleResetAll);
      copyButton.removeEventListener("click", handleCopy);
      select.replaceChildren();
      editor.hidden = true;
    },
  };
}
