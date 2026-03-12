'use client';

import { useState, useMemo, useEffect } from 'react';
import { NOTES, STANDARD_TUNING, getNoteName } from '@/lib/music-theory';
import Fretboard, { FretMarker } from './Fretboard';
import InfoTooltip from './InfoTooltip';
import { useAppContext } from './AppContext';
import { useMusicContext } from '@/contexts/MusicContext';

// CAGED shape definitions: offsets from root-on-A-string
// Sequence up the neck: C → A → G → E → D
const CAGED_SHAPES = [
  { name: 'C', offset: -3, color: '#f97316', desc: 'Root on A & B strings' },
  { name: 'A', offset:  0, color: '#eab308', desc: 'Root on A string'     },
  { name: 'G', offset:  2, color: '#22c55e', desc: 'Root on E & e strings' },
  { name: 'E', offset:  5, color: '#3b82f6', desc: 'Root on E & e strings' },
  { name: 'D', offset:  7, color: '#a855f7', desc: 'Root on D string'     },
] as const;

type ChordQuality = 'Major' | 'Minor' | 'Dom7' | 'Min7' | 'Maj7';

const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  Major: [0, 4, 7],
  Minor: [0, 3, 7],
  Dom7:  [0, 4, 7, 10],
  Min7:  [0, 3, 7, 10],
  Maj7:  [0, 4, 7, 11],
};

const QUALITY_LABELS: Record<ChordQuality, string> = {
  Major: 'Major',
  Minor: 'Minor',
  Dom7:  'Dom 7',
  Min7:  'Min 7',
  Maj7:  'Maj 7',
};

function buildCagedMarkers(
  root: number,
  intervals: number[],
  shapeOffset: number,
): FretMarker[] {
  const rootOnA = ((root - 9 + 12) % 12);
  const base = rootOnA < 3 ? rootOnA + 12 : rootOnA;
  const windowStart = Math.max(0, base + shapeOffset);
  const windowEnd = windowStart + 5;

  const chordNotes = intervals.map(i => (root + i) % 12);
  const markers: FretMarker[] = [];

  // One note per string: lowest chord-tone fret in the window
  for (let s = 0; s < 6; s++) {
    const open = STANDARD_TUNING[s];
    for (let f = windowStart; f <= Math.min(22, windowEnd); f++) {
      const note = (open + f) % 12;
      if (chordNotes.includes(note)) {
        markers.push({ string: s, fret: f, label: getNoteName(note), isRoot: note === root });
        break; // take only the lowest chord-tone on this string
      }
    }
  }
  return markers;
}

const INFO_SECTIONS = [
  {
    heading: 'What is the CAGED System?',
    content: 'CAGED is a framework that divides the guitar neck into 5 repeating shapes, named after the 5 open chord forms: C, A, G, E, and D. Together they tile the entire fretboard for any key.',
  },
  {
    heading: 'How it works',
    content: 'Every chord shape can be played as a barre chord anywhere on the neck. The shapes connect end-to-end — the top of one shape overlaps with the bottom of the next — so mastering all 5 means you can play in any key in any position.',
  },
  {
    heading: 'How to use this tool',
    content: 'Pick a root note and chord quality. The 5 shape cards on the left show mini previews of each position. Click a shape to see it full-size. Notice how each shape\'s root note (white dot) lands on a specific string — that\'s your anchor. Learn one shape at a time, then connect them.',
  },
];

export default function CAGEDSystem() {
  const [rootNote, setRootNote] = useState(0);
  const [quality, setQuality] = useState<ChordQuality>('Major');
  const [selectedShape, setSelectedShape] = useState(0);
  const [syncWithCircle, setSyncWithCircle] = useState(false);
  const { setCurrentContext } = useAppContext();
  const { selectedKey } = useMusicContext();

  const effectiveRoot = syncWithCircle ? selectedKey.rootIndex : rootNote;
  const effectiveLabel = syncWithCircle ? selectedKey.label : NOTES[rootNote];
  const intervals = QUALITY_INTERVALS[quality];

  useEffect(() => {
    setCurrentContext(`CAGED System: ${effectiveLabel} ${quality}`);
  }, [effectiveRoot, quality, setCurrentContext, effectiveLabel]);

  const shape = CAGED_SHAPES[selectedShape];

  // Mini markers per shape
  const miniMarkers = useMemo(
    () => CAGED_SHAPES.map(s => buildCagedMarkers(effectiveRoot, intervals, s.offset)),
    [effectiveRoot, intervals],
  );

  // Main markers for selected shape
  const mainMarkers = useMemo(
    () => buildCagedMarkers(effectiveRoot, intervals, shape.offset),
    [effectiveRoot, intervals, shape.offset],
  );

  // Precompute fret windows for all shapes
  const rootOnA = ((effectiveRoot - 9 + 12) % 12);
  const base = rootOnA < 3 ? rootOnA + 12 : rootOnA;
  const shapeStarts = useMemo(
    () => CAGED_SHAPES.map(s => Math.max(0, base + s.offset - 1)),
    [base],
  );
  const windowStart = Math.max(0, base + shape.offset);
  const displayStart = Math.max(0, windowStart - 1);

  return (
    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-500 p-5">

      {/* Header */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">CAGED System</h1>
          <p className="font-light tracking-[0.2em] uppercase text-[10px] mt-1.5" style={{ color: shape.color }}>
            5 shapes · one fretboard
          </p>
        </div>
        <div className="flex gap-2 pt-1 items-center">
          <button
            onClick={() => setSyncWithCircle(s => !s)}
            className={`px-3 py-1.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase transition-all ${
              syncWithCircle ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30' : 'bg-[#1A1A1A] text-white/40 hover:text-white'
            }`}
          >
            {syncWithCircle ? `⟳ ${effectiveLabel}` : 'Sync ◎'}
          </button>
          <InfoTooltip title="CAGED System" sections={INFO_SECTIONS} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-[#1A1A1A] rounded-[8px] px-4 py-2 shrink-0">
        {!syncWithCircle && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Root</span>
              <select
                value={rootNote}
                onChange={e => setRootNote(Number(e.target.value))}
                className="bg-[#222] text-white rounded-[4px] px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {NOTES.map((n, i) => <option key={n} value={i}>{n}</option>)}
              </select>
            </div>
            <div className="w-px h-4 bg-white/10" />
          </>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Quality</span>
          <div className="flex bg-[#222] rounded-[4px] p-0.5">
            {(Object.keys(QUALITY_LABELS) as ChordQuality[]).map(q => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-bold transition-all ${
                  quality === q ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                }`}
                style={quality === q ? { backgroundColor: shape.color + '33', color: shape.color } : {}}
              >
                {QUALITY_LABELS[q]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Left: 5 CAGED shape cards */}
        <div className="flex flex-col gap-1.5 w-[72px] shrink-0">
          {CAGED_SHAPES.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setSelectedShape(i)}
              className={`flex-1 rounded-[6px] px-1 pt-1 pb-0 text-left transition-all border overflow-hidden flex flex-col ${
                selectedShape === i
                  ? 'border-opacity-60 bg-opacity-5'
                  : 'border-white/5 bg-[#1A1A1A] hover:border-white/20'
              }`}
              style={selectedShape === i ? {
                borderColor: s.color + '99',
                backgroundColor: s.color + '0D',
              } : {}}
            >
              <div className="flex items-baseline gap-1 mb-0.5">
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: selectedShape === i ? s.color : '#ffffff40' }}
                >
                  {s.name}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <Fretboard
                  markers={miniMarkers[i].map(m => ({ ...m, color: m.isRoot ? '#ffffff' : s.color }))}
                  numFrets={4}
                  startFret={shapeStarts[i]}
                  showNut={shapeStarts[i] <= 1}
                  compact
                />
              </div>
            </button>
          ))}
        </div>

        {/* Right: main fretboard */}
        <div className="flex-1 bg-[#1A1A1A] rounded-[8px] flex flex-col min-h-0 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="text-base font-black tracking-tight"
                style={{ color: shape.color }}
              >
                {shape.name} Shape
              </span>
              <span className="text-sm font-normal text-white/40">
                {effectiveLabel} {quality} · fr.{windowStart}–{windowStart + 4}
              </span>
            </div>
            <div className="flex bg-[#0F0F0F] rounded-[4px] p-0.5">
              {CAGED_SHAPES.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setSelectedShape(i)}
                  className="px-2 py-0.5 rounded-[3px] text-[10px] font-black transition-all"
                  style={selectedShape === i
                    ? { backgroundColor: s.color + '33', color: s.color }
                    : { color: '#ffffff40' }
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Shape description */}
          <div className="px-4 pb-1 shrink-0">
            <span className="text-[9px] text-white/25 tracking-widest uppercase">{shape.desc}</span>
          </div>

          {/* Fretboard */}
          <div className="flex-1 min-h-0 overflow-hidden flex items-center">
            <Fretboard
              markers={mainMarkers.map(m => ({
                ...m,
                color: m.isRoot ? '#ffffff' : shape.color,
              }))}
              numFrets={5}
              startFret={displayStart}
              showNut={displayStart === 0}
              maxWidth={500}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
