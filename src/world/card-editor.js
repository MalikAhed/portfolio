import { getRequiredElement } from "../lib/dom.js";

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

export function initCardEditor(portfolioCards, onTransformChange) {
  const editor = getRequiredElement("[data-card-editor]");
  const cardSelect = getRequiredElement("[data-card-select]", editor);
  const resetCardButton = getRequiredElement("[data-card-reset]", editor);
  const resetAllButton = getRequiredElement("[data-card-reset-all]", editor);
  const fields = ["position", "rotation"].flatMap((type) =>
    ["x", "y", "z"].map((axis) => ({
      axis,
      type,
      input: getRequiredElement(`[data-card-${type}="${axis}"]`, editor),
    })),
  );

  function getSelectedCardIndex() {
    return Number(cardSelect.value);
  }

  function refresh() {
    const transform = portfolioCards.getTransform(getSelectedCardIndex());

    fields.forEach(({ axis, input, type }) => {
      const value = transform[type][axis];
      input.value = (type === "rotation" ? value * RAD_TO_DEG : value).toFixed(
        type === "rotation" ? 1 : 2,
      );
    });
  }

  function handleFieldInput(event) {
    const field = fields.find(({ input }) => input === event.currentTarget);
    if (!field) return;

    const value = Number(field.input.value);
    if (!Number.isFinite(value)) return;

    portfolioCards.setTransformComponent(
      getSelectedCardIndex(),
      field.type,
      field.axis,
      field.type === "rotation" ? value * DEG_TO_RAD : value,
    );
    onTransformChange();
  }

  function handleCardChange() {
    refresh();
  }

  function handleResetCard() {
    portfolioCards.resetCard(getSelectedCardIndex());
    refresh();
    onTransformChange();
  }

  function handleResetAll() {
    portfolioCards.resetAllCards();
    refresh();
    onTransformChange();
  }

  fields.forEach(({ input }) => {
    input.addEventListener("input", handleFieldInput);
  });
  cardSelect.addEventListener("change", handleCardChange);
  resetCardButton.addEventListener("click", handleResetCard);
  resetAllButton.addEventListener("click", handleResetAll);

  refresh();
  editor.hidden = false;

  return {
    refresh,
    dispose() {
      fields.forEach(({ input }) => {
        input.removeEventListener("input", handleFieldInput);
      });
      cardSelect.removeEventListener("change", handleCardChange);
      resetCardButton.removeEventListener("click", handleResetCard);
      resetAllButton.removeEventListener("click", handleResetAll);
      editor.hidden = true;
    },
  };
}
