/*
 * Agent editor view helpers.
 * Keeps agent preview panel synchronization separate from mixed visual editor
 * rendering.
 */

export function renderAgentEditorView(state, helpers = {}) {
  const {
    documentRef = globalThis.document,
    renderAgentEditorPanel = () => {},
  } = helpers;
  const showAgentsToggle = documentRef.getElementById("toggle-editor-agents");
  if (showAgentsToggle) showAgentsToggle.checked = state.editor.showAgents;
  renderAgentEditorPanel();
}
