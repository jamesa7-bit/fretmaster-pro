# Circle of Fifths — Modes Feature Design

**Date:** 2026-05-12  
**Status:** Approved

## Overview

Add mode names as an outer ring to the Circle of Fifths SVG (mirroring a physical circle-of-fifths wheel), make each mode label clickable to update the Scale Notes panel, and add an all-7-modes reference panel below the Scale Notes card.

## 1. Circle SVG — Outer Mode Ring

### SVG viewport
Expand `viewBox` from `-200 -200 400 400` to `-220 -220 440 440` to accommodate the outer text ring.

### Mode label positions
For the active key, compute which 7 of the 12 circle positions are diatonic using a fixed `MODES` constant:

```ts
const MODES = [
  { label: 'Ionian',     scaleKey: 'Major',         circleOffset: 0,  semitoneOffset: 0  },
  { label: 'Mixolydian', scaleKey: 'Mixolydian',    circleOffset: 1,  semitoneOffset: 7  },
  { label: 'Dorian',     scaleKey: 'Dorian',         circleOffset: 2,  semitoneOffset: 2  },
  { label: 'Aeolian',    scaleKey: 'Natural Minor',  circleOffset: 3,  semitoneOffset: 9  },
  { label: 'Phrygian',   scaleKey: 'Phrygian',       circleOffset: 4,  semitoneOffset: 4  },
  { label: 'Locrian',    scaleKey: 'Locrian',         circleOffset: 5,  semitoneOffset: 11 },
  { label: 'Lydian',     scaleKey: 'Lydian',          circleOffset: 11, semitoneOffset: 5  },
] as const;
```

`label` is the display name shown on the ring. `scaleKey` is the key into `SCALES` used for `getScaleNotes()` — note that Ionian maps to `'Major'` and Aeolian maps to `'Natural Minor'` since those are the existing SCALES keys.

Render a `<text>` SVG element at radius ~205 for each mode's `(activeKeyIndex + circleOffset) % 12` position. The 5 non-diatonic positions render nothing.

### Interaction
Clicking a mode label sets `selectedMode: { label: string; scaleKey: string; semitoneOffset: number; circleIndex: number } | null` where `circleIndex` is the absolute CIRCLE_OF_FIFTHS array index `(activeKeyIndex + modeCircleOffset) % 12`. Clicking the active label again clears it. `selectedMode` resets to `null` whenever `activeKeyIndex` changes.

### Styling
- Selected mode label: `#16a34a` (green)
- Unselected mode labels: `rgba(255,255,255,0.35)` — matching the existing minor key text style
- Font size: 10px, `fontWeight: "bold"`, `textAnchor: "middle"`

## 2. Scale Notes Panel Update

### Default behaviour (selectedMode is null)
No change — shows the major or natural minor scale of the active key exactly as today.

### When a mode is selected
- Panel header changes from "Scale Notes" to `{modeRootName} {modeName}` (e.g. **D Dorian**)
- Note pills show the 7 notes of that mode, computed via the existing `getScaleNotes(rootIndex, modeName)` — all 7 modes are already defined in `SCALES` in `lib/music-theory.ts`
- Mode root index: `(activeKey.index + selectedMode.semitoneOffset) % 12`
- Mode root name: `getNoteName(modeRootIndex, activeKey.flats > 0)`
- Semitone offsets are defined in the `MODES` constant above
- Note pills are unchanged in style (same white circles)
- A deselect affordance: clicking the selected mode label again (or the active row in the modes panel) clears `selectedMode`

## 3. All-7-Modes Reference Panel

A new card rendered below the Scale Notes panel.

### Card styling
`bg-[#1A1A1A] rounded-[8px] p-4` — identical to existing cards.

### Header
`text-xs font-light tracking-[0.2em] uppercase text-white/50` label: "Modes"

### Rows
One row per mode, always showing all 7 modes of the active key. Each row contains:
- **Left:** Mode root note + mode name (e.g. "D Dorian") in `font-bold text-sm`
- **Right:** The 7 note names for that mode, space-separated, in `text-xs text-white/40`

### Selection
Clicking a row selects that mode (same state as clicking the outer ring label). The selected row gets a green left border (`border-l-2 border-[#16a34a]`) and a subtle green background tint (`bg-[#16a34a]/5`), matching the chord card selection style. Clicking the selected row again deselects.

## State

One new piece of state in `CircleOfFifths`:

```ts
const [selectedMode, setSelectedMode] = useState<{
  label: string;
  scaleKey: string;
  semitoneOffset: number;
  circleIndex: number;
} | null>(null);
```

Reset on key change:
```ts
useEffect(() => { setSelectedMode(null); }, [activeKeyIndex]);
```

## Files Changed

- `components/CircleOfFifths.tsx` — all changes confined to this single file
- No changes to `lib/music-theory.ts` (all required scales and helpers already exist)
