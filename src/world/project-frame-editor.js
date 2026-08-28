import { getRequiredElement } from "../lib/dom.js";

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;
const SIDE_EDITOR_CONFIG = Object.freeze([
  Object.freeze({ side: "preview", label: "Preview side" }),
  Object.freeze({ side: "text", label: "Text side" }),
]);

function createSideRangeField({ axis, label, maximum, minimum, step, type }) {
  const field = document.createElement("label");
  field.className = "project-frame-editor__field";

  const heading = document.createElement("span");
  heading.className = "project-frame-editor__slider-heading";
  const name = document.createElement("span");
  name.textContent = label;
  const output = document.createElement("output");
  heading.append(name, output);

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(minimum);
  input.max = String(maximum);
  input.step = String(step);
  field.append(heading, input);
  return { axis, field, input, output, type };
}

function createSideEditor(side, label) {
  const element = document.createElement("fieldset");
  element.className =
    "project-frame-editor__group project-frame-editor__side-editor";
  const legend = document.createElement("legend");
  legend.textContent = label;
  element.append(legend);

  const groups = [
    {
      label: "Position (px)",
      fields: ["x", "y", "z"].map((axis) =>
        createSideRangeField({
          axis,
          label: axis,
          maximum: 600,
          minimum: -600,
          step: 5,
          type: "position",
        }),
      ),
    },
    {
      label: "Rotation (degrees)",
      fields: ["x", "y", "z"].map((axis) =>
        createSideRangeField({
          axis,
          label: axis,
          maximum: 45,
          minimum: -45,
          step: 1,
          type: "rotation",
        }),
      ),
    },
    {
      label: "Dimensions",
      fields: [
        createSideRangeField({
          label: "width",
          maximum: 1.6,
          minimum: 0.5,
          step: 0.01,
          type: "width",
        }),
        createSideRangeField({
          label: "height",
          maximum: 1.6,
          minimum: 0.5,
          step: 0.01,
          type: "height",
        }),
        createSideRangeField({
          label: "scale",
          maximum: 1.8,
          minimum: 0.5,
          step: 0.01,
          type: "scale",
        }),
      ],
    },
  ];

  const fields = groups.flatMap((group) => {
    const heading = document.createElement("div");
    heading.className = "project-frame-editor__side-heading";
    heading.textContent = group.label;
    const grid = document.createElement("div");
    grid.className = "project-frame-editor__grid";
    group.fields.forEach(({ field }) => grid.append(field));
    element.append(heading, grid);
    return group.fields;
  });

  const actions = document.createElement("div");
  actions.className = "project-frame-editor__side-actions";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = `Copy ${side} settings`;
  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = `Reset ${side}`;
  actions.append(copyButton, resetButton);
  element.append(actions);

  return { copyButton, element, fields, label, resetButton, side };
}

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
  const copySettingsButton = getRequiredElement(
    "[data-project-frame-copy-settings]",
    editor,
  );
  const editorActions = getRequiredElement(
    ".project-frame-editor__actions",
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
  const sideEditors = SIDE_EDITOR_CONFIG.map(({ label, side }) =>
    createSideEditor(side, label),
  );
  editorActions.before(...sideEditors.map(({ element }) => element));

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

    sideEditors.forEach(({ fields: sideFields, side }) => {
      const sideTransform = portfolioCards.getSideTransform(
        getSelectedProjectIndex(),
        side,
      );
      sideFields.forEach(({ axis, input, output, type }) => {
        const rawValue = axis ? sideTransform[type][axis] : sideTransform[type];
        const value = type === "rotation" ? rawValue * RAD_TO_DEG : rawValue;
        const digits = type === "position" ? 0 : type === "rotation" ? 1 : 2;
        input.value = value.toFixed(digits);
        output.value = value.toFixed(digits);
      });
    });
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

  function handleSideInput(event) {
    const sideEditor = sideEditors.find(({ fields: sideFields }) =>
      sideFields.some(({ input }) => input === event.currentTarget),
    );
    const field = sideEditor?.fields.find(
      ({ input }) => input === event.currentTarget,
    );
    if (!sideEditor || !field) return;

    const value = Number(field.input.value);
    if (!Number.isFinite(value)) return;
    portfolioCards.setSideTransformComponent(
      getSelectedProjectIndex(),
      sideEditor.side,
      field.type,
      field.axis,
      field.type === "rotation" ? value * DEG_TO_RAD : value,
    );
    field.output.value = value.toFixed(
      field.type === "position" ? 0 : field.type === "rotation" ? 1 : 2,
    );
    onTransformChange();
  }

  async function copySideSettings(sideEditor) {
    const projectIndex = getSelectedProjectIndex();
    const transform = portfolioCards.getSideTransform(
      projectIndex,
      sideEditor.side,
    );
    const text = [
      `Project ${projectIndex + 1} ${sideEditor.side}`,
      `position x ${transform.position.x.toFixed(0)}, y ${transform.position.y.toFixed(0)}, z ${transform.position.z.toFixed(0)}`,
      `rotation x ${(transform.rotation.x * RAD_TO_DEG).toFixed(1)}, y ${(transform.rotation.y * RAD_TO_DEG).toFixed(1)}, z ${(transform.rotation.z * RAD_TO_DEG).toFixed(1)}`,
      `width ${transform.width.toFixed(2)}, height ${transform.height.toFixed(2)}, scale ${transform.scale.toFixed(2)}`,
    ].join("; ");

    try {
      await navigator.clipboard.writeText(text);
      sideEditor.copyButton.textContent = "Copied settings";
      window.setTimeout(() => {
        sideEditor.copyButton.textContent = `Copy ${sideEditor.side} settings`;
      }, 1200);
    } catch (error) {
      console.warn("Could not copy the project side settings.", error);
      sideEditor.copyButton.textContent = "Copy failed";
    }
  }

  function resetSideSettings(sideEditor) {
    portfolioCards.resetSideTransform(
      getSelectedProjectIndex(),
      sideEditor.side,
    );
    refresh();
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

  function formatVector(label, vector, digits = 2, factor = 1) {
    return `${label} x ${(vector.x * factor).toFixed(digits)}, y ${(vector.y * factor).toFixed(digits)}, z ${(vector.z * factor).toFixed(digits)}`;
  }

  function formatSideSettings(label, transform) {
    return [
      `${label}:`,
      formatVector("position", transform.position, 0),
      formatVector("rotation", transform.rotation, 1, RAD_TO_DEG),
      `width ${transform.width.toFixed(2)}, height ${transform.height.toFixed(2)}, scale ${transform.scale.toFixed(2)}`,
    ].join(" ");
  }

  async function handleCopySettings() {
    const projectIndex = getSelectedProjectIndex();
    const frame = portfolioCards.getTransform(projectIndex);
    const preview = portfolioCards.getSideTransform(projectIndex, "preview");
    const textSide = portfolioCards.getSideTransform(projectIndex, "text");
    const settings = [
      `Project ${projectIndex + 1} settings`,
      [
        "Frame:",
        formatVector("position", frame.position),
        formatVector("rotation", frame.rotation, 1, RAD_TO_DEG),
        `width ${frame.dimensions.width.toFixed(2)}, height ${frame.dimensions.height.toFixed(2)}, scale ${frame.size.toFixed(2)}`,
      ].join(" "),
      formatSideSettings("Preview", preview),
      formatSideSettings("Text", textSide),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(settings);
      copySettingsButton.textContent = "All settings copied";
      window.setTimeout(() => {
        copySettingsButton.textContent = "Copy all settings";
      }, 1200);
    } catch (error) {
      console.warn("Could not copy all project settings.", error);
      copySettingsButton.textContent = "Copy failed";
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
  sideEditors.forEach((sideEditor) => {
    sideEditor.fields.forEach(({ input }) =>
      input.addEventListener("input", handleSideInput),
    );
    sideEditor.handleCopy = () => copySideSettings(sideEditor);
    sideEditor.handleReset = () => resetSideSettings(sideEditor);
    sideEditor.copyButton.addEventListener("click", sideEditor.handleCopy);
    sideEditor.resetButton.addEventListener("click", sideEditor.handleReset);
  });
  copySettingsButton.addEventListener("click", handleCopySettings);
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
      sideEditors.forEach((sideEditor) => {
        sideEditor.fields.forEach(({ input }) =>
          input.removeEventListener("input", handleSideInput),
        );
        sideEditor.copyButton.removeEventListener(
          "click",
          sideEditor.handleCopy,
        );
        sideEditor.resetButton.removeEventListener(
          "click",
          sideEditor.handleReset,
        );
        sideEditor.element.remove();
      });
      copySettingsButton.removeEventListener("click", handleCopySettings);
      copySizeButton.removeEventListener("click", handleCopySize);
      projectSelect.removeEventListener("change", refresh);
      resetProjectButton.removeEventListener("click", handleResetProject);
      resetAllButton.removeEventListener("click", handleResetAll);
      editor.hidden = true;
    },
  };
}
