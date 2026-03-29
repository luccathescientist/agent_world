export function previewSpriteFrame(state, agent, helpers = {}) {
  const {
    previewSpriteFrameName = () => "idle_0",
    shouldMirrorPreviewSprite = () => false,
  } = helpers;
  const seed = agent?.spriteSeed || "lucca-default";
  const atlasMeta = state.renderer?.assets?.spriteAtlasMeta?.[seed];
  const atlasPath = state.renderer?.assets?.spriteAtlasPaths?.[seed];
  if (!atlasMeta || !atlasPath) return null;
  const frameName = previewSpriteFrameName(agent, atlasMeta.frames || {});
  const frame = atlasMeta.frames?.[frameName];
  if (!frame) return null;
  const sheetWidth = atlasMeta?.meta?.size?.w || Math.max(frame.x + frame.w, 1);
  const sheetHeight = atlasMeta?.meta?.size?.h || Math.max(frame.y + frame.h, 1);
  const mirrored = shouldMirrorPreviewSprite(agent, atlasMeta.frames || {});
  const scale = frame.h <= 40 ? 2.1 : 1.8;
  return {
    ...frame,
    atlasPath,
    sheetWidth,
    sheetHeight,
    scale,
    scaleX: mirrored ? -scale : scale,
  };
}

export function previewSpriteFrameName(agent, frames) {
  if (!frames || typeof frames !== "object") return "idle_0";
  if (agent?.visualState === "reading" && frames.read_0) return "read_0";
  if ((agent?.visualState === "working" || agent?.visualState === "writing" || agent?.visualState === "messaging") && frames.work_0) return "work_0";
  if (agent?.visualState === "blocked" && frames.shocked_0) return "shocked_0";
  if (frames.idle_down) return "idle_down";
  if (frames.idle_0) return "idle_0";
  return Object.keys(frames)[0] || "idle_0";
}

export function shouldMirrorPreviewSprite(agent, frames) {
  if (!frames) return false;
  if (frames.idle_side && !frames.idle_left) return true;
  return false;
}

export function renderAgentEditorPanel(state, helpers = {}) {
  const {
    documentRef = document,
    escapeHtml = (value) => value,
    previewSpriteFrame = () => null,
    setText = () => {},
    shouldShowAgentSprite = () => true,
  } = helpers;
  const agent = (state.world?.agents || []).find((item) => item.id === state.selectedAgentId) || state.detail?.agent || null;
  const previewList = documentRef.getElementById("agent-sprite-preview-list");
  setText("agent-editor-selected-id", state.selectedAgentId || "--");
  setText("agent-editor-name", agent?.name || "--");
  setText("agent-editor-model", agent?.model || "--");
  setText("agent-editor-status", agent?.runtimeStatus || agent?.status || "--");
  setText("agent-editor-anchor", agent?.targetAnchor || agent?.currentAnchor || "--");
  setText("agent-editor-action", agent?.currentAction || "--");
  setText("agent-editor-visual", agent?.visualState || "--");
  if (!previewList) return;
  const agents = (state.world?.agents || []).filter((item) => shouldShowAgentSprite(item));
  if (!agents.length) {
    previewList.innerHTML = '<div class="event-item empty">No renderable agents are currently available.</div>';
    return;
  }
  previewList.innerHTML = agents.map((item) => {
    const frame = previewSpriteFrame(item);
    if (!frame) {
      return `
        <article class="agent-sprite-preview-card">
          <div class="agent-sprite-preview-figure">
            <div class="agent-sprite-preview-copy">No sprite frame</div>
          </div>
          <div class="agent-sprite-preview-meta">
            <div class="agent-sprite-preview-name">${escapeHtml(item.name || item.id || "Agent")}</div>
            <div class="agent-sprite-preview-copy">${escapeHtml(item.visualState || "idle")} · ${escapeHtml(item.runtimeStatus || "--")}</div>
          </div>
        </article>
      `;
    }
    return `
      <article class="agent-sprite-preview-card">
        <div class="agent-sprite-preview-figure">
          <div
            class="agent-sprite-preview-sheet"
            style="
              width:${frame.w}px;
              height:${frame.h}px;
              background-image:url('${frame.atlasPath}');
              background-position:-${frame.x}px -${frame.y}px;
              background-size:${frame.sheetWidth}px ${frame.sheetHeight}px;
              transform:scale(${frame.scaleX}, ${frame.scale});
            "
            aria-hidden="true"
          ></div>
        </div>
        <div class="agent-sprite-preview-meta">
          <div class="agent-sprite-preview-name">${escapeHtml(item.name || item.id || "Agent")}</div>
          <div class="agent-sprite-preview-copy">${escapeHtml(item.visualState || "idle")} · ${escapeHtml(item.runtimeStatus || "--")}</div>
        </div>
      </article>
    `;
  }).join("");
}
