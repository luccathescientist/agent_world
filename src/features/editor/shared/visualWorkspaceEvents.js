/*
 * Shared visual-workspace event wiring.
 * Owns zoom, visual-layer, and atlas picker interactions used across editor
 * subviews.
 */

export function bindVisualWorkspaceEvents(state, deps = {}) {
  const {
    applyVisualAtlasCell = () => {},
    documentRef = globalThis.document,
    getAtlasPointerCell = () => null,
    renderVisualEditor = () => {},
    setTilemapStatus = () => {},
    setVisualLayer = () => {},
  } = deps;

  documentRef.getElementById("editor-zoom-select").addEventListener("change", (event) => {
    state.editor.zoom = Number(event.target.value) || 2;
    renderVisualEditor();
  });
  for (const button of documentRef.querySelectorAll("#visual-layer-toggle [data-layer]")) {
    button.addEventListener("click", () => setVisualLayer(button.dataset.layer));
  }

  const atlasBoard = documentRef.getElementById("atlas-picker-board");
  documentRef.getElementById("atlas-picker-image").addEventListener("load", () => renderVisualEditor());
  atlasBoard.addEventListener("mousemove", (event) => {
    const cell = getAtlasPointerCell(event);
    state.editor.hoveredAtlasCell = cell;
    renderVisualEditor();
  });
  atlasBoard.addEventListener("mouseleave", () => {
    state.editor.hoveredAtlasCell = null;
    renderVisualEditor();
  });
  atlasBoard.addEventListener("click", (event) => {
    try {
      const cell = getAtlasPointerCell(event);
      if (!cell) return;
      applyVisualAtlasCell(cell);
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });
}
