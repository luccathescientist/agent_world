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
  collectSettingsPayload as collectSettingsPayloadHelper,
  fetchSettingsData as fetchSettingsDataHelper,
  renderCodeWithLineNumbers as renderCodeWithLineNumbersHelper,
  renderSettingsChecks as renderSettingsChecksHelper,
  renderSettingsSummary as renderSettingsSummaryHelper,
  saveSettings as saveSettingsHelper,
  saveSettingsFromJsonEditor as saveSettingsFromJsonEditorHelper,
  syncSettingsForm as syncSettingsFormHelper,
  syncSettingsJsonEditor as syncSettingsJsonEditorHelper,
} from "./features/settings/settingsPanel.js";
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
  classifyPath,
  displayActionText as displayActionTextHelper,
  extractPaths,
  fileUrl,
  formatInlineRichText as formatInlineRichTextHelper,
  formatRichTextHtml as formatRichTextHtmlHelper,
  historyRoleClass,
  historyRoleMeta as historyRoleMetaHelper,
  renderChat as renderChatHelper,
  renderHistory as renderHistoryHelper,
  renderRichText as renderRichTextHelper,
  renderSchedule as renderScheduleHelper,
  renderStash as renderStashHelper,
  setMessageSelection as setMessageSelectionHelper,
  showRichMessage as showRichMessageHelper,
  showStashItem as showStashItemHelper,
  stripControlTags,
} from "./features/chat/messageView.js";
import {
  closeWorldDetails as closeWorldDetailsHelper,
  connectStream as connectStreamHelper,
  handleStreamSnapshot as handleStreamSnapshotHelper,
  renderInspector as renderInspectorHelper,
  selectAgent as selectAgentHelper,
  syncSelectedAgentDetailFromWorld as syncSelectedAgentDetailFromWorldHelper,
} from "./features/world/agentDetails.js";
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
import {
  applyEditorState as applyEditorStateHelper,
  applyVisualAtlasCell as applyVisualAtlasCellHelper,
  applyVisualToken as applyVisualTokenHelper,
  assignChatBubbleTile as assignChatBubbleTileHelper,
  assignStashSelection as assignStashSelectionHelper,
  clearStashSelection as clearStashSelectionHelper,
  commitDraftTilemap as commitDraftTilemapHelper,
  getAtlasPointerCell as getAtlasPointerCellHelper,
  getCanvasCellFromEvent as getCanvasCellFromEventHelper,
  resetChatBubbleFrame as resetChatBubbleFrameHelper,
  resetEditorState as resetEditorStateHelper,
  resizeGridText as resizeGridTextHelper,
  resizeTilemapGrid as resizeTilemapGridHelper,
  setChatBubbleTextColor as setChatBubbleTextColorHelper,
  setHoveredMapCell as setHoveredMapCellHelper,
  setSelectedMapCell as setSelectedMapCellHelper,
  setVisualLayer as setVisualLayerHelper,
} from "./features/editor/editorState.js";
import {
  previewSpriteFrame as previewSpriteFrameHelper,
  previewSpriteFrameName,
  renderAgentEditorPanel as renderAgentEditorPanelHelper,
  shouldMirrorPreviewSprite,
} from "./features/editor/agentEditor.js";
import {
  assignRegionSelection as assignRegionSelectionHelper,
  clearRegionSelection as clearRegionSelectionHelper,
  deleteRoomRegion as deleteRoomRegionHelper,
  resolveRoomRegion as resolveRoomRegionHelper,
  setRegionLabelPosition as setRegionLabelPositionHelper,
} from "./features/editor/roomMappingEditor.js";
import {
  renderVisualEditor as renderVisualEditorHelper,
  renderVisualSelectionPreview as renderVisualSelectionPreviewHelper,
  renderEditorSubviews as renderEditorSubviewsHelper,
  setActiveEditorSubview as setActiveEditorSubviewHelper,
  syncEditorInputs as syncEditorInputsHelper,
} from "./features/editor/visualEditor.js";
import {
  appendVoiceTranscript as appendVoiceTranscriptHelper,
  ensureMicMeter as ensureMicMeterHelper,
  fetchVoiceConfig as fetchVoiceConfigHelper,
  initVoiceControls as initVoiceControlsHelper,
  maybeSpeakReply as maybeSpeakReplyHelper,
  normalizeSpeechText,
  pushVoiceEvent as pushVoiceEventHelper,
  refreshVoiceInputDevices as refreshVoiceInputDevicesHelper,
  renderVoiceDebugUi as renderVoiceDebugUiHelper,
  renderVoiceTranscriptDebug as renderVoiceTranscriptDebugHelper,
  speakText as speakTextHelper,
  startMicMeterLoop as startMicMeterLoopHelper,
  startVoiceCapture as startVoiceCaptureHelper,
  stopMicMeter as stopMicMeterHelper,
  stopSpeechPlayback as stopSpeechPlaybackHelper,
  stopVoiceCapture as stopVoiceCaptureHelper,
  transcribeRecordedAudio as transcribeRecordedAudioHelper,
  updateVoiceUi as updateVoiceUiHelper,
} from "./features/voice/voiceController.js";
import { initDomEvents, startApp } from "./bootstrap/domEvents.js";
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
import {
  previewSpriteFrame as previewSpriteFrameShell,
  renderAgentEditorPanel as renderAgentEditorPanelShell,
  renderEditorSubviews as renderEditorSubviewsShell,
  renderVisualEditor as renderVisualEditorShell,
  renderVisualSelectionPreview as renderVisualSelectionPreviewShell,
  setActiveEditorSubview as setActiveEditorSubviewShell,
  syncEditorInputs as syncEditorInputsShell,
} from "./app/editorShell.js";
import {
  appendVoiceTranscript as appendVoiceTranscriptShell,
  applyRuntimeStatusTone as applyRuntimeStatusToneShell,
  collectSettingsPayload as collectSettingsPayloadShell,
  ensureMicMeter as ensureMicMeterShell,
  fetchSettingsData as fetchSettingsDataShell,
  fetchVoiceConfig as fetchVoiceConfigShell,
  initVoiceControls as initVoiceControlsShell,
  pushVoiceEvent as pushVoiceEventShell,
  refreshVoiceInputDevices as refreshVoiceInputDevicesShell,
  renderCodeWithLineNumbers as renderCodeWithLineNumbersShell,
  renderSettingsChecks as renderSettingsChecksShell,
  renderSettingsSummary as renderSettingsSummaryShell,
  renderVoiceDebugUi as renderVoiceDebugUiShell,
  renderVoiceTranscriptDebug as renderVoiceTranscriptDebugShell,
  saveSettings as saveSettingsShell,
  saveSettingsFromJsonEditor as saveSettingsFromJsonEditorShell,
  setSettingsResult as setSettingsResultShell,
  setVoiceDebugText as setVoiceDebugTextShell,
  setVoiceStatus as setVoiceStatusShell,
  speakText as speakTextShell,
  startMicMeterLoop as startMicMeterLoopShell,
  startVoiceCapture as startVoiceCaptureShell,
  stopMicMeter as stopMicMeterShell,
  stopSpeechPlayback as stopSpeechPlaybackShell,
  stopVoiceCapture as stopVoiceCaptureShell,
  syncSettingsForm as syncSettingsFormShell,
  syncSettingsJsonEditor as syncSettingsJsonEditorShell,
  transcribeRecordedAudio as transcribeRecordedAudioShell,
  updateVoiceUi as updateVoiceUiShell,
} from "./app/settingsVoiceShell.js";
import {
  closeWorldDetails as closeWorldDetailsShell,
  connectStream as connectStreamShell,
  handleStreamSnapshot as handleStreamSnapshotShell,
  renderChat as renderChatShell,
  renderHistory as renderHistoryShell,
  renderInspector as renderInspectorShell,
  renderSchedule as renderScheduleShell,
  renderStash as renderStashShell,
  renderWorld as renderWorldShell,
  showRichMessage as showRichMessageShell,
  showStashItem as showStashItemShell,
  syncSelectedAgentDetailFromWorld as syncSelectedAgentDetailFromWorldShell,
} from "./app/worldShell.js";
import {
  populateAgentSelect as populateAgentSelectHelper,
  populateRegionIdSelect as populateRegionIdSelectHelper,
  setActiveTab as setActiveTabHelper,
  setTilemapStatus as setTilemapStatusHelper,
  syncWorldDetailVisibility as syncWorldDetailVisibilityHelper,
} from "./app/shell.js";
import { appState } from "./state/appState.js";
const chatBubbleThemeState = { atlasImagePromise: null };

function setVoiceStatus(text, isError = false) {
  return setVoiceStatusShell(text, isError, { documentRef: document });
}

function setVoiceDebugText(id, value) {
  return setVoiceDebugTextShell(id, value, { documentRef: document });
}

function setSettingsResult(text, isError = false) {
  return setSettingsResultShell(text, isError, { documentRef: document });
}

function applyRuntimeStatusTone(id, state) {
  return applyRuntimeStatusToneShell(id, state, { documentRef: document });
}

function renderCodeWithLineNumbers(text) {
  return renderCodeWithLineNumbersShell(text, {
    escapeHtml,
    renderCodeWithLineNumbersHelper,
  });
}

function renderSettingsChecks() {
  return renderSettingsChecksShell(appState, {
    documentRef: document,
    escapeHtml,
    renderCodeWithLineNumbers,
    renderSettingsChecksHelper,
    setText,
  });
}

function syncSettingsJsonEditor() {
  return syncSettingsJsonEditorShell(appState, {
    documentRef: document,
    syncSettingsJsonEditorHelper,
  });
}

function syncSettingsForm() {
  return syncSettingsFormShell(appState, {
    documentRef: document,
    syncSettingsFormHelper,
  });
}

function renderSettingsSummary() {
  return renderSettingsSummaryShell(appState, {
    applyRuntimeStatusTone,
    renderSettingsChecks,
    renderSettingsSummaryHelper,
    setText,
  });
}

function collectSettingsPayload() {
  return collectSettingsPayloadShell({
    collectSettingsPayloadHelper,
    documentRef: document,
  });
}

async function fetchSettingsData() {
  return fetchSettingsDataShell(appState, {
    fetchDiagnostics: () => getJson("/api/agent-world/settings/diagnostics"),
    fetchSettings: () => getJson("/api/agent-world/settings"),
    fetchSettingsDataHelper,
    renderSettingsSummary,
    setSettingsResult,
    syncSettingsForm,
    syncSettingsJsonEditor,
  });
}

async function saveSettings() {
  return saveSettingsShell(appState, {
    collectSettingsPayload,
    fetchSettingsData,
    fetchVoiceConfig,
    postSettings: (payload) => postJson("/api/agent-world/settings", payload),
    renderSettingsSummary,
    saveSettingsHelper,
    setSettingsResult,
  });
}

async function saveSettingsFromJsonEditor() {
  return saveSettingsFromJsonEditorShell(appState, {
    documentRef: document,
    fetchSettingsData,
    fetchVoiceConfig,
    postSettings: (payload) => postJson("/api/agent-world/settings", payload),
    renderSettingsSummary,
    saveSettingsFromJsonEditorHelper,
    setSettingsResult,
    syncSettingsForm,
    syncSettingsJsonEditor,
  });
}

async function fetchVoiceConfig() {
  return fetchVoiceConfigShell(appState, {
    fetchVoiceConfigHelper,
    getJson,
    pushVoiceEvent,
    updateVoiceUi,
  });
}

function pushVoiceEvent(message) {
  return pushVoiceEventShell(appState, message, {
    pushVoiceEventHelper,
    setVoiceDebugText,
  });
}

function renderVoiceTranscriptDebug() {
  return renderVoiceTranscriptDebugShell(appState, {
    normalizeSpeechText,
    renderVoiceTranscriptDebugHelper,
    setVoiceDebugText,
  });
}

function renderVoiceDebugUi() {
  return renderVoiceDebugUiShell(appState, {
    documentRef: document,
    renderVoiceDebugUiHelper,
    renderVoiceTranscriptDebug,
    setVoiceDebugText,
  });
}

function updateVoiceUi() {
  return updateVoiceUiShell(appState, {
    documentRef: document,
    renderVoiceDebugUi,
    updateVoiceUiHelper,
  });
}

function appendVoiceTranscript(text) {
  return appendVoiceTranscriptShell(text, {
    appendVoiceTranscriptHelper,
    documentRef: document,
  });
}

function stopSpeechPlayback() {
  return stopSpeechPlaybackShell(appState, {
    stopSpeechPlaybackHelper,
    URLRef: URL,
    windowRef: window,
  });
}

async function speakText(text, source = "manual") {
  return speakTextShell(appState, text, source, {
    AudioCtor: Audio,
    fetchRef: fetch,
    normalizeSpeechText,
    pushVoiceEvent,
    renderVoiceDebugUi,
    setVoiceStatus,
    speakTextHelper,
    stopSpeechPlayback,
    updateVoiceUi,
    URLRef: URL,
    windowRef: window,
  });
}

async function sendCommandText(text) {
  const result = document.getElementById("command-result");
  const commandText = String(text || "").trim();
  if (!commandText) return false;
  if (!appState.selectedAgentId) {
    result.textContent = "No agent selected.";
    return false;
  }
  const response = await getJson(`/api/agent-world/agents/${encodeURIComponent(appState.selectedAgentId)}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: commandText, mode: "append", source: "ui" }),
  });
  result.textContent = `${response.status === "accepted" ? "Sent" : "Rejected"} at ${formatTime(response.acceptedAt)}: ${response.echoedCommand}${response.reason ? ` (${response.reason})` : ""}`;
  await load();
  return response.status === "accepted";
}

function maybeSpeakReply(history) {
  return maybeSpeakReplyHelper(appState, history, {
    historyRoleClass,
    normalizeSpeechText,
    speakText,
  });
}

function stopMicMeter() {
  return stopMicMeterShell(appState, {
    cancelAnimationFrameRef: cancelAnimationFrame,
    renderVoiceDebugUi,
    stopMicMeterHelper,
  });
}

async function transcribeRecordedAudio(blob) {
  return transcribeRecordedAudioShell(appState, blob, {
    FormDataCtor: FormData,
    documentRef: document,
    fetchRef: fetch,
    normalizeSpeechText,
    pushVoiceEvent,
    renderVoiceDebugUi,
    sendCommandText,
    setVoiceStatus,
    stopMicMeter,
    transcribeRecordedAudioHelper,
    updateVoiceUi,
  });
}

async function refreshVoiceInputDevices() {
  return refreshVoiceInputDevicesShell(appState, {
    navigatorRef: navigator,
    pushVoiceEvent,
    refreshVoiceInputDevicesHelper,
    setStoredMap,
    updateVoiceUi,
  });
}

function startMicMeterLoop() {
  return startMicMeterLoopShell(appState, {
    renderVoiceDebugUi,
    requestAnimationFrameRef: requestAnimationFrame,
    startMicMeterLoop,
    startMicMeterLoopHelper,
  });
}

async function ensureMicMeter() {
  return ensureMicMeterShell(appState, {
    ensureMicMeterHelper,
    navigatorRef: navigator,
    pushVoiceEvent,
    refreshVoiceInputDevices,
    setStoredMap,
    setVoiceStatus,
    startMicMeterLoop,
    updateVoiceUi,
    windowRef: window,
  });
}

function stopVoiceCapture() {
  return stopVoiceCaptureShell(appState, {
    pushVoiceEvent,
    setVoiceStatus,
    stopMicMeter,
    stopVoiceCaptureHelper,
    stopSpeechPlayback,
    updateVoiceUi,
  });
}

async function startVoiceCapture() {
  return startVoiceCaptureShell(appState, {
    MediaRecorderCtor: MediaRecorder,
    ensureMicMeter,
    pushVoiceEvent,
    renderVoiceDebugUi,
    setVoiceStatus,
    startVoiceCaptureHelper,
    stopMicMeter,
    transcribeRecordedAudio,
    updateVoiceUi,
    windowRef: window,
  });
}

function initVoiceControls() {
  return initVoiceControlsShell(appState, {
    documentRef: document,
    fetchVoiceConfig,
    getStoredMap,
    initVoiceControlsHelper,
    navigatorRef: navigator,
    pushVoiceEvent,
    refreshVoiceInputDevices,
    renderVoiceDebugUi,
    sendCommandText,
    setVoiceStatus,
    stopMicMeter,
    updateVoiceUi,
    windowRef: window,
  });
}

function populateAgentSelect(agents) {
  return populateAgentSelectHelper(appState, agents, { documentRef: document });
}

function populateRegionIdSelect(select) {
  return populateRegionIdSelectHelper(appState, select, {
    defaultAnchorTiles: DEFAULT_ANCHOR_TILES,
  });
}

function selectedChatBubbleTheme() {
  return selectedChatBubbleThemeHelper(appState);
}

function applyChatBubbleFrameStyles() {
  return applyChatBubbleFrameStylesHelper(appState, chatBubbleThemeState, {
    consoleRef: console,
    documentRef: document,
    ImageCtor: Image,
  });
}

function chatBubbleSlotOverlayMarkup(role) {
  return chatBubbleSlotOverlayMarkupHelper(role, appState, { escapeHtml });
}

function applyChatRoleTheme(element, role) {
  return applyChatRoleThemeHelper(element, role);
}

function statusClass(runtimeStatus) {
  if (runtimeStatus === "blocked") return "blocked";
  if (runtimeStatus === "waiting_user") return "waiting";
  if (runtimeStatus === "offline") return "offline";
  return "active";
}

function hashString(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function bubblePaletteForAgent(agent) {
  if (agent?.id === "lucca-main") return { fill: 0x111111, stroke: 0xf6e8bf, text: 0xf6ebc7 };
  const seed = `${agent?.id || "agent"}:${agent?.name || ""}`;
  return AGENT_BUBBLE_PALETTES[hashString(seed) % AGENT_BUBBLE_PALETTES.length];
}

function isMainAgent(agent) {
  return agent?.id === "lucca-main";
}

function parseTimestampMs(value) {
  if (!value || typeof value !== "string") return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function isInactiveAgent(agent, nowMs = Date.now()) {
  if (!agent || isMainAgent(agent)) return false;
  if (agent.runtimeStatus === "active" || agent.runtimeStatus === "blocked" || agent.runtimeStatus === "waiting_user") {
    return false;
  }
  const updatedMs = parseTimestampMs(agent.lastUpdatedAt);
  return updatedMs > 0 && (nowMs - updatedMs) >= AGENT_INACTIVE_HIDE_MS;
}

function shouldShowAgentSprite(agent) {
  if (!agent) return true;
  return !isInactiveAgent(agent);
}

function nextAmbientRandom(state) {
  const current = Number.isFinite(state?.ambientSeed) ? state.ambientSeed >>> 0 : 1;
  const next = ((current * 1664525) + 1013904223) >>> 0;
  if (state) state.ambientSeed = next;
  return next / 0x100000000;
}

function setMessageSelection(kind, title, body, path = null, locked = true) {
  return setMessageSelectionHelper(appState, kind, title, body, path, locked);
}

function createText(text, style) {
  return new PIXI.Text(text, style);
}

function displayActionText(text) {
  return displayActionTextHelper(text, { stripControlTags });
}

function formatInlineRichText(text) {
  return formatInlineRichTextHelper(text, { escapeHtml });
}

function formatRichTextHtml(text) {
  return formatRichTextHtmlHelper(text, {
    escapeHtml,
    formatInlineRichText,
    stripControlTags,
  });
}

function renderRichText(target, text) {
  return renderRichTextHelper(target, text, { formatRichTextHtml });
}

function roomLabelForAnchor(anchorId) {
  const region = regionForAnchor(anchorId);
  if (region?.label) return region.label;
  const anchor = getAnchorTile(anchorId);
  return anchor?.label || String(anchorId || "room");
}

function activityCue(agent, sprite, moving) {
  if (moving) return "🚶";
  if (agent.visualState === "messaging") return "✉️";
  if (agent.visualState === "reading") return "📚";
  if (agent.visualState === "working" || agent.visualState === "writing") return "🛠️";
  if (agent.visualState === "blocked") return "⚠️";
  if (isIdleLikeAgent(agent)) return "😴";
  return "💭";
}

function displayedLocationLabel(agent) {
  const renderedRoomId = roomIdForAgent(agent);
  const renderedRoom = roomLabelForAnchor(renderedRoomId);
  const backendRoomId = agent.currentAnchor || agent.targetAnchor || renderedRoomId;
  const backendRoom = roomLabelForAnchor(backendRoomId);
  if (renderedRoomId !== backendRoomId) {
    return `${renderedRoom} (rendered)`;
  }
  return backendRoom;
}

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

function syncGameStateTextarea() {
  return syncGameStateTextareaHelper(appState, { buildCurrentGameStatePayload });
}

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

function getAnchorTile(anchorId) {
  return getAnchorTileHelper(appState, anchorId);
}

function canonicalizeAnchorId(rawId) {
  return canonicalizeAnchorIdHelper(rawId);
}

function normalizeRoomRegions(rawRegions) {
  return normalizeRoomRegionsHelper(appState, rawRegions);
}

function normalizeStashPoint(rawStash) {
  return normalizeStashPointHelper(appState, rawStash);
}

function regionForCell(row, col) {
  return regionForCellHelper(appState, row, col);
}

function regionForAnchor(anchorId) {
  return regionForAnchorHelper(appState, anchorId);
}

function furnitureTokenAt(row, col) {
  return furnitureTokenAtHelper(appState, row, col);
}

function propTokenAt(row, col) {
  return propTokenAtHelper(appState, row, col);
}

function isIdleLikeAgent(agent) {
  return agent?.visualState === "idle" || agent?.visualState === "waiting";
}

function roomIdForAgent(agent) {
  return roomIdForAgentHelper(agent, {
    isIdleLikeAgent,
  });
}

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

function getWorldCols() {
  return getWorldColsHelper(appState);
}

function getWorldRows() {
  return getWorldRowsHelper(appState);
}

function getWorldWidth() {
  return getWorldWidthHelper(appState);
}

function getWorldHeight() {
  return getWorldHeightHelper(appState);
}

function getSceneTopPadding() {
  return getSceneTopPaddingHelper(appState);
}

function getRenderHeight() {
  return getRenderHeightHelper(appState);
}

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

function isWalkable(row, col) {
  return isWalkableHelper(appState, row, col);
}

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

function getDraftFloorLines() {
  return parseMapText(appState.editor.draftFloorText).map(parseFloorRow);
}

function getDraftObjectLines(layerName) {
  const key = layerName === "wall"
    ? "draftWallText"
    : layerName === "furniture"
      ? "draftFurnitureText"
      : "draftPropText";
  return parseMapText(appState.editor[key]).map(parseObjectRow);
}

function updateDraftCell(layerName, row, col, value) {
  if (layerName === "floor") {
    const lines = getDraftFloorLines();
    lines[row][col] = value;
    appState.editor.draftFloorText = serializeFloorLines(lines);
    return;
  }
  const rows = getDraftObjectLines(layerName);
  rows[row][col] = value;
  const nextText = serializeObjectLines(rows);
  if (layerName === "wall") appState.editor.draftWallText = nextText;
  else if (layerName === "furniture") appState.editor.draftFurnitureText = nextText;
  else appState.editor.draftPropText = nextText;
}

function getDraftCellValue(layerName, row, col) {
  if (row == null || col == null) return "--";
  if (layerName === "floor") {
    const lines = getDraftFloorLines();
    return lines[row]?.[col] ?? "--";
  }
  const rows = getDraftObjectLines(layerName);
  return rows[row]?.[col] ?? "--";
}

function getSelectionBounds() {
  const anchor = appState.editor.selectionAnchor || appState.editor.selectedCell;
  const focus = appState.editor.selectionFocus || appState.editor.selectedCell;
  if (!anchor || !focus) return null;
  return {
    rowStart: Math.min(anchor.row, focus.row),
    rowEnd: Math.max(anchor.row, focus.row),
    colStart: Math.min(anchor.col, focus.col),
    colEnd: Math.max(anchor.col, focus.col),
  };
}

function getSelectedCells() {
  const bounds = getSelectionBounds();
  if (!bounds) return [];
  const cells = [];
  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    for (let col = bounds.colStart; col <= bounds.colEnd; col += 1) {
      cells.push({ row, col });
    }
  }
  return cells;
}

function getVisualLayerConfig() {
  return VISUAL_LAYER_CONFIG[appState.editor.selectedLayer] || VISUAL_LAYER_CONFIG.floor;
}

function getAtlasPathForLayer(layerName) {
  const layout = appState.renderer?.assets?.layout || {};
  if (VISUAL_LAYER_CONFIG[layerName]?.atlasKind === "floor") {
    return layout.floorAtlasPath || DEFAULT_FLOOR_ATLAS_PATH;
  }
  return VISUAL_LAYER_CONFIG[layerName]?.atlasKind === "wall"
    ? (layout.wallAtlasPath || DEFAULT_WALL_ATLAS_PATH)
    : (layout.officeAtlasPath || DEFAULT_OFFICE_ATLAS_PATH);
}

function getAssignedAtlasCell(layerName, rawValue) {
  if (!rawValue || rawValue === "--" || rawValue === ".") return null;
  if (layerName === "floor") {
    const floorToken = parseFloorToken(rawValue);
    if (floorToken.kind === "atlas") return { x: floorToken.x, y: floorToken.y };
    if (floorToken.kind === "code") {
      const entry = appState.tilemap?.manifest?.[floorToken.code];
      if (entry?.grid) return { x: entry.grid[0] + 1, y: entry.grid[1] + 1 };
    }
    return null;
  }
  const token = parseObjectToken(rawValue);
  if (token.kind === "atlas") return { x: token.x, y: token.y };
  return null;
}

function getAssignedPreviewToken(layerName, rawValue) {
  if (!rawValue || rawValue === "--") return null;
  if (layerName === "floor") return parseFloorToken(rawValue);
  return parseObjectToken(rawValue);
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

function setTilemapStatus(text, isError = false) {
  return setTilemapStatusHelper(text, isError, { documentRef: document });
}

function syncWorldDetailVisibility() {
  return syncWorldDetailVisibilityHelper(appState, { documentRef: document });
}

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

function setActiveEditorSubview(viewName) {
  return setActiveEditorSubviewShell(appState, viewName, {
    drawRoom,
    mountRendererView,
    renderEditorSubviews,
    renderVisualEditor,
    resizeRendererViewport,
    setActiveEditorSubviewHelper,
  });
}

function renderEditorSubviews() {
  return renderEditorSubviewsShell(appState, {
    documentRef: document,
    renderEditorSubviewsHelper,
    setText,
  });
}

function syncEditorInputs() {
  return syncEditorInputsShell(appState, {
    documentRef: document,
    getWorldCols,
    getWorldRows,
    renderVisualEditor,
    syncEditorInputsHelper,
    setText,
    syncGameStateTextarea,
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

function renderVisualSelectionPreview() {
  return renderVisualSelectionPreviewShell(appState, {
    documentRef: document,
    getAssignedAtlasCell,
    getAssignedPreviewToken,
    getDraftCellValue,
    getVisualLayerConfig,
    renderVisualSelectionPreviewHelper,
    selectedChatBubbleTheme,
  });
}

function renderVisualEditor() {
  return renderVisualEditorShell(appState, {
    applyChatRoleTheme,
    chatBubbleMarkup,
    chatBubbleSlotOverlayMarkup,
    deleteRoomRegion,
    documentRef: document,
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
    renderVisualEditorHelper,
    renderVisualSelectionPreview,
    selectedChatBubbleTheme,
    syncRendererCanvasSize,
  });
}

function renderAgentEditorPanel() {
  return renderAgentEditorPanelShell(appState, {
    documentRef: document,
    escapeHtml,
    previewSpriteFrame,
    renderAgentEditorPanelHelper,
    setText,
    shouldShowAgentSprite,
  });
}

function previewSpriteFrame(agent) {
  return previewSpriteFrameShell(appState, agent, {
    previewSpriteFrameHelper,
    previewSpriteFrameName,
    shouldMirrorPreviewSprite,
  });
}

function renderEditorSelectionOverlay(renderer) {
  return renderEditorSelectionOverlayHelper(appState, renderer, {
    getSelectedCells,
    PIXIRef: PIXI,
  });
}

function assignRegionSelection() {
  return assignRegionSelectionHelper(appState, {
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
  return resolveRoomRegionHelper(appState, rawId, selectedCell, {
    canonicalizeAnchorId,
    regionForCell,
  });
}

function deleteRoomRegion(regionId) {
  return deleteRoomRegionHelper(appState, regionId, {
    canonicalizeAnchorId,
    commitDraftTilemap,
    normalizeRoomRegions,
    setStoredJson,
    setTilemapStatus,
  });
}

function setRegionLabelPosition() {
  return setRegionLabelPositionHelper(appState, {
    drawRoom,
    normalizeRoomRegions,
    renderVisualEditor,
    resolveRoomRegion,
    setStoredJson,
    setTilemapStatus,
  });
}

function clearRegionSelection() {
  return clearRegionSelectionHelper(appState, {
    cellsKeySet,
    commitDraftTilemap,
    getSelectedCells,
    normalizeRoomRegions,
    setStoredJson,
    setTilemapStatus,
  });
}

function commitDraftTilemap(successMessage = "Applied draft tilemap.") {
  return commitDraftTilemapHelper(appState, successMessage, {
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

function resizeGridText(text, cols, rows, fillToken, parser, serializer) {
  return resizeGridTextHelper(text, cols, rows, fillToken, parser, serializer, {
    parseMapText,
  });
}

function resizeTilemapGrid(cols, rows) {
  return resizeTilemapGridHelper(appState, cols, rows, {
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

function applyVisualToken(rawValue) {
  return applyVisualTokenHelper(appState, rawValue, {
    commitDraftTilemap,
    getSelectedCells,
    setTilemapStatus,
    updateDraftCell,
  });
}

function applyVisualAtlasCell(atlasCell) {
  return applyVisualAtlasCellHelper(appState, atlasCell, {
    applyVisualToken,
  });
}

function assignChatBubbleTile() {
  return assignChatBubbleTileHelper(appState, {
    applyChatBubbleFrameStyles,
    renderChat,
    renderVisualEditor,
    selectedChatBubbleTheme,
    setStoredJson,
    setTilemapStatus,
  });
}

function resetChatBubbleFrame() {
  return resetChatBubbleFrameHelper(appState, {
    applyChatBubbleFrameStyles,
    normalizeChatBubbleTheme,
    renderChat,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
  });
}

function setChatBubbleTextColor(color) {
  return setChatBubbleTextColorHelper(appState, color, {
    applyChatBubbleFrameStyles,
    renderChat,
    renderVisualEditor,
    selectedChatBubbleTheme,
    setStoredJson,
  });
}

function setVisualLayer(layerName) {
  return setVisualLayerHelper(appState, layerName, {
    renderVisualEditor,
  });
}

function setSelectedMapCell(row, col) {
  return setSelectedMapCellHelper(appState, row, col, {
    drawRoom,
    regionForCell,
    renderVisualEditor,
  });
}

function setHoveredMapCell(row, col) {
  return setHoveredMapCellHelper(appState, row, col, {
    drawRoom,
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

function assignStashSelection() {
  return assignStashSelectionHelper(appState, {
    drawRoom,
    normalizeStashPoint,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
  });
}

function clearStashSelection() {
  return clearStashSelectionHelper(appState, {
    drawRoom,
    normalizeStashPoint,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
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

window.addEventListener("resize", () => {
  resizeRendererViewport();
});

function renderWorld(worldState) {
  return renderWorldShell(appState, worldState, {
    bubblePaletteForAgent,
    createAgentSprite,
    createBenchmarkSprite,
    formatDate,
    isBenchmarkAgent,
    populateAgentSelect,
    renderWorldHelper,
    setText,
    shouldShowAgentSprite,
    syncSelectedAgentDetailFromWorld,
    updateActivityCue,
    updateAgentLabel,
    updateBubble,
  });
}

function syncSelectedAgentDetailFromWorld(worldState) {
  return syncSelectedAgentDetailFromWorldShell(appState, worldState, {
    renderInspector,
    syncSelectedAgentDetailFromWorldHelper,
  });
}

function renderInspector(detailPayload) {
  return renderInspectorShell(appState, detailPayload, {
    displayedLocationLabel,
    documentRef: document,
    formatDate,
    renderInspectorHelper,
    setText,
    showRichMessage,
    statusClass,
  });
}

async function showRichMessage(kind, title, text, path = null) {
  return showRichMessageShell(appState, kind, title, text, path, {
    classifyPath,
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    extractPaths,
    fetchText: async (url) => {
      const res = await fetch(url);
      return res.text();
    },
    fileUrl,
    renderRichText,
    setMessageSelection,
    setText,
    showRichMessageHelper,
    windowRef: window,
  });
}

function historyRoleMeta(type) {
  return historyRoleMetaHelper(type, { historyRoleClass });
}

function renderChat(history) {
  return renderChatShell(appState, history, {
    applyChatRoleTheme,
    chatBubbleMarkup,
    classifyPath,
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    extractPaths,
    fileUrl,
    formatRichTextHtml,
    formatTime,
    historyRoleClass,
    historyRoleMeta,
    maybeSpeakReply,
    renderChatHelper,
    setText,
    showRichMessage,
    windowRef: window,
  });
}

function renderHistory(events) {
  return renderHistoryShell(events, {
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    extractPaths,
    formatTime,
    renderChat,
    renderHistoryHelper,
    showRichMessage,
  });
}

function renderSchedule(detailPayload) {
  return renderScheduleShell(detailPayload, {
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    formatDate,
    renderScheduleHelper,
    setText,
    showRichMessage,
  });
}

function showStashItem(item) {
  return showStashItemShell(item, {
    formatDate,
    showRichMessage,
    showStashItemHelper,
  });
}

function renderStash(stash) {
  return renderStashShell(appState, stash, {
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    formatDate,
    renderStashHelper,
    setText,
    showStashItem,
  });
}

function handleStreamSnapshot(payload) {
  return handleStreamSnapshotShell(payload, {
    handleStreamSnapshotHelper,
    renderHistory,
    renderInspector,
    renderSchedule,
    renderStash,
    renderWorld,
  });
}

function connectStream() {
  return connectStreamShell(appState, {
    EventSourceCtor: EventSource,
    URLSearchParamsCtor: URLSearchParams,
    connectStreamHelper,
    consoleRef: console,
    handleStreamSnapshot,
    setText,
  });
}

async function selectAgent(agentId) {
  return selectAgentHelper(appState, agentId, {
    connectStream,
    getJson,
    renderHistory,
    renderInspector,
    renderSchedule,
    renderStash,
    renderWorld,
    setMessageSelection,
    syncWorldDetailVisibility,
  });
}

function closeWorldDetails() {
  return closeWorldDetailsShell(appState, {
    closeWorldDetailsHelper,
    connectStream,
    documentRef: document,
    renderHistory,
    renderSchedule,
    renderStash,
    renderWorld,
    setText,
    syncWorldDetailVisibility,
  });
}

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

function applyEditorState() {
  return applyEditorStateHelper(appState, {
    commitDraftTilemap,
    documentRef: document,
  });
}

function resetEditorState() {
  return resetEditorStateHelper(appState, {
    applyEditorState,
    documentRef: document,
    setStoredMap,
  });
}

function toggleEditMode() {
  appState.editor.enabled = !appState.editor.enabled;
  syncEditorInputs();
  drawRoom(appState.renderer);
  if (appState.world) renderWorld(appState.world);
}

function getAtlasPointerCell(event) {
  return getAtlasPointerCellHelper(event, {
    documentRef: document,
    getVisualLayerConfig,
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

initDomEvents(appState, {
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
  writeGameStateToLocalStorage,
});

startApp({
  documentRef: document,
  initVoiceControls,
  load,
  setActiveTab,
  setTilemapStatus,
});
