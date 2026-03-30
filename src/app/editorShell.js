/*
 * Thin editor-shell adapters.
 * These helpers keep editor feature modules dependency-injected while exposing
 * app-friendly wrappers for the entrypoint and composed runtimes.
 */
export function setActiveEditorSubview(state, viewName, deps = {}) {
  const {
    drawRoom = () => {},
    mountRendererView = () => {},
    renderEditorSubviews = () => {},
    renderVisualEditor = () => {},
    resizeRendererViewport = () => {},
    setActiveEditorSubviewHelper = () => {},
  } = deps;
  return setActiveEditorSubviewHelper(state, viewName, {
    drawRoom,
    mountRendererView,
    renderEditorSubviews,
    renderVisualEditor,
    resizeRendererViewport,
  });
}

export function renderEditorSubviews(state, deps = {}) {
  const {
    documentRef = document,
    renderEditorSubviewsHelper = () => {},
    setText = () => {},
  } = deps;
  return renderEditorSubviewsHelper(state, {
    documentRef,
    setText,
  });
}

export function syncEditorInputs(state, deps = {}) {
  const {
    documentRef = document,
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    renderVisualEditor = () => {},
    setText = () => {},
    syncEditorInputsHelper = () => {},
    syncGameStateTextarea = () => {},
  } = deps;
  return syncEditorInputsHelper(state, {
    documentRef,
    getWorldCols,
    getWorldRows,
    renderVisualEditor,
    setText,
    syncGameStateTextarea,
  });
}

export function renderVisualSelectionPreview(state, deps = {}) {
  const {
    documentRef = document,
    getAssignedAtlasCell = () => null,
    getAssignedPreviewToken = () => null,
    getDraftCellValue = () => null,
    getVisualLayerConfig = () => ({}),
    renderVisualSelectionPreviewHelper = () => {},
    selectedChatBubbleTheme = () => null,
  } = deps;
  return renderVisualSelectionPreviewHelper(state, {
    documentRef,
    getAssignedAtlasCell,
    getAssignedPreviewToken,
    getDraftCellValue,
    getVisualLayerConfig,
    selectedChatBubbleTheme,
  });
}

export function renderVisualEditor(state, deps = {}) {
  const {
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    chatBubbleSlotOverlayMarkup = () => "",
    deleteRoomRegion = () => {},
    documentRef = document,
    drawRoom = () => {},
    formatRichTextHtml = (value) => value,
    getAtlasPathForLayer = () => "",
    getDraftCellValue = () => null,
    getSelectedCells = () => [],
    getVisualLayerConfig = () => ({}),
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    normalizeStashPoint = (value) => value,
    populateRegionIdSelect = () => {},
    renderAgentEditorPanel = () => {},
    renderVisualEditorHelper = () => {},
    renderVisualSelectionPreview = () => {},
    selectedChatBubbleTheme = () => null,
    syncRendererCanvasSize = () => {},
  } = deps;
  return renderVisualEditorHelper(state, {
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
    renderVisualSelectionPreview,
    selectedChatBubbleTheme,
    syncRendererCanvasSize,
  });
}

export function renderAgentEditorPanel(state, deps = {}) {
  const {
    documentRef = document,
    escapeHtml = (value) => String(value),
    previewSpriteFrame = () => null,
    renderAgentEditorPanelHelper = () => {},
    setText = () => {},
    shouldShowAgentSprite = () => true,
  } = deps;
  return renderAgentEditorPanelHelper(state, {
    documentRef,
    escapeHtml,
    previewSpriteFrame,
    setText,
    shouldShowAgentSprite,
  });
}

export function previewSpriteFrame(state, agent, deps = {}) {
  const {
    previewSpriteFrameHelper = () => null,
    previewSpriteFrameName = () => null,
    shouldMirrorPreviewSprite = () => false,
  } = deps;
  return previewSpriteFrameHelper(state, agent, {
    previewSpriteFrameName,
    shouldMirrorPreviewSprite,
  });
}
