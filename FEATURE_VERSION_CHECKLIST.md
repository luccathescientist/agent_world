# Feature Version Checklist

This file tracks implementation steps for each version listed in `IMPLEMENTATION_PLAN.md`.

## Release 0.1.0 - Standalone extraction baseline

- [ ] Extract Agent World into its own repository.
- [ ] Ship the standalone FastAPI server.
- [ ] Keep the current office layout as the default clean-install world.
- [ ] Document the OpenClaw-first product direction.

## Release 0.2.0 - Settings and OpenClaw diagnostics

- [ ] Add a global settings page.
- [ ] Expose OpenClaw path/config selection.
- [ ] Add readable diagnostics for required OpenClaw files and voice readiness.
- [ ] Document the exact OpenClaw files consumed by Agent World.

## Release 0.3.0 - Generic room model

- [ ] Move from hardcoded anchors toward configurable room definitions.
- [ ] Preserve seeded default room types.
- [ ] Support room `name` plus prose `description`.
- [ ] Store room and layout configuration in JSON.

## Release 0.4.0 - World builder generalization

- [ ] Support custom tile atlases with configurable tile sizes.
- [ ] Support full freeform layouts with semantic zones.
- [ ] Reduce office-specific assumptions in the current editor.
- [ ] Define the first versioned world-bundle contract between editor output and runtime loading.

## Release 0.5.0 - Agent sprite configurator

- [ ] Support raw character sheet import.
- [ ] Support manual directional frame mapping.
- [ ] Bind discovered OpenClaw agents to sprite definitions.
- [ ] Add animation preview tooling.

## Release 0.6.0 - Agent creation flow

- [ ] Add a `New Agent` UI flow.
- [ ] Let users define model, function, and visual identity.
- [ ] Write agent definitions into backend config.
- [ ] Support the required backend reload/restart path.
- [ ] Make newly created agents appear in-world after activation.

## Release 0.7.0 - Voice completion

- [ ] Complete per-agent voice/text interaction.
- [ ] Expose reply mode selection: text, voice, or both.
- [ ] Surface OpenClaw-backed voice options clearly in settings.

## Release 0.8.0 - Multi-floor and multi-building worlds

- [ ] Extend the bundle contract to support multiple maps, floors, and buildings.
- [ ] Add transitions between layouts.
- [ ] Support neighborhood-scale roaming and editing.

## Release 0.9.0 - Hardening and docs

- [ ] Add backend/API regression coverage for the standalone app.
- [ ] Add focused world-builder and sprite-mapping tests.
- [ ] Finish task-oriented setup and configuration documentation.
