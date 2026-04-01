/*
 * Shared editor utilities-panel wiring.
 * Keeps gear-toggle behavior out of the global DOM event bootstrap.
 */

export function toggleEditorSharedPanel(documentRef = document) {
  const panel = documentRef.getElementById("editor-shared-panel");
  if (!panel) return;
  panel.open = !panel.open;
}

export function bindEditorSharedPanelToggle(deps = {}) {
  const {
    documentRef = document,
  } = deps;
  const toggle = documentRef.getElementById("editor-shared-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => toggleEditorSharedPanel(documentRef));
}
