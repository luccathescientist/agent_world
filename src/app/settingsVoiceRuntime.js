import { setText as setTextDefault } from "../core/dom.js";
import { escapeHtml as escapeHtmlDefault, formatTime as formatTimeDefault } from "../core/format.js";
import { getJson as getJsonDefault, postJson as postJsonDefault } from "../core/http.js";
import { getStoredMap as getStoredMapDefault, setStoredMap as setStoredMapDefault } from "../core/storage.js";
import {
  collectSettingsPayload as collectSettingsPayloadHelperDefault,
  fetchSettingsData as fetchSettingsDataHelperDefault,
  renderCodeWithLineNumbers as renderCodeWithLineNumbersHelperDefault,
  renderSettingsChecks as renderSettingsChecksHelperDefault,
  renderSettingsSummary as renderSettingsSummaryHelperDefault,
  saveSettings as saveSettingsHelperDefault,
  saveSettingsFromJsonEditor as saveSettingsFromJsonEditorHelperDefault,
  syncSettingsForm as syncSettingsFormHelperDefault,
  syncSettingsJsonEditor as syncSettingsJsonEditorHelperDefault,
} from "../features/settings/settingsPanel.js";
import {
  appendVoiceTranscript as appendVoiceTranscriptHelperDefault,
  ensureMicMeter as ensureMicMeterHelperDefault,
  fetchVoiceConfig as fetchVoiceConfigHelperDefault,
  initVoiceControls as initVoiceControlsHelperDefault,
  normalizeSpeechText,
  pushVoiceEvent as pushVoiceEventHelperDefault,
  refreshVoiceInputDevices as refreshVoiceInputDevicesHelperDefault,
  renderVoiceDebugUi as renderVoiceDebugUiHelperDefault,
  renderVoiceTranscriptDebug as renderVoiceTranscriptDebugHelperDefault,
  speakText as speakTextHelperDefault,
  startMicMeterLoop as startMicMeterLoopHelperDefault,
  startVoiceCapture as startVoiceCaptureHelperDefault,
  stopMicMeter as stopMicMeterHelperDefault,
  stopSpeechPlayback as stopSpeechPlaybackHelperDefault,
  stopVoiceCapture as stopVoiceCaptureHelperDefault,
  transcribeRecordedAudio as transcribeRecordedAudioHelperDefault,
  updateVoiceUi as updateVoiceUiHelperDefault,
} from "../features/voice/voiceController.js";
import {
  appendVoiceTranscript as appendVoiceTranscriptShellDefault,
  applyRuntimeStatusTone as applyRuntimeStatusToneShellDefault,
  collectSettingsPayload as collectSettingsPayloadShellDefault,
  ensureMicMeter as ensureMicMeterShellDefault,
  fetchSettingsData as fetchSettingsDataShellDefault,
  fetchVoiceConfig as fetchVoiceConfigShellDefault,
  initVoiceControls as initVoiceControlsShellDefault,
  pushVoiceEvent as pushVoiceEventShellDefault,
  refreshVoiceInputDevices as refreshVoiceInputDevicesShellDefault,
  renderCodeWithLineNumbers as renderCodeWithLineNumbersShellDefault,
  renderSettingsChecks as renderSettingsChecksShellDefault,
  renderSettingsSummary as renderSettingsSummaryShellDefault,
  renderVoiceDebugUi as renderVoiceDebugUiShellDefault,
  renderVoiceTranscriptDebug as renderVoiceTranscriptDebugShellDefault,
  saveSettings as saveSettingsShellDefault,
  saveSettingsFromJsonEditor as saveSettingsFromJsonEditorShellDefault,
  setSettingsResult as setSettingsResultShellDefault,
  setVoiceDebugText as setVoiceDebugTextShellDefault,
  setVoiceStatus as setVoiceStatusShellDefault,
  speakText as speakTextShellDefault,
  startMicMeterLoop as startMicMeterLoopShellDefault,
  startVoiceCapture as startVoiceCaptureShellDefault,
  stopMicMeter as stopMicMeterShellDefault,
  stopSpeechPlayback as stopSpeechPlaybackShellDefault,
  stopVoiceCapture as stopVoiceCaptureShellDefault,
  syncSettingsForm as syncSettingsFormShellDefault,
  syncSettingsJsonEditor as syncSettingsJsonEditorShellDefault,
  transcribeRecordedAudio as transcribeRecordedAudioShellDefault,
  updateVoiceUi as updateVoiceUiShellDefault,
} from "./settingsVoiceShell.js";

export function createSettingsVoiceRuntime(state, deps = {}) {
  const {
    documentRef = globalThis.document,
    navigatorRef = globalThis.navigator,
    windowRef = globalThis.window,
    fetchRef = globalThis.fetch,
    AudioCtor = globalThis.Audio,
    MediaRecorderCtor = globalThis.MediaRecorder,
    FormDataCtor = globalThis.FormData,
    URLRef = globalThis.URL,
    requestAnimationFrameRef = globalThis.requestAnimationFrame,
    cancelAnimationFrameRef = globalThis.cancelAnimationFrame,
    load = async () => {},
    setText = setTextDefault,
    escapeHtml = escapeHtmlDefault,
    formatTime = formatTimeDefault,
    getJson = getJsonDefault,
    postJson = postJsonDefault,
    getStoredMap = getStoredMapDefault,
    setStoredMap = setStoredMapDefault,
    collectSettingsPayloadHelper = collectSettingsPayloadHelperDefault,
    fetchSettingsDataHelper = fetchSettingsDataHelperDefault,
    renderCodeWithLineNumbersHelper = renderCodeWithLineNumbersHelperDefault,
    renderSettingsChecksHelper = renderSettingsChecksHelperDefault,
    renderSettingsSummaryHelper = renderSettingsSummaryHelperDefault,
    saveSettingsHelper = saveSettingsHelperDefault,
    saveSettingsFromJsonEditorHelper = saveSettingsFromJsonEditorHelperDefault,
    syncSettingsFormHelper = syncSettingsFormHelperDefault,
    syncSettingsJsonEditorHelper = syncSettingsJsonEditorHelperDefault,
    appendVoiceTranscriptHelper = appendVoiceTranscriptHelperDefault,
    ensureMicMeterHelper = ensureMicMeterHelperDefault,
    fetchVoiceConfigHelper = fetchVoiceConfigHelperDefault,
    initVoiceControlsHelper = initVoiceControlsHelperDefault,
    pushVoiceEventHelper = pushVoiceEventHelperDefault,
    refreshVoiceInputDevicesHelper = refreshVoiceInputDevicesHelperDefault,
    renderVoiceDebugUiHelper = renderVoiceDebugUiHelperDefault,
    renderVoiceTranscriptDebugHelper = renderVoiceTranscriptDebugHelperDefault,
    speakTextHelper = speakTextHelperDefault,
    startMicMeterLoopHelper = startMicMeterLoopHelperDefault,
    startVoiceCaptureHelper = startVoiceCaptureHelperDefault,
    stopMicMeterHelper = stopMicMeterHelperDefault,
    stopSpeechPlaybackHelper = stopSpeechPlaybackHelperDefault,
    stopVoiceCaptureHelper = stopVoiceCaptureHelperDefault,
    transcribeRecordedAudioHelper = transcribeRecordedAudioHelperDefault,
    updateVoiceUiHelper = updateVoiceUiHelperDefault,
    appendVoiceTranscriptShell = appendVoiceTranscriptShellDefault,
    applyRuntimeStatusToneShell = applyRuntimeStatusToneShellDefault,
    collectSettingsPayloadShell = collectSettingsPayloadShellDefault,
    ensureMicMeterShell = ensureMicMeterShellDefault,
    fetchSettingsDataShell = fetchSettingsDataShellDefault,
    fetchVoiceConfigShell = fetchVoiceConfigShellDefault,
    initVoiceControlsShell = initVoiceControlsShellDefault,
    pushVoiceEventShell = pushVoiceEventShellDefault,
    refreshVoiceInputDevicesShell = refreshVoiceInputDevicesShellDefault,
    renderCodeWithLineNumbersShell = renderCodeWithLineNumbersShellDefault,
    renderSettingsChecksShell = renderSettingsChecksShellDefault,
    renderSettingsSummaryShell = renderSettingsSummaryShellDefault,
    renderVoiceDebugUiShell = renderVoiceDebugUiShellDefault,
    renderVoiceTranscriptDebugShell = renderVoiceTranscriptDebugShellDefault,
    saveSettingsShell = saveSettingsShellDefault,
    saveSettingsFromJsonEditorShell = saveSettingsFromJsonEditorShellDefault,
    setSettingsResultShell = setSettingsResultShellDefault,
    setVoiceDebugTextShell = setVoiceDebugTextShellDefault,
    setVoiceStatusShell = setVoiceStatusShellDefault,
    speakTextShell = speakTextShellDefault,
    startMicMeterLoopShell = startMicMeterLoopShellDefault,
    startVoiceCaptureShell = startVoiceCaptureShellDefault,
    stopMicMeterShell = stopMicMeterShellDefault,
    stopSpeechPlaybackShell = stopSpeechPlaybackShellDefault,
    stopVoiceCaptureShell = stopVoiceCaptureShellDefault,
    syncSettingsFormShell = syncSettingsFormShellDefault,
    syncSettingsJsonEditorShell = syncSettingsJsonEditorShellDefault,
    transcribeRecordedAudioShell = transcribeRecordedAudioShellDefault,
    updateVoiceUiShell = updateVoiceUiShellDefault,
  } = deps;

  const setVoiceStatus = (text, isError = false) => setVoiceStatusShell(text, isError, { documentRef });
  const setVoiceDebugText = (id, value) => setVoiceDebugTextShell(id, value, { documentRef });
  const setSettingsResult = (text, isError = false) => setSettingsResultShell(text, isError, { documentRef });
  const applyRuntimeStatusTone = (id, tone) => applyRuntimeStatusToneShell(id, tone, { documentRef });

  function renderCodeWithLineNumbers(text) {
    return renderCodeWithLineNumbersShell(text, {
      escapeHtml,
      renderCodeWithLineNumbersHelper,
    });
  }

  function renderSettingsChecks() {
    return renderSettingsChecksShell(state, {
      documentRef,
      escapeHtml,
      renderCodeWithLineNumbers,
      renderSettingsChecksHelper,
      setText,
    });
  }

  function syncSettingsJsonEditor() {
    return syncSettingsJsonEditorShell(state, {
      documentRef,
      syncSettingsJsonEditorHelper,
    });
  }

  function syncSettingsForm() {
    return syncSettingsFormShell(state, {
      documentRef,
      syncSettingsFormHelper,
    });
  }

  function renderSettingsSummary() {
    return renderSettingsSummaryShell(state, {
      applyRuntimeStatusTone,
      renderSettingsChecks,
      renderSettingsSummaryHelper,
      setText,
    });
  }

  function collectSettingsPayload() {
    return collectSettingsPayloadShell({
      collectSettingsPayloadHelper,
      documentRef,
    });
  }

  async function fetchSettingsData() {
    return fetchSettingsDataShell(state, {
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
    return saveSettingsShell(state, {
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
    return saveSettingsFromJsonEditorShell(state, {
      documentRef,
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
    return fetchVoiceConfigShell(state, {
      fetchVoiceConfigHelper,
      getJson,
      pushVoiceEvent,
      updateVoiceUi,
    });
  }

  function pushVoiceEvent(message) {
    return pushVoiceEventShell(state, message, {
      pushVoiceEventHelper,
      setVoiceDebugText,
    });
  }

  function renderVoiceTranscriptDebug() {
    return renderVoiceTranscriptDebugShell(state, {
      normalizeSpeechText,
      renderVoiceTranscriptDebugHelper,
      setVoiceDebugText,
    });
  }

  function renderVoiceDebugUi() {
    return renderVoiceDebugUiShell(state, {
      documentRef,
      renderVoiceDebugUiHelper,
      renderVoiceTranscriptDebug,
      setVoiceDebugText,
    });
  }

  function updateVoiceUi() {
    return updateVoiceUiShell(state, {
      documentRef,
      renderVoiceDebugUi,
      updateVoiceUiHelper,
    });
  }

  function appendVoiceTranscript(text) {
    return appendVoiceTranscriptShell(text, {
      appendVoiceTranscriptHelper,
      documentRef,
    });
  }

  function stopSpeechPlayback() {
    return stopSpeechPlaybackShell(state, {
      stopSpeechPlaybackHelper,
      URLRef,
      windowRef,
    });
  }

  async function speakText(text, source = "manual") {
    return speakTextShell(state, text, source, {
      AudioCtor,
      fetchRef,
      normalizeSpeechText,
      pushVoiceEvent,
      renderVoiceDebugUi,
      setVoiceStatus,
      speakTextHelper,
      stopSpeechPlayback,
      updateVoiceUi,
      URLRef,
      windowRef,
    });
  }

  async function sendCommandText(text) {
    const result = documentRef.getElementById("command-result");
    const commandText = String(text || "").trim();
    if (!commandText) return false;
    if (!state.selectedAgentId) {
      if (result) result.textContent = "No agent selected.";
      return false;
    }
    const response = await getJson(`/api/agent-world/agents/${encodeURIComponent(state.selectedAgentId)}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commandText, mode: "append", source: "ui" }),
    });
    if (result) {
      result.textContent = `${response.status === "accepted" ? "Sent" : "Rejected"} at ${formatTime(response.acceptedAt)}: ${response.echoedCommand}${response.reason ? ` (${response.reason})` : ""}`;
    }
    await load();
    return response.status === "accepted";
  }

  function stopMicMeter() {
    return stopMicMeterShell(state, {
      cancelAnimationFrameRef,
      renderVoiceDebugUi,
      stopMicMeterHelper,
    });
  }

  async function transcribeRecordedAudio(blob) {
    return transcribeRecordedAudioShell(state, blob, {
      FormDataCtor,
      documentRef,
      fetchRef,
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
    return refreshVoiceInputDevicesShell(state, {
      navigatorRef,
      pushVoiceEvent,
      refreshVoiceInputDevicesHelper,
      setStoredMap,
      updateVoiceUi,
    });
  }

  function startMicMeterLoop() {
    return startMicMeterLoopShell(state, {
      renderVoiceDebugUi,
      requestAnimationFrameRef,
      startMicMeterLoop,
      startMicMeterLoopHelper,
    });
  }

  async function ensureMicMeter() {
    return ensureMicMeterShell(state, {
      ensureMicMeterHelper,
      navigatorRef,
      pushVoiceEvent,
      refreshVoiceInputDevices,
      setStoredMap,
      setVoiceStatus,
      startMicMeterLoop,
      updateVoiceUi,
      windowRef,
    });
  }

  function stopVoiceCapture() {
    return stopVoiceCaptureShell(state, {
      pushVoiceEvent,
      setVoiceStatus,
      stopMicMeter,
      stopVoiceCaptureHelper,
      stopSpeechPlayback,
      updateVoiceUi,
    });
  }

  async function startVoiceCapture() {
    return startVoiceCaptureShell(state, {
      MediaRecorderCtor,
      ensureMicMeter,
      pushVoiceEvent,
      renderVoiceDebugUi,
      setVoiceStatus,
      startVoiceCaptureHelper,
      stopMicMeter,
      transcribeRecordedAudio,
      updateVoiceUi,
      windowRef,
    });
  }

  function initVoiceControls() {
    return initVoiceControlsShell(state, {
      documentRef,
      fetchVoiceConfig,
      getStoredMap,
      initVoiceControlsHelper,
      navigatorRef,
      pushVoiceEvent,
      refreshVoiceInputDevices,
      renderVoiceDebugUi,
      sendCommandText,
      setVoiceStatus,
      stopMicMeter,
      updateVoiceUi,
      windowRef,
    });
  }

  return {
    appendVoiceTranscript,
    applyRuntimeStatusTone,
    collectSettingsPayload,
    fetchSettingsData,
    fetchVoiceConfig,
    initVoiceControls,
    pushVoiceEvent,
    renderCodeWithLineNumbers,
    renderSettingsChecks,
    renderSettingsSummary,
    renderVoiceDebugUi,
    renderVoiceTranscriptDebug,
    saveSettings,
    saveSettingsFromJsonEditor,
    sendCommandText,
    setSettingsResult,
    setVoiceDebugText,
    setVoiceStatus,
    speakText,
    startMicMeterLoop,
    startVoiceCapture,
    stopMicMeter,
    stopSpeechPlayback,
    stopVoiceCapture,
    syncSettingsForm,
    syncSettingsJsonEditor,
    transcribeRecordedAudio,
    updateVoiceUi,
  };
}
