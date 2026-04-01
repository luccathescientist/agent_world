/*
 * Tilemap editor runtime adapter.
 * This keeps tilemap-specific editor actions cohesive and testable without
 * owning broader editor orchestration.
 */

export function createTilemapEditorRuntime(state, deps = {}) {
  const {
    applyEditorState = () => {},
    applyVisualToken = () => {},
    documentRef = globalThis.document,
    renderVisualEditor = () => {},
    resizeTilemapGrid = () => {},
    saveGameState = async () => {},
    setTilemapStatus = () => {},
  } = deps;

  function updateDraftMap(layerName, value) {
    if (layerName === "floor") state.editor.draftFloorText = value;
    else if (layerName === "wall") state.editor.draftWallText = value;
    else if (layerName === "furniture") state.editor.draftFurnitureText = value;
    else if (layerName === "prop") state.editor.draftPropText = value;
    renderVisualEditor();
  }

  function applyTilemap() {
    try {
      applyEditorState();
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  }

  async function saveTilemapGameState() {
    try {
      applyEditorState();
      await saveGameState();
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  }

  function resizeGridFromInputs() {
    try {
      resizeTilemapGrid(
        documentRef.getElementById("grid-cols-input").value,
        documentRef.getElementById("grid-rows-input").value,
      );
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  }

  function applyEmptyToken() {
    try {
      applyVisualToken(".");
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  }

  return {
    applyEmptyToken,
    applyTilemap,
    resizeGridFromInputs,
    saveTilemapGameState,
    updateDraftMap,
  };
}
