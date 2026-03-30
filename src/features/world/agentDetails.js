/*
 * Selected-agent detail and stream helpers.
 * This file keeps the inspector/detail state in sync with world snapshots and
 * owns agent-detail selection and SSE stream update flows.
 */
export function syncSelectedAgentDetailFromWorld(state, worldState, helpers = {}) {
  const { renderInspector = () => {} } = helpers;
  if (!state.selectedAgentId || !worldState?.agents?.length) return;
  const liveAgent = worldState.agents.find((agent) => agent.id === state.selectedAgentId);
  if (!liveAgent) return;
  if (!state.detail?.agent || state.detail.agent.id !== liveAgent.id) {
    renderInspector({ agent: liveAgent, session: state.detail?.session || {} });
    return;
  }
  state.detail = {
    ...state.detail,
    agent: {
      ...state.detail.agent,
      ...liveAgent,
    },
  };
  renderInspector(state.detail);
}

export function renderInspector(state, detailPayload, helpers = {}) {
  const {
    documentRef = document,
    displayedLocationLabel = (value) => value,
    formatDate = (value) => value,
    setText = () => {},
    showRichMessage = () => {},
    statusClass = () => "",
  } = helpers;
  const detail = detailPayload?.agent;
  const session = detailPayload?.session || {};
  state.detail = detailPayload;
  if (!detail) return;
  setText("selected-agent-id", detail.id);
  setText("agent-name", detail.name);
  setText("agent-model", detail.model);
  setText("agent-runtime-status", detail.runtimeStatus);
  setText("agent-location", displayedLocationLabel(detail));
  setText("agent-action", detail.currentActionFull || detail.currentAction);
  setText("agent-visual-state", detail.visualState);
  setText("agent-tool", detail.lastTool || "none");
  setText("agent-queue-depth", String(detail.queueDepth ?? 0));
  setText("agent-session-label", detail.sessionLabel || session.sessionKey || "--");
  setText("agent-last-channel", session.lastChannel || "--");
  setText("agent-waiting-reason", detail.waitingReason || "none");
  setText("agent-updated", formatDate(detail.lastUpdatedAt));
  const badge = documentRef.getElementById("agent-status-badge");
  badge.textContent = detail.runtimeStatus || "--";
  badge.className = `status-badge ${statusClass(detail.runtimeStatus)}`;
  if (!state.messageSelection.locked || state.messageSelection.kind === "current") {
    showRichMessage("current", `${detail.name} current action`, detail.currentActionFull || detail.currentAction);
  }
}

export function handleStreamSnapshot(payload, helpers = {}) {
  const {
    renderHistory = () => {},
    renderInspector = () => {},
    renderSchedule = () => {},
    renderStash = () => {},
    renderWorld = () => {},
  } = helpers;
  if (payload.world) renderWorld(payload.world);
  if (payload.detail?.ok) {
    renderInspector(payload.detail);
    renderHistory(payload.detail.history || []);
    renderSchedule(payload.detail);
    renderStash(payload.detail.stash || []);
    return;
  }
  if (payload.events?.events) renderHistory(payload.events.events);
}

export function connectStream(state, helpers = {}) {
  const {
    EventSourceCtor = EventSource,
    URLSearchParamsCtor = URLSearchParams,
    consoleRef = console,
    handleStreamSnapshot = () => {},
    setText = () => {},
  } = helpers;
  if (state.stream) {
    state.stream.close();
    state.stream = null;
  }
  const params = new URLSearchParamsCtor();
  if (state.selectedAgentId) params.set("agent_id", state.selectedAgentId);
  const stream = new EventSourceCtor(`/api/agent-world/stream?${params.toString()}`);
  stream.onmessage = (event) => {
    try {
      handleStreamSnapshot(JSON.parse(event.data));
    } catch (err) {
      consoleRef.error("stream parse error", err);
    }
  };
  stream.onerror = () => setText("command-result", "Live stream disconnected. Retrying...");
  state.stream = stream;
}

export async function selectAgent(state, agentId, helpers = {}) {
  const {
    connectStream = () => {},
    getJson = async () => ({}),
    renderHistory = () => {},
    renderInspector = () => {},
    renderSchedule = () => {},
    renderStash = () => {},
    renderWorld = () => {},
    setMessageSelection = () => {},
    syncWorldDetailVisibility = () => {},
  } = helpers;
  state.selectedAgentId = agentId;
  syncWorldDetailVisibility();
  setMessageSelection("current", "--", "Loading agent detail...", null, false);
  if (state.world) renderWorld(state.world);
  const detail = await getJson(`/api/agent-world/agents/${encodeURIComponent(agentId)}`);
  renderInspector(detail);
  renderHistory(detail.history || []);
  renderSchedule(detail);
  renderStash(detail.stash || []);
  connectStream();
}

export function closeWorldDetails(state, helpers = {}) {
  const {
    connectStream = () => {},
    documentRef = document,
    renderHistory = () => {},
    renderSchedule = () => {},
    renderStash = () => {},
    renderWorld = () => {},
    setText = () => {},
    syncWorldDetailVisibility = () => {},
  } = helpers;
  state.selectedAgentId = null;
  state.detail = null;
  syncWorldDetailVisibility();
  setText("agent-status-badge", "--");
  const badge = documentRef.getElementById("agent-status-badge");
  if (badge) badge.className = "status-badge";
  if (state.world) renderWorld(state.world);
  renderHistory([]);
  renderSchedule(null);
  renderStash([]);
  connectStream();
}
