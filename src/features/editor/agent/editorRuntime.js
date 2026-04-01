/*
 * Agent editor runtime adapter.
 * Isolates agent-preview toggle behavior from global event bootstrap code.
 */

export function createAgentEditorRuntime(state, deps = {}) {
  const {
    renderWorld = () => {},
  } = deps;

  function setShowAgents(enabled) {
    state.editor.showAgents = Boolean(enabled);
    if (state.world) renderWorld(state.world);
  }

  return {
    setShowAgents,
  };
}
