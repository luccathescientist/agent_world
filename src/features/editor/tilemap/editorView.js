/*
 * Tilemap editor view helpers.
 * Keeps tilemap text-input synchronization and summary rendering separate from
 * the broader mixed visual editor renderer.
 */

export function syncTilemapDraftInputs(state, helpers = {}) {
  const { documentRef = globalThis.document } = helpers;
  const floorInput = documentRef.getElementById("floor-map-input");
  const wallInput = documentRef.getElementById("wall-map-input");
  const furnitureInput = documentRef.getElementById("furniture-map-input");
  const propInput = documentRef.getElementById("prop-map-input");
  if (floorInput && floorInput.value !== state.editor.draftFloorText) floorInput.value = state.editor.draftFloorText;
  if (wallInput && wallInput.value !== state.editor.draftWallText) wallInput.value = state.editor.draftWallText;
  if (furnitureInput && furnitureInput.value !== state.editor.draftFurnitureText) furnitureInput.value = state.editor.draftFurnitureText;
  if (propInput && propInput.value !== state.editor.draftPropText) propInput.value = state.editor.draftPropText;
}

export function renderTilemapSummary(state, helpers = {}) {
  const {
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    setText = () => {},
  } = helpers;
  const tileCodes = Object.keys(state.tilemap?.manifest || {}).length;
  setText("tilemap-summary", `${getWorldCols()}x${getWorldRows()} grid · ${tileCodes} codes`);
  if (state.tilemap) {
    setText("tilemap-walkability", `${state.tilemap.walkableTiles} walkable · ${state.tilemap.solidTiles} solid · ${state.tilemap.doorTiles} doors`);
  }
}
