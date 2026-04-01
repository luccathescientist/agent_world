/*
 * Shared editor event orchestration.
 * Centralizes editor binder composition so bootstrap wiring stays thin while
 * preserving explicit module boundaries for each editor surface.
 */

import { bindAgentEditorEvents } from "../agent/editorEvents.js";
import { bindChatBubbleEditorEvents } from "../chatBubble/editorEvents.js";
import { bindRoomMappingEditorEvents } from "../roomMapping/editorEvents.js";
import { bindTilemapEditorEvents } from "../tilemap/editorEvents.js";
import { bindEditorSharedPanelToggle } from "./editorSharedPanel.js";
import { bindEditorSubviewTabEvents } from "./editorTabs.js";
import { bindEditorUtilitiesEvents } from "./editorUtilitiesEvents.js";
import { bindVisualWorkspaceEvents } from "./visualWorkspaceEvents.js";

export function bindEditorEvents(state, deps = {}) {
  const {
    applyEditorState = () => {},
    applyImportedAgentWorldStorageState = () => {},
    applyStructuredGameState = () => {},
    applyVisualAtlasCell = () => {},
    applyVisualToken = () => {},
    assignChatBubbleTile = () => {},
    assignRegionSelection = () => {},
    assignStashSelection = () => {},
    clearRegionSelection = () => {},
    clearStashSelection = () => {},
    documentRef = globalThis.document,
    getAtlasPointerCell = () => null,
    parseImportedAgentWorldStorageState = () => ({}),
    renderVisualEditor = () => {},
    renderWorld = () => {},
    resetChatBubbleFrame = () => {},
    resetEditorState = () => {},
    resizeTilemapGrid = () => {},
    saveGameState = async () => {},
    selectedChatBubbleTheme = () => null,
    setActiveEditorSubview = () => {},
    setChatBubbleTextColor = () => {},
    setRegionLabelPosition = () => {},
    setTilemapStatus = () => {},
    setVisualLayer = () => {},
    structuredSnapshotFromGameState = () => ({}),
    syncGameStateTextarea = () => {},
    writeGameStateToLocalStorage = () => {},
    URLRef = URL,
    BlobCtor = Blob,
    bindAgentEditorEventsHelper = bindAgentEditorEvents,
    bindChatBubbleEditorEventsHelper = bindChatBubbleEditorEvents,
    bindEditorSharedPanelToggleHelper = bindEditorSharedPanelToggle,
    bindEditorSubviewTabEventsHelper = bindEditorSubviewTabEvents,
    bindEditorUtilitiesEventsHelper = bindEditorUtilitiesEvents,
    bindRoomMappingEditorEventsHelper = bindRoomMappingEditorEvents,
    bindTilemapEditorEventsHelper = bindTilemapEditorEvents,
    bindVisualWorkspaceEventsHelper = bindVisualWorkspaceEvents,
  } = deps;

  bindEditorSubviewTabEventsHelper({ documentRef, setActiveEditorSubview });
  bindEditorSharedPanelToggleHelper({ documentRef });

  bindTilemapEditorEventsHelper(state, {
    applyEditorState,
    applyVisualToken,
    documentRef,
    renderVisualEditor,
    resizeTilemapGrid,
    saveGameState,
    setTilemapStatus,
  });

  bindRoomMappingEditorEventsHelper(state, {
    assignRegionSelection,
    assignStashSelection,
    clearRegionSelection,
    clearStashSelection,
    documentRef,
    setRegionLabelPosition,
    setTilemapStatus,
  });

  bindAgentEditorEventsHelper(state, {
    documentRef,
    renderWorld,
  });

  bindChatBubbleEditorEventsHelper(state, {
    assignChatBubbleTile,
    documentRef,
    renderVisualEditor,
    resetChatBubbleFrame,
    selectedChatBubbleTheme,
    setChatBubbleTextColor,
    setTilemapStatus,
  });

  bindEditorUtilitiesEventsHelper(state, {
    applyImportedAgentWorldStorageState,
    applyStructuredGameState,
    documentRef,
    parseImportedAgentWorldStorageState,
    resetEditorState,
    setTilemapStatus,
    structuredSnapshotFromGameState,
    syncGameStateTextarea,
    writeGameStateToLocalStorage,
    URLRef,
    BlobCtor,
  });

  bindVisualWorkspaceEventsHelper(state, {
    applyVisualAtlasCell,
    documentRef,
    getAtlasPointerCell,
    renderVisualEditor,
    setTilemapStatus,
    setVisualLayer,
  });
}
