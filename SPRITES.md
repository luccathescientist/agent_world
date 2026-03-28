# Agent World Sprite Notes

## Visual direction
A playful **16-bit SNES-inspired lab sim**.

Not full historical accuracy — more of a love letter to chunky JRPG interiors:
- bold palette blocks
- clear silhouettes
- readable idle poses
- exaggerated workstation zones
- soft CRT-ish glow around UI only, not the sprite body itself

## Core agent sprite concepts

### Lucca
- bright orange/red hair
- oversized round goggles
- pale lab coat over a green outfit
- toolbelt / wrench accent
- silhouette should read as: **inventor, tinkerer, clever menace**

### Robo (future)
- steel/teal chassis
- large amber eye visor
- broad shoulders, kind posture
- utility arms / backpack battery silhouette
- reads as: **helper tank with a good heart**

### Future expansion style guide
Each core agent should have:
- one dominant hair/head color
- one accessory silhouette
- one dominant torso color
- one accent item tied to their role

## v1 implementation approach
- use CSS-based pixel silhouettes first
- keep each sprite as a layered DOM figure, not bitmap art
- add alternate palettes/variants via `data-sprite` and CSS classes
- once behavior stabilizes, replace with actual sprite sheets if desired
