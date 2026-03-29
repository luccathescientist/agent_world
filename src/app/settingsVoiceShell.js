export function setVoiceStatus(text, isError = false, deps = {}) {
  const { documentRef = document } = deps;
  const el = documentRef.getElementById("voice-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "var(--warning)" : "var(--muted)";
}

export function setVoiceDebugText(id, value, deps = {}) {
  const { documentRef = document } = deps;
  const el = documentRef.getElementById(id);
  if (el) el.textContent = value;
}

export function setSettingsResult(text, isError = false, deps = {}) {
  const { documentRef = document } = deps;
  const el = documentRef.getElementById("settings-result");
  if (!el) return;
  el.textContent = text || "";
  el.style.color = isError ? "var(--warning)" : "var(--muted)";
}

export function applyRuntimeStatusTone(id, state, deps = {}) {
  const { documentRef = document } = deps;
  const el = documentRef.getElementById(id);
  if (!el) return;
  if (state === "online") el.style.color = "var(--accent)";
  else if (state === "partial") el.style.color = "#f6d673";
  else if (state === "offline") el.style.color = "var(--warning)";
  else el.style.color = "";
}

export function renderCodeWithLineNumbers(text, deps = {}) {
  const {
    escapeHtml = (value) => String(value),
    renderCodeWithLineNumbersHelper = (value) => value,
  } = deps;
  return renderCodeWithLineNumbersHelper(text, { escapeHtml });
}

export function renderSettingsChecks(state, deps = {}) {
  const {
    documentRef = document,
    escapeHtml = (value) => String(value),
    renderCodeWithLineNumbers = (value) => value,
    renderSettingsChecksHelper = () => {},
    setText = () => {},
  } = deps;
  return renderSettingsChecksHelper(state, {
    documentRef,
    escapeHtml,
    renderCodeWithLineNumbers,
    setText,
  });
}

export function syncSettingsJsonEditor(state, deps = {}) {
  const {
    documentRef = document,
    syncSettingsJsonEditorHelper = () => {},
  } = deps;
  return syncSettingsJsonEditorHelper(state, { documentRef });
}

export function syncSettingsForm(state, deps = {}) {
  const {
    documentRef = document,
    syncSettingsFormHelper = () => {},
  } = deps;
  return syncSettingsFormHelper(state, { documentRef });
}

export function renderSettingsSummary(state, deps = {}) {
  const {
    applyRuntimeStatusTone = () => {},
    renderSettingsChecks = () => {},
    renderSettingsSummaryHelper = () => {},
    setText = () => {},
  } = deps;
  return renderSettingsSummaryHelper(state, {
    applyRuntimeStatusTone,
    renderSettingsChecks,
    setText,
  });
}

export function collectSettingsPayload(deps = {}) {
  const {
    collectSettingsPayloadHelper = () => ({}),
    documentRef = document,
  } = deps;
  return collectSettingsPayloadHelper({ documentRef });
}

export async function fetchSettingsData(state, deps = {}) {
  const {
    fetchDiagnostics = async () => ({}),
    fetchSettings = async () => ({}),
    fetchSettingsDataHelper = async () => {},
    renderSettingsSummary = () => {},
    setSettingsResult = () => {},
    syncSettingsForm = () => {},
    syncSettingsJsonEditor = () => {},
  } = deps;
  return fetchSettingsDataHelper(state, {
    fetchDiagnostics,
    fetchSettings,
    renderSettingsSummary,
    setSettingsResult,
    syncSettingsForm,
    syncSettingsJsonEditor,
  });
}

export async function saveSettings(state, deps = {}) {
  const {
    collectSettingsPayload = () => ({}),
    fetchSettingsData = async () => {},
    fetchVoiceConfig = async () => {},
    postSettings = async () => ({}),
    renderSettingsSummary = () => {},
    saveSettingsHelper = async () => {},
    setSettingsResult = () => {},
  } = deps;
  return saveSettingsHelper(state, {
    collectSettingsPayload,
    fetchSettingsData,
    fetchVoiceConfig,
    postSettings,
    renderSettingsSummary,
    setSettingsResult,
  });
}

export async function saveSettingsFromJsonEditor(state, deps = {}) {
  const {
    documentRef = document,
    fetchSettingsData = async () => {},
    fetchVoiceConfig = async () => {},
    postSettings = async () => ({}),
    renderSettingsSummary = () => {},
    saveSettingsFromJsonEditorHelper = async () => {},
    setSettingsResult = () => {},
    syncSettingsForm = () => {},
    syncSettingsJsonEditor = () => {},
  } = deps;
  return saveSettingsFromJsonEditorHelper(state, {
    documentRef,
    fetchSettingsData,
    fetchVoiceConfig,
    postSettings,
    renderSettingsSummary,
    setSettingsResult,
    syncSettingsForm,
    syncSettingsJsonEditor,
  });
}

export async function fetchVoiceConfig(state, deps = {}) {
  const {
    fetchVoiceConfigHelper = async () => {},
    getJson = async () => ({}),
    pushVoiceEvent = () => {},
    updateVoiceUi = () => {},
  } = deps;
  return fetchVoiceConfigHelper(state, {
    getJson,
    pushVoiceEvent,
    updateVoiceUi,
  });
}

export function pushVoiceEvent(state, message, deps = {}) {
  const {
    pushVoiceEventHelper = () => {},
    setVoiceDebugText = () => {},
  } = deps;
  return pushVoiceEventHelper(state, message, { setVoiceDebugText });
}

export function renderVoiceTranscriptDebug(state, deps = {}) {
  const {
    normalizeSpeechText = (value) => value,
    renderVoiceTranscriptDebugHelper = () => {},
    setVoiceDebugText = () => {},
  } = deps;
  return renderVoiceTranscriptDebugHelper(state, {
    normalizeSpeechText,
    setVoiceDebugText,
  });
}

export function renderVoiceDebugUi(state, deps = {}) {
  const {
    documentRef = document,
    renderVoiceDebugUiHelper = () => {},
    renderVoiceTranscriptDebug = () => {},
    setVoiceDebugText = () => {},
  } = deps;
  return renderVoiceDebugUiHelper(state, {
    documentRef,
    renderVoiceTranscriptDebug,
    setVoiceDebugText,
  });
}

export function updateVoiceUi(state, deps = {}) {
  const {
    documentRef = document,
    renderVoiceDebugUi = () => {},
    updateVoiceUiHelper = () => {},
  } = deps;
  return updateVoiceUiHelper(state, {
    documentRef,
    renderVoiceDebugUi,
  });
}

export function appendVoiceTranscript(text, deps = {}) {
  const {
    appendVoiceTranscriptHelper = () => {},
    documentRef = document,
  } = deps;
  return appendVoiceTranscriptHelper(text, { documentRef });
}

export function stopSpeechPlayback(state, deps = {}) {
  const {
    stopSpeechPlaybackHelper = () => {},
    URLRef = URL,
    windowRef = window,
  } = deps;
  return stopSpeechPlaybackHelper(state, {
    URLRef,
    windowRef,
  });
}

export async function speakText(state, text, source = "manual", deps = {}) {
  const {
    AudioCtor,
    fetchRef = fetch,
    normalizeSpeechText = (value) => value,
    pushVoiceEvent = () => {},
    renderVoiceDebugUi = () => {},
    setVoiceStatus = () => {},
    speakTextHelper = async () => {},
    stopSpeechPlayback = () => {},
    updateVoiceUi = () => {},
    URLRef = URL,
    windowRef = window,
  } = deps;
  return speakTextHelper(state, text, source, {
    AudioCtor,
    fetchRef,
    normalizeSpeechText,
    pushVoiceEvent,
    renderVoiceDebugUi,
    setVoiceStatus,
    stopSpeechPlayback,
    updateVoiceUi,
    URLRef,
    windowRef,
  });
}

export function stopMicMeter(state, deps = {}) {
  const {
    cancelAnimationFrameRef,
    renderVoiceDebugUi = () => {},
    stopMicMeterHelper = () => {},
  } = deps;
  return stopMicMeterHelper(state, {
    cancelAnimationFrameRef,
    renderVoiceDebugUi,
  });
}

export async function transcribeRecordedAudio(state, blob, deps = {}) {
  const {
    documentRef = document,
    fetchRef = fetch,
    FormDataCtor = FormData,
    normalizeSpeechText = (value) => value,
    pushVoiceEvent = () => {},
    renderVoiceDebugUi = () => {},
    sendCommandText = async () => false,
    setVoiceStatus = () => {},
    stopMicMeter = () => {},
    transcribeRecordedAudioHelper = async () => {},
    updateVoiceUi = () => {},
  } = deps;
  return transcribeRecordedAudioHelper(state, blob, {
    FormDataCtor,
    documentRef,
    fetchRef,
    normalizeSpeechText,
    pushVoiceEvent,
    renderVoiceDebugUi,
    sendCommandText,
    setVoiceStatus,
    stopMicMeter,
    updateVoiceUi,
  });
}

export async function refreshVoiceInputDevices(state, deps = {}) {
  const {
    navigatorRef = navigator,
    pushVoiceEvent = () => {},
    refreshVoiceInputDevicesHelper = async () => {},
    setStoredMap = () => {},
    updateVoiceUi = () => {},
  } = deps;
  return refreshVoiceInputDevicesHelper(state, {
    navigatorRef,
    pushVoiceEvent,
    setStoredMap,
    updateVoiceUi,
  });
}

export function startMicMeterLoop(state, deps = {}) {
  const {
    renderVoiceDebugUi = () => {},
    requestAnimationFrameRef,
    startMicMeterLoop = () => {},
    startMicMeterLoopHelper = () => {},
  } = deps;
  return startMicMeterLoopHelper(state, {
    renderVoiceDebugUi,
    requestAnimationFrameRef,
    startMicMeterLoop,
  });
}

export async function ensureMicMeter(state, deps = {}) {
  const {
    navigatorRef = navigator,
    pushVoiceEvent = () => {},
    refreshVoiceInputDevices = async () => {},
    ensureMicMeterHelper = async () => {},
    setStoredMap = () => {},
    setVoiceStatus = () => {},
    startMicMeterLoop = () => {},
    updateVoiceUi = () => {},
    windowRef = window,
  } = deps;
  return ensureMicMeterHelper(state, {
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

export function stopVoiceCapture(state, deps = {}) {
  const {
    pushVoiceEvent = () => {},
    setVoiceStatus = () => {},
    stopMicMeter = () => {},
    stopSpeechPlayback = () => {},
    stopVoiceCaptureHelper = () => {},
    updateVoiceUi = () => {},
  } = deps;
  return stopVoiceCaptureHelper(state, {
    pushVoiceEvent,
    setVoiceStatus,
    stopMicMeter,
    stopSpeechPlayback,
    updateVoiceUi,
  });
}

export async function startVoiceCapture(state, deps = {}) {
  const {
    ensureMicMeter = async () => {},
    MediaRecorderCtor,
    pushVoiceEvent = () => {},
    renderVoiceDebugUi = () => {},
    setVoiceStatus = () => {},
    startVoiceCaptureHelper = async () => {},
    stopMicMeter = () => {},
    transcribeRecordedAudio = async () => {},
    updateVoiceUi = () => {},
    windowRef = window,
  } = deps;
  return startVoiceCaptureHelper(state, {
    MediaRecorderCtor,
    ensureMicMeter,
    pushVoiceEvent,
    renderVoiceDebugUi,
    setVoiceStatus,
    stopMicMeter,
    transcribeRecordedAudio,
    updateVoiceUi,
    windowRef,
  });
}

export function initVoiceControls(state, deps = {}) {
  const {
    documentRef = document,
    fetchVoiceConfig = async () => {},
    getStoredMap = () => "",
    initVoiceControlsHelper = () => {},
    navigatorRef = navigator,
    pushVoiceEvent = () => {},
    refreshVoiceInputDevices = async () => {},
    renderVoiceDebugUi = () => {},
    sendCommandText = async () => false,
    setVoiceStatus = () => {},
    stopMicMeter = () => {},
    updateVoiceUi = () => {},
    windowRef = window,
  } = deps;
  return initVoiceControlsHelper(state, {
    documentRef,
    fetchVoiceConfig,
    getStoredMap,
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
