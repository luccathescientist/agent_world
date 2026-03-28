import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts";
const DEFAULT_TTS_VOICE = "nova";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function resolveWorkspaceRoot() {
  const configured = (process.env.OPENCLAW_WORKSPACE || "").trim();
  const candidates = [
    configured,
    path.join(REPO_ROOT, "vendor", "openclaw"),
    path.join(path.dirname(REPO_ROOT), "openclaw"),
    path.join(process.env.HOME || "", "workspace", "openclaw"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

let cachedModules = null;

async function loadOpenClawModules() {
  if (cachedModules) return cachedModules;
  const workspaceRoot = await resolveWorkspaceRoot();
  if (!workspaceRoot) {
    throw new Error("OPENCLAW_WORKSPACE is not configured and no fallback checkout was found");
  }
  const importFromWorkspace = async (relativePath) =>
    import(pathToFileURL(path.join(workspaceRoot, relativePath)).href);
  const [
    configModule,
    authModule,
    mediaModule,
    ttsModule,
  ] = await Promise.all([
    importFromWorkspace("src/config/io.ts"),
    importFromWorkspace("src/agents/model-auth.ts"),
    importFromWorkspace("src/media-understanding/index.ts"),
    importFromWorkspace("src/tts/tts.ts"),
  ]);
  cachedModules = {
    workspaceRoot,
    loadConfig: configModule.loadConfig,
    resolveApiKeyForProvider: authModule.resolveApiKeyForProvider,
    applyMediaUnderstanding: mediaModule.applyMediaUnderstanding,
    OPENAI_TTS_VOICES: ttsModule.OPENAI_TTS_VOICES,
    resolveTtsApiKey: ttsModule.resolveTtsApiKey,
    resolveTtsConfig: ttsModule.resolveTtsConfig,
    textToSpeech: ttsModule.textToSpeech,
  };
  return cachedModules;
}

async function readJsonStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function cloneConfig(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

async function statusAction() {
  const {
    loadConfig,
    resolveApiKeyForProvider,
    OPENAI_TTS_VOICES,
    resolveTtsApiKey,
    resolveTtsConfig,
  } = await loadOpenClawModules();
  const cfg = loadConfig();
  let transcribeConfigured = false;
  let transcribeReason = null;
  try {
    await resolveApiKeyForProvider({ provider: "openai", cfg });
    transcribeConfigured = true;
  } catch (error) {
    transcribeReason = error?.message || String(error);
  }

  const ttsConfig = resolveTtsConfig(cfg);
  const speechConfigured = Boolean(resolveTtsApiKey(ttsConfig, "openai"));
  writeJson({
    ok: true,
    provider: "openclaw",
    upstreamProvider: "openai",
    configured: transcribeConfigured && speechConfigured,
    transcribeConfigured,
    speechConfigured,
    transcribeReason,
    transcribeModel: DEFAULT_TRANSCRIBE_MODEL,
    speechModel: DEFAULT_TTS_MODEL,
    defaultVoice: DEFAULT_TTS_VOICE,
    voices: OPENAI_TTS_VOICES,
    speechFormat: "mp3",
  });
}

async function transcribeAction(payload) {
  const { loadConfig, applyMediaUnderstanding } = await loadOpenClawModules();
  const filePath = String(payload?.filePath || "").trim();
  const mimeType = String(payload?.mimeType || "audio/webm").trim();
  const model = String(payload?.model || DEFAULT_TRANSCRIBE_MODEL).trim();
  if (!filePath) throw new Error("filePath is required");

  const cfg = cloneConfig(loadConfig());
  cfg.tools = cfg.tools || {};
  cfg.tools.media = cfg.tools.media || {};
  cfg.tools.media.audio = {
    ...(cfg.tools.media.audio || {}),
    enabled: true,
    models: [{ provider: "openai", model }],
  };

  const ctx = {
    Body: "<media:audio>",
    MediaPath: filePath,
    MediaType: mimeType,
  };
  const result = await applyMediaUnderstanding({ ctx, cfg });
  const transcript = String(ctx.Transcript || ctx.CommandBody || "").trim();
  if (!result.appliedAudio || !transcript) {
    throw new Error("OpenClaw did not produce an audio transcript");
  }
  writeJson({
    ok: true,
    provider: "openclaw",
    upstreamProvider: "openai",
    model,
    text: transcript,
  });
}

async function speechAction(payload) {
  const { loadConfig, textToSpeech } = await loadOpenClawModules();
  const text = String(payload?.text || "").trim();
  const voice = String(payload?.voice || DEFAULT_TTS_VOICE).trim();
  const model = String(payload?.model || DEFAULT_TTS_MODEL).trim();
  if (!text) throw new Error("text is required");

  const cfg = cloneConfig(loadConfig());
  cfg.messages = cfg.messages || {};
  cfg.messages.tts = {
    ...(cfg.messages.tts || {}),
    provider: "openai",
    openai: {
      ...(cfg.messages.tts?.openai || {}),
      model,
      voice,
    },
  };

  const result = await textToSpeech({
    text,
    cfg,
    overrides: {
      provider: "openai",
      openai: { model, voice },
    },
  });
  if (!result.success || !result.audioPath) {
    throw new Error(result.error || "OpenClaw TTS failed");
  }

  const audio = await fs.readFile(result.audioPath);
  writeJson({
    ok: true,
    provider: "openclaw",
    upstreamProvider: "openai",
    model,
    voice,
    outputFormat: result.outputFormat || "mp3",
    audioBase64: audio.toString("base64"),
  });
}

async function main() {
  const payload = await readJsonStdin();
  const action = String(payload?.action || "").trim();
  if (action === "status") {
    await statusAction();
    return;
  }
  if (action === "transcribe") {
    await transcribeAction(payload);
    return;
  }
  if (action === "speech") {
    await speechAction(payload);
    return;
  }
  throw new Error(`Unknown action: ${action || "<empty>"}`);
}

main().catch((error) => {
  writeJson({
    ok: false,
    error: error?.message || String(error),
  });
  process.exitCode = 1;
});
