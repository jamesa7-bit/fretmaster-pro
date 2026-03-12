'use client';

import { useState, useMemo, useEffect } from 'react';
import { NOTES, TRIADS, STANDARD_TUNING, getNoteName } from '@/lib/music-theory';
import Fretboard, { FretMarker } from './Fretboard';
import { useAppContext } from './AppContext';
import { useMusicContext } from '@/contexts/MusicContext';
import InfoTooltip from './InfoTooltip';

const TRIADS_INFO = [
  {
    heading: 'What are Triads & Inversions?',
    content: 'A triad is a 3-note chord built from a root, third, and fifth. Inversions reorder those notes: root position (R-3-5), first inversion (3-R-5), second inversion (5-R-3). Every inversion has a distinct sound and a different lowest note.',
  },
  {
    heading: 'Why learn them across the neck?',
    content: 'Knowing all triad shapes in every position lets you comp (accompany) in any register, connect chord changes smoothly, and add melodic fills. Higher-register triads sit beautifully over a bass player holding the root.',
  },
  {
    heading: 'How to use this tool',
    content: 'Select a root and triad type. The fretboard shows every occurrence across all 22 frets — green dots are roots, amber are thirds, slate are fifths. Practice connecting adjacent shapes, and notice how first/second inversions link to root position on nearby strings.',
  },
];

export default function NeckTriads() {
  const [rootNote, setRootNote] = useState(0);
  const [triadType, setTriadType] = useState('Major');
  const [syncWithCircle, setSyncWithCircle] = useState(false);
  const { setCurrentContext } = useAppContext();
  const { selectedKey } = useMusicContext();

  const effectiveRoot = syncWithCircle ? selectedKey.rootIndex : rootNote;
  const effectiveLabel = syncWithCircle ? selectedKey.label : NOTES[rootNote];

  useEffect(() => {
    setCurrentContext(`Viewing Neck Triads: ${effectiveLabel} ${triadType}`);
  }, [effectiveRoot, triadType, setCurrentContext, effectiveLabel]);

  const triad = TRIADS[triadType];

  // Build all triad note indices
  const triadNoteIndices = useMemo(() =>
    triad.intervals.map(interval => (effectiveRoot + interval) % 12),
    [effectiveRoot, triad]
  );

  // Generate markers across the full neck (22 frets), color-coded per interval
  const markers = useMemo(() => {
    const generated: FretMarker[] = [];
    for (let s = 0; s < 6; s++) {
      const stringTune = STANDARD_TUNING[s];
      for (let f = 0; f <= 22; f++) {
        const noteIndex = (stringTune + f) % 12;
        const intervalIdx = triadNoteIndices.indexOf(noteIndex);
        if (intervalIdx !== -1) {
          generated.push({
            string: s,
            fret: f,
            label: triad.labels[intervalIdx],
            color: triad.colors[intervalIdx],
            isRoot: false, // we control color via `color` prop
          });
        }
      }
    }
    return generated;
  }, [triadNoteIndices, triad]);

  const triadNoteNames = triadNoteIndices.map(n => getNoteName(n));

  return (
    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-500 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Neck Triads</h1>
            <InfoTooltip title="Neck Triads" sections={TRIADS_INFO} />
          </div>
          <p className="text-[#16a34a] font-light tracking-[0.2em] uppercase text-xs mt-1">Every triad position across the full neck</p>
        </div>

        <button
          onClick={() => setSyncWithCircle(s => !s)}
          className={`px-4 py-2 rounded-[6px] text-xs font-bold tracking-wide uppercase transition-all ${
            syncWithCircle
              ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30'
              : 'bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white'
          }`}
        >
          {syncWithCircle ? `⟳ Synced: ${selectedKey.label}` : 'Sync with Circle'}
        </button>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#1A1A1A] rounded-[8px] px-4 py-3 shrink-0">
        {!syncWithCircle && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Root</span>
            <select
              value={rootNote}
              onChange={e => setRootNote(Number(e.target.value))}
              className="bg-[#222] text-white rounded-[6px] px-2 py-1.5 text-sm font-bold focus:outline-none cursor-pointer"
            >
              {NOTES.map((note, i) => <option key={note} value={i}>{note}</option>)}
            </select>
          </div>
        )}
        {!syncWithCircle && <div className="w-px h-5 bg-white/10" />}

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Type</span>
          <div className="flex bg-[#222] rounded-[6px] p-0.5">
            {Object.keys(TRIADS).map(type => (
              <button
                key={type}
                onClick={() => setTriadType(type)}
                className={`px-3 py-1 rounded-[4px] text-xs font-bold transition-all ${
                  triadType === type ? 'bg-[#16a34a] text-[#0A0A0A]' : 'text-white/50 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Interval legend */}
        <div className="flex items-center gap-3">
          {triad.intervals.map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: triad.colors[i] }} />
              <span className="text-xs font-mono font-bold text-white/60">{triad.labels[i]}</span>
              <span className="text-xs text-white/30">{triadNoteNames[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fretboard */}
      <div className="flex-1 bg-[#1A1A1A] rounded-[8px] p-3 overflow-hidden flex flex-col min-h-[280px]">
        <h2 className="text-base font-bold mb-2 shrink-0 tracking-tight">
          {effectiveLabel} {triadType}
          <span className="ml-3 text-sm font-light text-white/30 tracking-wider">
            {triadNoteNames.join(' – ')}
          </span>
        </h2>
        <div className="flex-1 overflow-hidden flex items-center justify-center">
          <Fretboard
            markers={markers}
            numFrets={22}
          />
        </div>
      </div>
    </div>
  );
}
