# Editor Isolation Implementation Plan

## Goal

Refactor the current mixed editor architecture into four distinct editors:

- Tilemap Editor
- Room Mapping Editor
- Chat Bubble Editor
- Agent Editor

Each editor should own its own view rendering and event wiring while sharing only low-level primitives.

## Non-goals

- No user-facing behavior changes unless explicitly planned.
- No visual redesign in this pass.
- No backend contract changes.

## Current coupling to remove

- Single render pass updates multiple editor surfaces (`visualEditor.js`).
- Single event-registration file wires controls for all editor modes (`domEvents.js`).
- Shared panel composition (`data-editor-only`, `data-editor-views`) blends concerns.

## Target architecture

### Shared layer (thin)

- `src/features/editor/shared/editorTabs.js`
  - Owns active subtab state + top-level section visibility.
- `src/features/editor/shared/editorSharedPanel.js`
  - Owns shared gear/utilities panel behavior.
- `src/features/editor/shared/atlasPicker.js`
  - Dumb atlas picker primitive used by tilemap/chat-bubble editors.
- `src/features/editor/shared/selectionPreview.js`
  - Generic preview canvas helper for atlas/token selection.

### Per-editor modules (owned surfaces)

- `src/features/editor/tilemap/editorView.js`
- `src/features/editor/tilemap/editorEvents.js`
- `src/features/editor/tilemap/editorRuntime.js`

- `src/features/editor/roomMapping/editorView.js`
- `src/features/editor/roomMapping/editorEvents.js`
- `src/features/editor/roomMapping/editorRuntime.js`

- `src/features/editor/chatBubble/editorView.js`
- `src/features/editor/chatBubble/editorEvents.js`
- `src/features/editor/chatBubble/editorRuntime.js`

- `src/features/editor/agent/editorView.js`
- `src/features/editor/agent/editorEvents.js`
- `src/features/editor/agent/editorRuntime.js`

## State boundaries

- Keep `state.editor.activeSubview` as the top-level router state.
- Split mode-specific state under:
  - `state.editor.tilemap`
  - `state.editor.roomMapping`
  - `state.editor.chatBubble`
  - `state.editor.agent`
- Keep true cross-editor values only at `state.editor` root.

## DOM structure plan (`index.html`)

1. Keep the shared subtab bar and shared utilities panel.
2. Replace mixed `editor-subview-grid` sections with 4 explicit top-level editor sections:
   - `#tilemap-editor-root`
   - `#room-mapping-editor-root`
   - `#chat-bubble-editor-root`
   - `#agent-editor-root`
3. Each root owns its preview + controls; no conditional child composition via `data-editor-only`.

## Implementation phases

### Phase 1: Shell split (no behavior changes)

1. Add shared tab controller module and migrate subtab activation logic.
2. Add shared panel module and migrate gear toggle wiring.
3. Keep existing view internals untouched for now.
4. Validation:
   - Subtab switching still works.
   - Shared utilities panel still works.

### Phase 2: Tilemap editor extraction

1. Move tilemap-specific rendering from `visualEditor.js` into `tilemap/editorView.js`.
2. Move tilemap-specific event handlers from `domEvents.js` into `tilemap/editorEvents.js`.
3. Introduce `tilemap/editorRuntime.js` adapter to bridge existing actions/state helpers.
4. Validation:
   - Apply map, save game state, resize grid work.
   - Atlas interactions and selection preview work.
   - Existing tilemap tests pass.

### Phase 3: Room mapping editor extraction

1. Move room mapping list + controls rendering into `roomMapping/editorView.js`.
2. Move room mapping handlers into `roomMapping/editorEvents.js`.
3. Keep domain operations in `roomMappingEditor.js`, accessed through room-mapping runtime adapter.
4. Validation:
   - Assign/clear region and label positioning work.
   - Region hover highlighting works.
   - Existing room mapping tests pass.

### Phase 4: Chat bubble editor extraction

1. Move chat bubble preview/render controls into `chatBubble/editorView.js`.
2. Move chat bubble events into `chatBubble/editorEvents.js`.
3. Reuse shared atlas picker primitive only as a dumb component.
4. Validation:
   - Role/slot selection works.
   - Assign/reset tile frame works.
   - Text color updates still propagate.

### Phase 5: Agent editor extraction

1. Move agent panel rendering into `agent/editorView.js`.
2. Move agent-only handlers into `agent/editorEvents.js`.
3. Keep sprite frame logic in `agentEditor.js`, called via runtime adapter.
4. Validation:
   - Agent metadata view still updates.
   - Sprite previews still render.
   - Show/hide agents toggle still works.

### Phase 6: Remove legacy mixed modules

1. Delete or slim legacy mixed orchestration in:
   - `src/features/editor/visualEditor.js`
   - `src/bootstrap/domEvents.js` (editor portion)
2. Keep compatibility wrappers only if needed for incremental transition.
3. Validation:
   - Full editor smoke test across all four modes.
   - Existing tests updated and passing.

## Test strategy

- Keep current tests green after each phase.
- Add per-editor unit tests:
  - `tests/tilemapEditorView.test.mjs`
  - `tests/roomMappingEditorView.test.mjs`
  - `tests/chatBubbleEditorView.test.mjs`
  - `tests/agentEditorView.test.mjs`
- Add an integration smoke test for cross-subtab navigation and state persistence.

## Rollout strategy

- Land in small PRs by phase.
- No phase should exceed 2-4 files of deep logic change without tests.
- Favor temporary compatibility adapters to reduce risk.

## File size guardrail

- Apply `AGENTS.md` rule during this refactor:
  - avoid new files over ~500 LOC
  - split large render/event modules proactively
