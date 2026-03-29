import { TILEMAP_STORAGE_KEYS } from "../../core/constants.js";

export function assignRegionSelection(state, helpers = {}) {
  const {
    canonicalizeAnchorId = (value) => value,
    cellsKeySet = () => new Set(),
    commitDraftTilemap = () => {},
    getSelectedCells = () => [],
    normalizeRoomRegions = (value) => value,
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = helpers;
  const cells = getSelectedCells();
  if (!cells.length) {
    setTilemapStatus("Select cells before assigning a room region.", true);
    return;
  }
  const regionId = canonicalizeAnchorId(state.editor.regionId.trim());
  if (!regionId) {
    setTilemapStatus("Room region id is required.", true);
    return;
  }
  const regionLabel = state.editor.regionLabel.trim() || regionId;
  const existingRegion = state.roomRegions.find((region) => region.id === regionId);
  const nextRegion = {
    id: regionId,
    label: regionLabel,
    kind: state.editor.regionKind,
    cells,
    labelCell: existingRegion?.labelCell || null,
  };
  const selectedKeys = cellsKeySet(cells);
  const survivors = state.roomRegions
    .map((region) => ({
      ...region,
      cells: region.cells.filter((cell) => !selectedKeys.has(`${cell.row}:${cell.col}`)),
    }))
    .filter((region) => region.cells.length && region.id !== regionId);
  state.roomRegions = normalizeRoomRegions([...survivors, nextRegion]);
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, state.roomRegions);
  commitDraftTilemap(`Assigned ${cells.length} cells to ${state.editor.regionKind} ${regionId}.`);
}

export function resolveRoomRegion(state, rawId, selectedCell = null, helpers = {}) {
  const {
    canonicalizeAnchorId = (value) => value,
    regionForCell = () => null,
  } = helpers;
  const canonicalId = canonicalizeAnchorId(rawId);
  if (canonicalId) {
    const byId = state.roomRegions.find((region) => region.id === canonicalId);
    if (byId) return byId;
  }
  const typed = String(rawId || "").trim().toLowerCase();
  if (typed) {
    const byLabel = state.roomRegions.find((region) => String(region.label || "").trim().toLowerCase() === typed);
    if (byLabel) return byLabel;
  }
  if (selectedCell) {
    const byCell = regionForCell(selectedCell.row, selectedCell.col);
    if (byCell) return byCell;
  }
  return null;
}

export function deleteRoomRegion(state, regionId, helpers = {}) {
  const {
    canonicalizeAnchorId = (value) => value,
    commitDraftTilemap = () => {},
    normalizeRoomRegions = (value) => value,
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = helpers;
  const canonicalId = canonicalizeAnchorId(regionId);
  if (!canonicalId) return;
  const beforeCount = state.roomRegions.length;
  state.roomRegions = normalizeRoomRegions(state.roomRegions.filter((region) => region.id !== canonicalId));
  if (state.roomRegions.length === beforeCount) {
    setTilemapStatus(`No room region found for ${canonicalId}.`, true);
    return;
  }
  if (state.editor.hoveredRegionId === canonicalId) state.editor.hoveredRegionId = "";
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, state.roomRegions);
  commitDraftTilemap(`Deleted room region ${canonicalId}.`);
}

export function setRegionLabelPosition(state, helpers = {}) {
  const {
    drawRoom = () => {},
    normalizeRoomRegions = (value) => value,
    renderVisualEditor = () => {},
    resolveRoomRegion = () => null,
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = helpers;
  const selected = state.editor.selectedCell;
  if (!selected) {
    setTilemapStatus("Select a cell before positioning a room label.", true);
    return;
  }
  const region = resolveRoomRegion(state.editor.regionId, selected);
  if (!region) {
    setTilemapStatus("Choose a room id before positioning its label.", true);
    return;
  }
  let updated = false;
  state.roomRegions = normalizeRoomRegions(
    state.roomRegions.map((item) => {
      if (item.id !== resolveRoomRegion(state.editor.regionId, selected).id) return item;
      updated = true;
      return {
        ...item,
        labelCell: { row: selected.row, col: selected.col },
      };
    }),
  );
  if (!updated) {
    setTilemapStatus(`No room region found for ${region.id}.`, true);
    return;
  }
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, state.roomRegions);
  drawRoom(state.renderer);
  renderVisualEditor();
  setTilemapStatus(`Set label position for ${region.id} to ${selected.col + 1}:${selected.row + 1}.`);
}

export function clearRegionSelection(state, helpers = {}) {
  const {
    cellsKeySet = () => new Set(),
    commitDraftTilemap = () => {},
    getSelectedCells = () => [],
    normalizeRoomRegions = (value) => value,
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = helpers;
  const cells = getSelectedCells();
  if (!cells.length) {
    setTilemapStatus("Select cells before clearing a room region.", true);
    return;
  }
  const selectedKeys = cellsKeySet(cells);
  state.roomRegions = normalizeRoomRegions(
    state.roomRegions
      .map((region) => ({
        ...region,
        cells: region.cells.filter((cell) => !selectedKeys.has(`${cell.row}:${cell.col}`)),
      }))
      .filter((region) => region.cells.length),
  );
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, state.roomRegions);
  commitDraftTilemap(`Cleared room mappings from ${cells.length} cells.`);
}
