/*
 * Core editor-state mutation helpers.
 * This file owns editor apply/reset behavior, grid-resize helpers, and pointer
 * coordinate helpers that update editor-facing state.
 */
import {
  DEFAULT_CHAT_BUBBLE_FRAME,
  TILE_SIZE,
  TILEMAP_STORAGE_KEYS,
  VISUAL_LAYER_CONFIG,
} from "../../core/constants.js";
import { normalizeMapText, parseMapText } from "../tilemap/mapText.js";

export function commitDraftTilemap(state, successMessage = "Applied draft tilemap.", helpers = {}) {
  const {
    buildTilemapState = () => null,
    drawRoom = () => {},
    renderWorld = () => {},
    resizeRendererViewport = () => {},
    setStoredJson = () => {},
    setStoredMap = () => {},
    setTilemapStatus = () => {},
    syncEditorInputs = () => {},
  } = helpers;
  const nextTilemap = buildTilemapState(
    state.editor.draftFloorText,
    state.editor.draftWallText,
    state.editor.draftFurnitureText,
    state.editor.draftPropText,
    state.renderer.assets.tileManifest,
    state.renderer.assets.layout,
    state.roomRegions,
  );
  state.tilemap = nextTilemap;
  state.roomRegions = nextTilemap.layout.roomRegions || [];
  state.editor.draftFloorText = nextTilemap.floorText;
  state.editor.draftWallText = nextTilemap.wallText;
  state.editor.draftFurnitureText = nextTilemap.furnitureText;
  state.editor.draftPropText = nextTilemap.propText;
  state.renderer.assets.layout.cols = nextTilemap.layout.cols;
  state.renderer.assets.layout.rows = nextTilemap.layout.rows;
  setStoredMap(TILEMAP_STORAGE_KEYS.floor, nextTilemap.floorText);
  setStoredMap(TILEMAP_STORAGE_KEYS.wall, nextTilemap.wallText);
  setStoredMap(TILEMAP_STORAGE_KEYS.furniture, nextTilemap.furnitureText);
  setStoredMap(TILEMAP_STORAGE_KEYS.prop, nextTilemap.propText);
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, state.roomRegions);
  resizeRendererViewport();
  drawRoom(state.renderer);
  if (state.world) renderWorld(state.world);
  syncEditorInputs();
  setTilemapStatus(successMessage);
}

export function resizeGridText(text, cols, rows, fillToken, parser, serializer, helpers = {}) {
  const { parseMapText: parseMapTextHelper = parseMapText } = helpers;
  const parsed = parseMapTextHelper(text).map(parser);
  const next = [];
  for (let row = 0; row < rows; row += 1) {
    const source = parsed[row] || [];
    const nextRow = [];
    for (let col = 0; col < cols; col += 1) {
      nextRow.push(source[col] ?? fillToken);
    }
    next.push(nextRow);
  }
  return serializer(next);
}

export function resizeTilemapGrid(state, cols, rows, helpers = {}) {
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
    serializeFloorLines = (value) => value,
    serializeObjectLines = (value) => value,
    setStoredJson = () => {},
    setStoredMap = () => {},
    setTilemapStatus = () => {},
    syncEditorInputs = () => {},
  } = helpers;
  const nextCols = Math.max(4, Math.min(80, Number(cols) || getWorldCols()));
  const nextRows = Math.max(4, Math.min(80, Number(rows) || getWorldRows()));
  state.editor.draftFloorText = resizeGridText(state.editor.draftFloorText, nextCols, nextRows, ".", parseFloorRow, serializeFloorLines);
  state.editor.draftWallText = resizeGridText(state.editor.draftWallText, nextCols, nextRows, ".", parseObjectRow, serializeObjectLines);
  state.editor.draftFurnitureText = resizeGridText(state.editor.draftFurnitureText, nextCols, nextRows, ".", parseObjectRow, serializeObjectLines);
  state.editor.draftPropText = resizeGridText(state.editor.draftPropText, nextCols, nextRows, ".", parseObjectRow, serializeObjectLines);
  const nextLayout = { ...state.renderer.assets.layout, cols: nextCols, rows: nextRows };
  const nextTilemap = buildTilemapState(
    state.editor.draftFloorText,
    state.editor.draftWallText,
    state.editor.draftFurnitureText,
    state.editor.draftPropText,
    state.renderer.assets.tileManifest,
    nextLayout,
    state.roomRegions,
  );
  state.tilemap = nextTilemap;
  state.roomRegions = nextTilemap.layout.roomRegions || [];
  state.renderer.assets.layout = nextLayout;
  state.editor.selectedCell = null;
  state.editor.hoveredCell = null;
  resizeRendererViewport();
  setStoredMap(TILEMAP_STORAGE_KEYS.floor, nextTilemap.floorText);
  setStoredMap(TILEMAP_STORAGE_KEYS.wall, nextTilemap.wallText);
  setStoredMap(TILEMAP_STORAGE_KEYS.furniture, nextTilemap.furnitureText);
  setStoredMap(TILEMAP_STORAGE_KEYS.prop, nextTilemap.propText);
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, state.roomRegions);
  drawRoom(state.renderer);
  if (state.world) renderWorld(state.world);
  syncEditorInputs();
  setTilemapStatus(`Resized grid to ${nextCols}x${nextRows}.`);
}

export function applyVisualToken(state, rawValue, helpers = {}) {
  const {
    commitDraftTilemap = () => {},
    getSelectedCells = () => [],
    setTilemapStatus = () => {},
    updateDraftCell = () => {},
  } = helpers;
  const selected = state.editor.selectedCell;
  const layer = state.editor.selectedLayer;
  if (!selected) {
    setTilemapStatus("Select a map cell first.", true);
    return;
  }
  const cells = getSelectedCells();
  for (const cell of cells) {
    updateDraftCell(layer, cell.row, cell.col, rawValue);
  }
  commitDraftTilemap(
    cells.length > 1
      ? `Updated ${cells.length} ${layer} cells to ${rawValue}.`
      : `Updated ${layer} ${selected.col + 1}:${selected.row + 1} to ${rawValue}.`,
  );
}

export function applyVisualAtlasCell(state, atlasCell, helpers = {}) {
  const { applyVisualToken = () => {} } = helpers;
  state.editor.selectedAtlasCell = atlasCell;
  applyVisualToken(`${atlasCell.x}:${atlasCell.y}`);
}

export function assignChatBubbleTile(state, helpers = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    renderChat = () => {},
    renderVisualEditor = () => {},
    selectedChatBubbleTheme = () => ({}),
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = helpers;
  if (!["wall", "floor"].includes(state.editor.selectedLayer)) {
    setTilemapStatus("Switch to the wall or floor layer before assigning a chat bubble tile.", true);
    return;
  }
  if (!state.editor.selectedAtlasCell) {
    setTilemapStatus("Choose a floor or wall atlas tile first.", true);
    return;
  }
  const slot = state.editor.selectedChatBubbleSlot || "mm";
  const token = `${state.editor.selectedAtlasCell.x}:${state.editor.selectedAtlasCell.y}`;
  const role = state.editor.selectedChatBubbleRole;
  const theme = selectedChatBubbleTheme();
  state.chatBubbleThemes = {
    ...state.chatBubbleThemes,
    [role]: {
      ...theme,
      frame: {
        ...theme.frame,
        [slot]: {
          layer: state.editor.selectedLayer === "floor" ? "floor" : "wall",
          token,
        },
      },
    },
  };
  setStoredJson(TILEMAP_STORAGE_KEYS.chatBubbleFrame, state.chatBubbleThemes);
  applyChatBubbleFrameStyles();
  renderVisualEditor();
  renderChat(state.detail?.session?.history || []);
  setTilemapStatus(`Set ${role} chat bubble ${slot} to ${state.editor.selectedLayer} ${token}.`);
}

export function resetChatBubbleFrame(state, helpers = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    normalizeChatBubbleTheme = (value) => value,
    renderChat = () => {},
    renderVisualEditor = () => {},
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = helpers;
  const role = state.editor.selectedChatBubbleRole;
  state.chatBubbleThemes = {
    ...state.chatBubbleThemes,
    [role]: normalizeChatBubbleTheme(DEFAULT_CHAT_BUBBLE_FRAME, role),
  };
  setStoredJson(TILEMAP_STORAGE_KEYS.chatBubbleFrame, state.chatBubbleThemes);
  applyChatBubbleFrameStyles();
  renderVisualEditor();
  renderChat(state.detail?.session?.history || []);
  setTilemapStatus(`Reset ${role} chat bubble theme to the default pattern.`);
}

export function setChatBubbleTextColor(state, color, helpers = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    renderChat = () => {},
    renderVisualEditor = () => {},
    selectedChatBubbleTheme = () => ({}),
    setStoredJson = () => {},
  } = helpers;
  const normalized = String(color || "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(normalized)) return;
  const role = state.editor.selectedChatBubbleRole;
  const theme = selectedChatBubbleTheme();
  state.chatBubbleThemes = {
    ...state.chatBubbleThemes,
    [role]: {
      ...theme,
      textColor: normalized,
    },
  };
  setStoredJson(TILEMAP_STORAGE_KEYS.chatBubbleFrame, state.chatBubbleThemes);
  applyChatBubbleFrameStyles();
  renderVisualEditor();
  renderChat(state.detail?.session?.history || []);
}

export function setVisualLayer(state, layerName, helpers = {}) {
  const { renderVisualEditor = () => {} } = helpers;
  state.editor.selectedLayer = VISUAL_LAYER_CONFIG[layerName] ? layerName : "floor";
  renderVisualEditor();
}

export function setSelectedMapCell(state, row, col, helpers = {}) {
  const {
    drawRoom = () => {},
    regionForCell = () => null,
    renderVisualEditor = () => {},
  } = helpers;
  state.editor.selectedCell = { row, col };
  state.editor.selectionAnchor = { row, col };
  state.editor.selectionFocus = { row, col };
  state.editor.selectedAtlasCell = null;
  const region = regionForCell(row, col);
  if (region) {
    state.editor.regionKind = region.kind;
    state.editor.regionId = region.id;
    state.editor.regionLabel = region.label;
  }
  drawRoom(state.renderer);
  renderVisualEditor();
}

export function setHoveredMapCell(state, row, col, helpers = {}) {
  const { drawRoom = () => {} } = helpers;
  const next = row == null || col == null ? null : { row, col };
  const prev = state.editor.hoveredCell;
  if (prev?.row === next?.row && prev?.col === next?.col) return;
  state.editor.hoveredCell = next;
  drawRoom(state.renderer);
}

export function assignStashSelection(state, helpers = {}) {
  const {
    drawRoom = () => {},
    normalizeStashPoint = (value) => value,
    renderVisualEditor = () => {},
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = helpers;
  const selected = state.editor.selectedCell;
  if (!selected) {
    setTilemapStatus("Select a cell before placing the stash box.", true);
    return;
  }
  const stash = normalizeStashPoint(selected);
  state.renderer.assets.layout.stash = stash;
  if (state.tilemap) state.tilemap.layout.stash = stash;
  setStoredJson(TILEMAP_STORAGE_KEYS.stash, stash);
  drawRoom(state.renderer);
  renderVisualEditor();
  setTilemapStatus(`Placed stash at ${stash.col + 1}:${stash.row + 1}.`);
}

export function clearStashSelection(state, helpers = {}) {
  const {
    drawRoom = () => {},
    normalizeStashPoint = (value) => value,
    renderVisualEditor = () => {},
    setStoredJson = () => {},
    setTilemapStatus = () => {},
  } = helpers;
  const stash = normalizeStashPoint({ col: 15, row: 14 });
  state.renderer.assets.layout.stash = stash;
  if (state.tilemap) state.tilemap.layout.stash = stash;
  setStoredJson(TILEMAP_STORAGE_KEYS.stash, stash);
  drawRoom(state.renderer);
  renderVisualEditor();
  setTilemapStatus(`Reset stash to ${stash.col + 1}:${stash.row + 1}.`);
}

export function applyEditorState(state, helpers = {}) {
  const {
    commitDraftTilemap = () => {},
    documentRef = document,
  } = helpers;
  const floorInput = documentRef.getElementById("floor-map-input");
  const wallInput = documentRef.getElementById("wall-map-input");
  const furnitureInput = documentRef.getElementById("furniture-map-input");
  const propInput = documentRef.getElementById("prop-map-input");
  state.editor.draftFloorText = normalizeMapText(floorInput?.value || "");
  state.editor.draftWallText = normalizeMapText(wallInput?.value || "");
  state.editor.draftFurnitureText = normalizeMapText(furnitureInput?.value || "");
  state.editor.draftPropText = normalizeMapText(propInput?.value || "");
  commitDraftTilemap("Applied draft tilemap.");
}

export function resetEditorState(state, helpers = {}) {
  const {
    applyEditorState = () => {},
    documentRef = document,
    setStoredMap = () => {},
  } = helpers;
  state.editor.draftFloorText = state.editor.baseFloorText;
  state.editor.draftWallText = state.editor.baseWallText;
  state.editor.draftFurnitureText = state.editor.baseFurnitureText;
  state.editor.draftPropText = state.editor.basePropText;
  state.renderer.assets.layout.cols = state.editor.baseCols;
  state.renderer.assets.layout.rows = state.editor.baseRows;
  documentRef.getElementById("floor-map-input").value = state.editor.baseFloorText;
  documentRef.getElementById("wall-map-input").value = state.editor.baseWallText;
  documentRef.getElementById("furniture-map-input").value = state.editor.baseFurnitureText;
  documentRef.getElementById("prop-map-input").value = state.editor.basePropText;
  setStoredMap(TILEMAP_STORAGE_KEYS.floor, state.editor.baseFloorText);
  setStoredMap(TILEMAP_STORAGE_KEYS.wall, state.editor.baseWallText);
  setStoredMap(TILEMAP_STORAGE_KEYS.furniture, state.editor.baseFurnitureText);
  setStoredMap(TILEMAP_STORAGE_KEYS.prop, state.editor.basePropText);
  applyEditorState();
}

export function getAtlasPointerCell(event, helpers = {}) {
  const {
    documentRef = document,
    getVisualLayerConfig = () => ({ cols: 0, rows: 0 }),
  } = helpers;
  const image = documentRef.getElementById("atlas-picker-image");
  const config = getVisualLayerConfig();
  if (!image) return null;
  const rect = image.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
  const col = Math.floor((x / rect.width) * config.cols) + 1;
  const row = Math.floor((y / rect.height) * config.rows) + 1;
  if (col < 1 || row < 1 || col > config.cols || row > config.rows) return null;
  return { x: col, y: row };
}

export function getCanvasCellFromEvent(event, view, helpers = {}) {
  const {
    getWorldCols = () => 0,
    getWorldHeight = () => 0,
    getWorldRows = () => 0,
    getWorldWidth = () => 0,
  } = helpers;
  const rect = view.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * getWorldWidth();
  const y = ((event.clientY - rect.top) / rect.height) * getWorldHeight();
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  if (col < 0 || row < 0 || col >= getWorldCols() || row >= getWorldRows()) return null;
  return { row, col };
}
