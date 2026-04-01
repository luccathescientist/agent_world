/*
 * Room-mapping editor view helpers.
 * Keeps room-region controls and list rendering separate from mixed visual
 * editor rendering.
 */

export function renderRoomMappingEditorPanel(state, helpers = {}) {
  const {
    deleteRoomRegion = () => {},
    documentRef = globalThis.document,
    drawRoom = () => {},
    normalizeStashPoint = (value) => value,
    populateRegionIdSelect = () => {},
  } = helpers;
  const regionKindInput = documentRef.getElementById("region-kind-input");
  const regionIdInput = documentRef.getElementById("region-id-input");
  const regionLabelInput = documentRef.getElementById("region-label-input");
  const regionSummary = documentRef.getElementById("room-region-summary");
  const regionList = documentRef.getElementById("room-region-list");
  const stashSummary = documentRef.getElementById("stash-cell-summary");
  if (!regionKindInput || !regionIdInput || !regionLabelInput || !regionSummary || !regionList || !stashSummary) return;

  regionKindInput.value = state.editor.regionKind;
  populateRegionIdSelect(regionIdInput);
  if (documentRef.activeElement !== regionLabelInput) regionLabelInput.value = state.editor.regionLabel;
  regionSummary.textContent = `${state.roomRegions.length} regions`;
  const stash = normalizeStashPoint(state.tilemap?.layout?.stash || state.renderer?.assets?.layout?.stash || { col: 15, row: 14 });
  stashSummary.textContent = `Stash ${stash.col + 1}:${stash.row + 1}`;

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
}
