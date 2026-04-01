/*
 * Composed editor runtime.
 * This module binds editor features, draft-state mutations, and editor-facing
 * world callbacks into the API that the entrypoint and DOM events use.
 */
import { setText as setTextDefault } from "../core/dom.js";
import { escapeHtml as escapeHtmlDefault } from "../core/format.js";
import { setStoredJson as setStoredJsonDefault, setStoredMap as setStoredMapDefault } from "../core/storage.js";
import {
  parseMapText as parseMapTextDefault,
  parseFloorRow as parseFloorRowDefault,
  parseObjectRow as parseObjectRowDefault,
  parseFloorToken as parseFloorTokenDefault,
  parseObjectToken as parseObjectTokenDefault,
  serializeFloorLines as serializeFloorLinesDefault,
  serializeObjectLines as serializeObjectLinesDefault,
} from "../features/tilemap/mapText.js";
import {
  previewSpriteFrame as previewSpriteFrameHelperDefault,
  previewSpriteFrameName as previewSpriteFrameNameDefault,
  renderAgentEditorPanel as renderAgentEditorPanelHelperDefault,
  shouldMirrorPreviewSprite as shouldMirrorPreviewSpriteDefault,
} from "../features/editor/agentEditor.js";
import {
  applyEditorState as applyEditorStateHelperDefault,
  applyVisualAtlasCell as applyVisualAtlasCellHelperDefault,
  applyVisualToken as applyVisualTokenHelperDefault,
  assignChatBubbleTile as assignChatBubbleTileHelperDefault,
  assignStashSelection as assignStashSelectionHelperDefault,
  clearStashSelection as clearStashSelectionHelperDefault,
  commitDraftTilemap as commitDraftTilemapHelperDefault,
  getAtlasPointerCell as getAtlasPointerCellHelperDefault,
  resetChatBubbleFrame as resetChatBubbleFrameHelperDefault,
  resetEditorState as resetEditorStateHelperDefault,
  resizeGridText as resizeGridTextHelperDefault,
  resizeTilemapGrid as resizeTilemapGridHelperDefault,
  setChatBubbleTextColor as setChatBubbleTextColorHelperDefault,
  setHoveredMapCell as setHoveredMapCellHelperDefault,
  setSelectedMapCell as setSelectedMapCellHelperDefault,
  setVisualLayer as setVisualLayerHelperDefault,
} from "../features/editor/editorState.js";
import {
  assignRegionSelection as assignRegionSelectionHelperDefault,
  clearRegionSelection as clearRegionSelectionHelperDefault,
  deleteRoomRegion as deleteRoomRegionHelperDefault,
  resolveRoomRegion as resolveRoomRegionHelperDefault,
  setRegionLabelPosition as setRegionLabelPositionHelperDefault,
} from "../features/editor/roomMappingEditor.js";
import {
  renderEditorSubviews as renderEditorSubviewsHelperDefault,
  renderVisualEditor as renderVisualEditorHelperDefault,
  renderVisualSelectionPreview as renderVisualSelectionPreviewHelperDefault,
  setActiveEditorSubview as setActiveEditorSubviewHelperDefault,
  syncEditorInputs as syncEditorInputsHelperDefault,
} from "../features/editor/visualEditor.js";
import {
  applyVisualAtlasCell as applyVisualAtlasCellActionDefault,
  applyVisualToken as applyVisualTokenActionDefault,
  assignChatBubbleTile as assignChatBubbleTileActionDefault,
  assignRegionSelection as assignRegionSelectionActionDefault,
  assignStashSelection as assignStashSelectionActionDefault,
  clearRegionSelection as clearRegionSelectionActionDefault,
  clearStashSelection as clearStashSelectionActionDefault,
  commitDraftTilemap as commitDraftTilemapActionDefault,
  deleteRoomRegion as deleteRoomRegionActionDefault,
  getAssignedAtlasCell as getAssignedAtlasCellActionDefault,
  getAssignedPreviewToken as getAssignedPreviewTokenActionDefault,
  getAtlasPathForLayer as getAtlasPathForLayerActionDefault,
  getDraftCellValue as getDraftCellValueActionDefault,
  getDraftFloorLines as getDraftFloorLinesActionDefault,
  getDraftObjectLines as getDraftObjectLinesActionDefault,
  getSelectedCells as getSelectedCellsActionDefault,
  getSelectionBounds as getSelectionBoundsActionDefault,
  getVisualLayerConfig as getVisualLayerConfigActionDefault,
  resetChatBubbleFrame as resetChatBubbleFrameActionDefault,
  resolveRoomRegion as resolveRoomRegionActionDefault,
  resizeGridText as resizeGridTextActionDefault,
  resizeTilemapGrid as resizeTilemapGridActionDefault,
  setChatBubbleTextColor as setChatBubbleTextColorActionDefault,
  setHoveredMapCell as setHoveredMapCellActionDefault,
  setRegionLabelPosition as setRegionLabelPositionActionDefault,
  setSelectedMapCell as setSelectedMapCellActionDefault,
  setVisualLayer as setVisualLayerActionDefault,
  updateDraftCell as updateDraftCellActionDefault,
} from "./editorActions.js";
import {
  previewSpriteFrame as previewSpriteFrameShellDefault,
  renderAgentEditorPanel as renderAgentEditorPanelShellDefault,
  renderEditorSubviews as renderEditorSubviewsShellDefault,
  renderVisualEditor as renderVisualEditorShellDefault,
  renderVisualSelectionPreview as renderVisualSelectionPreviewShellDefault,
  setActiveEditorSubview as setActiveEditorSubviewShellDefault,
  syncEditorInputs as syncEditorInputsShellDefault,
} from "./editorShell.js";

export function createEditorRuntime(state, deps = {}) {
  const {
    documentRef = globalThis.document,
    PIXIRef = globalThis.PIXI,
    setText = setTextDefault,
    escapeHtml = escapeHtmlDefault,
    setStoredJson = setStoredJsonDefault,
    setStoredMap = setStoredMapDefault,
    parseMapText = parseMapTextDefault,
    parseFloorRow = parseFloorRowDefault,
    parseObjectRow = parseObjectRowDefault,
    parseFloorToken = parseFloorTokenDefault,
    parseObjectToken = parseObjectTokenDefault,
    serializeFloorLines = serializeFloorLinesDefault,
    serializeObjectLines = serializeObjectLinesDefault,
    buildTilemapState = () => null,
    canonicalizeAnchorId = (value) => value,
    cellsKeySet = () => new Set(),
    commitDraftTilemapHelper = commitDraftTilemapHelperDefault,
    drawRoom = () => {},
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    normalizeRoomRegions = (value) => value,
    normalizeStashPoint = (value) => value,
    populateRegionIdSelect = () => {},
    regionForCell = () => null,
    renderChat = () => {},
    renderWorld = () => {},
    resizeRendererViewport = () => {},
    selectedChatBubbleTheme = () => null,
    setTilemapStatus = () => {},
    shouldShowAgentSprite = () => true,
    syncGameStateTextarea = () => {},
    syncRendererCanvasSize = () => {},
    applyChatBubbleFrameStyles = () => {},
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    chatBubbleSlotOverlayMarkup = () => "",
    formatRichTextHtml = (value) => value,
    applyEditorStateHelper = applyEditorStateHelperDefault,
    applyVisualAtlasCellHelper = applyVisualAtlasCellHelperDefault,
    applyVisualTokenHelper = applyVisualTokenHelperDefault,
    assignChatBubbleTileHelper = assignChatBubbleTileHelperDefault,
    assignStashSelectionHelper = assignStashSelectionHelperDefault,
    clearStashSelectionHelper = clearStashSelectionHelperDefault,
    getAtlasPointerCellHelper = getAtlasPointerCellHelperDefault,
    resetChatBubbleFrameHelper = resetChatBubbleFrameHelperDefault,
    resetEditorStateHelper = resetEditorStateHelperDefault,
    resizeGridTextHelper = resizeGridTextHelperDefault,
    resizeTilemapGridHelper = resizeTilemapGridHelperDefault,
    setChatBubbleTextColorHelper = setChatBubbleTextColorHelperDefault,
    setHoveredMapCellHelper = setHoveredMapCellHelperDefault,
    setSelectedMapCellHelper = setSelectedMapCellHelperDefault,
    setVisualLayerHelper = setVisualLayerHelperDefault,
    assignRegionSelectionHelper = assignRegionSelectionHelperDefault,
    clearRegionSelectionHelper = clearRegionSelectionHelperDefault,
    deleteRoomRegionHelper = deleteRoomRegionHelperDefault,
    resolveRoomRegionHelper = resolveRoomRegionHelperDefault,
    setRegionLabelPositionHelper = setRegionLabelPositionHelperDefault,
    renderEditorSubviewsHelper = renderEditorSubviewsHelperDefault,
    renderVisualEditorHelper = renderVisualEditorHelperDefault,
    renderVisualSelectionPreviewHelper = renderVisualSelectionPreviewHelperDefault,
    setActiveEditorSubviewHelper = setActiveEditorSubviewHelperDefault,
    syncEditorInputsHelper = syncEditorInputsHelperDefault,
    previewSpriteFrameHelper = previewSpriteFrameHelperDefault,
    previewSpriteFrameName = previewSpriteFrameNameDefault,
    renderAgentEditorPanelHelper = renderAgentEditorPanelHelperDefault,
    shouldMirrorPreviewSprite = shouldMirrorPreviewSpriteDefault,
    applyVisualAtlasCellAction = applyVisualAtlasCellActionDefault,
    applyVisualTokenAction = applyVisualTokenActionDefault,
    assignChatBubbleTileAction = assignChatBubbleTileActionDefault,
    assignRegionSelectionAction = assignRegionSelectionActionDefault,
    assignStashSelectionAction = assignStashSelectionActionDefault,
    clearRegionSelectionAction = clearRegionSelectionActionDefault,
    clearStashSelectionAction = clearStashSelectionActionDefault,
    commitDraftTilemapAction = commitDraftTilemapActionDefault,
    deleteRoomRegionAction = deleteRoomRegionActionDefault,
    getAssignedAtlasCellAction = getAssignedAtlasCellActionDefault,
    getAssignedPreviewTokenAction = getAssignedPreviewTokenActionDefault,
    getAtlasPathForLayerAction = getAtlasPathForLayerActionDefault,
    getDraftCellValueAction = getDraftCellValueActionDefault,
    getDraftFloorLinesAction = getDraftFloorLinesActionDefault,
    getDraftObjectLinesAction = getDraftObjectLinesActionDefault,
    getSelectedCellsAction = getSelectedCellsActionDefault,
    getSelectionBoundsAction = getSelectionBoundsActionDefault,
    getVisualLayerConfigAction = getVisualLayerConfigActionDefault,
    resetChatBubbleFrameAction = resetChatBubbleFrameActionDefault,
    resolveRoomRegionAction = resolveRoomRegionActionDefault,
    resizeGridTextAction = resizeGridTextActionDefault,
    resizeTilemapGridAction = resizeTilemapGridActionDefault,
    setChatBubbleTextColorAction = setChatBubbleTextColorActionDefault,
    setHoveredMapCellAction = setHoveredMapCellActionDefault,
    setRegionLabelPositionAction = setRegionLabelPositionActionDefault,
    setSelectedMapCellAction = setSelectedMapCellActionDefault,
    setVisualLayerAction = setVisualLayerActionDefault,
    updateDraftCellAction = updateDraftCellActionDefault,
    previewSpriteFrameShell = previewSpriteFrameShellDefault,
    renderAgentEditorPanelShell = renderAgentEditorPanelShellDefault,
    renderEditorSubviewsShell = renderEditorSubviewsShellDefault,
    renderVisualEditorShell = renderVisualEditorShellDefault,
    renderVisualSelectionPreviewShell = renderVisualSelectionPreviewShellDefault,
    setActiveEditorSubviewShell = setActiveEditorSubviewShellDefault,
    syncEditorInputsShell = syncEditorInputsShellDefault,
  } = deps;

  function getDraftFloorLines() {
    return getDraftFloorLinesAction(state, { parseFloorRow, parseMapText });
  }

  function getDraftObjectLines(layerName) {
    return getDraftObjectLinesAction(state, layerName, { parseMapText, parseObjectRow });
  }

  function updateDraftCell(layerName, row, col, value) {
    return updateDraftCellAction(state, layerName, row, col, value, {
      getDraftFloorLines,
      getDraftObjectLines,
      serializeFloorLines,
      serializeObjectLines,
    });
  }

  function getDraftCellValue(layerName, row, col) {
    return getDraftCellValueAction(state, layerName, row, col, {
      getDraftFloorLines,
      getDraftObjectLines,
    });
  }

  function getSelectionBounds() {
    return getSelectionBoundsAction(state);
  }

  function getSelectedCells() {
    return getSelectedCellsAction(state, { getSelectionBounds: () => getSelectionBoundsAction(state) });
  }

  function getVisualLayerConfig() {
    return getVisualLayerConfigAction(state);
  }

  function getAtlasPathForLayer(layerName) {
    return getAtlasPathForLayerAction(state, layerName);
  }

  function getAssignedAtlasCell(layerName, rawValue) {
    return getAssignedAtlasCellAction(state, layerName, rawValue, {
      parseFloorToken,
      parseObjectToken,
    });
  }

  function getAssignedPreviewToken(layerName, rawValue) {
    return getAssignedPreviewTokenAction(layerName, rawValue, {
      parseFloorToken,
      parseObjectToken,
    });
  }

  function setActiveEditorSubview(viewName) {
    return setActiveEditorSubviewShell(state, viewName, {
      drawRoom,
      mountRendererView: deps.mountRendererView || (() => {}),
      renderEditorSubviews,
      renderVisualEditor,
      resizeRendererViewport,
      setActiveEditorSubviewHelper,
    });
  }

  function renderEditorSubviews() {
    return renderEditorSubviewsShell(state, {
      documentRef,
      renderEditorSubviewsHelper,
      setText,
    });
  }

  function syncEditorInputs() {
    return syncEditorInputsShell(state, {
      documentRef,
      getWorldCols,
      getWorldRows,
      renderVisualEditor,
      setText,
      syncEditorInputsHelper,
      syncGameStateTextarea,
    });
  }

  function renderVisualSelectionPreview() {
    return renderVisualSelectionPreviewShell(state, {
      documentRef,
      getAssignedAtlasCell,
      getAssignedPreviewToken,
      getDraftCellValue,
      getVisualLayerConfig,
      renderVisualSelectionPreviewHelper,
      selectedChatBubbleTheme,
    });
  }

  function renderVisualEditor() {
    return renderVisualEditorShell(state, {
      applyChatRoleTheme,
      chatBubbleMarkup,
      chatBubbleSlotOverlayMarkup,
      deleteRoomRegion,
      documentRef,
      drawRoom,
      formatRichTextHtml,
      getAtlasPathForLayer,
      getDraftCellValue,
      getSelectedCells,
      getVisualLayerConfig,
      getWorldCols,
      getWorldRows,
      normalizeStashPoint,
      populateRegionIdSelect,
      renderAgentEditorPanel,
      rerenderVisualEditor: renderVisualEditor,
      renderVisualEditorHelper,
      renderVisualSelectionPreview,
      selectedChatBubbleTheme,
      syncRendererCanvasSize,
    });
  }

  function renderAgentEditorPanel() {
    return renderAgentEditorPanelShell(state, {
      documentRef,
      escapeHtml,
      previewSpriteFrame,
      renderAgentEditorPanelHelper,
      setText,
      shouldShowAgentSprite,
    });
  }

  function previewSpriteFrame(agent) {
    return previewSpriteFrameShell(state, agent, {
      previewSpriteFrameHelper,
      previewSpriteFrameName,
      shouldMirrorPreviewSprite,
    });
  }

  function assignRegionSelection() {
    return assignRegionSelectionAction(state, {
      assignRegionSelectionHelper,
      canonicalizeAnchorId,
      cellsKeySet,
      commitDraftTilemap,
      getSelectedCells,
      normalizeRoomRegions,
      setStoredJson,
      setTilemapStatus,
    });
  }

  function resolveRoomRegion(rawId, selectedCell = null) {
    return resolveRoomRegionAction(state, rawId, selectedCell, {
      canonicalizeAnchorId,
      regionForCell,
      resolveRoomRegionHelper,
    });
  }

  function deleteRoomRegion(regionId) {
    return deleteRoomRegionAction(state, regionId, {
      canonicalizeAnchorId,
      commitDraftTilemap,
      deleteRoomRegionHelper,
      normalizeRoomRegions,
      setStoredJson,
      setTilemapStatus,
    });
  }

  function setRegionLabelPosition() {
    return setRegionLabelPositionAction(state, {
      drawRoom,
      normalizeRoomRegions,
      renderVisualEditor,
      resolveRoomRegion,
      setRegionLabelPositionHelper,
      setStoredJson,
      setTilemapStatus,
    });
  }

  function clearRegionSelection() {
    return clearRegionSelectionAction(state, {
      cellsKeySet,
      clearRegionSelectionHelper,
      commitDraftTilemap,
      getSelectedCells,
      normalizeRoomRegions,
      setStoredJson,
      setTilemapStatus,
    });
  }

  function commitDraftTilemap(successMessage = "Applied draft tilemap.") {
    return commitDraftTilemapAction(state, successMessage, {
      buildTilemapState,
      commitDraftTilemapHelper,
      drawRoom,
      renderWorld,
      resizeRendererViewport,
      setStoredJson,
      setStoredMap,
      setTilemapStatus,
      syncEditorInputs,
    });
  }

  function resizeGridText(text, cols, rows, fillToken, parser, serializer) {
    return resizeGridTextAction(text, cols, rows, fillToken, parser, serializer, {
      parseMapText,
      resizeGridTextHelper,
    });
  }

  function resizeTilemapGrid(cols, rows) {
    return resizeTilemapGridAction(state, cols, rows, {
      buildTilemapState,
      drawRoom,
      getWorldCols,
      getWorldRows,
      parseFloorRow,
      parseObjectRow,
      renderWorld,
      resizeGridText,
      resizeRendererViewport,
      resizeTilemapGridHelper,
      serializeFloorLines,
      serializeObjectLines,
      setStoredJson,
      setStoredMap,
      setTilemapStatus,
      syncEditorInputs,
    });
  }

  function applyVisualToken(rawValue) {
    return applyVisualTokenAction(state, rawValue, {
      applyVisualTokenHelper,
      commitDraftTilemap,
      getSelectedCells,
      setTilemapStatus,
      updateDraftCell,
    });
  }

  function applyVisualAtlasCell(atlasCell) {
    return applyVisualAtlasCellAction(state, atlasCell, {
      applyVisualAtlasCellHelper,
      applyVisualToken,
    });
  }

  function assignChatBubbleTile() {
    return assignChatBubbleTileAction(state, {
      applyChatBubbleFrameStyles,
      assignChatBubbleTileHelper,
      renderChat,
      renderVisualEditor,
      selectedChatBubbleTheme,
      setStoredJson,
      setTilemapStatus,
    });
  }

  function resetChatBubbleFrame() {
    return resetChatBubbleFrameAction(state, {
      applyChatBubbleFrameStyles,
      normalizeChatBubbleTheme: deps.normalizeChatBubbleTheme || ((value) => value),
      renderChat,
      renderVisualEditor,
      resetChatBubbleFrameHelper,
      setStoredJson,
      setTilemapStatus,
    });
  }

  function setChatBubbleTextColor(color) {
    return setChatBubbleTextColorAction(state, color, {
      applyChatBubbleFrameStyles,
      renderChat,
      renderVisualEditor,
      selectedChatBubbleTheme,
      setChatBubbleTextColorHelper,
      setStoredJson,
    });
  }

  function setVisualLayer(layerName) {
    return setVisualLayerAction(state, layerName, {
      renderVisualEditor,
      setVisualLayerHelper,
    });
  }

  function setSelectedMapCell(row, col) {
    return setSelectedMapCellAction(state, row, col, {
      drawRoom,
      regionForCell,
      renderVisualEditor,
      setSelectedMapCellHelper,
    });
  }

  function setHoveredMapCell(row, col) {
    return setHoveredMapCellAction(state, row, col, {
      drawRoom,
      setHoveredMapCellHelper,
    });
  }

  function assignStashSelection() {
    return assignStashSelectionAction(state, {
      assignStashSelectionHelper,
      drawRoom,
      normalizeStashPoint,
      renderVisualEditor,
      setStoredJson,
      setTilemapStatus,
    });
  }

  function clearStashSelection() {
    return clearStashSelectionAction(state, {
      clearStashSelectionHelper,
      drawRoom,
      normalizeStashPoint,
      renderVisualEditor,
      setStoredJson,
      setTilemapStatus,
    });
  }

  function applyEditorState() {
    return applyEditorStateHelper(state, {
      commitDraftTilemap,
      documentRef,
    });
  }

  function resetEditorState() {
    return resetEditorStateHelper(state, {
      applyEditorState,
      documentRef,
      setStoredMap,
    });
  }

  function toggleEditMode() {
    state.editor.enabled = !state.editor.enabled;
    syncEditorInputs();
    drawRoom(state.renderer);
    if (state.world) renderWorld(state.world);
  }

  function getAtlasPointerCell(event) {
    return getAtlasPointerCellHelper(event, {
      documentRef,
      getVisualLayerConfig,
    });
  }

  return {
    applyEditorState,
    applyVisualAtlasCell,
    applyVisualToken,
    assignChatBubbleTile,
    assignRegionSelection,
    assignStashSelection,
    clearRegionSelection,
    clearStashSelection,
    commitDraftTilemap,
    deleteRoomRegion,
    getAssignedAtlasCell,
    getAssignedPreviewToken,
    getAtlasPathForLayer,
    getAtlasPointerCell,
    getDraftCellValue,
    getDraftFloorLines,
    getDraftObjectLines,
    getSelectedCells,
    getSelectionBounds,
    getVisualLayerConfig,
    previewSpriteFrame,
    renderAgentEditorPanel,
    renderEditorSubviews,
    renderVisualEditor,
    renderVisualSelectionPreview,
    resetChatBubbleFrame,
    resetEditorState,
    resolveRoomRegion,
    resizeGridText,
    resizeTilemapGrid,
    setActiveEditorSubview,
    setChatBubbleTextColor,
    setHoveredMapCell,
    setRegionLabelPosition,
    setSelectedMapCell,
    setVisualLayer,
    syncEditorInputs,
    toggleEditMode,
  };
}
