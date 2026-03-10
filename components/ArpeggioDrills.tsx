'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { NOTES, ARPEGGIOS, getArpeggioNotes, STANDARD_TUNING, getNoteName } from '@/lib/music-theory';
import Fretboard, { FretMarker } from './Fretboard';
import ArpeggioTab from './ArpeggioTab';
import { Play, Square, Mic } from 'lucide-react';
import { useAppContext } from './AppContext';
import { useMusicContext } from '@/contexts/MusicContext';

type Orientation = 'vertical' | 'horizontal' | 'diagonal' | 'full';

// Relative offsets from root-on-low-E for the 5 vertical/diagonal positions
const POSITION_OFFSETS = [0, 2, 5, 7, 10];

// String pairs for horizontal mode (string indices: 0=high E … 5=low E)
const H_PAIRS: [number, number][] = [[5, 4], [4, 3], [3, 2], [2, 1], [1, 0]];
const H_PAIR_LABELS = ['E–A', 'A–D', 'D–G', 'G–B', 'B–e'];

function buildMarkers(
  orientation: Orientation,
  posIdx: number,
  arpeggioNotes: number[],
  root: number,
  posWindows: { startFret: number }[],
): FretMarker[] {
  const out: FretMarker[] = [];

  if (orientation === 'full') {
    for (let s = 5; s >= 0; s--) {
      const tune = STANDARD_TUNING[s];
      for (let f = 0; f <= 22; f++) {
        const n = (tune + f) % 12;
        if (arpeggioNotes.includes(n))
          out.push({ string: s, fret: f, label: getNoteName(n), isRoot: n === root });
      }
    }
  } else if (orientation === 'vertical') {
    const sf = posWindows[posIdx].startFret;
    for (let s = 5; s >= 0; s--) {
      const tune = STANDARD_TUNING[s];
      for (let f = sf; f <= sf + 4; f++) {
        const n = (tune + f) % 12;
        if (arpeggioNotes.includes(n))
          out.push({ string: s, fret: f, label: getNoteName(n), isRoot: n === root });
      }
    }
  } else if (orientation === 'horizontal') {
    const [sHigh, sLow] = H_PAIRS[posIdx];
    for (let s = sLow; s <= sHigh; s++) {
      const tune = STANDARD_TUNING[s];
      for (let f = 0; f <= 22; f++) {
        const n = (tune + f) % 12;
        if (arpeggioNotes.includes(n))
          out.push({ string: s, fret: f, label: getNoteName(n), isRoot: n === root });
      }
    }
  } else if (orientation === 'diagonal') {
    const sweepStart = Math.max(0, posWindows[posIdx].startFret - 1);
    let cur = sweepStart;
    for (let s = 5; s >= 0; s--) {
      const tune = STANDARD_TUNING[s];
      for (let f = cur; f <= cur + 3; f++) {
        const n = (tune + f) % 12;
        if (arpeggioNotes.includes(n))
          out.push({ string: s, fret: f, label: getNoteName(n), isRoot: n === root });
      }
      cur += 1;
    }
  }

  return out.sort((a, b) => a.string !== b.string ? b.string - a.string : a.fret - b.fret);
}

export default function ArpeggioDrills() {
  const [rootNote, setRootNote] = useState(0);
  const [arpeggioType, setArpeggioType] = useState('Major');
  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [selectedPos, setSelectedPos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [syncWithCircle, setSyncWithCircle] = useState(false);
  const [showTab, setShowTab] = useState(true);
  const ascendingRef = useRef(true);
  const { setCurrentContext } = useAppContext();
  const { selectedKey } = useMusicContext();

  const effectiveRoot = syncWithCircle ? selectedKey.rootIndex : rootNote;
  const effectiveLabel = syncWithCircle ? selectedKey.label : NOTES[rootNote];

  useEffect(() => {
    setCurrentContext(`Practicing Arpeggio: ${effectiveLabel} ${arpeggioType}`);
  }, [effectiveRoot, arpeggioType, setCurrentContext, effectiveLabel]);

  useEffect(() => {
    setIsPlaying(false);
    setActiveNoteIdx(-1);
    ascendingRef.current = true;
  }, [effectiveRoot, arpeggioType, selectedPos, orientation]);

  const arpeggioNotes = useMemo(
    () => getArpeggioNotes(effectiveRoot, arpeggioType),
    [effectiveRoot, arpeggioType]
  );

  const rootOnLowE = useMemo(
    () => ((effectiveRoot - STANDARD_TUNING[5]) % 12 + 12) % 12,
    [effectiveRoot]
  );

  const posWindows = useMemo(
    () => POSITION_OFFSETS.map((off, i) => ({ label: `P${i + 1}`, startFret: rootOnLowE + off })),
    [rootOnLowE]
  );

  const markers = useMemo(
    () => buildMarkers(orientation, selectedPos, arpeggioNotes, effectiveRoot, posWindows),
    [orientation, selectedPos, arpeggioNotes, effectiveRoot, posWindows]
  );

  // Mini markers for position cards (dot-only, always vertical pattern)
  const miniMarkers = useMemo(
    () => posWindows.map((_, i) =>
      buildMarkers('vertical', i, arpeggioNotes, effectiveRoot, posWindows)
        .map(m => ({ ...m, label: '' }))
    ),
    [posWindows, arpeggioNotes, effectiveRoot]
  );

  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => {
      setActiveNoteIdx(prev => {
        if (ascendingRef.current) {
          if (prev >= markers.length - 1) {
            // reached the top — start descending
            ascendingRef.current = false;
            return prev - 1;
          }
          return prev + 1;
        } else {
          if (prev <= 0) {
            // reached the bottom — stop
            setIsPlaying(false);
            ascendingRef.current = true;
            return -1;
          }
          return prev - 1;
        }
      });
    }, 500);
    return () => clearInterval(iv);
  }, [isPlaying, markers.length]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setActiveNoteIdx(-1);
      ascendingRef.current = true;
    } else {
      ascendingRef.current = true;
      setIsPlaying(true);
      setActiveNoteIdx(0);
    }
  };

  const toggleMic = async () => {
    if (isListening) { setIsListening(false); return; }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);
    } catch { alert('Microphone access required for pitch feedback.'); }
  };

  const displayMarkers = markers.map((m, i) => ({
    ...m,
    color: i === activeNoteIdx ? '#10b981' : undefined,
  }));

  // Fretboard params per orientation
  const fbNumFrets = orientation === 'vertical' ? 7
    : orientation === 'diagonal' ? 12
    : 22;
  const fbStartFret = orientation === 'vertical'
    ? Math.max(0, posWindows[selectedPos].startFret - 1)
    : orientation === 'diagonal'
    ? Math.max(0, posWindows[selectedPos].startFret - 3)
    : 0;

  // Subtitle for main fretboard
  const fbSubtitle =
    orientation === 'vertical' ? `fr.${posWindows[selectedPos].startFret}–${posWindows[selectedPos].startFret + 4}`
    : orientation === 'horizontal' ? H_PAIR_LABELS[selectedPos]
    : orientation === 'diagonal' ? `sweep fr.${Math.max(0, posWindows[selectedPos].startFret - 1)}+`
    : 'full neck';

  const showMini = orientation !== 'full';

  return (
    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-500 p-5">

      {/* ── Header row ── */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Arpeggio Drills</h1>
          <p className="text-[#16a34a] font-light tracking-[0.2em] uppercase text-[10px] mt-1.5">Master chord tones across the neck</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setSyncWithCircle(s => !s)}
            className={`px-3 py-1.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase transition-all ${
              syncWithCircle ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30' : 'bg-[#1A1A1A] text-white/40 hover:text-white'
            }`}
          >
            {syncWithCircle ? `⟳ ${selectedKey.label}` : 'Sync ◎'}
          </button>
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase transition-all ${
              isPlaying ? 'bg-red-500/20 text-red-400' : 'bg-[#16a34a] text-[#0A0A0A] hover:bg-[#15803d]'
            }`}
          >
            {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          <button
            onClick={toggleMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase transition-all ${
              isListening ? 'bg-[#16a34a]/20 text-[#16a34a]' : 'bg-[#1A1A1A] text-white/40 hover:text-white'
            }`}
          >
            <Mic className={`w-3 h-3 ${isListening ? 'animate-pulse' : ''}`} />
            Mic
          </button>
          <button
            onClick={() => setShowTab(t => !t)}
            className={`px-3 py-1.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase transition-all ${
              showTab ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30' : 'bg-[#1A1A1A] text-white/40 hover:text-white'
            }`}
          >
            Tab
          </button>
        </div>
      </div>

      {/* ── Controls bar ── */}
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
          <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Type</span>
          <select
            value={arpeggioType}
            onChange={e => setArpeggioType(e.target.value)}
            className="bg-[#222] text-white rounded-[4px] px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer"
          >
            {Object.keys(ARPEGGIOS).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Pattern</span>
          <div className="flex bg-[#222] rounded-[4px] p-0.5">
            {(['vertical', 'horizontal', 'diagonal', 'full'] as Orientation[]).map(o => (
              <button
                key={o}
                onClick={() => setOrientation(o)}
                className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-bold transition-all ${
                  orientation === o ? 'bg-[#16a34a] text-[#0A0A0A]' : 'text-white/40 hover:text-white'
                }`}
              >
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column main area ── */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Left: 5 mini position cards */}
        {showMini && (
          <div className="flex flex-col gap-1.5 w-[72px] shrink-0">
            {posWindows.map((pos, i) => {
              const subtitle = orientation === 'horizontal'
                ? H_PAIR_LABELS[i]
                : `fr.${pos.startFret}`;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedPos(i)}
                  className={`flex-1 rounded-[6px] px-1 pt-1 pb-0 text-left transition-all border overflow-hidden flex flex-col ${
                    selectedPos === i
                      ? 'border-[#16a34a] bg-[#16a34a]/5'
                      : 'border-white/5 bg-[#1A1A1A] hover:border-white/20'
                  }`}
                >
                  <div className={`text-[8px] font-bold uppercase tracking-widest leading-none mb-0.5 flex items-baseline gap-1 ${
                    selectedPos === i ? 'text-[#16a34a]' : 'text-white/30'
                  }`}>
                    {pos.label}
                    <span className="font-normal normal-case tracking-normal text-white/20">{subtitle}</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <Fretboard
                      markers={miniMarkers[i]}
                      numFrets={4}
                      startFret={pos.startFret}
                      showNut={pos.startFret === 0}
                      compact
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Right: main fretboard card */}
        <div className="flex-1 bg-[#1A1A1A] rounded-[8px] flex flex-col min-h-0 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
            <span className="text-sm font-bold tracking-tight">
              {effectiveLabel} {arpeggioType}
              <span className="ml-2 text-xs font-normal text-white/30">{fbSubtitle}</span>
            </span>
            {/* Inline position selector for the main card */}
            {showMini && (
              <div className="flex bg-[#0F0F0F] rounded-[4px] p-0.5">
                {posWindows.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPos(i)}
                    className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold transition-all ${
                      selectedPos === i ? 'bg-[#16a34a] text-[#0A0A0A]' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fretboard — maxWidth keeps it from stretching too tall */}
          <div className="flex-1 min-h-0 overflow-hidden flex items-center">
            <Fretboard
              markers={displayMarkers}
              numFrets={fbNumFrets}
              startFret={fbStartFret}
              maxWidth={orientation === 'vertical' ? 480 : orientation === 'diagonal' ? 520 : undefined}
            />
          </div>

          {/* Tab view */}
          {showTab && (
            <div className="shrink-0 bg-[#0F0F0F] px-4 py-2.5">
              <div className="text-[8px] font-light tracking-[0.2em] uppercase text-white/25 mb-2">Tab</div>
              <ArpeggioTab markers={displayMarkers} activeNoteIndex={activeNoteIdx} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
