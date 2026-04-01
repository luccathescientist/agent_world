/*
 * Room-mapping editor runtime adapter.
 * Keeps room-mapping controls and guarded action execution isolated from the
 * global editor event bootstrap.
 */

export function createRoomMappingEditorRuntime(state, deps = {}) {
  const {
    assignRegionSelection = () => {},
    assignStashSelection = () => {},
    clearRegionSelection = () => {},
    clearStashSelection = () => {},
    setRegionLabelPosition = () => {},
    setTilemapStatus = () => {},
  } = deps;

  function runAction(action) {
    try {
      action();
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  }

  function updateRegionKind(value) {
    state.editor.regionKind = value === "door" ? "door" : "room";
  }

  function updateRegionId(value) {
    state.editor.regionId = value;
  }

  function updateRegionLabel(value) {
    state.editor.regionLabel = value;
  }

  function assignRegion() {
    runAction(assignRegionSelection);
  }

  function clearRegion() {
    runAction(clearRegionSelection);
  }

  function placeRegionLabel() {
    runAction(setRegionLabelPosition);
  }

  function assignStash() {
    runAction(assignStashSelection);
  }

  function clearStash() {
    runAction(clearStashSelection);
  }

  return {
    assignRegion,
    assignStash,
    clearRegion,
    clearStash,
    placeRegionLabel,
    updateRegionId,
    updateRegionKind,
    updateRegionLabel,
  };
}
