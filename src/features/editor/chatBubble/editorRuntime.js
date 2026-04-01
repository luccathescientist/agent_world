/*
 * Chat-bubble editor runtime adapter.
 * Isolates chat-bubble action handling and guarded mutations from global
 * event/bootstrap code.
 */

export function createChatBubbleEditorRuntime(state, deps = {}) {
  const {
    assignChatBubbleTile = () => {},
    renderVisualEditor = () => {},
    resetChatBubbleFrame = () => {},
    selectedChatBubbleTheme = () => null,
    setChatBubbleTextColor = () => {},
    setTilemapStatus = () => {},
  } = deps;

  function runAction(action) {
    try {
      action();
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  }

  function normalizeRole(rawRole) {
    return ["assistant", "tool", "user"].includes(rawRole) ? rawRole : "assistant";
  }

  function syncLayerFromSelectedSlot() {
    const frame = selectedChatBubbleTheme()?.frame?.[state.editor.selectedChatBubbleSlot || "mm"] || null;
    if (frame?.layer && ["floor", "wall"].includes(frame.layer)) {
      state.editor.selectedLayer = frame.layer;
    }
  }

  function assignTile() {
    runAction(assignChatBubbleTile);
  }

  function resetFrame() {
    runAction(resetChatBubbleFrame);
  }

  function setRole(role) {
    state.editor.selectedChatBubbleRole = normalizeRole(role);
    syncLayerFromSelectedSlot();
    renderVisualEditor();
  }

  function setRoleAndSlot(role, slot) {
    state.editor.selectedChatBubbleRole = normalizeRole(role);
    state.editor.selectedChatBubbleSlot = slot || "mm";
    syncLayerFromSelectedSlot();
    renderVisualEditor();
  }

  function setTextColor(color) {
    setChatBubbleTextColor(color);
  }

  return {
    assignTile,
    resetFrame,
    setRole,
    setRoleAndSlot,
    setTextColor,
  };
}
