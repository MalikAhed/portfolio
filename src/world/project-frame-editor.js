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
  const sizeInput = getRequiredElement("[data-project-frame-size]", editor);
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
    sizeInput.value = transform.size.toFixed(2);
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
    onTransformChange();
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
      projectSelect.removeEventListener("change", refresh);
      resetProjectButton.removeEventListener("click", handleResetProject);
      resetAllButton.removeEventListener("click", handleResetAll);
      editor.hidden = true;
    },
  };
}
