/*
 * Shared editor subtab helpers.
 * This module owns subview normalization, subtab click wiring, and shell-level
 * visibility/title updates for the editor mode switcher.
 */

export const EDITOR_SUBVIEWS = Object.freeze(["tilemap", "room-mapping", "chat-bubble", "agent"]);

export function normalizeEditorSubviewName(viewName) {
  return EDITOR_SUBVIEWS.includes(viewName) ? viewName : "tilemap";
}

export function editorSubviewLabel(viewName) {
  if (viewName === "chat-bubble") return "Chat Bubble";
  if (viewName === "agent") return "Agent";
  if (viewName === "room-mapping") return "Room Mapping";
  return "Tilemap";
}

export function editorPreviewTitle(viewName) {
  if (viewName === "chat-bubble") return "Chat Bubble Preview";
  if (viewName === "agent") return "Agent Sprite Preview";
  if (viewName === "room-mapping") return "Room Mapping Preview";
  return "Tilemap Preview";
}

export function renderEditorSubviewShell(state, helpers = {}) {
  const {
    documentRef = document,
    setText = () => {},
  } = helpers;
  const currentView = normalizeEditorSubviewName(state.editor.activeSubview || "tilemap");
  const visualToolTitle = documentRef.getElementById("visual-tool-title");
  const previewTitle = documentRef.getElementById("editor-preview-title");

  for (const button of documentRef.querySelectorAll(".editor-subtab-btn")) {
    button.classList.toggle("active", button.dataset.editorView === currentView);
  }
  for (const panel of documentRef.querySelectorAll(".editor-subview")) {
    const views = String(panel.dataset.editorViews || "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean);
    panel.classList.toggle("active", views.includes(currentView));
  }
  for (const panel of documentRef.querySelectorAll(".editor-preview-mode")) {
    panel.classList.toggle("active", panel.dataset.editorPreview === currentView);
  }
  for (const section of documentRef.querySelectorAll("[data-editor-only]")) {
    section.hidden = section.dataset.editorOnly !== currentView;
  }
  if (currentView === "chat-bubble" && !["floor", "wall"].includes(state.editor.selectedLayer)) {
    state.editor.selectedLayer = "wall";
  }
  for (const button of documentRef.querySelectorAll("#visual-layer-toggle [data-layer]")) {
    const layer = button.dataset.layer || "";
    const allowed = currentView !== "chat-bubble" || layer === "floor" || layer === "wall";
    button.hidden = !allowed;
  }
  if (visualToolTitle) {
    visualToolTitle.textContent = currentView === "chat-bubble" ? "Bubble Tile Palette" : "Tile Palette";
  }
  if (previewTitle) {
    previewTitle.textContent = editorPreviewTitle(currentView);
  }
  setText("editor-subview-pill", editorSubviewLabel(currentView));
}

export function bindEditorSubviewTabEvents(deps = {}) {
  const {
    documentRef = document,
    setActiveEditorSubview = () => {},
  } = deps;
  for (const button of documentRef.querySelectorAll(".editor-subtab-btn")) {
    button.addEventListener("click", () => setActiveEditorSubview(button.dataset.editorView || "tilemap"));
  }
}
