import { AGENT_BUBBLE_PALETTES, AGENT_INACTIVE_HIDE_MS } from "../../core/constants.js";

export function statusClass(runtimeStatus) {
  if (runtimeStatus === "blocked") return "blocked";
  if (runtimeStatus === "waiting_user") return "waiting";
  if (runtimeStatus === "offline") return "offline";
  return "active";
}

export function hashString(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function bubblePaletteForAgent(agent, deps = {}) {
  const { hashString = (value) => value.length } = deps;
  if (agent?.id === "lucca-main") return { fill: 0x111111, stroke: 0xf6e8bf, text: 0xf6ebc7 };
  const seed = `${agent?.id || "agent"}:${agent?.name || ""}`;
  return AGENT_BUBBLE_PALETTES[hashString(seed) % AGENT_BUBBLE_PALETTES.length];
}

export function isMainAgent(agent) {
  return agent?.id === "lucca-main";
}

export function parseTimestampMs(value) {
  if (!value || typeof value !== "string") return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export function isInactiveAgent(agent, nowMs = Date.now(), deps = {}) {
  const {
    isMainAgent = () => false,
    parseTimestampMs = () => 0,
  } = deps;
  if (!agent || isMainAgent(agent)) return false;
  if (agent.runtimeStatus === "active" || agent.runtimeStatus === "blocked" || agent.runtimeStatus === "waiting_user") {
    return false;
  }
  const updatedMs = parseTimestampMs(agent.lastUpdatedAt);
  return updatedMs > 0 && (nowMs - updatedMs) >= AGENT_INACTIVE_HIDE_MS;
}

export function shouldShowAgentSprite(agent, deps = {}) {
  const { isInactiveAgent = () => false } = deps;
  if (!agent) return true;
  return !isInactiveAgent(agent);
}

export function activityCue(agent, sprite, moving, deps = {}) {
  const { isIdleLikeAgent = () => false } = deps;
  if (moving) return "🚶";
  if (agent.visualState === "messaging") return "✉️";
  if (agent.visualState === "reading") return "📚";
  if (agent.visualState === "working" || agent.visualState === "writing") return "🛠️";
  if (agent.visualState === "blocked") return "⚠️";
  if (isIdleLikeAgent(agent)) return "😴";
  return "💭";
}

export function displayedLocationLabel(agent, deps = {}) {
  const {
    roomIdForAgent = () => "",
    roomLabelForAnchor = (value) => value,
  } = deps;
  const renderedRoomId = roomIdForAgent(agent);
  const renderedRoom = roomLabelForAnchor(renderedRoomId);
  const backendRoomId = agent.currentAnchor || agent.targetAnchor || renderedRoomId;
  const backendRoom = roomLabelForAnchor(backendRoomId);
  if (renderedRoomId !== backendRoomId) {
    return `${renderedRoom} (rendered)`;
  }
  return backendRoom;
}
