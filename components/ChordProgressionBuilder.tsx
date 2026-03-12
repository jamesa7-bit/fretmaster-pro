'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { CIRCLE_OF_FIFTHS, getScaleNotes, getNoteName } from '@/lib/music-theory';
import { CHORD_DICTIONARY } from '@/lib/chord-dictionary';
import { Play, Square, Plus, Music2 } from 'lucide-react';
import { useAppContext } from './AppContext';
import { useMusicContext } from '@/contexts/MusicContext';

type ViewMode = 'chart' | 'diagrams' | 'playback';

interface ChordSlot {
  id: number;
  chordName: string;
  degree: string;
}

// ── Voicing helper ────────────────────────────────────────────────────────────

const NOTE_MAP: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

function parseChordName(name: string) {
  const match = name.match(/^([A-G][#b]?)(.*)/);
  const root = match?.[1] ?? 'C';
  const suffix = match?.[2] ?? '';
  const rootIndex = NOTE_MAP[root] ?? 0;
  const quality = suffix.startsWith('dim') ? 'dim' : suffix.startsWith('m') ? 'minor' : 'major';
  return { rootIndex, quality } as const;
}

function getVoicing(chordName: string) {
  const dict = CHORD_DICTIONARY[chordName];
  if (dict) {
    const frettedNotes = dict.frets.filter(f => f > 0);
    const minFret = frettedNotes.length > 0 ? Math.min(...frettedNotes) : 1;
    const maxFret = frettedNotes.length > 0 ? Math.max(...frettedNotes) : 1;
    const startFret = minFret > 1 && (maxFret - minFret) < 4 ? minFret : 1;
    return { frets: dict.frets, fingers: dict.fingers, startFret };
  }
  const { rootIndex, quality } = parseChordName(chordName);
  const eFret = ((rootIndex - 4 + 12) % 12);
  const aFret = ((rootIndex - 9 + 12) % 12);
  if (eFret >= 1 && eFret <= 15) {
    const f = eFret;
    const frets = quality === 'minor' ? [f,f+2,f+2,f,f,f] : quality === 'dim' ? [f,f+2,f+3,f+2,-1,-1] : [f,f+2,f+2,f+1,f,f];
    const fingers = quality === 'minor' ? [1,3,4,1,1,1] : quality === 'dim' ? [1,2,4,3,-1,-1] : [1,3,4,2,1,1];
    return { frets, fingers, startFret: f };
  }
  if (aFret >= 1 && aFret <= 15) {
    const f = aFret;
    const frets = quality === 'minor' ? [-1,f,f+2,f+2,f+1,f] : quality === 'dim' ? [-1,f,f+1,f+2,f+1,-1] : [-1,f,f+2,f+2,f+2,f];
    const fingers = quality === 'minor' ? [-1,1,3,4,2,1] : quality === 'dim' ? [-1,1,2,4,3,-1] : [-1,1,3,4,2,1];
    return { frets, fingers, startFret: f };
  }
  return null;
}

// ── Mini chord diagram ────────────────────────────────────────────────────────

function ChordDiagram({ chordName, active = false }: { chordName: string; active?: boolean }) {
  const v = getVoicing(chordName);
  if (!v) return <div className="w-[76px] h-[90px] flex items-center justify-center text-white/20 text-xs">?</div>;

  const { frets, fingers, startFret } = v;
  const numStrings = 6, numFrets = 5, showNut = startFret === 1;
  const colW = 24, rowH = 22, padL = 18, padT = 20, padR = 6, padB = 8;
  const W = padL + (numStrings - 1) * colW + padR;
  const H = padT + numFrets * rowH + padB;
  const dotFill = active ? '#16a34a' : '#16a34a';

  return (
    <div className="flex flex-col items-center">
      <div className="text-[8px] text-white/25 h-4 flex items-center">{!showNut ? `${startFret}fr` : ''}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W * 1.1} height={H * 1.1}>
        {showNut && <rect x={padL - 2} y={padT} width={(numStrings-1)*colW+4} height={3} fill={active ? '#16a34a' : '#555'} rx={1} />}
        {Array.from({ length: numFrets+1 }).map((_, i) => (
          <line key={i} x1={padL} y1={padT+i*rowH} x2={padL+(numStrings-1)*colW} y2={padT+i*rowH} stroke="#2a2a2a" strokeWidth={1} />
        ))}
        {Array.from({ length: numStrings }).map((_, s) => (
          <line key={s} x1={padL+s*colW} y1={padT} x2={padL+s*colW} y2={padT+numFrets*rowH} stroke="#2a2a2a" strokeWidth={1.5} />
        ))}
        {frets.map((fret, s) => {
          const cx = padL + s * colW, cy = padT - 8;
          if (fret === -1) return <text key={s} x={cx} y={cy} fill="#ff4444" fontSize={9} fontWeight="bold" textAnchor="middle" dominantBaseline="central">×</text>;
          if (fret === 0) return <circle key={s} cx={cx} cy={cy} r={3} fill="none" stroke="#555" strokeWidth={1.5} />;
          return null;
        })}
        {frets.map((fret, s) => {
          if (fret <= 0) return null;
          const rel = fret - startFret + 1;
          if (rel < 1 || rel > numFrets) return null;
          const cx = padL + s * colW, cy = padT + (rel - 0.5) * rowH;
          return (
            <g key={s}>
              <circle cx={cx} cy={cy} r={8} fill={dotFill} />
              {fingers[s] > 0 && <text x={cx} y={cy} fill="#0A0A0A" fontSize={7} fontWeight="bold" textAnchor="middle" dominantBaseline="central">{fingers[s]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Diatonic chords ───────────────────────────────────────────────────────────

function getDiatonicChords(rootIndex: number, isMinor: boolean) {
  const scaleNotes = getScaleNotes(rootIndex, isMinor ? 'Natural Minor' : 'Major');
  return isMinor ? [
    { degree: 'i',   chord: `${getNoteName(scaleNotes[0])}m` },
    { degree: 'II',  chord: getNoteName(scaleNotes[1]) },
    { degree: 'III', chord: getNoteName(scaleNotes[2]) },
    { degree: 'iv',  chord: `${getNoteName(scaleNotes[3])}m` },
    { degree: 'v',   chord: `${getNoteName(scaleNotes[4])}m` },
    { degree: 'VI',  chord: getNoteName(scaleNotes[5]) },
    { degree: 'VII', chord: getNoteName(scaleNotes[6]) },
  ] : [
    { degree: 'I',   chord: getNoteName(scaleNotes[0]) },
    { degree: 'ii',  chord: `${getNoteName(scaleNotes[1])}m` },
    { degree: 'iii', chord: `${getNoteName(scaleNotes[2])}m` },
    { degree: 'IV',  chord: getNoteName(scaleNotes[3]) },
    { degree: 'V',   chord: getNoteName(scaleNotes[4]) },
    { degree: 'vi',  chord: `${getNoteName(scaleNotes[5])}m` },
    { degree: 'VII', chord: getNoteName(scaleNotes[6]) },
  ];
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChordProgressionBuilder() {
  const [keyIndex, setKeyIndex] = useState(0);
  const [isMinor, setIsMinor] = useState(false);
  const [progression, setProgression] = useState<ChordSlot[]>([]);
  const [view, setView] = useState<ViewMode>('chart');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);
  const [bpm, setBpm] = useState(80);
  const [beatsPerChord, setBeatsPerChord] = useState(4);
  const [syncWithCircle, setSyncWithCircle] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [customChord, setCustomChord] = useState('');

  const nextIdRef = useRef(1);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setCurrentContext } = useAppContext();
  const { selectedKey } = useMusicContext();

  // Sync key from MusicContext
  useEffect(() => {
    if (!syncWithCircle) return;
    const idx = CIRCLE_OF_FIFTHS.findIndex(k => k.index === selectedKey.rootIndex);
    if (idx >= 0) setKeyIndex(idx);
  }, [syncWithCircle, selectedKey.rootIndex]);

  const activeKey = CIRCLE_OF_FIFTHS[keyIndex];

  useEffect(() => {
    setCurrentContext(`Chord Progression · ${activeKey.key}${isMinor ? 'm' : ''}`);
  }, [activeKey.key, isMinor, setCurrentContext]);

  const diatonicChords = useMemo(
    () => getDiatonicChords(activeKey.index, isMinor),
    [activeKey.index, isMinor],
  );
  const diatonicSet = useMemo(() => new Set(diatonicChords.map(c => c.chord)), [diatonicChords]);

  // Playback
  useEffect(() => {
    if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null; }
    if (!isPlaying || progression.length === 0) return;
    const ms = beatsPerChord * (60000 / bpm);
    playTimerRef.current = setInterval(() => {
      setActiveSlot(prev => (prev + 1) % progression.length);
    }, ms);
    return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
  }, [isPlaying, progression.length, bpm, beatsPerChord]);

  useEffect(() => {
    setIsPlaying(false);
    setActiveSlot(0);
  }, [progression.length]);

  const addChord = (chordName: string, degree: string) => {
    if (progression.length >= 16) return;
    setProgression(prev => [...prev, { id: nextIdRef.current++, chordName, degree }]);
  };

  const removeChord = (id: number) => setProgression(prev => prev.filter(c => c.id !== id));

  const moveChord = (id: number, dir: -1 | 1) => {
    setProgression(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const addCustomChord = () => {
    const name = customChord.trim();
    if (!name) return;
    const degree = diatonicChords.find(c => c.chord === name)?.degree ?? '?';
    addChord(name, degree);
    setCustomChord('');
    setShowCustom(false);
  };

  const togglePlay = () => {
    if (isPlaying) { setIsPlaying(false); }
    else { setActiveSlot(0); setIsPlaying(true); }
  };

  const sharedProps = { progression, activeSlot: isPlaying ? activeSlot : -1, diatonicSet, onRemove: removeChord, onMove: moveChord };

  return (
    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-500 p-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Chord Progression</h1>
          <p className="text-[#16a34a] font-light tracking-[0.2em] uppercase text-[10px] mt-1">Build · visualise · play</p>
        </div>
        <div className="flex gap-2 pt-1 items-center">
          {/* Sync */}
          <button
            onClick={() => setSyncWithCircle(s => !s)}
            className={`px-3 py-1.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase transition-all ${
              syncWithCircle ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30' : 'bg-[#1A1A1A] text-white/40 hover:text-white'
            }`}
          >
            {syncWithCircle ? `⟳ ${activeKey.key}` : 'Sync ◎'}
          </button>
          {/* View toggle */}
          <div className="flex bg-[#1A1A1A] rounded-[6px] p-0.5">
            {(['chart', 'diagrams', 'playback'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wide transition-all ${
                  view === v ? 'bg-[#16a34a] text-[#0A0A0A]' : 'text-white/40 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-[#1A1A1A] rounded-[8px] px-4 py-2 shrink-0">
        {/* Key selector */}
        {!syncWithCircle && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Key</span>
              <select
                value={keyIndex}
                onChange={e => setKeyIndex(Number(e.target.value))}
                className="bg-[#222] text-white rounded-[4px] px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {CIRCLE_OF_FIFTHS.map((k, i) => <option key={k.key} value={i}>{k.key}</option>)}
              </select>
            </div>
            <div className="w-px h-4 bg-white/10" />
          </>
        )}

        {/* Major / Minor */}
        <div className="flex bg-[#222] rounded-[4px] p-0.5">
          {(['Major', 'Minor'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setIsMinor(mode === 'Minor')}
              className={`px-2.5 py-0.5 rounded-[3px] text-[10px] font-bold transition-all ${
                (mode === 'Minor') === isMinor ? 'bg-[#16a34a] text-[#0A0A0A]' : 'text-white/40 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {progression.length > 0 && (
          <>
            <div className="w-px h-4 bg-white/10" />
            {/* Play */}
            <button
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wide transition-all ${
                isPlaying ? 'bg-red-500/20 text-red-400' : 'bg-[#16a34a] text-[#0A0A0A] hover:bg-[#15803d]'
              }`}
            >
              {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            {/* BPM */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">BPM</span>
              <input
                type="number" value={bpm} min={40} max={240}
                onChange={e => setBpm(Math.max(40, Math.min(240, Number(e.target.value) || 80)))}
                className="w-14 bg-[#222] text-white text-xs font-bold rounded-[4px] px-2 py-1 text-center focus:outline-none"
              />
            </div>
            {/* Beats per chord */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Beats</span>
              <div className="flex bg-[#222] rounded-[4px] p-0.5">
                {[1, 2, 4, 8].map(b => (
                  <button
                    key={b}
                    onClick={() => setBeatsPerChord(b)}
                    className={`w-6 h-5 rounded-[2px] text-[9px] font-bold transition-all ${
                      beatsPerChord === b ? 'bg-[#16a34a] text-[#0A0A0A]' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            {/* Clear */}
            <button
              onClick={() => setProgression([])}
              className="ml-auto text-[9px] text-white/25 hover:text-white/50 uppercase tracking-widest transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* ── Diatonic palette ── */}
      <div className="shrink-0">
        <div className="text-[9px] text-white/20 uppercase tracking-widest font-bold mb-1.5">
          {activeKey.key} {isMinor ? 'Minor' : 'Major'} — tap to add
        </div>
        <div className="flex flex-wrap gap-1.5">
          {diatonicChords.map(({ degree, chord }) => (
            <button
              key={chord}
              onClick={() => addChord(chord, degree)}
              disabled={progression.length >= 16}
              className="group flex flex-col items-center px-3 py-1.5 rounded-[6px] bg-[#1A1A1A] border border-white/5 hover:border-[#16a34a]/40 hover:bg-[#16a34a]/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-w-[48px]"
            >
              <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">{chord}</span>
              <span className="text-[7px] text-white/25 font-mono mt-0.5">{degree}</span>
            </button>
          ))}

          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              disabled={progression.length >= 16}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[#1A1A1A] border border-dashed border-white/10 hover:border-white/25 text-white/25 hover:text-white/60 transition-all text-[10px] disabled:opacity-40"
            >
              <Plus className="w-3 h-3" /> custom
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text" value={customChord}
                onChange={e => setCustomChord(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCustomChord(); if (e.key === 'Escape') { setShowCustom(false); setCustomChord(''); } }}
                placeholder="e.g. F#m"
                autoFocus
                className="w-20 bg-[#222] text-white text-xs font-bold rounded-[4px] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
              />
              <button onClick={addCustomChord} className="px-2 py-1.5 bg-[#16a34a] text-[#0A0A0A] text-[10px] font-bold rounded-[4px]">Add</button>
              <button onClick={() => { setShowCustom(false); setCustomChord(''); }} className="px-2 py-1.5 text-white/30 text-[10px] hover:text-white">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Progression area ── */}
      <div className="flex-1 bg-[#1A1A1A] rounded-[8px] min-h-0 overflow-hidden flex flex-col">
        {progression.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/15 gap-3">
            <Music2 className="w-10 h-10" />
            <p className="text-xs tracking-wide">Tap a chord above to start your progression</p>
          </div>
        ) : view === 'diagrams' ? (
          <DiagramsView {...sharedProps} />
        ) : (
          <ChartView {...sharedProps} />
        )}
      </div>
    </div>
  );
}

// ── Chart View ────────────────────────────────────────────────────────────────

interface ViewProps {
  progression: ChordSlot[];
  activeSlot: number;
  diatonicSet: Set<string>;
  onRemove: (id: number) => void;
  onMove: (id: number, dir: -1 | 1) => void;
}

function ChartView({ progression, activeSlot, diatonicSet, onRemove, onMove }: ViewProps) {
  const bars: ChordSlot[][] = [];
  for (let i = 0; i < progression.length; i += 4) bars.push(progression.slice(i, i + 4));

  return (
    <div className="p-4 overflow-y-auto flex flex-col gap-2 custom-scrollbar h-full">
      {bars.map((bar, barIdx) => (
        <div key={barIdx} className="flex gap-2 items-stretch">
          <div className="w-0.5 bg-white/10 rounded-full shrink-0" />
          {bar.map((slot, slotInBar) => {
            const gIdx = barIdx * 4 + slotInBar;
            const isActive = gIdx === activeSlot;
            const isOut = !diatonicSet.has(slot.chordName);
            return (
              <div
                key={slot.id}
                className={`relative flex-1 flex flex-col items-center justify-center py-5 px-2 rounded-[6px] border transition-all ${
                  isActive ? 'bg-[#16a34a]/15 border-[#16a34a]/50' : 'bg-[#141414] border-white/5'
                }`}
              >
                {/* Out-of-key dot */}
                {isOut && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" title="Not in key" />}

                {/* Active pulse */}
                {isActive && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />}

                <div className={`text-2xl font-extrabold tracking-tight ${isActive ? 'text-[#16a34a]' : 'text-white'}`}>
                  {slot.chordName}
                </div>
                <div className="text-[9px] text-white/25 font-mono mt-0.5">{slot.degree}</div>

                {/* Inline controls row */}
                <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                </div>
                <div className="absolute top-1 left-1 flex gap-0.5">
                  <button onClick={() => onMove(slot.id, -1)} className="w-4 h-4 rounded text-white/20 hover:text-white/60 text-[9px] flex items-center justify-center transition-colors">‹</button>
                  <button onClick={() => onMove(slot.id, 1)}  className="w-4 h-4 rounded text-white/20 hover:text-white/60 text-[9px] flex items-center justify-center transition-colors">›</button>
                </div>
                <button onClick={() => onRemove(slot.id)} className="absolute top-1 right-1 w-4 h-4 rounded text-white/20 hover:text-red-400 text-[10px] flex items-center justify-center transition-colors">×</button>
              </div>
            );
          })}
          {/* Empty filler slots */}
          {bar.length < 4 && Array.from({ length: 4 - bar.length }).map((_, i) => (
            <div key={i} className="flex-1 rounded-[6px] border border-dashed border-white/5" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Diagrams View ─────────────────────────────────────────────────────────────

function DiagramsView({ progression, activeSlot, diatonicSet, onRemove, onMove }: ViewProps) {
  return (
    <div className="flex-1 p-3 overflow-x-auto flex items-end gap-3 custom-scrollbar pb-6" style={{ alignItems: 'flex-start' }}>
      {progression.map((slot, idx) => {
        const isActive = idx === activeSlot;
        const isOut = !diatonicSet.has(slot.chordName);
        return (
          <div
            key={slot.id}
            className={`relative flex flex-col items-center gap-1 shrink-0 px-2 pt-2 pb-3 rounded-[8px] border transition-all ${
              isActive ? 'bg-[#16a34a]/10 border-[#16a34a]/40' : 'bg-[#141414] border-white/5'
            }`}
          >
            {isOut && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />}
            <ChordDiagram chordName={slot.chordName} active={isActive} />
            <div className={`text-xs font-bold ${isActive ? 'text-[#16a34a]' : 'text-white/80'}`}>{slot.chordName}</div>
            <div className="text-[8px] text-white/25 font-mono">{slot.degree}</div>

            {/* Controls */}
            <div className="flex gap-1 mt-1">
              <button onClick={() => onMove(slot.id, -1)} className="w-5 h-5 bg-[#222] hover:bg-[#333] rounded text-white/30 hover:text-white text-[10px] flex items-center justify-center transition-colors">‹</button>
              <button onClick={() => onRemove(slot.id)} className="w-5 h-5 bg-[#222] hover:bg-red-900/40 rounded text-white/30 hover:text-red-400 text-[10px] flex items-center justify-center transition-colors">×</button>
              <button onClick={() => onMove(slot.id, 1)} className="w-5 h-5 bg-[#222] hover:bg-[#333] rounded text-white/30 hover:text-white text-[10px] flex items-center justify-center transition-colors">›</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
