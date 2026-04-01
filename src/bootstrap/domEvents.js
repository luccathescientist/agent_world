/*
 * DOM event registration for the frontend.
 * This file wires the static page controls to the composed app/runtime APIs but
 * deliberately avoids owning the underlying feature logic itself.
 */
import { bindEditorEvents } from "../features/editor/shared/editorEvents.js";

export function initDomEvents(state, deps = {}) {
  const {
    applyEditorState = () => {},
    applyImportedAgentWorldStorageState = () => {},
    applyStructuredGameState = () => {},
    applyVisualAtlasCell = () => {},
    applyVisualToken = () => {},
    assignChatBubbleTile = () => {},
    assignRegionSelection = () => {},
    assignStashSelection = () => {},
    clearRegionSelection = () => {},
    clearStashSelection = () => {},
    closeWorldDetails = () => {},
    documentRef = document,
    fetchSettingsData = async () => {},
    initVoiceControls = () => {},
    load = async () => {},
    moveSelectedAgentToAnchor = async () => {},
    parseImportedAgentWorldStorageState = () => ({}),
    renderVisualEditor = () => {},
    renderWorld = () => {},
    resetChatBubbleFrame = () => {},
    resetEditorState = () => {},
    resizeTilemapGrid = () => {},
    saveGameState = async () => {},
    saveSettings = async () => {},
    saveSettingsFromJsonEditor = async () => {},
    selectedChatBubbleTheme = () => null,
    setActiveEditorSubview = () => {},
    setActiveTab = () => {},
    setChatBubbleTextColor = () => {},
    setSettingsResult = () => {},
    setTilemapStatus = () => {},
    setVisualLayer = () => {},
    setVoiceStatus = () => {},
    setRegionLabelPosition = () => {},
    setStoredMap = () => {},
    selectAgent = async () => {},
    stopSpeechPlayback = () => {},
    stopVoiceCapture = () => {},
    structuredSnapshotFromGameState = () => ({}),
    submitCommand = async () => {},
    syncGameStateTextarea = () => {},
    updateVoiceUi = () => {},
    writeGameStateToLocalStorage = () => {},
    getAtlasPointerCell = () => null,
    pushVoiceEvent = () => {},
    speakText = () => {},
    startVoiceCapture = async () => {},
    TILEMAP_STORAGE_KEYS = {},
    URLRef = URL,
    BlobCtor = Blob,
  } = deps;

  documentRef.getElementById("command-form").addEventListener("submit", submitCommand);
  documentRef.getElementById("voice-toggle").addEventListener("click", async () => {
    if (state.voice.listening) stopVoiceCapture();
    else await startVoiceCapture();
  });
  documentRef.getElementById("voice-stop").addEventListener("click", stopVoiceCapture);
  documentRef.getElementById("voice-speak-current").addEventListener("click", () => {
    speakText(state.messageSelection.body || state.messageSelection.title, "selected-message");
  });
  documentRef.getElementById("voice-auto-send").addEventListener("change", (event) => {
    state.voice.autoSend = !!event.target.checked;
    setVoiceStatus(state.voice.autoSend ? "Auto-send is on." : "Auto-send is off.");
  });
  documentRef.getElementById("voice-speak-replies").addEventListener("change", (event) => {
    state.voice.speakReplies = !!event.target.checked;
    if (!state.voice.speakReplies) stopSpeechPlayback();
    setVoiceStatus(state.voice.speakReplies ? "Reply speech is on." : "Reply speech is off.");
  });
  documentRef.getElementById("voice-input-select").addEventListener("change", (event) => {
    state.voice.selectedInputDeviceId = event.target.value || "";
    setStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, state.voice.selectedInputDeviceId);
    pushVoiceEvent(state.voice.selectedInputDeviceId ? "Preferred mic input updated." : "Preferred mic input cleared.");
    if (state.voice.listening) {
      stopVoiceCapture();
      setVoiceStatus("Microphone changed. Press Start Mic to reconnect.", false);
    } else {
      updateVoiceUi();
    }
  });
  documentRef.getElementById("agent-select").addEventListener("change", async (event) => {
    const agentId = event.target.value;
    if (!agentId) {
      closeWorldDetails();
      return;
    }
    await selectAgent(agentId);
  });
  documentRef.getElementById("close-world-details").addEventListener("click", closeWorldDetails);
  documentRef.getElementById("refresh-button").addEventListener("click", load);
  documentRef.getElementById("tab-world").addEventListener("click", () => setActiveTab("world"));
  documentRef.getElementById("tab-editor").addEventListener("click", () => setActiveTab("editor"));
  documentRef.getElementById("tab-settings").addEventListener("click", () => setActiveTab("settings"));
  documentRef.getElementById("settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveSettings();
  });
  documentRef.getElementById("settings-refresh").addEventListener("click", async () => {
    await fetchSettingsData();
    setSettingsResult("Diagnostics refreshed.");
  });
  documentRef.getElementById("settings-save-json").addEventListener("click", async () => {
    await saveSettingsFromJsonEditor();
  });
  documentRef.getElementById("settings-reload-json").addEventListener("click", async () => {
    await fetchSettingsData();
    setSettingsResult("Settings JSON reloaded from disk.");
  });
  bindEditorEvents(state, {
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
    documentRef,
    getAtlasPointerCell,
    parseImportedAgentWorldStorageState,
    renderVisualEditor,
    renderWorld,
    resetChatBubbleFrame,
    resetEditorState,
    resizeTilemapGrid,
    saveGameState,
    selectedChatBubbleTheme,
    setActiveEditorSubview,
    setChatBubbleTextColor,
    setRegionLabelPosition,
    setTilemapStatus,
    setVisualLayer,
    structuredSnapshotFromGameState,
    syncGameStateTextarea,
    writeGameStateToLocalStorage,
    URLRef,
    BlobCtor,
  });
  documentRef.getElementById("move-agent-button").addEventListener("click", async () => {
    try {
      await moveSelectedAgentToAnchor();
    } catch (err) {
      documentRef.getElementById("command-result").textContent = `Move error: ${err.message}`;
    }
  });
}

export function startApp(deps = {}) {
  const {
    documentRef = document,
    initVoiceControls = () => {},
    load = async () => {},
    setActiveTab = () => {},
    setTilemapStatus = () => {},
  } = deps;
  setActiveTab("world");
  load().catch((err) => {
    setTilemapStatus(err.message, true);
    documentRef.getElementById("command-result").textContent = `Load error: ${err.message}`;
  });
  initVoiceControls();
}
