/*
 * Small app-shell UI helpers.
 * This file owns lightweight app-level DOM updates such as tabs, selectors,
 * status labels, and world-detail visibility toggles.
 */
export function setTilemapStatus(text, isError = false, deps = {}) {
  const { documentRef = document } = deps;
  const el = documentRef.getElementById("tilemap-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "var(--warning)" : "";
}

export function syncWorldDetailVisibility(state, deps = {}) {
  const { documentRef = document } = deps;
  const open = state.activeTab === "world" && Boolean(state.selectedAgentId);
  documentRef.body.classList.toggle("world-detail-open", open);
}

export function populateAgentSelect(state, agents, deps = {}) {
  const { documentRef = document } = deps;
  const select = documentRef.getElementById("agent-select");
  if (!select) return;
  const options = [`<option value="">Select agent</option>`];
  for (const agent of agents || []) {
    const selected = agent.id === state.selectedAgentId ? " selected" : "";
    options.push(`<option value="${agent.id}"${selected}>${agent.name || agent.id}</option>`);
  }
  select.innerHTML = options.join("");
}

export function populateRegionIdSelect(state, select, deps = {}) {
  const { defaultAnchorTiles = {} } = deps;
  if (!select) return;
  const ids = [
    ...Object.keys(defaultAnchorTiles),
    ...state.roomRegions.map((region) => region.id),
  ].filter((value, index, list) => value && list.indexOf(value) === index);
  select.innerHTML = [`<option value="">Select room</option>`, ...ids.map((id) => `<option value="${id}">${id}</option>`)].join("");
  select.value = state.editor.regionId || "";
}

export function setActiveTab(state, tabName, deps = {}) {
  const {
    documentRef = document,
    drawRoom = () => {},
    mountRendererView = () => {},
    renderEditorSubviews = () => {},
    renderSettingsSummary = () => {},
    renderVisualEditor = () => {},
    renderWorld = () => {},
    resizeRendererViewport = () => {},
    syncWorldDetailVisibility = () => {},
  } = deps;

  if (tabName === "editor") state.activeTab = "editor";
  else if (tabName === "settings") state.activeTab = "settings";
  else state.activeTab = "world";

  for (const button of documentRef.querySelectorAll(".tab-btn")) {
    button.classList.toggle("active", button.dataset.tab === state.activeTab);
  }
  for (const panel of documentRef.querySelectorAll(".tab-panel")) {
    panel.classList.toggle("active", panel.dataset.panel === state.activeTab);
  }
  if (state.activeTab !== "settings") {
    mountRendererView();
    resizeRendererViewport();
  }
  syncWorldDetailVisibility();
  if (state.activeTab !== "settings") {
    if (state.renderer) drawRoom(state.renderer);
    if (state.world) renderWorld(state.world);
    renderEditorSubviews();
    renderVisualEditor();
  } else {
    renderSettingsSummary();
  }
}
