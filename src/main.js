/*
 * Frontend entrypoint and top-level composition layer.
 * This file wires together shared app state, browser globals, renderer
 * ownership, and the composed runtimes that drive the frontend.
 */
import {
  AGENT_BUBBLE_PALETTES,
  AGENT_INACTIVE_HIDE_MS,
  CHAT_BUBBLE_PREVIEW_SAMPLES,
  CHAT_BUBBLE_SLOT_LAYOUT,
  DEFAULT_ANCHOR_TILES,
  DEFAULT_FLOOR_ATLAS_PATH,
  DEFAULT_OFFICE_ATLAS_PATH,
  DEFAULT_SELECTED_AGENT_ID,
  DEFAULT_WALL_ATLAS_PATH,
  DEFAULT_WORLD_COLS,
  DEFAULT_WORLD_ROWS,
  EMPTY_OBJECT,
  GAME_STATE_STORAGE_KEYS,
  PATH_RE,
  ROOM_LANDMARK_TOKENS,
  SEAT_FURNITURE_TILES,
  TILE_SIZE,
  TILEMAP_STORAGE_KEYS,
  VISUAL_LAYER_CONFIG,
} from "./core/constants.js";
import { setText } from "./core/dom.js";
import { escapeHtml, formatDate, formatTime } from "./core/format.js";
import { getJson, getText, postJson } from "./core/http.js";
import {
  getStoredJson,
  getStoredMap,
  peekStoredJson,
  peekStoredMap,
  setStoredJson,
  setStoredMap,
} from "./core/storage.js";
import {
  floorTokenLabel,
  normalizeMapText,
  parseFloorRow,
  parseFloorToken,
  parseMapText,
  parseObjectRow,
  parseObjectToken,
  serializeFloorLines,
  serializeObjectLines,
  tokenLabel,
} from "./features/tilemap/mapText.js";
import {
  applyImportedAgentWorldStorageState,
  buildCurrentGameStatePayload as buildCurrentGameStatePayloadHelper,
  currentLayoutConfigPayload as currentLayoutConfigPayloadHelper,
  defaultLayoutConfig,
  normalizePersistenceSnapshot as normalizePersistenceSnapshotHelper,
  parseImportedAgentWorldStorageState,
  peekParsedValue,
  structuredSnapshotFromGameState as structuredSnapshotFromGameStateHelper,
  syncGameStateTextarea as syncGameStateTextareaHelper,
  writeGameStateToLocalStorage as writeGameStateToLocalStorageHelper,
} from "./features/tilemap/tilemapState.js";
import {
  applyChatBubbleFrameStyles as applyChatBubbleFrameStylesHelper,
  applyChatRoleTheme as applyChatRoleThemeHelper,
  chatBubbleMarkup,
  chatBubbleSlotOverlayMarkup as chatBubbleSlotOverlayMarkupHelper,
  normalizeChatBubbleTheme,
  normalizeChatBubbleThemes,
  selectedChatBubbleTheme as selectedChatBubbleThemeHelper,
} from "./features/chat/chatBubbleThemes.js";
import {
  displayActionText as displayActionTextHelper,
  formatInlineRichText as formatInlineRichTextHelper,
  formatRichTextHtml as formatRichTextHtmlHelper,
  historyRoleClass,
  renderRichText as renderRichTextHelper,
  setMessageSelection as setMessageSelectionHelper,
  stripControlTags,
} from "./features/chat/messageView.js";
import {
  chooseDisplayFrames as chooseDisplayFramesHelper,
  collectFrameSequence,
  createAgentSprite as createAgentSpriteHelper,
  createBenchmarkSprite as createBenchmarkSpriteHelper,
  directionalIdleFrames as directionalIdleFramesHelper,
  directionalWalkFrames as directionalWalkFramesHelper,
  getAnimationFrames as getAnimationFramesHelper,
  positionAgentLabel,
  positionBubble,
  shouldMirrorSpriteForFacing as shouldMirrorSpriteForFacingHelper,
  spriteFramesForAgent,
  updateActivityCue as updateActivityCueHelper,
  updateAgentLabel,
  updateBubble as updateBubbleHelper,
} from "./features/world/agentSprites.js";
import {
  activityCue as activityCueHelper,
  bubblePaletteForAgent as bubblePaletteForAgentHelper,
  displayedLocationLabel as displayedLocationLabelHelper,
  hashString,
  isInactiveAgent as isInactiveAgentHelper,
  isMainAgent,
  parseTimestampMs,
  shouldShowAgentSprite as shouldShowAgentSpriteHelper,
  statusClass,
} from "./features/world/presentation.js";
import {
  applyPathing as applyPathingHelper,
  currentTileForAgent as currentTileForAgentHelper,
  effectiveGoalTileForAgent as effectiveGoalTileForAgentHelper,
  findPath as findPathHelper,
  goalTileForAgent as goalTileForAgentHelper,
  inBounds as inBoundsHelper,
  isWalkable as isWalkableHelper,
  nearestWalkableTile as nearestWalkableTileHelper,
  roomGoalTile as roomGoalTileHelper,
  roomIdForAgent as roomIdForAgentHelper,
  roomWaypointTiles as roomWaypointTilesHelper,
  tileFromWorldPoint as tileFromWorldPointHelper,
  tilePoint,
} from "./features/world/pathing.js";
import {
  buildTilemapState as buildTilemapStateHelper,
  canonicalizeAnchorId as canonicalizeAnchorIdHelper,
  cellsKeySet,
  furnitureTokenAt as furnitureTokenAtHelper,
  getAnchorTile as getAnchorTileHelper,
  getRenderHeight as getRenderHeightHelper,
  getSceneTopPadding as getSceneTopPaddingHelper,
  getWorldCols as getWorldColsHelper,
  getWorldHeight as getWorldHeightHelper,
  getWorldRows as getWorldRowsHelper,
  getWorldWidth as getWorldWidthHelper,
  normalizeRoomRegions as normalizeRoomRegionsHelper,
  normalizeStashPoint as normalizeStashPointHelper,
  propTokenAt as propTokenAtHelper,
  regionCenter,
  regionForAnchor as regionForAnchorHelper,
  regionForCell as regionForCellHelper,
} from "./features/world/worldState.js";
import {
  buildPrimitiveTexture as buildPrimitiveTextureHelper,
  buildTileTextures as buildTileTexturesHelper,
  getLayerTexture as getLayerTextureHelper,
  loadArtAssets as loadArtAssetsHelper,
} from "./render/assets.js";
import {
  createAnchorLabel as createAnchorLabelHelper,
  createRegionLabel as createRegionLabelHelper,
  createStashBox as createStashBoxHelper,
  drawRoom as drawRoomHelper,
  getFloorTexture as getFloorTextureHelper,
  renderEditorSelectionOverlay as renderEditorSelectionOverlayHelper,
} from "./render/scene.js";
import {
  mountRendererView as mountRendererViewHelper,
  renderWorld as renderWorldHelper,
  resizeRendererViewport as resizeRendererViewportHelper,
  syncRendererCanvasSize as syncRendererCanvasSizeHelper,
  syncSceneOffset as syncSceneOffsetHelper,
  tickAgents as tickAgentsHelper,
} from "./render/worldRenderer.js";
import { initRenderer as initRendererHelper } from "./render/pixiApp.js";
import { getCanvasCellFromEvent as getCanvasCellFromEventHelper } from "./features/editor/editorState.js";
import {
  maybeSpeakReply as maybeSpeakReplyHelper,
  normalizeSpeechText,
} from "./features/voice/voiceController.js";
import { initAppStartup } from "./app/startup.js";
import {
  applyStructuredGameState as applyStructuredGameStateHelper,
  loadApp as loadAppHelper,
  moveSelectedAgentToAnchor as moveSelectedAgentToAnchorHelper,
  saveGameState as saveGameStateHelper,
  submitCommand as submitCommandHelper,
} from "./app/runtime.js";
import {
  buildPrimitiveTexture as buildPrimitiveTextureShell,
  buildTileTextures as buildTileTexturesShell,
  createAnchorLabel as createAnchorLabelShell,
  createRegionLabel as createRegionLabelShell,
  getFloorTexture as getFloorTextureShell,
  getLayerTexture as getLayerTextureShell,
  loadArtAssets as loadArtAssetsShell,
  mountRendererView as mountRendererViewShell,
  resizeRendererViewport as resizeRendererViewportShell,
  syncRendererCanvasSize as syncRendererCanvasSizeShell,
  syncSceneOffset as syncSceneOffsetShell,
} from "./app/renderShell.js";
import { createEditorRuntime } from "./app/editorRuntime.js";
import { createSettingsVoiceRuntime } from "./app/settingsVoiceRuntime.js";
import { createWorldUiRuntime } from "./app/worldUiRuntime.js";
import {
  populateAgentSelect as populateAgentSelectHelper,
  populateRegionIdSelect as populateRegionIdSelectHelper,
  setActiveTab as setActiveTabHelper,
  setTilemapStatus as setTilemapStatusHelper,
  syncWorldDetailVisibility as syncWorldDetailVisibilityHelper,
} from "./app/shell.js";
import { appState } from "./state/appState.js";

const chatBubbleThemeState = { atlasImagePromise: null };
const {
  fetchSettingsData,
  fetchVoiceConfig,
  initVoiceControls,
  pushVoiceEvent,
  renderSettingsSummary,
  saveSettings,
  saveSettingsFromJsonEditor,
  sendCommandText,
  setSettingsResult,
  setVoiceStatus,
  speakText,
  startVoiceCapture,
  stopSpeechPlayback,
  stopVoiceCapture,
  updateVoiceUi,
} = createSettingsVoiceRuntime(appState, {
  AudioCtor: Audio,
  MediaRecorderCtor: MediaRecorder,
  FormDataCtor: FormData,
  URLRef: URL,
  cancelAnimationFrameRef: cancelAnimationFrame,
  documentRef: document,
  fetchRef: fetch,
  load: () => load(),
  navigatorRef: navigator,
  requestAnimationFrameRef: requestAnimationFrame,
  windowRef: window,
});

function maybeSpeakReply(history) {
  return maybeSpeakReplyHelper(appState, history, {
    historyRoleClass,
    normalizeSpeechText,
    speakText,
  });
}

const populateAgentSelect = (agents) => populateAgentSelectHelper(appState, agents, { documentRef: document });

function populateRegionIdSelect(select) {
  return populateRegionIdSelectHelper(appState, select, {
    defaultAnchorTiles: DEFAULT_ANCHOR_TILES,
  });
}

const selectedChatBubbleTheme = () => selectedChatBubbleThemeHelper(appState);

function applyChatBubbleFrameStyles() {
  return applyChatBubbleFrameStylesHelper(appState, chatBubbleThemeState, {
    consoleRef: console,
    documentRef: document,
    ImageCtor: Image,
  });
}

const chatBubbleSlotOverlayMarkup = (role) => chatBubbleSlotOverlayMarkupHelper(role, appState, { escapeHtml });

const applyChatRoleTheme = (element, role) => applyChatRoleThemeHelper(element, role);

function nextAmbientRandom(state) {
  const current = Number.isFinite(state?.ambientSeed) ? state.ambientSeed >>> 0 : 1;
  const next = ((current * 1664525) + 1013904223) >>> 0;
  if (state) state.ambientSeed = next;
  return next / 0x100000000;
}

const setMessageSelection = (kind, title, body, path = null, locked = true) =>
  setMessageSelectionHelper(appState, kind, title, body, path, locked);

const createText = (text, style) => new PIXI.Text(text, style);

const displayActionText = (text) => displayActionTextHelper(text, { stripControlTags });

const formatInlineRichText = (text) => formatInlineRichTextHelper(text, { escapeHtml });

function formatRichTextHtml(text) {
  return formatRichTextHtmlHelper(text, {
    escapeHtml,
    formatInlineRichText,
    stripControlTags,
  });
}

const renderRichText = (target, text) => renderRichTextHelper(target, text, { formatRichTextHtml });

function roomLabelForAnchor(anchorId) {
  const region = regionForAnchor(anchorId);
  if (region?.label) return region.label;
  const anchor = getAnchorTile(anchorId);
  return anchor?.label || String(anchorId || "room");
}

const bubblePaletteForAgent = (agent) => bubblePaletteForAgentHelper(agent, { hashString });
const isInactiveAgent = (agent, nowMs = Date.now()) => isInactiveAgentHelper(agent, nowMs, { isMainAgent, parseTimestampMs });
const shouldShowAgentSprite = (agent) => shouldShowAgentSpriteHelper(agent, { isInactiveAgent });

function normalizePersistenceSnapshot(rawValue = {}, layout = {}) {
  return normalizePersistenceSnapshotHelper(rawValue, layout, {
    normalizeRoomRegions,
    normalizeStashPoint,
    normalizeChatBubbleThemes,
  });
}

function structuredSnapshotFromGameState(rawGameState = {}, fallbackLayout = {}) {
  return structuredSnapshotFromGameStateHelper(rawGameState, fallbackLayout, {
    normalizeRoomRegions,
    normalizeStashPoint,
    normalizeChatBubbleThemes,
  });
}

function currentLayoutConfigPayload() {
  return currentLayoutConfigPayloadHelper(appState, {
    getWorldCols,
    getWorldRows,
  });
}

function buildCurrentGameStatePayload() {
  return buildCurrentGameStatePayloadHelper(appState, {
    currentLayoutConfigPayload,
    normalizeStashPoint,
    peekStoredMap,
  });
}

const syncGameStateTextarea = () => syncGameStateTextareaHelper(appState, { buildCurrentGameStatePayload });

function writeGameStateToLocalStorage(payload, syncTextarea = true) {
  if (!syncTextarea) {
    for (const key of GAME_STATE_STORAGE_KEYS) {
      if (!(key in payload)) continue;
      localStorage.setItem(key, String(payload[key]));
    }
    appState.gameStateRaw = { ...payload };
    return;
  }
  return writeGameStateToLocalStorageHelper(appState, payload, { syncGameStateTextarea });
}

const getAnchorTile = (anchorId) => getAnchorTileHelper(appState, anchorId);
const canonicalizeAnchorId = (rawId) => canonicalizeAnchorIdHelper(rawId);
const normalizeRoomRegions = (rawRegions) => normalizeRoomRegionsHelper(appState, rawRegions);
const normalizeStashPoint = (rawStash) => normalizeStashPointHelper(appState, rawStash);
const regionForCell = (row, col) => regionForCellHelper(appState, row, col);
const regionForAnchor = (anchorId) => regionForAnchorHelper(appState, anchorId);
const furnitureTokenAt = (row, col) => furnitureTokenAtHelper(appState, row, col);
const propTokenAt = (row, col) => propTokenAtHelper(appState, row, col);

function isIdleLikeAgent(agent) {
  return agent?.visualState === "idle" || agent?.visualState === "waiting";
}

function roomIdForAgent(agent) {
  return roomIdForAgentHelper(agent, {
    isIdleLikeAgent,
  });
}

const activityCue = (agent, sprite, moving) => activityCueHelper(agent, sprite, moving, { isIdleLikeAgent });
const displayedLocationLabel = (agent) => displayedLocationLabelHelper(agent, { roomIdForAgent, roomLabelForAnchor });

function roomGoalTile(anchorId, startTile = null) {
  return roomGoalTileHelper(anchorId, startTile, {
    findPath,
    furnitureTokenAt,
    getAnchorTile,
    isWalkable,
    nearestWalkableTile,
    regionCenter,
    regionForAnchor,
  });
}

function roomWaypointTiles(anchorId, startTile = null) {
  return roomWaypointTilesHelper(anchorId, startTile, {
    findPath,
    furnitureTokenAt,
    inBounds,
    isWalkable,
    propTokenAt,
    regionCenter,
    regionForAnchor,
  });
}

const getWorldCols = () => getWorldColsHelper(appState);
const getWorldRows = () => getWorldRowsHelper(appState);
const getWorldWidth = () => getWorldWidthHelper(appState);
const getWorldHeight = () => getWorldHeightHelper(appState);
const getSceneTopPadding = () => getSceneTopPaddingHelper(appState);
const getRenderHeight = () => getRenderHeightHelper(appState);

function isBenchmarkAgent(agent) {
  const id = String(agent?.id || "").toLowerCase();
  const name = String(agent?.name || "").toLowerCase();
  return id.startsWith("bench-") || name.startsWith("bench-");
}

function tileFromWorldPoint(x, y) {
  return tileFromWorldPointHelper(x, y, {
    getWorldCols,
    getWorldRows,
    nearestWalkableTile,
  });
}

function inBounds(row, col) {
  return inBoundsHelper(appState, row, col, {
    getWorldCols: () => getWorldCols(),
    getWorldRows: () => getWorldRows(),
  });
}

const isWalkable = (row, col) => isWalkableHelper(appState, row, col);

function nearestWalkableTile(row, col) {
  return nearestWalkableTileHelper(appState, row, col, {
    inBounds,
    isWalkable,
  });
}

function goalTileForAgent(agent, startTile = null) {
  return goalTileForAgentHelper(agent, startTile, {
    roomGoalTile,
  });
}

function currentTileForAgent(agent) {
  return currentTileForAgentHelper(agent, {
    getAnchorTile,
    nearestWalkableTile,
  });
}

function findPath(startTile, goalTile) {
  return findPathHelper(startTile, goalTile, {
    inBounds,
    isWalkable,
  });
}

function getFloorTexture(renderer, floorToken) {
  return getFloorTextureShell(renderer, floorToken, {
    getFloorTextureHelper,
    PIXIRef: PIXI,
  });
}

function buildTilemapState(floorText, wallText, furnitureText, propText, manifest, layout, roomRegions = []) {
  return buildTilemapStateHelper(floorText, wallText, furnitureText, propText, manifest, layout, roomRegions, {
    normalizeRoomRegions: normalizeRoomRegionsHelper,
    normalizeStashPoint: normalizeStashPointHelper,
    state: appState,
  });
}

function createAnchorLabel(text, x, y) {
  return createAnchorLabelShell(text, x, y, {
    createAnchorLabelHelper,
    createText,
    PIXIRef: PIXI,
  });
}

function createRegionLabel(region) {
  return createRegionLabelShell(region, {
    createAnchorLabel,
    createRegionLabelHelper,
    regionCenter,
  });
}

function getAnimationFrames(renderer, agent, visualState) {
  return getAnimationFramesHelper(renderer, agent, visualState, {
    spriteFramesForAgent,
  });
}

function directionalIdleFrames(renderer, agent, facing) {
  return directionalIdleFramesHelper(renderer, agent, facing, {
    getAnimationFrames,
    spriteFramesForAgent,
  });
}

function directionalWalkFrames(renderer, agent, facing) {
  return directionalWalkFramesHelper(renderer, agent, facing, {
    collectFrameSequence,
    spriteFramesForAgent,
  });
}

function shouldMirrorSpriteForFacing(renderer, agent, facing) {
  return shouldMirrorSpriteForFacingHelper(renderer, agent, facing, {
    spriteFramesForAgent,
  });
}

async function loadArtAssets() {
  return loadArtAssetsShell(appState, {
    applyChatBubbleFrameStyles,
    defaultLayoutConfig,
    getJson,
    loadArtAssetsHelper,
    PIXIRef: PIXI,
    setChatBubbleThemes: (state, themes) => {
      state.chatBubbleThemes = themes;
    },
    structuredSnapshotFromGameState,
    writeGameStateToLocalStorage,
  });
}

const setTilemapStatus = (text, isError = false) => setTilemapStatusHelper(text, isError, { documentRef: document });

const syncWorldDetailVisibility = () => syncWorldDetailVisibilityHelper(appState, { documentRef: document });

function mountRendererView() {
  return mountRendererViewShell(appState, {
    documentRef: document,
    mountRendererViewHelper,
    syncRendererCanvasSize,
  });
}

function syncSceneOffset() {
  return syncSceneOffsetShell(appState, {
    getSceneTopPadding,
    syncSceneOffsetHelper,
  });
}

function resizeRendererViewport() {
  return resizeRendererViewportShell(appState, {
    getRenderHeight,
    getWorldWidth,
    resizeRendererViewportHelper,
    syncRendererCanvasSize,
    syncSceneOffset,
  });
}

function syncRendererCanvasSize() {
  return syncRendererCanvasSizeShell(appState, {
    getRenderHeight,
    getWorldWidth,
    syncRendererCanvasSizeHelper,
  });
}

function buildPrimitiveTexture(pixiApp, primitiveName) {
  return buildPrimitiveTextureShell(pixiApp, primitiveName, {
    buildPrimitiveTextureHelper,
    PIXIRef: PIXI,
  });
}

async function buildTileTextures(pixiApp, manifest) {
  return buildTileTexturesShell(pixiApp, manifest, {
    buildPrimitiveTexture,
    buildTileTexturesHelper,
    PIXIRef: PIXI,
  });
}

function getLayerTexture(renderer, objectToken, layerName) {
  return getLayerTextureShell(renderer, objectToken, layerName, {
    getLayerTextureHelper,
    PIXIRef: PIXI,
  });
}

function setActiveTab(tabName) {
  return setActiveTabHelper(appState, tabName, {
    documentRef: document,
    drawRoom,
    mountRendererView,
    renderEditorSubviews,
    renderSettingsSummary,
    renderVisualEditor,
    renderWorld,
    resizeRendererViewport,
    syncWorldDetailVisibility,
  });
}

function applyStructuredGameState(snapshot, successMessage = "Loaded game state.") {
  return applyStructuredGameStateHelper(appState, snapshot, successMessage, {
    applyChatBubbleFrameStyles,
    buildCurrentGameStatePayload,
    buildTilemapState,
    defaultLayoutConfig,
    drawRoom,
    normalizePersistenceSnapshot,
    renderWorld,
    resizeRendererViewport,
    setTilemapStatus,
    syncEditorInputs,
  });
}

function renderEditorSelectionOverlay(renderer) {
  return renderEditorSelectionOverlayHelper(appState, renderer, {
    getSelectedCells,
    PIXIRef: PIXI,
  });
}

function createStashBox() {
  return createStashBoxHelper(appState, {
    createText,
    documentRef: document,
    normalizeStashPoint,
    PIXIRef: PIXI,
    showStashItem,
  });
}

function drawRoom(renderer) {
  return drawRoomHelper(appState, renderer, {
    createAnchorLabel,
    createRegionLabel,
    createStashBox,
    createText,
    floorTokenLabel,
    getFloorTexture,
    getLayerTexture,
    getRenderHeight,
    getSceneTopPadding,
    getSelectedCells,
    getWorldCols,
    getWorldHeight,
    getWorldRows,
    getWorldWidth,
    parseFloorToken,
    parseObjectToken,
    PIXIRef: PIXI,
    renderEditorSelectionOverlay,
    tokenLabel,
  });
}

function createAgentSprite(agent) {
  return createAgentSpriteHelper(appState, agent, {
    bubblePaletteForAgent,
    createText,
    currentTileForAgent,
    displayActionText,
    getAnimationFrames,
    hashString,
    onSelectAgent: async (agentId) => {
      await selectAgent(agentId);
      document.querySelector(".inspector")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    PIXIRef: PIXI,
    positionAgentLabel,
    positionBubble,
    tilePoint,
  });
}

function createBenchmarkSprite(agent) {
  return createBenchmarkSpriteHelper(appState, agent, {
    bubblePaletteForAgent,
    createText,
    currentTileForAgent,
    displayActionText,
    hashString,
    onSelectAgent: async (agentId) => {
      await selectAgent(agentId);
      document.querySelector(".inspector")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    PIXIRef: PIXI,
    positionAgentLabel,
    positionBubble,
  });
}

function updateBubble(container, text) {
  return updateBubbleHelper(container, text, {
    displayActionText,
    positionBubble,
  });
}

function updateActivityCue(container, agent, moving) {
  return updateActivityCueHelper(container, agent, moving, {
    activityCue,
  });
}

function chooseDisplayFrames(renderer, agent, moving) {
  return chooseDisplayFramesHelper(renderer, agent, moving, {
    directionalIdleFrames,
    directionalWalkFrames,
    getAnimationFrames,
  });
}

function effectiveGoalTileForAgent(sprite, agent, currentTile) {
  return effectiveGoalTileForAgentHelper(appState, sprite, agent, currentTile, {
    nextAmbientRandom,
    regionForAnchor,
    regionForCell,
    roomGoalTile,
    roomIdForAgent,
    roomWaypointTiles,
  });
}

function applyPathing(sprite, agent) {
  return applyPathingHelper(appState, sprite, agent, {
    effectiveGoalTileForAgent,
    findPath,
    goalTileForAgent,
    isWalkable,
    nearestWalkableTile,
    tileFromWorldPoint,
    tilePoint,
  });
}

function tickAgents(delta) {
  return tickAgentsHelper(appState, delta, {
    applyPathing,
    chooseDisplayFrames,
    positionAgentLabel,
    positionBubble,
    shouldMirrorSpriteForFacing,
    updateActivityCue,
    updateAgentLabel,
  });
}

async function initRenderer() {
  return initRendererHelper(appState, {
    PIXIRef: window.PIXI,
    buildPrimitiveTexture,
    buildTileTextures,
    buildTilemapState,
    documentRef: document,
    drawRoom,
    getCanvasCellFromEvent,
    getRenderHeight,
    getWorldWidth,
    loadArtAssets,
    mountRendererView,
    normalizeMapText,
    normalizeStashPoint,
    renderVisualEditor,
    setHoveredMapCell,
    setTilemapStatus,
    syncEditorInputs,
    syncRendererCanvasSize,
    syncSceneOffset,
    tickAgents,
    windowRef: window,
  });
}

const {
  closeWorldDetails,
  connectStream,
  handleStreamSnapshot,
  renderChat,
  renderHistory,
  renderInspector,
  renderSchedule,
  renderStash,
  renderWorld,
  selectAgent,
  showRichMessage,
  showStashItem,
  syncSelectedAgentDetailFromWorld,
} = createWorldUiRuntime(appState, {
  applyChatRoleTheme,
  bubblePaletteForAgent,
  chatBubbleMarkup,
  createAgentSprite,
  createBenchmarkSprite,
  displayedLocationLabel,
  documentRef: document,
  EventSourceCtor: EventSource,
  fetchRef: fetch,
  formatDate,
  formatRichTextHtml,
  formatTime,
  getJson,
  isBenchmarkAgent,
  maybeSpeakReply,
  populateAgentSelect,
  renderRichText,
  setMessageSelection,
  setText,
  shouldShowAgentSprite,
  statusClass,
  syncWorldDetailVisibility,
  updateActivityCue,
  updateAgentLabel,
  updateBubble,
  URLSearchParamsCtor: URLSearchParams,
  windowRef: window,
});

const {
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
} = createEditorRuntime(appState, {
  PIXIRef: PIXI,
  applyChatBubbleFrameStyles,
  applyChatRoleTheme,
  buildTilemapState,
  canonicalizeAnchorId,
  cellsKeySet,
  chatBubbleMarkup,
  chatBubbleSlotOverlayMarkup,
  documentRef: document,
  drawRoom,
  escapeHtml,
  formatRichTextHtml,
  getWorldCols,
  getWorldRows,
  mountRendererView,
  normalizeChatBubbleTheme,
  normalizeRoomRegions,
  normalizeStashPoint,
  parseFloorRow,
  parseFloorToken,
  parseMapText,
  parseObjectRow,
  parseObjectToken,
  populateRegionIdSelect,
  regionForCell,
  renderChat,
  renderWorld,
  resizeRendererViewport,
  selectedChatBubbleTheme,
  serializeFloorLines,
  serializeObjectLines,
  setStoredJson,
  setStoredMap,
  setText,
  setTilemapStatus,
  shouldShowAgentSprite,
  syncGameStateTextarea,
  syncRendererCanvasSize,
});

async function saveGameState() {
  return saveGameStateHelper(appState, {
    applyStructuredGameState,
    buildCurrentGameStatePayload,
    postJson,
    structuredSnapshotFromGameState,
    writeGameStateToLocalStorage,
  });
}

async function moveSelectedAgentToAnchor() {
  return moveSelectedAgentToAnchorHelper(appState, {
    currentTileForAgent,
    documentRef: document,
    findPath,
    formatTime,
    goalTileForAgent,
    isWalkable,
    load,
    postJson,
    renderInspector,
    renderWorld,
  });
}

function getCanvasCellFromEvent(event, view) {
  return getCanvasCellFromEventHelper(event, view, {
    getWorldCols,
    getWorldHeight,
    getWorldRows,
    getWorldWidth,
  });
}

async function load() {
  return loadAppHelper(appState, {
    connectStream,
    fetchSettingsData,
    getJson,
    initRenderer,
    renderHistory,
    renderSchedule,
    renderStash,
    renderWorld,
    selectAgent,
    syncWorldDetailVisibility,
  });
}

async function submitCommand(event) {
  return submitCommandHelper(event, {
    documentRef: document,
    sendCommandText,
  });
}

initAppStartup(appState, {
  applyEditorState,
  applyImportedAgentWorldStorageState,
  applyStructuredGameState,
  applyVisualAtlasCell,
  applyVisualToken,
  assignChatBubbleTile,
  assignRegionSelection,
  assignStashSelection,
  clearRegionSelection,
  clearStashSelection,
  closeWorldDetails,
  documentRef: document,
  fetchSettingsData,
  getAtlasPointerCell,
  initVoiceControls,
  load,
  moveSelectedAgentToAnchor,
  parseImportedAgentWorldStorageState,
  pushVoiceEvent,
  renderVisualEditor,
  renderWorld,
  resetChatBubbleFrame,
  resetEditorState,
  resizeRendererViewport,
  resizeTilemapGrid,
  saveGameState,
  saveSettings,
  saveSettingsFromJsonEditor,
  selectedChatBubbleTheme,
  selectAgent,
  setActiveEditorSubview,
  setActiveTab,
  setChatBubbleTextColor,
  setRegionLabelPosition,
  setSettingsResult,
  setStoredMap,
  setTilemapStatus,
  setVisualLayer,
  setVoiceStatus,
  speakText,
  startVoiceCapture,
  stopSpeechPlayback,
  stopVoiceCapture,
  structuredSnapshotFromGameState,
  submitCommand,
  syncGameStateTextarea,
  TILEMAP_STORAGE_KEYS,
  updateVoiceUi,
  windowRef: window,
  writeGameStateToLocalStorage,
});
