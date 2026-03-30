/*
 * Editor draft-state and mutation helpers.
 * These functions update editor-owned tilemap drafts and selection-driven edits
 * without taking ownership of DOM wiring or renderer lifecycle concerns.
 */
import {
  DEFAULT_FLOOR_ATLAS_PATH,
  DEFAULT_OFFICE_ATLAS_PATH,
  DEFAULT_WALL_ATLAS_PATH,
  VISUAL_LAYER_CONFIG,
} from "../core/constants.js";

export function getDraftFloorLines(state, deps = {}) {
  const { parseFloorRow = (value) => value, parseMapText = (value) => [value] } = deps;
  return parseMapText(state.editor.draftFloorText).map(parseFloorRow);
}

export function getDraftObjectLines(state, layerName, deps = {}) {
  const { parseMapText = (value) => [value], parseObjectRow = (value) => value } = deps;
  const key = layerName === "wall"
    ? "draftWallText"
    : layerName === "furniture"
      ? "draftFurnitureText"
      : "draftPropText";
  return parseMapText(state.editor[key]).map(parseObjectRow);
}

export function updateDraftCell(state, layerName, row, col, value, deps = {}) {
  const {
    getDraftFloorLines = () => [],
    getDraftObjectLines = () => [],
    serializeFloorLines = (lines) => lines,
    serializeObjectLines = (lines) => lines,
  } = deps;
  if (layerName === "floor") {
    const lines = getDraftFloorLines();
    lines[row][col] = value;
    state.editor.draftFloorText = serializeFloorLines(lines);
    return;
  }
  const rows = getDraftObjectLines(layerName);
  rows[row][col] = value;
  const nextText = serializeObjectLines(rows);
  if (layerName === "wall") state.editor.draftWallText = nextText;
  else if (layerName === "furniture") state.editor.draftFurnitureText = nextText;
  else state.editor.draftPropText = nextText;
}

export function getDraftCellValue(state, layerName, row, col, deps = {}) {
  const {
    getDraftFloorLines = () => [],
    getDraftObjectLines = () => [],
  } = deps;
  if (row == null || col == null) return "--";
  if (layerName === "floor") {
    const lines = getDraftFloorLines();
    return lines[row]?.[col] ?? "--";
  }
  const rows = getDraftObjectLines(layerName);
  return rows[row]?.[col] ?? "--";
}

export function getSelectionBounds(state) {
  const anchor = state.editor.selectionAnchor || state.editor.selectedCell;
  const focus = state.editor.selectionFocus || state.editor.selectedCell;
  if (!anchor || !focus) return null;
  return {
    rowStart: Math.min(anchor.row, focus.row),
    rowEnd: Math.max(anchor.row, focus.row),
    colStart: Math.min(anchor.col, focus.col),
    colEnd: Math.max(anchor.col, focus.col),
  };
}

export function getSelectedCells(state, deps = {}) {
  const { getSelectionBounds = () => null } = deps;
  const bounds = getSelectionBounds(state);
  if (!bounds) return [];
  const cells = [];
  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    for (let col = bounds.colStart; col <= bounds.colEnd; col += 1) {
      cells.push({ row, col });
    }
  }
  return cells;
}

export function getVisualLayerConfig(state) {
  return VISUAL_LAYER_CONFIG[state.editor.selectedLayer] || VISUAL_LAYER_CONFIG.floor;
}

export function getAtlasPathForLayer(state, layerName) {
  const layout = state.renderer?.assets?.layout || {};
  if (VISUAL_LAYER_CONFIG[layerName]?.atlasKind === "floor") {
    return layout.floorAtlasPath || DEFAULT_FLOOR_ATLAS_PATH;
  }
  return VISUAL_LAYER_CONFIG[layerName]?.atlasKind === "wall"
    ? (layout.wallAtlasPath || DEFAULT_WALL_ATLAS_PATH)
    : (layout.officeAtlasPath || DEFAULT_OFFICE_ATLAS_PATH);
}

export function getAssignedAtlasCell(state, layerName, rawValue, deps = {}) {
  const {
    parseFloorToken = (value) => value,
    parseObjectToken = (value) => value,
  } = deps;
  if (!rawValue || rawValue === "--" || rawValue === ".") return null;
  if (layerName === "floor") {
    const floorToken = parseFloorToken(rawValue);
    if (floorToken.kind === "atlas") return { x: floorToken.x, y: floorToken.y };
    if (floorToken.kind === "code") {
      const entry = state.tilemap?.manifest?.[floorToken.code];
      if (entry?.grid) return { x: entry.grid[0] + 1, y: entry.grid[1] + 1 };
    }
    return null;
  }
  const token = parseObjectToken(rawValue);
  if (token.kind === "atlas") return { x: token.x, y: token.y };
  return null;
}

export function getAssignedPreviewToken(layerName, rawValue, deps = {}) {
  const {
    parseFloorToken = (value) => value,
    parseObjectToken = (value) => value,
  } = deps;
  if (!rawValue || rawValue === "--") return null;
  if (layerName === "floor") return parseFloorToken(rawValue);
  return parseObjectToken(rawValue);
}

export function assignRegionSelection(state, deps = {}) {
  const {
    assignRegionSelectionHelper = () => {},
    canonicalizeAnchorId = (value) => value,
    cellsKeySet = () => new Set(),
    commitDraftTilemap = () => {},
    getSelectedCells = () => [],
    normalizeRoomRegions = (value) => value,
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = deps;
  return assignRegionSelectionHelper(state, {
    canonicalizeAnchorId,
    cellsKeySet,
    commitDraftTilemap,
    getSelectedCells,
    normalizeRoomRegions,
    setStoredJson,
    setTilemapStatus,
  });
}

export function resolveRoomRegion(state, rawId, selectedCell = null, deps = {}) {
  const {
    canonicalizeAnchorId = (value) => value,
    regionForCell = () => null,
    resolveRoomRegionHelper = () => null,
  } = deps;
  return resolveRoomRegionHelper(state, rawId, selectedCell, {
    canonicalizeAnchorId,
    regionForCell,
  });
}

export function deleteRoomRegion(state, regionId, deps = {}) {
  const {
    canonicalizeAnchorId = (value) => value,
    commitDraftTilemap = () => {},
    deleteRoomRegionHelper = () => {},
    normalizeRoomRegions = (value) => value,
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = deps;
  return deleteRoomRegionHelper(state, regionId, {
    canonicalizeAnchorId,
    commitDraftTilemap,
    normalizeRoomRegions,
    setStoredJson,
    setTilemapStatus,
  });
}

export function setRegionLabelPosition(state, deps = {}) {
  const {
    drawRoom = () => {},
    normalizeRoomRegions = (value) => value,
    renderVisualEditor = () => {},
    resolveRoomRegion = () => null,
    setRegionLabelPositionHelper = () => {},
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = deps;
  return setRegionLabelPositionHelper(state, {
    drawRoom,
    normalizeRoomRegions,
    renderVisualEditor,
    resolveRoomRegion,
    setStoredJson,
    setTilemapStatus,
  });
}

export function clearRegionSelection(state, deps = {}) {
  const {
    cellsKeySet = () => new Set(),
    clearRegionSelectionHelper = () => {},
    commitDraftTilemap = () => {},
    getSelectedCells = () => [],
    normalizeRoomRegions = (value) => value,
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = deps;
  return clearRegionSelectionHelper(state, {
    cellsKeySet,
    commitDraftTilemap,
    getSelectedCells,
    normalizeRoomRegions,
    setStoredJson,
    setTilemapStatus,
  });
}

export function commitDraftTilemap(state, successMessage = "Applied draft tilemap.", deps = {}) {
  const {
    buildTilemapState = () => null,
    commitDraftTilemapHelper = () => {},
    drawRoom = () => {},
    renderWorld = () => {},
    resizeRendererViewport = () => {},
    setStoredJson = () => {},
    setStoredMap = () => {},
    setTilemapStatus = () => {},
    syncEditorInputs = () => {},
  } = deps;
  return commitDraftTilemapHelper(state, successMessage, {
    buildTilemapState,
    drawRoom,
    renderWorld,
    resizeRendererViewport,
    setStoredJson,
    setStoredMap,
    setTilemapStatus,
    syncEditorInputs,
  });
}

export function resizeGridText(text, cols, rows, fillToken, parser, serializer, deps = {}) {
  const {
    parseMapText = (value) => [value],
    resizeGridTextHelper = () => "",
  } = deps;
  return resizeGridTextHelper(text, cols, rows, fillToken, parser, serializer, {
    parseMapText,
  });
}

export function resizeTilemapGrid(state, cols, rows, deps = {}) {
  const {
    buildTilemapState = () => null,
    drawRoom = () => {},
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    parseFloorRow = (value) => value,
    parseObjectRow = (value) => value,
    renderWorld = () => {},
    resizeGridText = () => "",
    resizeRendererViewport = () => {},
    resizeTilemapGridHelper = () => {},
    serializeFloorLines = (value) => value,
    serializeObjectLines = (value) => value,
    setStoredJson = () => {},
    setStoredMap = () => {},
    setTilemapStatus = () => {},
    syncEditorInputs = () => {},
  } = deps;
  return resizeTilemapGridHelper(state, cols, rows, {
    buildTilemapState,
    drawRoom,
    getWorldCols,
    getWorldRows,
    parseFloorRow,
    parseObjectRow,
    renderWorld,
    resizeGridText,
    resizeRendererViewport,
    serializeFloorLines,
    serializeObjectLines,
    setStoredJson,
    setStoredMap,
    setTilemapStatus,
    syncEditorInputs,
  });
}

export function applyVisualToken(state, rawValue, deps = {}) {
  const {
    applyVisualTokenHelper = () => {},
    commitDraftTilemap = () => {},
    getSelectedCells = () => [],
    setTilemapStatus = () => {},
    updateDraftCell = () => {},
  } = deps;
  return applyVisualTokenHelper(state, rawValue, {
    commitDraftTilemap,
    getSelectedCells,
    setTilemapStatus,
    updateDraftCell,
  });
}

export function applyVisualAtlasCell(state, atlasCell, deps = {}) {
  const {
    applyVisualAtlasCellHelper = () => {},
    applyVisualToken = () => {},
  } = deps;
  return applyVisualAtlasCellHelper(state, atlasCell, {
    applyVisualToken,
  });
}

export function assignChatBubbleTile(state, deps = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    assignChatBubbleTileHelper = () => {},
    renderChat = () => {},
    renderVisualEditor = () => {},
    selectedChatBubbleTheme = () => ({}),
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = deps;
  return assignChatBubbleTileHelper(state, {
    applyChatBubbleFrameStyles,
    renderChat,
    renderVisualEditor,
    selectedChatBubbleTheme,
    setStoredJson,
    setTilemapStatus,
  });
}

export function resetChatBubbleFrame(state, deps = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    normalizeChatBubbleTheme = (value) => value,
    renderChat = () => {},
    renderVisualEditor = () => {},
    resetChatBubbleFrameHelper = () => {},
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = deps;
  return resetChatBubbleFrameHelper(state, {
    applyChatBubbleFrameStyles,
    normalizeChatBubbleTheme,
    renderChat,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
  });
}

export function setChatBubbleTextColor(state, color, deps = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    renderChat = () => {},
    renderVisualEditor = () => {},
    selectedChatBubbleTheme = () => ({}),
    setChatBubbleTextColorHelper = () => {},
    setStoredJson = () => {},
  } = deps;
  return setChatBubbleTextColorHelper(state, color, {
    applyChatBubbleFrameStyles,
    renderChat,
    renderVisualEditor,
    selectedChatBubbleTheme,
    setStoredJson,
  });
}

export function setVisualLayer(state, layerName, deps = {}) {
  const {
    renderVisualEditor = () => {},
    setVisualLayerHelper = () => {},
  } = deps;
  return setVisualLayerHelper(state, layerName, {
    renderVisualEditor,
  });
}

export function setSelectedMapCell(state, row, col, deps = {}) {
  const {
    drawRoom = () => {},
    regionForCell = () => null,
    renderVisualEditor = () => {},
    setSelectedMapCellHelper = () => {},
  } = deps;
  return setSelectedMapCellHelper(state, row, col, {
    drawRoom,
    regionForCell,
    renderVisualEditor,
  });
}

export function setHoveredMapCell(state, row, col, deps = {}) {
  const {
    drawRoom = () => {},
    setHoveredMapCellHelper = () => {},
  } = deps;
  return setHoveredMapCellHelper(state, row, col, {
    drawRoom,
  });
}

export function assignStashSelection(state, deps = {}) {
  const {
    assignStashSelectionHelper = () => {},
    drawRoom = () => {},
    normalizeStashPoint = (value) => value,
    renderVisualEditor = () => {},
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = deps;
  return assignStashSelectionHelper(state, {
    drawRoom,
    normalizeStashPoint,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
  });
}

export function clearStashSelection(state, deps = {}) {
  const {
    clearStashSelectionHelper = () => {},
    drawRoom = () => {},
    normalizeStashPoint = (value) => value,
    renderVisualEditor = () => {},
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = deps;
  return clearStashSelectionHelper(state, {
    drawRoom,
    normalizeStashPoint,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
  });
}
