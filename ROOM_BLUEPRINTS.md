# Office Room Blueprints

## Current asset read

The new pack is a strong fit for Agent World.

- Best source sheet for custom composition: `assets/tiles/office_tileset/Office Tileset/Office Tileset All 16x16 no shadow.png`
- Best references for full-room composition:
  - `assets/tiles/office_tileset/Office Tileset/Office Designs/Office Level 2.png`
  - `assets/tiles/office_tileset/Office Tileset/Office Designs/Office Level 3.png`
  - `assets/tiles/office_tileset/Office Tileset/Office Designs/Office Level 4.png`
- Best VX-style modular layers if we want autotiled walls/floors later:
  - `assets/tiles/office_tileset/Office Tileset/Office VX Ace/A2 Office Floors.png`
  - `assets/tiles/office_tileset/Office Tileset/Office VX Ace/A4 Office Walls.png`
  - `assets/tiles/office_tileset/Office Tileset/Office VX Ace/B-C-D-E Office 1 No Shadows.png`
  - `assets/tiles/office_tileset/Office Tileset/Office VX Ace/B-C-D-E Office 2 No Shadows.png`

The pack gives us exactly what the current room model needs:

- bookcases and wall shelves for `library`
- multi-monitor desks and laptop desks for `terminal`
- writing tables and executive desks for `desk`
- side tables, couches, benches, plants for `lounge`
- clocks, phones, water coolers, framed wall pieces, spare desks for `comms`

## Style direction

We should keep the current one-room SNES layout, but rebuild it as a cleaner office-lab hybrid:

- top-left stays knowledge-heavy and bookish
- top-right becomes the communications wall
- center becomes the active terminal cluster
- bottom-left becomes the planning desk / writing zone
- bottom-right becomes the lounge / decompression zone

The office pack is more restrained and realistic than the previous roguelike pack, so the room should feel:

- more deliberate
- less fantasy tavern
- more "operations floor for agents"

## Anchor concepts

### Library

Primary concept: `Reference Wall`

- two or three tall bookcases against the back wall
- one narrow reading desk angled toward center room
- framed charts above shelves
- small rug or floor inset to separate it from the main office floor

Variant concept: `Archive Nook`

- shelves plus stacked storage crates
- one terminal-adjacent side table for open docs/manuals
- slightly tighter footprint if we need more room for terminal activity

### Comms

Primary concept: `Relay Corner`

- wall phone / handset read as communication equipment
- coffee machine + water cooler nearby so it feels like a social-message hub
- one side console facing into the room
- wall clock and framed display above

Variant concept: `Operator Booth`

- partition or narrow wall break to make comms feel semi-private
- single desk with monitor and phone
- bench or waiting stool just outside the booth

### Terminal

Primary concept: `Bullpen Cluster`

- 3 to 4 desks in a center block
- mixed CRT and flat monitor silhouettes so the room has tech texture
- chairs spaced so multiple agents can share the zone without overlap
- this remains the visual center of the room

Variant concept: `Command Table`

- one larger main desk with premium monitor placement
- one side workstation offset behind it
- better for scenes where only one or two agents are active

### Desk

Primary concept: `Planning Desk`

- larger wood-toned table
- laptop, paper, mug, framed chart on wall
- placed lower-left as the quieter authoring corner
- foreground lip should let the character tuck slightly behind the desk edge

Variant concept: `Lead Scientist Office`

- executive-style desk with cleaner wall behind it
- framed certificates / charts
- bench or shelf nearby

### Lounge

Primary concept: `Break Nook`

- couch or padded bench
- low table
- plant pair for softness
- isolated enough that idle agents read as "waiting" instead of "working"

Variant concept: `Meeting Table`

- small table with 2 to 4 chairs
- better if we want lounge to read as informal collaboration, not just rest

## Full room presets

These are the first three room directions worth building.

### Preset A: Research Office

Best match for current backend semantics.

- Library: large reference wall
- Comms: open relay corner with coffee/water
- Terminal: 4-desk cluster in the center
- Desk: planning desk in lower-left
- Lounge: compact sofa nook in lower-right

Why this works:

- keeps every anchor readable at a glance
- matches current anchor positions with minimal code churn
- makes the world feel like a real operating room instead of a generic lab

### Preset B: Admin Maze

More partitioned and a bit denser.

- Library: archive nook behind shelves
- Comms: booth-style side office
- Terminal: 2 main desks plus 1 support desk
- Desk: lead office desk
- Lounge: meeting-table corner

Why this works:

- stronger sense of architecture
- good if we later add collision/pathing
- slightly less readable for quick status scanning

### Preset C: Night Shift Floor

Cleaner, emptier, more atmospheric.

- Library: one shelf wall and one lamp-lit desk
- Comms: single operator station
- Terminal: 2 premium workstations
- Desk: solitary author desk
- Lounge: bench + plants + coffee table

Why this works:

- more dramatic and less cluttered
- ideal if we want the agent sprite to stand out more
- weaker "busy operations center" feeling

## Recommendation

Build `Preset A: Research Office` first.

It maps best onto the current world coordinates in `app.js` and `backend/state_mapper.py`, and it uses the strongest assets in the pack without needing a pathing rewrite.

After that:

1. Split the room generator into per-anchor assembly blocks.
2. Replace the existing hand-drawn room in `tools/build_temp_assets.py` with office-pack composition.
3. Export one new background and one foreground overlay for the first office room.
4. Keep `Preset B` and `Preset C` as alternate skins once the first office room is stable.

## License note

The included `LICENSE.txt` allows editing and use in commercial and non-commercial projects, but forbids redistribution of the original tileset and forbids AI/ML training use.
