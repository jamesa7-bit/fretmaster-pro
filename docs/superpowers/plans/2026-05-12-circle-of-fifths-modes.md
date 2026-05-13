# Circle of Fifths — Modes Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mode names as a clickable outer ring to the Circle of Fifths SVG, update the Scale Notes panel to show a selected mode's notes, and add an all-7-modes reference card below Scale Notes.

**Architecture:** All changes are confined to `components/CircleOfFifths.tsx`. A `MODES` constant defined at module level drives both the SVG outer ring and the reference panel. A single `selectedMode` state piece controls both the ring highlight and the Scale Notes panel swap.

**Tech Stack:** React (useState, useEffect), Next.js, Tailwind CSS, SVG, existing `lib/music-theory.ts` utilities (`getScaleNotes`, `getNoteName`, `CIRCLE_OF_FIFTHS`).

---

## File Map

| File | Change |
|---|---|
| `components/CircleOfFifths.tsx` | All changes — MODES constant, selectedMode state, SVG ring, Scale Notes update, Modes card |
| `lib/music-theory.ts` | No changes — all required scales and helpers already exist |

---

## Task 1: Add MODES constant and selectedMode state

**Files:**
- Modify: `components/CircleOfFifths.tsx:26-37` (after the `// ── Types` block)

- [ ] **Step 1: Add the MODES constant above the `// ── Voicing engine` comment**

Open `components/CircleOfFifths.tsx`. After line 37 (the closing brace of `CalculatedVoicing`) and before `// ── Voicing engine`, insert:

```tsx
// ── Modes ────────────────────────────────────────────────────────────────────

interface ModeEntry {
  label: string;
  scaleKey: string;
  circleOffset: number;
  semitoneOffset: number;
}

const MODES: ModeEntry[] = [
  { label: 'Ionian',     scaleKey: 'Major',        circleOffset: 0,  semitoneOffset: 0  },
  { label: 'Mixolydian', scaleKey: 'Mixolydian',   circleOffset: 1,  semitoneOffset: 7  },
  { label: 'Dorian',     scaleKey: 'Dorian',        circleOffset: 2,  semitoneOffset: 2  },
  { label: 'Aeolian',    scaleKey: 'Natural Minor', circleOffset: 3,  semitoneOffset: 9  },
  { label: 'Phrygian',   scaleKey: 'Phrygian',      circleOffset: 4,  semitoneOffset: 4  },
  { label: 'Locrian',    scaleKey: 'Locrian',        circleOffset: 5,  semitoneOffset: 11 },
  { label: 'Lydian',     scaleKey: 'Lydian',         circleOffset: 11, semitoneOffset: 5  },
];
```

- [ ] **Step 2: Add the selectedMode state type and useState declaration**

`circleIndex` is the absolute CIRCLE_OF_FIFTHS array index `(activeKeyIndex + mode.circleOffset) % 12`.

Inside the `CircleOfFifths` function, after the existing `const [triadInversion, setTriadInversion] = useState<TriadInversion>('root');` line (~line 216), add:

```tsx
const [selectedMode, setSelectedMode] = useState<{
  label: string;
  scaleKey: string;
  semitoneOffset: number;
  circleIndex: number;
} | null>(null);
```

- [ ] **Step 3: Add the reset effect**

After the existing `useEffect(() => { setSelectedChord(null); }, [activeKeyIndex, orientation]);` line, add:

```tsx
useEffect(() => { setSelectedMode(null); }, [activeKeyIndex]);
```

- [ ] **Step 4: Verify the build still compiles**

```bash
cd "C:/Users/James/OneDrive/Desktop/Personal/Claude/fretmaster-pro-main/.claude/worktrees/beautiful-cori-12d95b"
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/James/OneDrive/Desktop/Personal/Claude/fretmaster-pro-main/.claude/worktrees/beautiful-cori-12d95b"
git add components/CircleOfFifths.tsx
git commit -m "feat: add MODES constant and selectedMode state to CircleOfFifths"
```

---

## Task 2: Add outer mode ring to the SVG

**Files:**
- Modify: `components/CircleOfFifths.tsx` — SVG `viewBox` and mode label `<text>` elements

The SVG currently has `viewBox="-200 -200 400 400"`. Slices extend to radius 180. Mode labels sit at radius 205 (25px outside the slices).

- [ ] **Step 1: Expand the SVG viewBox**

Find the line:

```tsx
<svg viewBox="-200 -200 400 400" className="w-full max-w-[400px] h-auto overflow-visible">
```

Replace with:

```tsx
<svg viewBox="-220 -220 440 440" className="w-full max-w-[400px] h-auto overflow-visible">
```

- [ ] **Step 2: Add mode label `<text>` elements after the CIRCLE_OF_FIFTHS.map block**

The existing `CIRCLE_OF_FIFTHS.map(...)` block ends with a closing `})}`. After that closing and before the `<circle cx="0" cy="0" r="45"...` centre circle, insert:

```tsx
{MODES.map((mode) => {
  const circleIdx = (activeKeyIndex + mode.circleOffset) % 12;
  const angle = (circleIdx * 30 - 90) * (Math.PI / 180);
  const x = Math.cos(angle) * 205;
  const y = Math.sin(angle) * 205;
  const isSelected = selectedMode?.circleIndex === circleIdx;
  return (
    <text
      key={mode.label}
      x={x}
      y={y}
      fill={isSelected ? '#16a34a' : 'rgba(255,255,255,0.35)'}
      fontSize="9"
      fontWeight="bold"
      textAnchor="middle"
      dominantBaseline="central"
      className="cursor-pointer hover:opacity-80 select-none"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedMode(isSelected ? null : {
          label: mode.label,
          scaleKey: mode.scaleKey,
          semitoneOffset: mode.semitoneOffset,
          circleIndex: circleIdx,
        });
      }}
    >
      {mode.label}
    </text>
  );
})}
```

- [ ] **Step 3: Build and verify**

```bash
cd "C:/Users/James/OneDrive/Desktop/Personal/Claude/fretmaster-pro-main/.claude/worktrees/beautiful-cori-12d95b"
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Visual check in dev server**

```bash
npm run dev
```

Open `http://localhost:3000`, navigate to Circle of Fifths. With C selected you should see 7 mode labels around the outside: Ionian at top (12 o'clock), Mixolydian one position clockwise, Dorian two positions clockwise, Aeolian three, Phrygian four, Locrian five, Lydian one position counter-clockwise (at the 11 o'clock position, on F). Clicking a label should highlight it in green. Clicking it again should deselect. Clicking a different key on the circle should clear the selection.

- [ ] **Step 5: Commit**

```bash
git add components/CircleOfFifths.tsx
git commit -m "feat: add outer mode ring labels to Circle of Fifths SVG"
```

---

## Task 3: Update Scale Notes panel to show selected mode

**Files:**
- Modify: `components/CircleOfFifths.tsx` — Scale Notes panel JSX (~lines 488–497)

- [ ] **Step 1: Replace the Scale Notes panel with a mode-aware version**

Find the existing Scale Notes panel:

```tsx
{/* Scale Notes */}
<div className="bg-[#1A1A1A] rounded-[8px] p-4">
  <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-3">Scale Notes</label>
  <div className="flex flex-wrap gap-2">
    {scaleNotes.map((noteIndex, i) => (
      <div key={i} className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center font-bold text-white/70 text-sm">
        {getNoteName(noteIndex, activeKey.flats > 0)}
      </div>
    ))}
  </div>
</div>
```

Replace it entirely with:

```tsx
{/* Scale Notes */}
<div className="bg-[#1A1A1A] rounded-[8px] p-4">
  {selectedMode ? (
    <>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50">
          {getNoteName((activeKey.index + selectedMode.semitoneOffset) % 12, activeKey.flats > 0)} {selectedMode.label}
        </label>
        <button onClick={() => setSelectedMode(null)} className="text-white/30 hover:text-white transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {getScaleNotes((activeKey.index + selectedMode.semitoneOffset) % 12, selectedMode.scaleKey).map((noteIndex, i) => (
          <div key={i} className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center font-bold text-white/70 text-sm">
            {getNoteName(noteIndex, activeKey.flats > 0)}
          </div>
        ))}
      </div>
    </>
  ) : (
    <>
      <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-3">Scale Notes</label>
      <div className="flex flex-wrap gap-2">
        {scaleNotes.map((noteIndex, i) => (
          <div key={i} className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center font-bold text-white/70 text-sm">
            {getNoteName(noteIndex, activeKey.flats > 0)}
          </div>
        ))}
      </div>
    </>
  )}
</div>
```

Note: `X` is already imported from `lucide-react` at line 6.

- [ ] **Step 2: Build and verify**

```bash
cd "C:/Users/James/OneDrive/Desktop/Personal/Claude/fretmaster-pro-main/.claude/worktrees/beautiful-cori-12d95b"
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Visual check**

In the dev server, select key C. Click "Dorian" in the outer ring. Scale Notes header should change to "D Dorian" and show: D E F G A B C. Click the × button — header reverts to "Scale Notes" showing C D E F G A B. Select key G, click "Aeolian" — header shows "A Aeolian", notes: A B C D E F G.

- [ ] **Step 4: Commit**

```bash
git add components/CircleOfFifths.tsx
git commit -m "feat: update Scale Notes panel to display selected mode notes"
```

---

## Task 4: Add all-7-modes reference panel

**Files:**
- Modify: `components/CircleOfFifths.tsx` — insert new card after the Scale Notes panel

- [ ] **Step 1: Add the Modes reference card**

Find the Scale Notes closing `</div>` (the one that ends the Scale Notes card added in Task 3). Immediately after it, before the `{showJazzSubs && (` block, insert:

```tsx
{/* Modes Reference */}
<div className="bg-[#1A1A1A] rounded-[8px] p-4">
  <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-3">Modes</label>
  <div className="flex flex-col gap-1">
    {MODES.map((mode) => {
      const modeRootChromatic = (activeKey.index + mode.semitoneOffset) % 12;
      const modeRootName = getNoteName(modeRootChromatic, activeKey.flats > 0);
      const modeNotes = getScaleNotes(modeRootChromatic, mode.scaleKey);
      const circleIdx = (activeKeyIndex + mode.circleOffset) % 12;
      const isSelected = selectedMode?.circleIndex === circleIdx;
      return (
        <button
          key={mode.label}
          onClick={() => setSelectedMode(isSelected ? null : {
            label: mode.label,
            scaleKey: mode.scaleKey,
            semitoneOffset: mode.semitoneOffset,
            circleIndex: circleIdx,
          })}
          className="flex items-center justify-between rounded-[6px] px-3 py-2 text-left transition-all w-full"
          style={{
            background: isSelected ? 'rgba(22,163,74,0.05)' : 'transparent',
            borderLeft: isSelected ? '2px solid #16a34a' : '2px solid transparent',
          }}
        >
          <span className="font-bold text-sm shrink-0 mr-3" style={{ color: isSelected ? '#16a34a' : 'white' }}>
            {modeRootName} {mode.label}
          </span>
          <span className="text-xs text-white/40 truncate">
            {modeNotes.map(n => getNoteName(n, activeKey.flats > 0)).join(' · ')}
          </span>
        </button>
      );
    })}
  </div>
</div>
```

- [ ] **Step 2: Build and verify**

```bash
cd "C:/Users/James/OneDrive/Desktop/Personal/Claude/fretmaster-pro-main/.claude/worktrees/beautiful-cori-12d95b"
npm run build
```

Expected: build succeeds with no TypeScript or lint errors.

- [ ] **Step 3: Visual check**

In the dev server with C selected, the Modes card shows 7 rows:
- C Ionian · C · D · E · F · G · A · B
- G Mixolydian · G · A · B · C · D · E · F
- D Dorian · D · E · F · G · A · B · C
- A Aeolian · A · B · C · D · E · F · G
- E Phrygian · E · F · G · A · B · C · D
- B Locrian · B · C · D · E · F · G · A
- F Lydian · F · G · A · B · C · D · E

Click "D Dorian" row → green left border appears on that row, ring label "Dorian" turns green, Scale Notes header changes to "D Dorian". Click the same row again → everything deselects. Click "Dorian" in the outer ring → same row in the panel highlights.

Switch key to Bb (flat key). All mode roots and note names should use flat notation (e.g. "C Dorian", "Eb Phrygian", etc.).

- [ ] **Step 4: Commit**

```bash
git add components/CircleOfFifths.tsx
git commit -m "feat: add all-7-modes reference panel to Circle of Fifths"
```
