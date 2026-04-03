/*
 * Visual editor rendering helpers.
 * This module renders the atlas-driven editor UI, selection preview, and
 * editor subviews without owning higher-level app/runtime wiring.
 */
import { DEFAULT_CHAT_TEXT_COLORS, TILE_SIZE } from "../../core/constants.js";
import { renderAgentEditorView } from "./agent/editorView.js";
import { createChatBubbleEditorRuntime } from "./chatBubble/editorRuntime.js";
import { renderChatBubbleEditorPanel } from "./chatBubble/editorView.js";
import {
  normalizeEditorSubviewName,
  renderEditorSubviewShell,
} from "./shared/editorTabs.js";
import {
  renderTilemapSummary,
  syncTilemapDraftInputs,
} from "./tilemap/editorView.js";
import { renderRoomMappingEditorPanel } from "./roomMapping/editorView.js";

export function setActiveEditorSubview(state, viewName, helpers = {}) {
  const {
    drawRoom = () => {},
    mountRendererView = () => {},
    renderEditorSubviews = () => {},
    renderVisualEditor = () => {},
    resizeRendererViewport = () => {},
  } = helpers;
  viewName = normalizeEditorSubviewName(viewName);
  state.editor.activeSubview = viewName;
  renderEditorSubviews();
  if (state.renderer && (viewName === "tilemap" || viewName === "room-mapping")) {
    mountRendererView();
    resizeRendererViewport();
    drawRoom(state.renderer);
  }
  renderVisualEditor();
}

export function renderEditorSubviews(state, helpers = {}) {
  return renderEditorSubviewShell(state, helpers);
}

export function syncEditorInputs(state, helpers = {}) {
  const {
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    renderVisualEditor = () => {},
    setText = () => {},
    syncGameStateTextarea = () => {},
  } = helpers;
  syncTilemapDraftInputs(state, helpers);
  renderTilemapSummary(state, { getWorldCols, getWorldRows, setText });
  syncGameStateTextarea();
  renderVisualEditor();
}

export function renderVisualSelectionPreview(state, helpers = {}) {
  const {
    documentRef = document,
    getAssignedAtlasCell = () => null,
    getAssignedPreviewToken = () => null,
    getDraftCellValue = () => null,
    getVisualLayerConfig = () => ({ label: "" }),
    selectedChatBubbleTheme = () => null,
  } = helpers;
  const canvas = documentRef.getElementById("visual-selection-preview");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const titleEl = documentRef.getElementById("visual-selection-title");
  const detailEl = documentRef.getElementById("visual-selection-detail");
  const isChatBubbleView = state.editor.activeSubview === "chat-bubble";
  let layer = state.editor.selectedLayer;
  const hover = state.editor.hoveredAtlasCell;
  const selected = state.editor.selectedAtlasCell;
  const selectedCell = state.editor.selectedCell;
  let assignedValue = selectedCell ? getDraftCellValue(layer, selectedCell.row, selectedCell.col) : null;
  let assignedAtlasCell = getAssignedAtlasCell(layer, assignedValue);
  let assignedPreviewToken = getAssignedPreviewToken(layer, assignedValue);
  if (isChatBubbleView) {
    const theme = selectedChatBubbleTheme();
    const frame = theme?.frame?.[state.editor.selectedChatBubbleSlot || "mm"] || null;
    if (frame?.layer && ["floor", "wall"].includes(frame.layer)) {
      layer = frame.layer;
      assignedValue = frame.token || ".";
      assignedAtlasCell = getAssignedAtlasCell(layer, assignedValue);
      assignedPreviewToken = getAssignedPreviewToken(layer, assignedValue);
    } else {
      assignedValue = null;
      assignedAtlasCell = null;
      assignedPreviewToken = null;
    }
  }
  const atlasCell = hover || selected || assignedAtlasCell;

  if (!atlasCell && !assignedPreviewToken) {
    titleEl.textContent = isChatBubbleView ? "No bubble tile selected" : "No atlas tile selected";
    detailEl.textContent = isChatBubbleView
      ? "Pick Agent, Tool, or User, click a bubble segment in the preview, then choose a floor or wall atlas tile."
      : "Click a map cell, then hover or click a tile in the atlas.";
    return;
  }

  if (hover || selected || assignedAtlasCell) {
    const image = documentRef.getElementById("atlas-picker-image");
    if (!image?.complete || !image.naturalWidth) return;
    const tileSize = state.renderer?.assets?.layout?.atlasTileSize || TILE_SIZE;
    const sx = (atlasCell.x - 1) * tileSize;
    const sy = (atlasCell.y - 1) * tileSize;
    ctx.drawImage(image, sx, sy, tileSize, tileSize, 0, 0, canvas.width, canvas.height);
  } else if (assignedPreviewToken?.kind === "primitive" && state.renderer?.assets?.primitiveTextures?.[assignedPreviewToken.primitive]) {
    const texture = state.renderer.assets.primitiveTextures[assignedPreviewToken.primitive];
    const source = texture.baseTexture.resource?.source;
    const frame = texture.frame;
    if (source && frame) {
      ctx.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, canvas.width, canvas.height);
    }
  }

  const code = atlasCell ? `${atlasCell.x}:${atlasCell.y}` : String(assignedValue || "--");
  if (isChatBubbleView) {
    const roleLabel = state.editor.selectedChatBubbleRole === "assistant"
      ? "Agent"
      : state.editor.selectedChatBubbleRole === "tool"
        ? "Tool"
        : "User";
    const slotLabel = String(state.editor.selectedChatBubbleSlot || "mm").toUpperCase();
    titleEl.textContent = `${roleLabel} ${slotLabel} · ${getVisualLayerConfig().label} ${code}`;
    detailEl.textContent = hover
      ? `Ready to assign ${layer} ${code} to ${roleLabel} ${slotLabel}.`
      : assignedValue && assignedValue !== "--"
        ? `Selected bubble segment uses ${assignedValue}.`
        : `Ready to assign ${layer} ${code} to ${roleLabel} ${slotLabel}.`;
    return;
  }

  titleEl.textContent = atlasCell
    ? `${getVisualLayerConfig().label} ${atlasCell.x}:${atlasCell.y}`
    : `${getVisualLayerConfig().label} ${assignedValue}`;
  detailEl.textContent = hover
    ? `Will write \`${code}\` into the ${layer} map.`
    : assignedValue && assignedValue !== "--"
      ? `Current ${layer} value is \`${assignedValue}\`.`
      : `Will write \`${code}\` into the ${layer} map.`;
}

export function renderVisualEditor(state, helpers = {}) {
  const {
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    chatBubbleSlotOverlayMarkup = () => "",
    deleteRoomRegion = () => {},
    documentRef = document,
    drawRoom = () => {},
    formatRichTextHtml = (value) => value,
    getAtlasPathForLayer = () => "",
    getDraftCellValue = () => "--",
    getSelectedCells = () => [],
    getVisualLayerConfig = () => ({ cols: 1, rows: 1, label: "", modeLabel: "", title: "" }),
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    normalizeStashPoint = (value) => value,
    populateRegionIdSelect = () => {},
    renderAgentEditorPanel = () => {},
    rerenderVisualEditor = () => {},
    renderVisualSelectionPreview = () => {},
    selectedChatBubbleTheme = () => null,
    syncRendererCanvasSize = () => {},
  } = helpers;
  const selectedCellEl = documentRef.getElementById("selected-map-cell");
  const selectedLayerEl = documentRef.getElementById("selected-layer-cell");
  const hoveredAtlasEl = documentRef.getElementById("hovered-atlas-cell");
  const atlasTitleEl = documentRef.getElementById("atlas-picker-title");
  const atlasModeEl = documentRef.getElementById("atlas-picker-mode");
  const atlasImage = documentRef.getElementById("atlas-picker-image");
  const atlasHover = documentRef.getElementById("atlas-picker-hover");
  const emptyButton = documentRef.getElementById("visual-token-empty");
  const colsInput = documentRef.getElementById("grid-cols-input");
  const rowsInput = documentRef.getElementById("grid-rows-input");
  const zoomSelect = documentRef.getElementById("editor-zoom-select");
  const showAgentsToggle = documentRef.getElementById("toggle-editor-agents");
  const chatBubblePreviewList = documentRef.getElementById("editor-chat-bubble-preview-list");
  const chatBubbleTextColor = documentRef.getElementById("chat-bubble-text-color");
  const chatBubbleSlotSummary = documentRef.getElementById("chat-bubble-slot-summary");

  if (!selectedCellEl || !selectedLayerEl || !hoveredAtlasEl || !atlasTitleEl || !atlasModeEl || !atlasImage || !atlasHover || !emptyButton || !colsInput || !rowsInput || !zoomSelect || !showAgentsToggle || !chatBubblePreviewList || !chatBubbleTextColor || !chatBubbleSlotSummary) {
    return;
  }

  const layer = state.editor.selectedLayer;
  const currentView = state.editor.activeSubview || "tilemap";
  const config = getVisualLayerConfig();
  const selectedCell = state.editor.selectedCell;
  const selectedCells = getSelectedCells();
  const currentValue = selectedCell ? getDraftCellValue(layer, selectedCell.row, selectedCell.col) : "--";
  selectedCellEl.textContent = selectedCell
    ? selectedCells.length > 1
      ? `Cells ${selectedCells.length} selected`
      : `Cell ${selectedCell.col + 1}:${selectedCell.row + 1}`
    : "Cell --";
  selectedLayerEl.textContent = `${config.label} ${currentValue}`;
  const hovered = state.editor.hoveredAtlasCell;
  hoveredAtlasEl.textContent = hovered ? `Atlas ${hovered.x}:${hovered.y}` : "Atlas --";

  atlasTitleEl.textContent = currentView === "chat-bubble" ? `${config.label} Atlas` : config.title;
  atlasModeEl.textContent = config.modeLabel;
  if (documentRef.activeElement !== colsInput) colsInput.value = String(getWorldCols());
  if (documentRef.activeElement !== rowsInput) rowsInput.value = String(getWorldRows());
  zoomSelect.value = String(state.editor.zoom);
  chatBubblePreviewList.style.zoom = currentView === "chat-bubble" ? String(state.editor.zoom) : "";
  const activeChatTheme = selectedChatBubbleTheme();
  chatBubbleTextColor.value = activeChatTheme?.textColor || DEFAULT_CHAT_TEXT_COLORS[state.editor.selectedChatBubbleRole] || "#fff4d7";
  const chatRoleLabel = state.editor.selectedChatBubbleRole === "assistant"
    ? "Agent"
    : state.editor.selectedChatBubbleRole === "tool"
      ? "Tool"
      : "User";
  chatBubbleSlotSummary.textContent = `${chatRoleLabel} · ${(state.editor.selectedChatBubbleSlot || "mm").toUpperCase()}`;
  const atlasPath = getAtlasPathForLayer(layer);
  if (atlasImage.getAttribute("src") !== atlasPath) {
    atlasImage.setAttribute("src", atlasPath);
  }
  atlasImage.dataset.cols = String(config.cols);
  atlasImage.dataset.rows = String(config.rows);

  if (hovered) {
    const cellWidth = atlasImage.clientWidth / config.cols;
    const cellHeight = atlasImage.clientHeight / config.rows;
    atlasHover.style.display = "block";
    atlasHover.style.width = `${cellWidth}px`;
    atlasHover.style.height = `${cellHeight}px`;
    atlasHover.style.transform = `translate(${(hovered.x - 1) * cellWidth}px, ${(hovered.y - 1) * cellHeight}px)`;
  } else {
    atlasHover.style.display = "none";
  }

  emptyButton.textContent = layer === "floor" ? "Set `.` floor" : "Set `.`";
  syncRendererCanvasSize();
  renderAgentEditorView(state, {
    documentRef,
    renderAgentEditorPanel,
  });

  for (const button of documentRef.querySelectorAll("#visual-layer-toggle [data-layer]")) {
    button.classList.toggle("active", button.dataset.layer === layer);
  }
  renderRoomMappingEditorPanel(state, {
    deleteRoomRegion,
    documentRef,
    drawRoom,
    normalizeStashPoint,
    populateRegionIdSelect,
  });
  const chatBubbleRuntime = createChatBubbleEditorRuntime(state, {
    renderVisualEditor: rerenderVisualEditor,
    selectedChatBubbleTheme,
  });
  renderChatBubbleEditorPanel(state, {
    applyChatRoleTheme,
    chatBubbleMarkup,
    chatBubbleSlotOverlayMarkup,
    documentRef,
    formatRichTextHtml,
    onSelectChatBubbleSlot: (role, slot) => {
      chatBubbleRuntime.setRoleAndSlot(role, slot);
    },
  });
  renderVisualSelectionPreview();
}
