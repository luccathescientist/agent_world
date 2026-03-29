import {
  CHAT_BUBBLE_PREVIEW_SAMPLES,
  DEFAULT_CHAT_TEXT_COLORS,
  TILE_SIZE,
} from "../../core/constants.js";

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

export function renderVisualSelectionPreview(state, helpers = {}) {
  const {
    documentRef = document,
    getAssignedAtlasCell = () => null,
    getAssignedPreviewToken = () => null,
    getDraftCellValue = () => null,
    getVisualLayerConfig = () => ({ label: "" }),
    selectedChatBubbleTheme = () => null,
  } = helpers;
  const canvas = documentRef.getElementById("visual-selection-preview");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const titleEl = documentRef.getElementById("visual-selection-title");
  const detailEl = documentRef.getElementById("visual-selection-detail");
  const isChatBubbleView = state.editor.activeSubview === "chat-bubble";
  let layer = state.editor.selectedLayer;
  const hover = state.editor.hoveredAtlasCell;
  const selected = state.editor.selectedAtlasCell;
  const selectedCell = state.editor.selectedCell;
  let assignedValue = selectedCell ? getDraftCellValue(layer, selectedCell.row, selectedCell.col) : null;
  let assignedAtlasCell = getAssignedAtlasCell(layer, assignedValue);
  let assignedPreviewToken = getAssignedPreviewToken(layer, assignedValue);
  if (isChatBubbleView) {
    const theme = selectedChatBubbleTheme();
    const frame = theme?.frame?.[state.editor.selectedChatBubbleSlot || "mm"] || null;
    if (frame?.layer && ["floor", "wall"].includes(frame.layer)) {
      layer = frame.layer;
      assignedValue = frame.token || ".";
      assignedAtlasCell = getAssignedAtlasCell(layer, assignedValue);
      assignedPreviewToken = getAssignedPreviewToken(layer, assignedValue);
    } else {
      assignedValue = null;
      assignedAtlasCell = null;
      assignedPreviewToken = null;
    }
  }
  const atlasCell = hover || selected || assignedAtlasCell;

  if (!atlasCell && !assignedPreviewToken) {
    titleEl.textContent = isChatBubbleView ? "No bubble tile selected" : "No atlas tile selected";
    detailEl.textContent = isChatBubbleView
      ? "Pick Agent, Tool, or User, click a bubble segment in the preview, then choose a floor or wall atlas tile."
      : "Click a map cell, then hover or click a tile in the atlas.";
    return;
  }

  if (hover || selected || assignedAtlasCell) {
    const image = documentRef.getElementById("atlas-picker-image");
    if (!image?.complete || !image.naturalWidth) return;
    const tileSize = state.renderer?.assets?.layout?.atlasTileSize || TILE_SIZE;
    const sx = (atlasCell.x - 1) * tileSize;
    const sy = (atlasCell.y - 1) * tileSize;
    ctx.drawImage(image, sx, sy, tileSize, tileSize, 0, 0, canvas.width, canvas.height);
  } else if (assignedPreviewToken?.kind === "primitive" && state.renderer?.assets?.primitiveTextures?.[assignedPreviewToken.primitive]) {
    const texture = state.renderer.assets.primitiveTextures[assignedPreviewToken.primitive];
    const source = texture.baseTexture.resource?.source;
    const frame = texture.frame;
    if (source && frame) {
      ctx.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, canvas.width, canvas.height);
    }
  }

  const code = atlasCell ? `${atlasCell.x}:${atlasCell.y}` : String(assignedValue || "--");
  if (isChatBubbleView) {
    const roleLabel = state.editor.selectedChatBubbleRole === "assistant"
      ? "Agent"
      : state.editor.selectedChatBubbleRole === "tool"
        ? "Tool"
        : "User";
    const slotLabel = String(state.editor.selectedChatBubbleSlot || "mm").toUpperCase();
    titleEl.textContent = `${roleLabel} ${slotLabel} · ${getVisualLayerConfig().label} ${code}`;
    detailEl.textContent = hover
      ? `Ready to assign ${layer} ${code} to ${roleLabel} ${slotLabel}.`
      : assignedValue && assignedValue !== "--"
        ? `Selected bubble segment uses ${assignedValue}.`
        : `Ready to assign ${layer} ${code} to ${roleLabel} ${slotLabel}.`;
    return;
  }

  titleEl.textContent = atlasCell
    ? `${getVisualLayerConfig().label} ${atlasCell.x}:${atlasCell.y}`
    : `${getVisualLayerConfig().label} ${assignedValue}`;
  detailEl.textContent = hover
    ? `Will write \`${code}\` into the ${layer} map.`
    : assignedValue && assignedValue !== "--"
      ? `Current ${layer} value is \`${assignedValue}\`.`
      : `Will write \`${code}\` into the ${layer} map.`;
}

export function renderVisualEditor(state, helpers = {}) {
  const {
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    chatBubbleSlotOverlayMarkup = () => "",
    deleteRoomRegion = () => {},
    documentRef = document,
    drawRoom = () => {},
    formatRichTextHtml = (value) => value,
    getAtlasPathForLayer = () => "",
    getDraftCellValue = () => "--",
    getSelectedCells = () => [],
    getVisualLayerConfig = () => ({ cols: 1, rows: 1, label: "", modeLabel: "", title: "" }),
    getWorldCols = () => 0,
    getWorldRows = () => 0,
    normalizeStashPoint = (value) => value,
    populateRegionIdSelect = () => {},
    renderAgentEditorPanel = () => {},
    rerenderVisualEditor = () => {},
    renderVisualSelectionPreview = () => {},
    selectedChatBubbleTheme = () => null,
    syncRendererCanvasSize = () => {},
  } = helpers;
  const selectedCellEl = documentRef.getElementById("selected-map-cell");
  const selectedLayerEl = documentRef.getElementById("selected-layer-cell");
  const hoveredAtlasEl = documentRef.getElementById("hovered-atlas-cell");
  const atlasTitleEl = documentRef.getElementById("atlas-picker-title");
  const atlasModeEl = documentRef.getElementById("atlas-picker-mode");
  const atlasImage = documentRef.getElementById("atlas-picker-image");
  const atlasHover = documentRef.getElementById("atlas-picker-hover");
  const emptyButton = documentRef.getElementById("visual-token-empty");
  const colsInput = documentRef.getElementById("grid-cols-input");
  const rowsInput = documentRef.getElementById("grid-rows-input");
  const zoomSelect = documentRef.getElementById("editor-zoom-select");
  const showAgentsToggle = documentRef.getElementById("toggle-editor-agents");
  const regionKindInput = documentRef.getElementById("region-kind-input");
  const regionIdInput = documentRef.getElementById("region-id-input");
  const regionLabelInput = documentRef.getElementById("region-label-input");
  const regionSummary = documentRef.getElementById("room-region-summary");
  const regionList = documentRef.getElementById("room-region-list");
  const stashSummary = documentRef.getElementById("stash-cell-summary");
  const chatBubblePreviewList = documentRef.getElementById("editor-chat-bubble-preview-list");
  const chatBubbleTextColor = documentRef.getElementById("chat-bubble-text-color");
  const chatBubbleSlotSummary = documentRef.getElementById("chat-bubble-slot-summary");

  if (!selectedCellEl || !selectedLayerEl || !hoveredAtlasEl || !atlasTitleEl || !atlasModeEl || !atlasImage || !atlasHover || !emptyButton || !colsInput || !rowsInput || !zoomSelect || !showAgentsToggle || !regionKindInput || !regionIdInput || !regionLabelInput || !regionSummary || !regionList || !stashSummary || !chatBubblePreviewList || !chatBubbleTextColor || !chatBubbleSlotSummary) {
    return;
  }

  const layer = state.editor.selectedLayer;
  const currentView = state.editor.activeSubview || "tilemap";
  const config = getVisualLayerConfig();
  const selectedCell = state.editor.selectedCell;
  const selectedCells = getSelectedCells();
  const currentValue = selectedCell ? getDraftCellValue(layer, selectedCell.row, selectedCell.col) : "--";
  selectedCellEl.textContent = selectedCell
    ? selectedCells.length > 1
      ? `Cells ${selectedCells.length} selected`
      : `Cell ${selectedCell.col + 1}:${selectedCell.row + 1}`
    : "Cell --";
  selectedLayerEl.textContent = `${config.label} ${currentValue}`;
  const hovered = state.editor.hoveredAtlasCell;
  hoveredAtlasEl.textContent = hovered ? `Atlas ${hovered.x}:${hovered.y}` : "Atlas --";

  atlasTitleEl.textContent = currentView === "chat-bubble" ? `${config.label} Atlas` : config.title;
  atlasModeEl.textContent = config.modeLabel;
  if (documentRef.activeElement !== colsInput) colsInput.value = String(getWorldCols());
  if (documentRef.activeElement !== rowsInput) rowsInput.value = String(getWorldRows());
  zoomSelect.value = String(state.editor.zoom);
  showAgentsToggle.checked = state.editor.showAgents;
  regionKindInput.value = state.editor.regionKind;
  populateRegionIdSelect(regionIdInput);
  if (documentRef.activeElement !== regionLabelInput) regionLabelInput.value = state.editor.regionLabel;
  const activeChatTheme = selectedChatBubbleTheme();
  chatBubbleTextColor.value = activeChatTheme?.textColor || DEFAULT_CHAT_TEXT_COLORS[state.editor.selectedChatBubbleRole] || "#fff4d7";
  const chatRoleLabel = state.editor.selectedChatBubbleRole === "assistant"
    ? "Agent"
    : state.editor.selectedChatBubbleRole === "tool"
      ? "Tool"
      : "User";
  chatBubbleSlotSummary.textContent = `${chatRoleLabel} · ${(state.editor.selectedChatBubbleSlot || "mm").toUpperCase()}`;
  regionSummary.textContent = `${state.roomRegions.length} regions`;
  const stash = normalizeStashPoint(state.tilemap?.layout?.stash || state.renderer?.assets?.layout?.stash || { col: 15, row: 14 });
  stashSummary.textContent = `Stash ${stash.col + 1}:${stash.row + 1}`;
  const atlasPath = getAtlasPathForLayer(layer);
  if (atlasImage.getAttribute("src") !== atlasPath) {
    atlasImage.onload = () => renderVisualSelectionPreview();
    atlasImage.setAttribute("src", atlasPath);
  }
  atlasImage.dataset.cols = String(config.cols);
  atlasImage.dataset.rows = String(config.rows);

  if (hovered) {
    const cellWidth = atlasImage.clientWidth / config.cols;
    const cellHeight = atlasImage.clientHeight / config.rows;
    atlasHover.style.display = "block";
    atlasHover.style.width = `${cellWidth}px`;
    atlasHover.style.height = `${cellHeight}px`;
    atlasHover.style.transform = `translate(${(hovered.x - 1) * cellWidth}px, ${(hovered.y - 1) * cellHeight}px)`;
  } else {
    atlasHover.style.display = "none";
  }

  emptyButton.textContent = layer === "floor" ? "Set `.` floor" : "Set `.`";
  syncRendererCanvasSize();
  renderAgentEditorPanel();

  for (const button of documentRef.querySelectorAll("#visual-layer-toggle [data-layer]")) {
    button.classList.toggle("active", button.dataset.layer === layer);
  }
  regionList.innerHTML = state.roomRegions.length
    ? state.roomRegions.map((region) => `
      <div class="room-region-item${state.editor.hoveredRegionId === region.id ? " active" : ""}" data-region-id="${region.id}">
        <div class="room-region-copy">
          <span>${region.label}</span>
          <span class="room-region-meta">${region.kind} · ${region.id} · ${region.cells.length} cells${region.labelCell ? ` · label ${region.labelCell.col + 1}:${region.labelCell.row + 1}` : ""}</span>
        </div>
        <button class="secondary-btn room-region-delete" type="button" data-region-id="${region.id}">Delete</button>
      </div>
    `).join("")
    : `<div class="room-region-item"><span>No mapped rooms yet.</span><span class="room-region-meta">Select cells and assign one.</span></div>`;
  for (const row of regionList.querySelectorAll(".room-region-item[data-region-id]")) {
    row.addEventListener("mouseenter", () => {
      state.editor.hoveredRegionId = row.dataset.regionId || "";
      drawRoom(state.renderer);
    });
    row.addEventListener("mouseleave", () => {
      state.editor.hoveredRegionId = "";
      drawRoom(state.renderer);
    });
  }
  for (const button of regionList.querySelectorAll(".room-region-delete")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteRoomRegion(button.dataset.regionId || "");
    });
  }
  chatBubblePreviewList.innerHTML = CHAT_BUBBLE_PREVIEW_SAMPLES.map((sample) => `
    <article class="chat-bubble-preview-card ${sample.role}">
      <div class="chat-bubble-preview-label">${sample.label}</div>
      <div class="chat-item ${sample.role} preview">
        ${chatBubbleMarkup(sample.role, sample.metaLabel, sample.eventType, sample.time, formatRichTextHtml(sample.body))}
        ${chatBubbleSlotOverlayMarkup(sample.role)}
      </div>
    </article>
  `).join("");
  for (const item of chatBubblePreviewList.querySelectorAll(".chat-item.preview")) {
    const role = item.classList.contains("user") ? "user" : item.classList.contains("tool") ? "tool" : "assistant";
    applyChatRoleTheme(item, role);
  }
  for (const button of chatBubblePreviewList.querySelectorAll(".chat-bubble-slot-hotspot")) {
    button.addEventListener("click", () => {
      state.editor.selectedChatBubbleRole = ["assistant", "tool", "user"].includes(button.dataset.role) ? button.dataset.role : "assistant";
      state.editor.selectedChatBubbleSlot = button.dataset.slot || "mm";
      const frame = selectedChatBubbleTheme()?.frame?.[state.editor.selectedChatBubbleSlot] || null;
      if (frame?.layer && ["floor", "wall"].includes(frame.layer)) {
        state.editor.selectedLayer = frame.layer;
      }
      rerenderVisualEditor();
    });
  }
  for (const button of documentRef.querySelectorAll(".chat-bubble-role-btn")) {
    button.classList.toggle("active", button.dataset.role === state.editor.selectedChatBubbleRole);
  }
  renderVisualSelectionPreview();
}
