export function setActiveEditorSubview(state, viewName, helpers = {}) {
  const {
    drawRoom = () => {},
    mountRendererView = () => {},
    renderEditorSubviews = () => {},
    renderVisualEditor = () => {},
    resizeRendererViewport = () => {},
  } = helpers;
  if (!["tilemap", "room-mapping", "chat-bubble", "agent"].includes(viewName)) viewName = "tilemap";
  state.editor.activeSubview = viewName;
  renderEditorSubviews();
  if (state.renderer && (viewName === "tilemap" || viewName === "room-mapping")) {
    mountRendererView();
    resizeRendererViewport();
    drawRoom(state.renderer);
  }
  renderVisualEditor();
}

export function renderEditorSubviews(state, helpers = {}) {
  const {
    documentRef = document,
    setText = () => {},
  } = helpers;
  const currentView = state.editor.activeSubview || "tilemap";
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
    previewTitle.textContent =
      currentView === "chat-bubble"
        ? "Chat Bubble Preview"
        : currentView === "agent"
          ? "Agent Sprite Preview"
          : currentView === "room-mapping"
            ? "Room Mapping Preview"
            : "Tilemap Preview";
  }
  setText(
    "editor-subview-pill",
    currentView === "chat-bubble"
      ? "Chat Bubble"
      : currentView === "agent"
        ? "Agent"
        : currentView === "room-mapping"
          ? "Room Mapping"
          : "Tilemap",
  );
}

export function syncEditorInputs(state, helpers = {}) {
  const {
    documentRef = document,
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    renderVisualEditor = () => {},
    setText = () => {},
    syncGameStateTextarea = () => {},
  } = helpers;
  const floorInput = documentRef.getElementById("floor-map-input");
  const wallInput = documentRef.getElementById("wall-map-input");
  const furnitureInput = documentRef.getElementById("furniture-map-input");
  const propInput = documentRef.getElementById("prop-map-input");
  if (floorInput && floorInput.value !== state.editor.draftFloorText) floorInput.value = state.editor.draftFloorText;
  if (wallInput && wallInput.value !== state.editor.draftWallText) wallInput.value = state.editor.draftWallText;
  if (furnitureInput && furnitureInput.value !== state.editor.draftFurnitureText) furnitureInput.value = state.editor.draftFurnitureText;
  if (propInput && propInput.value !== state.editor.draftPropText) propInput.value = state.editor.draftPropText;
  const tileCodes = Object.keys(state.tilemap?.manifest || {}).length;
  setText("tilemap-summary", `${getWorldCols()}x${getWorldRows()} grid · ${tileCodes} codes`);
  if (state.tilemap) {
    setText("tilemap-walkability", `${state.tilemap.walkableTiles} walkable · ${state.tilemap.solidTiles} solid · ${state.tilemap.doorTiles} doors`);
  }
  syncGameStateTextarea();
  renderVisualEditor();
}
