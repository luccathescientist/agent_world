/*
 * Live world renderer helpers.
 * This module owns viewport sizing, scene offset syncing, agent ticking, and
 * world-state rendering on top of the PIXI scene and sprite layers.
 */
export function mountRendererView(state, helpers = {}) {
  const {
    documentRef = document,
    syncRendererCanvasSize = () => {},
  } = helpers;
  if (!state.renderer?.pixiApp?.view) return;
  const targetId = state.activeTab === "editor"
    ? (state.editor.activeSubview === "room-mapping" ? "editor-room-world-canvas" : "editor-world-canvas")
    : "world-canvas";
  const host = documentRef.getElementById(targetId);
  if (!host) return;
  if (state.renderer.pixiApp.view.parentElement !== host) {
    host.appendChild(state.renderer.pixiApp.view);
  }
  syncRendererCanvasSize();
}

export function syncSceneOffset(state, helpers = {}) {
  const { getSceneTopPadding = () => 0 } = helpers;
  if (!state.renderer) return;
  const offsetY = getSceneTopPadding();
  for (const layerName of ["floorLayer", "wallLayer", "depthLayer", "overlayLayer", "interactionLayer", "labelLayer", "agentLabelLayer", "bubbleLayer"]) {
    if (state.renderer[layerName]) state.renderer[layerName].y = offsetY;
  }
  if (state.renderer.backgroundLayer) state.renderer.backgroundLayer.y = 0;
}

export function resizeRendererViewport(state, helpers = {}) {
  const {
    getRenderHeight = () => 0,
    getWorldWidth = () => 0,
    syncRendererCanvasSize = () => {},
    syncSceneOffset = () => {},
  } = helpers;
  if (!state.renderer?.pixiApp?.renderer) return;
  state.renderer.pixiApp.renderer.resize(getWorldWidth(), getRenderHeight());
  syncSceneOffset();
  syncRendererCanvasSize();
}

export function syncRendererCanvasSize(state, helpers = {}) {
  const {
    getRenderHeight = () => 0,
    getWorldWidth = () => 0,
  } = helpers;
  const view = state.renderer?.pixiApp?.view;
  if (!view) return;
  if (state.activeTab === "editor" && !["tilemap", "room-mapping"].includes(state.editor.activeSubview || "tilemap")) {
    view.style.width = `${Math.round(getWorldWidth() * state.editor.zoom)}px`;
    view.style.height = `${Math.round(getRenderHeight() * state.editor.zoom)}px`;
    return;
  }
  view.style.width = "100%";
  view.style.height = "auto";
}

export function tickAgents(state, delta, helpers = {}) {
  const {
    applyPathing = () => null,
    chooseDisplayFrames = () => [],
    positionAgentLabel = () => {},
    positionBubble = () => {},
    shouldMirrorSpriteForFacing = () => false,
    updateActivityCue = () => {},
    updateAgentLabel = () => {},
  } = helpers;
  if (!state.renderer) return;
  for (const sprite of state.renderer.agents.values()) {
    const agent = sprite._agent;
    if (!agent) continue;
    let remaining = 2.9 * delta;
    let moving = false;
    while (remaining > 0.001) {
      const pathing = applyPathing(sprite, agent);
      const dx = pathing.target.x - sprite.x;
      const dy = pathing.target.y - sprite.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0.001) {
        sprite._state.currentTile = pathing.nextTile;
        if (sprite._state.path?.length > 1) {
          sprite._state.path = sprite._state.path.slice(1);
          continue;
        }
        break;
      }
      moving = true;
      if (Math.abs(dx) > Math.abs(dy)) sprite._state.facing = dx >= 0 ? "right" : "left";
      else sprite._state.facing = dy >= 0 ? "down" : "up";
      if (distance <= remaining) {
        sprite.x = pathing.target.x;
        sprite.y = pathing.target.y;
        remaining -= distance;
        sprite._state.currentTile = pathing.nextTile;
        if (sprite._state.path?.length > 1) {
          sprite._state.path = sprite._state.path.slice(1);
          continue;
        }
        break;
      }
      sprite.x += (dx / distance) * remaining;
      sprite.y += (dy / distance) * remaining;
      remaining = 0;
    }
    positionBubble(sprite);
    positionAgentLabel(sprite);
    sprite.zIndex = sprite.y;
    state.renderer.depthLayer.sortDirty = true;
    const frames = chooseDisplayFrames(state.renderer, agent, moving);
    const current = sprite._anim.textures || [];
    const changed = current.length !== frames.length || current.some((t, i) => t !== frames[i]);
    if (changed) {
      sprite._anim.textures = frames;
      sprite._anim.gotoAndPlay(0);
    }
    updateActivityCue(sprite, agent, moving);
    sprite._anim.scale.set(shouldMirrorSpriteForFacing(state.renderer, agent, sprite._state.facing) ? -1.72 : 1.72, 1.72);
    sprite._anim.tint = agent.runtimeStatus === "offline" ? 0xc3bfd1 : agent.runtimeStatus === "blocked" ? 0xffc0ba : 0xffffff;
    updateAgentLabel(sprite, sprite.agentId === state.selectedAgentId);
  }
}

export function renderWorld(state, worldState, helpers = {}) {
  const {
    bubblePaletteForAgent = () => null,
    createAgentSprite = () => null,
    createBenchmarkSprite = () => null,
    populateAgentSelect = () => {},
    setText = () => {},
    shouldShowAgentSprite = () => true,
    showStashItem = () => {},
    syncSelectedAgentDetailFromWorld = () => {},
    updateActivityCue = () => {},
    updateAgentLabel = () => {},
    updateBubble = () => {},
  } = helpers;
  state.world = worldState;
  setText("room-name", worldState.room?.name || "Agent World");
  setText("server-time", helpers.formatDate ? helpers.formatDate(worldState.serverTime) : worldState.serverTime);
  const totalAgents = worldState.agents?.length || 0;
  const visibleAgents = (worldState.agents || []).filter((agent) => shouldShowAgentSprite(agent)).length;
  const hiddenAgents = Math.max(0, totalAgents - visibleAgents);
  setText("agent-count", hiddenAgents
    ? `${visibleAgents}/${totalAgents} visible · ${hiddenAgents} inactive`
    : `${totalAgents} agent${totalAgents === 1 ? "" : "s"}`);
  populateAgentSelect(worldState.agents || []);
  if (!state.renderer || !worldState.agents) return;
  const { depthLayer, agents } = state.renderer;
  const liveIds = new Set();
  for (const agent of worldState.agents) {
    liveIds.add(agent.id);
    let sprite = agents.get(agent.id);
    if (!sprite) {
      sprite = (helpers.isBenchmarkAgent?.(agent) ? createBenchmarkSprite(agent) : createAgentSprite(agent));
      agents.set(agent.id, sprite);
      depthLayer.addChild(sprite);
    }
    sprite._agent = agent;
    sprite._bubblePalette = bubblePaletteForAgent(agent);
    const visibleInWorld = shouldShowAgentSprite(agent);
    const visible = visibleInWorld && !(state.activeTab === "editor" && !state.editor.showAgents);
    sprite.visible = visible;
    if (sprite._bubbleWrap) sprite._bubbleWrap.visible = visible;
    if (sprite._labelWrap) sprite._labelWrap.visible = visible;
    sprite.interactive = visible && state.activeTab !== "editor";
    sprite.buttonMode = visible && state.activeTab !== "editor";
    sprite.cursor = visible && state.activeTab !== "editor" ? "pointer" : "default";
    if (sprite._bubble) updateBubble(sprite, agent.currentAction);
    if (sprite._label) {
      sprite._label.text = sprite._kind === "benchmark"
        ? agent.name.replace(/^bench-/, "").slice(0, 18)
        : agent.name;
      updateAgentLabel(sprite, agent.id === state.selectedAgentId);
    }
    updateActivityCue(sprite, agent, false);
    sprite._selection.clear();
    if (agent.id === state.selectedAgentId) {
      sprite._selection.lineStyle(4, 0x76d0a8, 1);
      sprite._selection.drawCircle(0, -38, 28);
    }
    sprite.scale.set(agent.runtimeStatus === "active" ? 1 : 0.94);
    sprite.alpha = agent.runtimeStatus === "offline" ? 0.76 : 1;
    sprite.zIndex = sprite.y;
  }
  for (const [id, sprite] of agents.entries()) {
    if (liveIds.has(id)) continue;
    if (sprite._bubbleWrap?.parent) sprite._bubbleWrap.parent.removeChild(sprite._bubbleWrap);
    if (sprite._labelWrap?.parent) sprite._labelWrap.parent.removeChild(sprite._labelWrap);
    depthLayer.removeChild(sprite);
    agents.delete(id);
  }
  depthLayer.sortDirty = true;
  syncSelectedAgentDetailFromWorld(worldState);
}
