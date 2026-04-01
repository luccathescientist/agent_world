/*
 * Shared editor utilities-panel event wiring.
 * Owns game-state import/export/reset controls that are shared across editor
 * subviews.
 */

export function bindEditorUtilitiesEvents(state, deps = {}) {
  const {
    applyImportedAgentWorldStorageState = () => {},
    applyStructuredGameState = () => {},
    documentRef = globalThis.document,
    parseImportedAgentWorldStorageState = () => ({}),
    resetEditorState = () => {},
    setTilemapStatus = () => {},
    structuredSnapshotFromGameState = () => ({}),
    syncGameStateTextarea = () => {},
    writeGameStateToLocalStorage = () => {},
    URLRef = URL,
    BlobCtor = Blob,
  } = deps;

  documentRef.getElementById("apply-game-state-json").addEventListener("click", () => {
    try {
      const textarea = documentRef.getElementById("tilemap-state-json");
      const payload = parseImportedAgentWorldStorageState(textarea?.value || "");
      applyImportedAgentWorldStorageState(payload);
      writeGameStateToLocalStorage(payload);
      const snapshot = structuredSnapshotFromGameState(payload, state.renderer?.assets?.layout || {});
      applyStructuredGameState(snapshot, "Applied game state JSON.");
      if (textarea) textarea.value = JSON.stringify(payload, null, 2);
      if (!snapshot.floorText && !snapshot.wallText && !snapshot.furnitureText && !snapshot.propText) {
        setTilemapStatus("Imported JSON did not contain usable game-state map data.", true);
        return;
      }
      setTilemapStatus(`Imported ${Object.keys(payload).length} keys into local storage.`);
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });

  documentRef.getElementById("download-game-state-json").addEventListener("click", () => {
    try {
      syncGameStateTextarea();
      const textarea = documentRef.getElementById("tilemap-state-json");
      const content = textarea?.value || "{}";
      const blob = new BlobCtor([content], { type: "application/json" });
      const url = URLRef.createObjectURL(blob);
      const anchor = documentRef.createElement("a");
      anchor.href = url;
      anchor.download = "agent_world_game_state.json";
      documentRef.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URLRef.revokeObjectURL(url);
      setTilemapStatus("Downloaded current game state JSON.");
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });

  documentRef.getElementById("reset-tilemap").addEventListener("click", () => {
    try {
      resetEditorState();
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });
}
