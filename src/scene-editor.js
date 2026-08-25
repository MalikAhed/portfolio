export async function loadSceneEditorShell() {
  await import("./sections/about/black-hole-editor.css");
}

export async function loadSceneEditorModules() {
  const [, originState, aboutEditor, sceneCopy, fluidCursor] =
    await Promise.all([
      import("./styles/scene-editor.css"),
      import("./components/origin-state-transfer.js"),
      import("./sections/about/about-copy-editor.js"),
      import("./components/scene-state-copy/scene-state-copy.js"),
      import("./components/fluid-cursor/fluid-cursor.js"),
    ]);

  return { originState, aboutEditor, sceneCopy, fluidCursor };
}
