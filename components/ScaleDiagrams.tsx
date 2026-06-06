'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import { NOTES, SCALES, getScaleNotes, getNoteName, CAGEDShape, CAGED_OFFSETS, STANDARD_TUNING } from '@/lib/music-theory';
import Fretboard, { FretMarker, LabelMode } from './Fretboard';
import MiniMetronome from './MiniMetronome';
import { useAppContext } from './AppContext';
import { useMusicContext } from '@/contexts/MusicContext';
import { useMetronome } from '@/contexts/MetronomeContext';

export default function ScaleDiagrams() {
  const [rootNote, setRootNote] = useState(0);
  const [scaleType, setScaleType] = useState('Major');
  const [labelMode, setLabelMode] = useState<LabelMode>('name');
  const [syncWithCircle, setSyncWithCircle] = useState(true);
  const [showCaged, setShowCaged] = useState(false);
  const [cagedShape, setCagedShape] = useState<CAGEDShape | null>(null);

  // Scale Run state
  const [isRunMode, setIsRunMode] = useState(false);
  const [runNoteIdx, setRunNoteIdx] = useState(-1);
  const runAscendingRef = useRef(true);
  const prevBeatRef = useRef(-1);

  const { setCurrentContext } = useAppContext();
  const { selectedKey } = useMusicContext();
  const { currentBeat, isPlaying: metroPlaying, togglePlay: metroToggle } = useMetronome();

  const effectiveRoot = syncWithCircle ? selectedKey.rootIndex : rootNote;
  const effectiveLabel = syncWithCircle ? selectedKey.label : NOTES[rootNote];

  useEffect(() => {
    setCurrentContext(`Viewing Scale: ${effectiveLabel} ${scaleType}`);
  }, [effectiveRoot, scaleType, setCurrentContext, effectiveLabel]);

  const scaleNotes = useMemo(() => getScaleNotes(effectiveRoot, scaleType), [effectiveRoot, scaleType]);

  const numFrets = useMemo(() => {
    if (!showCaged || !cagedShape) return 15;
    const baseFret = ((effectiveRoot - STANDARD_TUNING[5]) % 12 + 12) % 12;
    const endFret = baseFret + CAGED_OFFSETS[cagedShape][1];
    return Math.max(15, endFret + 2);
  }, [showCaged, cagedShape, effectiveRoot]);

  // Open-position scale markers (frets 0–5 across all strings), sorted low-E → high-e, ascending fret
  const scaleRunMarkers = useMemo((): FretMarker[] => {
    const out: FretMarker[] = [];
    for (let s = 5; s >= 0; s--) {
      const open = STANDARD_TUNING[s];
      for (let f = 0; f <= 5; f++) {
        const note = (open + f) % 12;
        if (scaleNotes.includes(note)) {
          out.push({ string: s, fret: f, label: getNoteName(note), isRoot: note === effectiveRoot });
        }
      }
    }
    return out.sort((a, b) => b.string !== a.string ? b.string - a.string : a.fret - b.fret);
  }, [scaleNotes, effectiveRoot]);

  // Reset run on scale change
  useEffect(() => {
    setRunNoteIdx(-1);
    runAscendingRef.current = true;
    prevBeatRef.current = -1;
  }, [scaleNotes, effectiveRoot]);

  // Advance one note per beat (ascending → descending → loop)
  useEffect(() => {
    if (!isRunMode || !metroPlaying || currentBeat === -1) return;
    if (currentBeat === prevBeatRef.current) return;
    prevBeatRef.current = currentBeat;

    setRunNoteIdx(prev => {
      const len = scaleRunMarkers.length;
      if (prev < 0) return 0;
      if (runAscendingRef.current) {
        if (prev >= len - 1) { runAscendingRef.current = false; return prev - 1; }
        return prev + 1;
      } else {
        if (prev <= 0) { runAscendingRef.current = true; return prev + 1; }
        return prev - 1;
      }
    });
  }, [currentBeat, isRunMode, metroPlaying, scaleRunMarkers.length]);

  // Stop run animation when metronome stops
  useEffect(() => {
    if (!metroPlaying && isRunMode) {
      setRunNoteIdx(-1);
      runAscendingRef.current = true;
    }
  }, [metroPlaying, isRunMode]);

  const startRun = () => {
    setIsRunMode(true);
    setRunNoteIdx(0);
    runAscendingRef.current = true;
    prevBeatRef.current = -1;
    if (!metroPlaying) metroToggle();
  };

  const stopRun = () => {
    setIsRunMode(false);
    setRunNoteIdx(-1);
    runAscendingRef.current = true;
  };

  const runDisplayMarkers = useMemo(() =>
    scaleRunMarkers.map((m, i) => ({
      ...m,
      color: i === runNoteIdx ? '#3b82f6' : undefined,
    })),
    [scaleRunMarkers, runNoteIdx]
  );

  return (
    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-500 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Scale Library</h1>
          <p className="text-[#3b82f6] font-light tracking-[0.2em] uppercase text-xs mt-1">Explore scales across the entire fretboard</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSyncWithCircle(s => !s)}
            className={`px-4 py-2 rounded-[6px] text-xs font-bold tracking-wide uppercase transition-all ${
              syncWithCircle
                ? 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30'
                : 'bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white'
            }`}
          >
            {syncWithCircle ? `⟳ Synced: ${selectedKey.label}` : 'Sync with Circle'}
          </button>

          <div className="flex bg-[#1A1A1A] rounded-[8px] p-1">
            {(['name', 'degree', 'interval', 'none'] as LabelMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLabelMode(mode)}
                className={`px-4 py-2 rounded-[6px] text-xs font-light tracking-wide transition-all ${
                  labelMode === mode
                    ? 'bg-[#3b82f6] text-white font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Scale Run toggle */}
          <button
            onClick={isRunMode ? stopRun : startRun}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-xs font-bold tracking-wide uppercase transition-all ${
              isRunMode
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
            }`}
          >
            {isRunMode ? <><Square className="w-3 h-3 fill-current" /> Stop Run</> : <><Play className="w-3 h-3 fill-current" /> Scale Run</>}
          </button>
        </div>
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
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Scale</span>
          <select
            value={scaleType}
            onChange={e => setScaleType(e.target.value)}
            className="bg-[#222] text-white rounded-[6px] px-2 py-1.5 text-sm font-bold focus:outline-none cursor-pointer"
          >
            {Object.keys(SCALES).map(scale => <option key={scale} value={scale}>{scale}</option>)}
          </select>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">CAGED</span>
          <button
            onClick={() => setShowCaged(s => !s)}
            className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${showCaged ? 'bg-[#3b82f6]' : 'bg-[#333]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showCaged ? 'left-4' : 'left-0.5'}`} />
          </button>
          {showCaged && (
            <div className="flex gap-1">
              {(['C', 'A', 'G', 'E', 'D'] as CAGEDShape[]).map(shape => (
                <button
                  key={shape}
                  onClick={() => setCagedShape(s => s === shape ? null : shape)}
                  className={`w-7 h-7 rounded-[4px] text-xs font-bold transition-all ${
                    cagedShape === shape ? 'bg-[#3b82f6] text-white' : 'bg-[#222] text-white/70 hover:bg-[#333]'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MiniMetronome — right-aligned */}
        <div className="ml-auto">
          <MiniMetronome accent="#3b82f6" />
        </div>
      </div>

      {/* Run mode hint — only shows if user manually stops the metronome while running */}
      {isRunMode && !metroPlaying && (
        <div className="shrink-0 px-4 py-2 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-[8px] text-xs text-[#3b82f6] flex items-center justify-between">
          <span>Metronome paused — scale run is waiting</span>
          <button
            onClick={metroToggle}
            className="flex items-center gap-1 px-2 py-1 bg-[#3b82f6] text-white rounded-[4px] font-bold hover:bg-[#2563eb] transition-colors"
          >
            <Play className="w-3 h-3 fill-current" /> Resume
          </button>
        </div>
      )}

      {/* Fretboard */}
      <div className="flex-1 bg-[#1A1A1A] rounded-[8px] p-2 overflow-hidden flex flex-col min-h-[300px]">
        <div className="px-3 pt-2 pb-1 shrink-0 flex items-center gap-2">
          <span className="text-base font-bold tracking-tight">{effectiveLabel} {scaleType}</span>
          {isRunMode && (
            <span className="text-xs font-light text-[#3b82f6] tracking-widest uppercase">
              {runNoteIdx >= 0 ? scaleRunMarkers[runNoteIdx]?.label ?? '' : 'open position'}
            </span>
          )}
          {!isRunMode && showCaged && cagedShape && (
            <span className="text-xs font-light text-white/40 tracking-widest uppercase">{cagedShape} shape</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden flex items-center">
          {isRunMode ? (
            <Fretboard
              markers={runDisplayMarkers}
              numFrets={7}
              startFret={0}
              spacious
            />
          ) : (
            <Fretboard
              rootNote={effectiveRoot}
              notes={scaleNotes}
              labelMode={labelMode}
              numFrets={numFrets}
              spacious
              cagedOverlay={showCaged && cagedShape ? { shape: cagedShape, rootNote: effectiveRoot } : null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
