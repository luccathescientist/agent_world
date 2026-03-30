/*
 * Voice-controller helpers.
 * This module owns microphone capture, transcript/debug rendering, device
 * refresh, and speech playback helpers for the voice UI.
 */
import { TILEMAP_STORAGE_KEYS } from "../../core/constants.js";

export async function fetchVoiceConfig(state, helpers = {}) {
  const {
    getJson = async () => ({}),
    pushVoiceEvent = () => {},
    updateVoiceUi = () => {},
  } = helpers;
  try {
    const config = await getJson("/api/agent-world/voice/config");
    state.voice.backendConfigured = !!config?.configured;
    state.voice.backendProvider = config?.provider || "openai";
    state.voice.transcribeModel = config?.transcribeModel || "gpt-4o-mini-transcribe";
    state.voice.speechModel = config?.speechModel || "gpt-4o-mini-tts";
    state.voice.speechVoice = config?.defaultVoice || "nova";
    state.voice.speechFormat = config?.speechFormat || "mp3";
    if (state.voice.backendConfigured) {
      state.voice.mode = "openai";
      pushVoiceEvent(`Voice backend ready via ${state.voice.backendProvider}.`);
    } else {
      pushVoiceEvent("Voice backend unavailable. Falling back to browser voice APIs.");
    }
  } catch (error) {
    pushVoiceEvent(`Voice backend config failed: ${error?.message || String(error)}`);
  }
  updateVoiceUi();
}

export function pushVoiceEvent(state, message, helpers = {}) {
  const { setVoiceDebugText = () => {} } = helpers;
  const stamp = new Date().toLocaleTimeString();
  state.voice.events = [`[${stamp}] ${message}`, ...state.voice.events].slice(0, 8);
  setVoiceDebugText("voice-events", state.voice.events.join("\n") || "No voice events yet.");
}

export function normalizeSpeechText(text) {
  return String(text || "")
    .replace(/`+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function renderVoiceTranscriptDebug(state, helpers = {}) {
  const {
    normalizeSpeechText = (value) => value,
    setVoiceDebugText = () => {},
  } = helpers;
  const finalText = normalizeSpeechText(state.voice.transcriptBuffer);
  const interimText = normalizeSpeechText(state.voice.interimTranscript);
  if (!finalText && !interimText) {
    setVoiceDebugText("voice-transcript", "No transcript yet.");
    return;
  }
  const lines = [];
  if (finalText) lines.push(`Final: ${finalText}`);
  if (interimText) lines.push(`Interim: ${interimText}`);
  setVoiceDebugText("voice-transcript", lines.join("\n"));
}

export function renderVoiceDebugUi(state, helpers = {}) {
  const {
    documentRef = document,
    renderVoiceTranscriptDebug = () => {},
    setVoiceDebugText = () => {},
  } = helpers;
  setVoiceDebugText("voice-support", state.voice.supportSummary || "Checking...");
  setVoiceDebugText("voice-recognition-state", state.voice.recognitionState || "idle");
  setVoiceDebugText("voice-error", state.voice.lastError || "None");
  const levelFill = documentRef.getElementById("voice-level-fill");
  if (levelFill) levelFill.style.width = `${Math.max(0, Math.min(100, Math.round(state.voice.micLevel * 100)))}%`;
  setVoiceDebugText(
    "voice-level-text",
    state.voice.micStream
      ? `Live input level: ${Math.round(state.voice.micLevel * 100)}%${state.voice.currentInputLabel ? ` via ${state.voice.currentInputLabel}` : ""}`
      : "No mic capture yet.",
  );
  const spokenSummary = state.voice.lastSpokenText
    ? `${state.voice.lastSpokenSource ? `[${state.voice.lastSpokenSource}] ` : ""}${state.voice.lastSpokenText}`
    : "Nothing queued for speech.";
  setVoiceDebugText("voice-spoken-text", spokenSummary);
  renderVoiceTranscriptDebug();
  setVoiceDebugText("voice-events", state.voice.events.join("\n") || "No voice events yet.");
}

export function updateVoiceUi(state, helpers = {}) {
  const {
    documentRef = document,
    renderVoiceDebugUi = () => {},
  } = helpers;
  const toggle = documentRef.getElementById("voice-toggle");
  const stop = documentRef.getElementById("voice-stop");
  const speakCurrent = documentRef.getElementById("voice-speak-current");
  const autoSend = documentRef.getElementById("voice-auto-send");
  const speakReplies = documentRef.getElementById("voice-speak-replies");
  const inputSelect = documentRef.getElementById("voice-input-select");
  if (toggle) {
    toggle.disabled = !(state.voice.recordingSupported || state.voice.supported);
    if (state.voice.isTranscribing) toggle.textContent = "Transcribing...";
    else toggle.textContent = state.voice.listening ? "Recording..." : "Start Mic";
  }
  if (stop) stop.disabled = !(state.voice.listening || state.voice.isSpeaking);
  if (speakCurrent) speakCurrent.disabled = !(state.voice.backendConfigured || state.voice.ttsSupported);
  if (autoSend) autoSend.checked = !!state.voice.autoSend;
  if (speakReplies) speakReplies.checked = !!state.voice.speakReplies;
  if (inputSelect) {
    const options = ['<option value="">System Default</option>'];
    for (const device of state.voice.inputDevices) {
      const selected = device.deviceId === state.voice.selectedInputDeviceId ? " selected" : "";
      options.push(`<option value="${device.deviceId}"${selected}>${device.label || "Unnamed input"}</option>`);
    }
    inputSelect.innerHTML = options.join("");
    inputSelect.value = state.voice.selectedInputDeviceId || "";
    inputSelect.disabled = !state.voice.meterSupported;
  }
  renderVoiceDebugUi();
}

export function appendVoiceTranscript(text, helpers = {}) {
  const { documentRef = document } = helpers;
  const input = documentRef.getElementById("command-input");
  if (!input) return;
  const nextText = String(text || "").trim();
  if (!nextText) return;
  input.value = input.value.trim() ? `${input.value.trim()} ${nextText}` : nextText;
}

export function stopSpeechPlayback(state, helpers = {}) {
  const {
    URLRef = URL,
    windowRef = window,
  } = helpers;
  if ("speechSynthesis" in windowRef) windowRef.speechSynthesis.cancel();
  if (state.voice.audioPlayer) {
    state.voice.audioPlayer.pause();
    state.voice.audioPlayer.src = "";
    state.voice.audioPlayer = null;
  }
  if (state.voice.audioObjectUrl) {
    URLRef.revokeObjectURL(state.voice.audioObjectUrl);
    state.voice.audioObjectUrl = "";
  }
  state.voice.isSpeaking = false;
}

export async function speakText(state, text, source = "manual", helpers = {}) {
  const {
    AudioCtor = Audio,
    fetchRef = fetch,
    normalizeSpeechText = (value) => value,
    pushVoiceEvent = () => {},
    renderVoiceDebugUi = () => {},
    setVoiceStatus = () => {},
    stopSpeechPlayback = () => {},
    updateVoiceUi = () => {},
    URLRef = URL,
    windowRef = window,
  } = helpers;
  const spoken = normalizeSpeechText(text);
  if (!spoken) {
    pushVoiceEvent("Speech synthesis skipped because no text was available.");
    setVoiceStatus("Nothing to speak yet.", true);
    return;
  }
  stopSpeechPlayback();
  state.voice.lastSpokenText = spoken;
  state.voice.lastSpokenSource = source;
  state.voice.lastError = "";
  if (state.voice.backendConfigured && state.selectedAgentId) {
    try {
      pushVoiceEvent(`OpenAI speech queued from ${source}.`);
      state.voice.isSpeaking = true;
      state.voice.recognitionState = state.voice.listening ? "recording + speaking" : "speaking";
      updateVoiceUi();
      setVoiceStatus("Generating speech...");
      const response = await fetchRef(`/api/agent-world/agents/${encodeURIComponent(state.selectedAgentId)}/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: spoken,
          voice: state.voice.speechVoice,
          model: state.voice.speechModel,
          format: state.voice.speechFormat,
        }),
      });
      if (!response.ok) throw new Error(`speech request failed: ${response.status}`);
      const audioBlob = await response.blob();
      const audioUrl = URLRef.createObjectURL(audioBlob);
      state.voice.audioObjectUrl = audioUrl;
      const audio = new AudioCtor(audioUrl);
      state.voice.audioPlayer = audio;
      audio.onplay = () => {
        state.voice.isSpeaking = true;
        state.voice.recognitionState = state.voice.listening ? "recording + speaking" : "speaking";
        pushVoiceEvent(`OpenAI speech started from ${source}.`);
        updateVoiceUi();
        setVoiceStatus("Speaking selected message.");
      };
      audio.onended = () => {
        stopSpeechPlayback();
        state.voice.recognitionState = state.voice.listening ? "recording" : "idle";
        pushVoiceEvent(`OpenAI speech finished from ${source}.`);
        updateVoiceUi();
        setVoiceStatus(state.voice.listening ? "Recording..." : "Voice idle.");
      };
      audio.onerror = () => {
        stopSpeechPlayback();
        state.voice.lastError = "OpenAI speech playback failed.";
        state.voice.recognitionState = state.voice.listening ? "recording" : "idle";
        pushVoiceEvent(`OpenAI speech failed from ${source}.`);
        updateVoiceUi();
        setVoiceStatus("Speech playback failed.", true);
      };
      await audio.play();
      renderVoiceDebugUi();
      return;
    } catch (error) {
      state.voice.lastError = error?.message || String(error);
      pushVoiceEvent(`OpenAI speech failed, falling back to browser TTS: ${state.voice.lastError}`);
      stopSpeechPlayback();
      updateVoiceUi();
    }
  }

  if (!state.voice.ttsSupported) {
    state.voice.lastError = "Speech synthesis is not supported in this browser.";
    pushVoiceEvent("Speech synthesis unavailable.");
    renderVoiceDebugUi();
    setVoiceStatus("Speech playback is not supported in this browser.", true);
    return;
  }

  pushVoiceEvent(`Speech synthesis queued from ${source}.`);
  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onstart = () => {
    state.voice.isSpeaking = true;
    state.voice.recognitionState = state.voice.listening ? "recording + speaking" : "speaking";
    pushVoiceEvent(`Speech synthesis started from ${source}.`);
    updateVoiceUi();
    setVoiceStatus("Speaking selected message.");
  };
  utterance.onend = () => {
    stopSpeechPlayback();
    state.voice.recognitionState = state.voice.listening ? "recording" : "idle";
    pushVoiceEvent(`Speech synthesis finished from ${source}.`);
    updateVoiceUi();
    setVoiceStatus(state.voice.listening ? "Recording..." : "Voice idle.");
  };
  utterance.onerror = () => {
    stopSpeechPlayback();
    state.voice.lastError = "Speech playback failed.";
    state.voice.recognitionState = state.voice.listening ? "recording" : "idle";
    pushVoiceEvent(`Speech synthesis failed from ${source}.`);
    updateVoiceUi();
    setVoiceStatus("Speech playback failed.", true);
  };
  windowRef.speechSynthesis.speak(utterance);
  renderVoiceDebugUi();
}

export function maybeSpeakReply(state, history, helpers = {}) {
  const {
    historyRoleClass = () => "",
    normalizeSpeechText = (value) => value,
    speakText = () => {},
  } = helpers;
  if (!state.voice.speakReplies || !("speechSynthesis" in window)) return;
  const latestAssistant = [...(history || [])].reverse().find((event) => historyRoleClass(event.type) === "assistant");
  if (!latestAssistant) return;
  const spokenText = normalizeSpeechText(latestAssistant.fullLabel || latestAssistant.label || latestAssistant.fullDetail || latestAssistant.detail);
  if (!spokenText) return;
  if (latestAssistant.type === "tool_started" || latestAssistant.type === "tool_finished") return;
  if (spokenText === "NO_REPLY" || spokenText.startsWith("HEARTBEAT_OK")) return;
  const signature = `${latestAssistant.id || ""}:${latestAssistant.ts || ""}:${spokenText}`;
  if (signature === state.voice.lastSpokenSignature) return;
  if (state.voice.spokenReplySignatures.includes(signature)) return;
  state.voice.lastSpokenSignature = signature;
  state.voice.spokenReplySignatures = [...state.voice.spokenReplySignatures, signature].slice(-40);
  speakText(spokenText, "agent-reply");
}

export function stopMicMeter(state, helpers = {}) {
  const {
    cancelAnimationFrameRef = cancelAnimationFrame,
    renderVoiceDebugUi = () => {},
  } = helpers;
  if (state.voice.meterFrame) {
    cancelAnimationFrameRef(state.voice.meterFrame);
    state.voice.meterFrame = 0;
  }
  if (state.voice.audioContext) {
    state.voice.audioContext.close().catch(() => {});
    state.voice.audioContext = null;
  }
  if (state.voice.micStream) {
    for (const track of state.voice.micStream.getTracks()) track.stop();
    state.voice.micStream = null;
  }
  state.voice.analyser = null;
  state.voice.analyserData = null;
  state.voice.micLevel = 0;
  state.voice.currentInputLabel = "";
  renderVoiceDebugUi();
}

export async function transcribeRecordedAudio(state, blob, helpers = {}) {
  const {
    FormDataCtor = FormData,
    documentRef = document,
    fetchRef = fetch,
    normalizeSpeechText = (value) => value,
    pushVoiceEvent = () => {},
    renderVoiceDebugUi = () => {},
    sendCommandText = async () => false,
    setVoiceStatus = () => {},
    stopMicMeter = () => {},
    updateVoiceUi = () => {},
  } = helpers;
  if (!blob || !state.selectedAgentId) return;
  state.voice.isTranscribing = true;
  state.voice.recognitionState = "transcribing";
  state.voice.lastError = "";
  updateVoiceUi();
  setVoiceStatus("Uploading audio for transcription...");
  try {
    const form = new FormDataCtor();
    form.append("file", blob, `voice.${state.voice.recordingMimeType.includes("ogg") ? "ogg" : "webm"}`);
    form.append("model", state.voice.transcribeModel);
    const response = await fetchRef(`/api/agent-world/agents/${encodeURIComponent(state.selectedAgentId)}/voice/transcribe`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      let detail = `transcription failed: ${response.status}`;
      try {
        const payload = await response.json();
        detail = payload?.detail?.reason || payload?.detail?.detail || detail;
      } catch {}
      throw new Error(detail);
    }
    const payload = await response.json();
    const transcript = normalizeSpeechText(payload?.text || "");
    state.voice.transcriptBuffer = transcript;
    state.voice.interimTranscript = "";
    pushVoiceEvent("OpenAI transcription completed.");
    renderVoiceDebugUi();
    if (transcript) {
      const input = documentRef.getElementById("command-input");
      if (input) input.value = transcript;
    }
    if (state.voice.autoSend && transcript) {
      setVoiceStatus("Sending transcript...");
      const sent = await sendCommandText(transcript);
      if (sent) {
        const input = documentRef.getElementById("command-input");
        if (input) input.value = "";
        state.voice.transcriptBuffer = "";
        renderVoiceDebugUi();
        setVoiceStatus("Transcript sent.");
      }
    } else {
      setVoiceStatus(transcript ? "Transcript captured." : "No speech detected.");
    }
  } catch (error) {
    state.voice.lastError = error?.message || String(error);
    pushVoiceEvent(`OpenAI transcription failed: ${state.voice.lastError}`);
    setVoiceStatus(`Voice transcription failed: ${state.voice.lastError}`, true);
  } finally {
    state.voice.isTranscribing = false;
    state.voice.listening = false;
    state.voice.recognitionState = state.voice.isSpeaking ? "speaking" : "idle";
    stopMicMeter();
    updateVoiceUi();
  }
}

export async function refreshVoiceInputDevices(state, helpers = {}) {
  const {
    navigatorRef = navigator,
    pushVoiceEvent = () => {},
    setStoredMap = () => {},
    updateVoiceUi = () => {},
  } = helpers;
  if (!navigatorRef.mediaDevices?.enumerateDevices) return;
  try {
    const devices = await navigatorRef.mediaDevices.enumerateDevices();
    state.voice.inputDevices = devices
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Audio Input ${index + 1}`,
      }));
    if (state.voice.selectedInputDeviceId && !state.voice.inputDevices.some((device) => device.deviceId === state.voice.selectedInputDeviceId)) {
      state.voice.selectedInputDeviceId = "";
      setStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, "");
    }
    updateVoiceUi();
  } catch (error) {
    pushVoiceEvent(`Input device scan failed: ${error?.message || String(error)}`);
  }
}

export function startMicMeterLoop(state, helpers = {}) {
  const {
    renderVoiceDebugUi = () => {},
    requestAnimationFrameRef = requestAnimationFrame,
    startMicMeterLoop = () => {},
  } = helpers;
  const analyser = state.voice.analyser;
  const data = state.voice.analyserData;
  if (!analyser || !data) return;
  analyser.getByteTimeDomainData(data);
  let peak = 0;
  let sumSquares = 0;
  for (let index = 0; index < data.length; index += 1) {
    const normalized = Math.abs((data[index] - 128) / 128);
    sumSquares += normalized * normalized;
    if (normalized > peak) peak = normalized;
  }
  const rms = Math.sqrt(sumSquares / data.length);
  const boostedLevel = Math.max(peak * 3.5, rms * 9);
  state.voice.micLevel = Math.max(state.voice.micLevel * 0.72, Math.min(1, boostedLevel));
  renderVoiceDebugUi();
  state.voice.meterFrame = requestAnimationFrameRef(startMicMeterLoop);
}

export async function ensureMicMeter(state, helpers = {}) {
  const {
    navigatorRef = navigator,
    pushVoiceEvent = () => {},
    refreshVoiceInputDevices = async () => {},
    setStoredMap = () => {},
    setVoiceStatus = () => {},
    startMicMeterLoop = () => {},
    updateVoiceUi = () => {},
    windowRef = window,
  } = helpers;
  if (state.voice.micStream && state.voice.audioContext && state.voice.analyser) return true;
  if (!state.voice.meterSupported) {
    pushVoiceEvent("Microphone meter unavailable in this browser.");
    return false;
  }
  try {
    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };
    if (state.voice.selectedInputDeviceId) {
      audioConstraints.deviceId = { exact: state.voice.selectedInputDeviceId };
    }
    const stream = await navigatorRef.mediaDevices.getUserMedia({
      audio: audioConstraints,
    });
    const AudioContextCtor = windowRef.AudioContext || windowRef.webkitAudioContext;
    const audioContext = new AudioContextCtor();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    state.voice.micStream = stream;
    state.voice.audioContext = audioContext;
    state.voice.analyser = analyser;
    state.voice.analyserData = new Uint8Array(analyser.frequencyBinCount);
    const activeTrack = stream.getAudioTracks()[0];
    const activeSettings = activeTrack?.getSettings?.() || {};
    const activeDeviceId = activeSettings.deviceId || "";
    const matchedDevice = state.voice.inputDevices.find((device) => device.deviceId === activeDeviceId);
    state.voice.currentInputLabel = matchedDevice?.label || activeTrack?.label || "";
    if (activeDeviceId && activeDeviceId !== state.voice.selectedInputDeviceId) {
      state.voice.selectedInputDeviceId = activeDeviceId;
      setStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, activeDeviceId);
    }
    pushVoiceEvent("Microphone meter connected.");
    if (state.voice.currentInputLabel) pushVoiceEvent(`Active input: ${state.voice.currentInputLabel}`);
    await refreshVoiceInputDevices();
    startMicMeterLoop();
    return true;
  } catch (error) {
    state.voice.lastError = error?.message || String(error);
    pushVoiceEvent(`Microphone meter failed: ${state.voice.lastError}`);
    updateVoiceUi();
    setVoiceStatus(`Microphone access failed: ${state.voice.lastError}`, true);
    return false;
  }
}

export function stopVoiceCapture(state, helpers = {}) {
  const {
    pushVoiceEvent = () => {},
    setVoiceStatus = () => {},
    stopMicMeter = () => {},
    stopSpeechPlayback = () => {},
    updateVoiceUi = () => {},
  } = helpers;
  if (state.voice.isSpeaking) {
    stopSpeechPlayback();
    state.voice.recognitionState = state.voice.listening ? "recording" : "idle";
    updateVoiceUi();
    setVoiceStatus(state.voice.listening ? "Recording..." : "Voice idle.");
  }
  if (state.voice.mediaRecorder && state.voice.mediaRecorder.state !== "inactive") {
    try {
      pushVoiceEvent("Recording stop requested.");
      state.voice.mediaRecorder.stop();
    } catch (error) {
      state.voice.lastError = error?.message || String(error);
      pushVoiceEvent(`Recording stop failed: ${state.voice.lastError}`);
      stopMicMeter();
      updateVoiceUi();
      setVoiceStatus(`Voice stop failed: ${state.voice.lastError}`, true);
    }
    return;
  }
  if (state.voice.recognition && state.voice.listening) {
    try {
      pushVoiceEvent("Stop requested.");
      state.voice.recognition.stop();
    } catch (error) {
      state.voice.lastError = error?.message || String(error);
      pushVoiceEvent(`Stop failed: ${state.voice.lastError}`);
      updateVoiceUi();
      setVoiceStatus(`Voice stop failed: ${state.voice.lastError}`, true);
    }
  }
}

export async function startVoiceCapture(state, helpers = {}) {
  const {
    MediaRecorderCtor = MediaRecorder,
    ensureMicMeter = async () => false,
    pushVoiceEvent = () => {},
    renderVoiceDebugUi = () => {},
    setVoiceStatus = () => {},
    stopMicMeter = () => {},
    transcribeRecordedAudio = async () => {},
    updateVoiceUi = () => {},
    windowRef = window,
  } = helpers;
  if (!state.selectedAgentId) {
    setVoiceStatus("Select an agent before starting voice mode.", true);
    return;
  }
  if (state.voice.backendConfigured && state.voice.recordingSupported) {
    state.voice.transcriptBuffer = "";
    state.voice.interimTranscript = "";
    state.voice.lastError = "";
    renderVoiceDebugUi();
    const ready = await ensureMicMeter();
    if (!ready || !state.voice.micStream) return;
    try {
      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ];
      const mimeType = preferredMimeTypes.find((candidate) => windowRef.MediaRecorder?.isTypeSupported?.(candidate)) || "";
      state.voice.recordingMimeType = mimeType || "audio/webm";
      state.voice.recordedChunks = [];
      const recorder = mimeType ? new MediaRecorderCtor(state.voice.micStream, { mimeType }) : new MediaRecorderCtor(state.voice.micStream);
      state.voice.mediaRecorder = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) state.voice.recordedChunks.push(event.data);
      };
      recorder.onstart = () => {
        state.voice.listening = true;
        state.voice.recognitionState = "recording";
        pushVoiceEvent("Recording started.");
        updateVoiceUi();
        setVoiceStatus("Recording voice...");
      };
      recorder.onerror = (event) => {
        state.voice.lastError = event?.error?.message || "recording error";
        state.voice.listening = false;
        pushVoiceEvent(`Recording error: ${state.voice.lastError}`);
        stopMicMeter();
        updateVoiceUi();
        setVoiceStatus(`Voice input error: ${state.voice.lastError}`, true);
      };
      recorder.onstop = async () => {
        const blob = new Blob(state.voice.recordedChunks, {
          type: state.voice.recordingMimeType || "audio/webm",
        });
        state.voice.mediaRecorder = null;
        state.voice.recordedChunks = [];
        pushVoiceEvent("Recording stopped.");
        if (blob.size > 0) await transcribeRecordedAudio(blob);
        else {
          state.voice.listening = false;
          stopMicMeter();
          updateVoiceUi();
          setVoiceStatus("No audio captured.", true);
        }
      };
      recorder.start();
      return;
    } catch (error) {
      state.voice.lastError = error?.message || String(error);
      pushVoiceEvent(`Recording start failed: ${state.voice.lastError}`);
      stopMicMeter();
      updateVoiceUi();
      setVoiceStatus(`Voice start failed: ${state.voice.lastError}`, true);
      return;
    }
  }

  if (!state.voice.recognition) {
    pushVoiceEvent("Start requested but recognition is unavailable.");
    setVoiceStatus("Speech recognition is not available in this browser.", true);
    return;
  }
  state.voice.transcriptBuffer = "";
  state.voice.interimTranscript = "";
  state.voice.lastError = "";
  renderVoiceDebugUi();
  await ensureMicMeter();
  try {
    pushVoiceEvent("Recognition start requested.");
    state.voice.recognition.start();
  } catch (error) {
    state.voice.lastError = error?.message || String(error);
    state.voice.recognitionState = "start failed";
    pushVoiceEvent(`Recognition start failed: ${state.voice.lastError}`);
    updateVoiceUi();
    setVoiceStatus(`Voice start failed: ${state.voice.lastError}`, true);
  }
}

export function initVoiceControls(state, helpers = {}) {
  const {
    documentRef = document,
    fetchVoiceConfig = () => {},
    getStoredMap = () => "",
    navigatorRef = navigator,
    pushVoiceEvent = () => {},
    refreshVoiceInputDevices = () => {},
    renderVoiceDebugUi = () => {},
    sendCommandText = async () => false,
    setVoiceStatus = () => {},
    stopMicMeter = () => {},
    updateVoiceUi = () => {},
    windowRef = window,
  } = helpers;
  const RecognitionCtor = windowRef.SpeechRecognition || windowRef.webkitSpeechRecognition;
  const AudioContextCtor = windowRef.AudioContext || windowRef.webkitAudioContext;
  state.voice.recordingSupported = !!(navigatorRef.mediaDevices?.getUserMedia && windowRef.MediaRecorder);
  state.voice.ttsSupported = "speechSynthesis" in windowRef;
  state.voice.supported = typeof RecognitionCtor === "function";
  state.voice.meterSupported = !!(navigatorRef.mediaDevices?.getUserMedia && AudioContextCtor);
  const browserHints = [];
  if (!windowRef.isSecureContext) browserHints.push("not a secure context");
  if (!state.voice.supported) browserHints.push("speech recognition API missing");
  if (!state.voice.ttsSupported) browserHints.push("speech synthesis API missing");
  if (!state.voice.meterSupported) browserHints.push("mic meter API missing");
  if (!state.voice.recordingSupported) browserHints.push("media recorder API missing");
  state.voice.supportSummary = [
    state.voice.recordingSupported ? "recording available" : "recording unavailable",
    state.voice.supported ? "recognition available" : "recognition unavailable",
    state.voice.meterSupported ? "mic meter available" : "mic meter unavailable",
    state.voice.ttsSupported ? "speech output available" : "speech output unavailable",
    windowRef.isSecureContext ? "secure context" : "insecure context",
    ...browserHints,
  ].join(" | ");
  state.voice.selectedInputDeviceId = getStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, "");
  pushVoiceEvent("Voice controls initialized.");
  updateVoiceUi();
  refreshVoiceInputDevices();
  fetchVoiceConfig();
  if (!state.voice.recordingSupported && !state.voice.supported) {
    setVoiceStatus("Voice input is unavailable here. Try a Chromium-based browser.", true);
    return;
  }
  if (!state.voice.supported) {
    setVoiceStatus(state.voice.backendConfigured ? "OpenAI voice recording ready." : "Voice input is unavailable here. Try a Chromium-based browser.", !state.voice.backendConfigured);
    return;
  }
  const recognition = new RecognitionCtor();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  state.voice.recognition = recognition;

  recognition.onstart = () => {
    state.voice.listening = true;
    state.voice.recognitionState = "listening";
    state.voice.draftBeforeListening = documentRef.getElementById("command-input")?.value.trim() || "";
    state.voice.lastError = "";
    pushVoiceEvent("Recognition started.");
    updateVoiceUi();
    setVoiceStatus("Listening for speech...");
  };
  recognition.onend = async () => {
    state.voice.listening = false;
    state.voice.recognitionState = "idle";
    state.voice.interimTranscript = "";
    stopMicMeter();
    pushVoiceEvent("Recognition ended.");
    updateVoiceUi();
    const finalDraft = normalizeSpeechText(`${state.voice.draftBeforeListening} ${state.voice.transcriptBuffer}`);
    if (finalDraft) {
      const input = documentRef.getElementById("command-input");
      if (input) input.value = finalDraft;
    }
    if (state.voice.autoSend && finalDraft) {
      setVoiceStatus("Sending transcript...");
      const sent = await sendCommandText(finalDraft);
      if (sent) {
        const input = documentRef.getElementById("command-input");
        if (input) input.value = "";
        state.voice.transcriptBuffer = "";
        state.voice.draftBeforeListening = "";
        state.voice.interimTranscript = "";
        pushVoiceEvent("Transcript auto-sent.");
        renderVoiceDebugUi();
        setVoiceStatus("Transcript sent.");
        return;
      }
    }
    setVoiceStatus("Voice idle.");
  };
  recognition.onerror = (event) => {
    state.voice.listening = false;
    state.voice.recognitionState = `error: ${event.error || "unknown"}`;
    state.voice.lastError = event.error || "unknown";
    stopMicMeter();
    pushVoiceEvent(`Recognition error: ${state.voice.lastError}`);
    updateVoiceUi();
    setVoiceStatus(`Voice input error: ${event.error || "unknown"}.`, true);
  };
  recognition.onresult = async (event) => {
    let finalTranscript = "";
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result?.[0]?.transcript || "";
      if (result.isFinal) finalTranscript += `${transcript} `;
      else interimTranscript += `${transcript} `;
    }
    const combined = normalizeSpeechText(`${state.voice.transcriptBuffer} ${finalTranscript}`);
    if (combined) state.voice.transcriptBuffer = combined;
    state.voice.interimTranscript = normalizeSpeechText(interimTranscript);
    const preview = normalizeSpeechText(`${state.voice.draftBeforeListening} ${combined} ${interimTranscript}`);
    if (preview) {
      const input = documentRef.getElementById("command-input");
      if (input) input.value = preview;
    }
    pushVoiceEvent(finalTranscript.trim() ? "Recognition produced final transcript." : "Recognition produced interim transcript.");
    renderVoiceDebugUi();
    if (finalTranscript.trim()) {
      setVoiceStatus(state.voice.autoSend ? "Transcript captured. Sending..." : "Transcript captured.");
    }
  };
  recognition.onaudiostart = () => {
    state.voice.recognitionState = "hearing audio";
    pushVoiceEvent("Audio capture started.");
    updateVoiceUi();
  };
  recognition.onsoundstart = () => {
    state.voice.recognitionState = "sound detected";
    pushVoiceEvent("Sound detected.");
    updateVoiceUi();
  };
  recognition.onspeechstart = () => {
    state.voice.recognitionState = "speech detected";
    pushVoiceEvent("Speech detected.");
    updateVoiceUi();
  };
  recognition.onspeechend = () => {
    pushVoiceEvent("Speech ended.");
    updateVoiceUi();
  };
  recognition.onaudioend = () => {
    pushVoiceEvent("Audio capture ended.");
    updateVoiceUi();
  };
}
