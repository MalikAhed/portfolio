import { getRequiredElement } from "../lib/dom.js";

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function initProjectFrameEditor(portfolioCards, onTransformChange) {
  const editor = getRequiredElement("[data-project-frame-editor]");
  const projectSelect = getRequiredElement(
    "[data-project-frame-select]",
    editor,
  );
  const resetProjectButton = getRequiredElement(
    "[data-project-frame-reset]",
    editor,
  );
  const resetAllButton = getRequiredElement(
    "[data-project-frame-reset-all]",
    editor,
  );
  const copySizeButton = getRequiredElement(
    "[data-project-frame-copy-size]",
    editor,
  );
  const sizeInput = getRequiredElement("[data-project-frame-size]", editor);
  const sizeValue = getRequiredElement(
    "[data-project-frame-size-value]",
    editor,
  );
  const dimensionInputs = ["width", "height"].map((dimension) => ({
    dimension,
    input: getRequiredElement(
      `[data-project-frame-dimension="${dimension}"]`,
      editor,
    ),
    output: getRequiredElement(
      `[data-project-frame-dimension-value="${dimension}"]`,
      editor,
    ),
  }));
  const fields = ["position", "rotation"].flatMap((type) =>
    ["x", "y", "z"].map((axis) => ({
      axis,
      type,
      input: getRequiredElement(
        `[data-project-frame-${type}="${axis}"]`,
        editor,
      ),
    })),
  );

  function getSelectedProjectIndex() {
    return Number(projectSelect.value);
  }

  function refresh() {
    const transform = portfolioCards.getTransform(getSelectedProjectIndex());

    fields.forEach(({ axis, input, type }) => {
      const value = transform[type][axis];
      input.value = (type === "rotation" ? value * RAD_TO_DEG : value).toFixed(
        type === "rotation" ? 1 : 2,
      );
    });
    dimensionInputs.forEach(({ dimension, input, output }) => {
      const value = transform.dimensions[dimension].toFixed(2);
      input.value = value;
      output.value = value;
    });
    sizeInput.value = transform.size.toFixed(2);
    sizeValue.value = transform.size.toFixed(2);
  }

  function handleFieldInput(event) {
    const field = fields.find(({ input }) => input === event.currentTarget);
    if (!field) return;
    const value = Number(field.input.value);
    if (!Number.isFinite(value)) return;

    portfolioCards.setTransformComponent(
      getSelectedProjectIndex(),
      field.type,
      field.axis,
      field.type === "rotation" ? value * DEG_TO_RAD : value,
    );
    onTransformChange();
  }

  function handleSizeInput() {
    const value = Number(sizeInput.value);
    if (!Number.isFinite(value) || value <= 0) return;
    portfolioCards.setSize(getSelectedProjectIndex(), value);
    sizeValue.value = value.toFixed(2);
    onTransformChange();
  }

  function handleDimensionInput(event) {
    const field = dimensionInputs.find(
      ({ input }) => input === event.currentTarget,
    );
    if (!field) return;
    const value = Number(field.input.value);
    if (!Number.isFinite(value) || value <= 0) return;
    portfolioCards.setFrameDimension(
      getSelectedProjectIndex(),
      field.dimension,
      value,
    );
    field.output.value = value.toFixed(2);
    onTransformChange();
  }

  async function handleCopySize() {
    const projectIndex = getSelectedProjectIndex();
    const transform = portfolioCards.getTransform(projectIndex);
    const text = `Project ${projectIndex + 1}: width ${transform.dimensions.width.toFixed(2)}, height ${transform.dimensions.height.toFixed(2)}, scale ${transform.size.toFixed(2)}`;

    try {
      await navigator.clipboard.writeText(text);
      copySizeButton.textContent = "Copied";
      window.setTimeout(() => {
        copySizeButton.textContent = "Copy size";
      }, 1200);
    } catch (error) {
      console.warn("Could not copy the project frame size.", error);
      copySizeButton.textContent = "Copy failed";
    }
  }

  function handleResetProject() {
    portfolioCards.resetCard(getSelectedProjectIndex());
    refresh();
    onTransformChange();
  }

  function handleResetAll() {
    portfolioCards.resetAllCards();
    refresh();
    onTransformChange();
  }

  fields.forEach(({ input }) =>
    input.addEventListener("input", handleFieldInput),
  );
  sizeInput.addEventListener("input", handleSizeInput);
  dimensionInputs.forEach(({ input }) =>
    input.addEventListener("input", handleDimensionInput),
  );
  copySizeButton.addEventListener("click", handleCopySize);
  projectSelect.addEventListener("change", refresh);
  resetProjectButton.addEventListener("click", handleResetProject);
  resetAllButton.addEventListener("click", handleResetAll);

  refresh();
  editor.hidden = false;

  return {
    refresh,
    dispose() {
      fields.forEach(({ input }) =>
        input.removeEventListener("input", handleFieldInput),
      );
      sizeInput.removeEventListener("input", handleSizeInput);
      dimensionInputs.forEach(({ input }) =>
        input.removeEventListener("input", handleDimensionInput),
      );
      copySizeButton.removeEventListener("click", handleCopySize);
      projectSelect.removeEventListener("change", refresh);
      resetProjectButton.removeEventListener("click", handleResetProject);
      resetAllButton.removeEventListener("click", handleResetAll);
      editor.hidden = true;
    },
  };
}
