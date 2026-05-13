'use client';

import { useState, useEffect } from 'react';
import { CIRCLE_OF_FIFTHS, getScaleNotes, getNoteName } from '@/lib/music-theory';
import { CHORD_DICTIONARY } from '@/lib/chord-dictionary';
import { Layers, RefreshCw, X } from 'lucide-react';
import { useAppContext } from './AppContext';
import { useMusicContext } from '@/contexts/MusicContext';
import { useTheme } from '@/contexts/ThemeContext';
import InfoTooltip from './InfoTooltip';

const COF_INFO = [
  {
    heading: 'What is the Circle of Fifths?',
    content: 'A clock-like diagram of all 12 keys arranged so each neighbour is a perfect fifth apart. Adjacent keys share the most notes, making them harmonically close.',
  },
  {
    heading: 'Functions & Jazz Subs',
    content: 'Toggle "Functions" to see Roman numeral roles (I = tonic, IV = subdominant, V = dominant). Toggle "Jazz Subs" to reveal tritone substitutions — chords a tritone away from the V that can replace it for a smoother bass line.',
  },
  {
    heading: 'How to use this tool',
    content: 'Click any key on the circle to explore its diatonic chords and scale. Use the Functions view to understand chord roles. Use Jazz Subs to find substitution chords. The selected key syncs to other tools (Scale Library, Arpeggio Drills, etc.) via the Sync button.',
  },
];

// ── Types ────────────────────────────────────────────────────────────────────

type ChordMode = 'chords' | 'triads';
type TriadInversion = 'root' | '1st' | '2nd';

interface CalculatedVoicing {
  frets: number[];
  fingers: number[];
  baseFret: number;
  shape: string;
}

// ── Modes ────────────────────────────────────────────────────────────────────

interface ModeEntry {
  label: string;
  scaleKey: string;
  circleOffset: number;
  semitoneOffset: number;
}

interface SelectedMode {
  label: string;
  scaleKey: string;
  semitoneOffset: number;
  circleIndex: number;
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

// Diatonic keys of any major key occupy these circle-of-fifths offsets:
// IV is one step counter-clockwise (offset 11), I–VII clockwise (0–5).
const DIATONIC_OFFSETS = new Set([0, 1, 2, 3, 4, 5, 11]);
const DEGREE_FOR_OFFSET: Record<number, string> = {
  0: 'I', 1: 'V', 2: 'II', 3: 'VI', 4: 'III', 5: 'VII', 11: 'IV',
};

// Circle SVG geometry constants
const OUTER_R = 140;
const INNER_R = 52;
const MAJOR_R = 108;
const DEGREE_R = 80;
const MINOR_R = 63;
const OVERLAY_R = 155; // function label overlay outside outer arc
const FRAME_OUTER_R = 148;
const FRAME_INNER_R = 50;

function getSliceDegree(
  circleIndex: number,
  activeKeyIndex: number,
): { isDiatonic: boolean; degreeLabel: string | null } {
  const relOffset = (circleIndex - activeKeyIndex + 12) % 12;
  const isDiatonic = DIATONIC_OFFSETS.has(relOffset);
  return {
    isDiatonic,
    degreeLabel: isDiatonic ? DEGREE_FOR_OFFSET[relOffset] : null,
  };
}

// ── Voicing engine ───────────────────────────────────────────────────────────

const NOTE_MAP: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

function parseChordName(name: string): { rootIndex: number; quality: 'major' | 'minor' | 'dim' } {
  const match = name.match(/^([A-G][#b]?)(.*)/);
  const root = match?.[1] ?? 'C';
  const suffix = match?.[2] ?? '';
  const rootIndex = NOTE_MAP[root] ?? 0;
  const quality = suffix.startsWith('dim') ? 'dim' : suffix.startsWith('m') ? 'minor' : 'major';
  return { rootIndex, quality };
}

// Barre chord voicings (E-shape and A-shape), closest to targetFret
const LOW_E = 4, A_STR = 9;

function getPositionVoicing(chordName: string, targetFret: number): CalculatedVoicing | null {
  const { rootIndex, quality } = parseChordName(chordName);
  const eFret = ((rootIndex - LOW_E + 12) % 12);
  const aFret = ((rootIndex - A_STR + 12) % 12);

  const eShape = quality === 'minor' ? (f: number) => [f, f+2, f+2, f, f, f]
    : quality === 'dim'              ? (f: number) => [f, f+2, f+3, f+2, -1, -1]
    :                                  (f: number) => [f, f+2, f+2, f+1, f, f];
  const eFingers = quality === 'minor' ? [1,3,4,1,1,1] : quality === 'dim' ? [1,2,4,3,-1,-1] : [1,3,4,2,1,1];

  const aShape = quality === 'minor' ? (f: number) => [-1, f, f+2, f+2, f+1, f]
    : quality === 'dim'              ? (f: number) => [-1, f, f+1, f+2, f+1, -1]
    :                                  (f: number) => [-1, f, f+2, f+2, f+2, f];
  const aFingers = quality === 'minor' ? [-1,1,3,4,2,1] : quality === 'dim' ? [-1,1,2,4,3,-1] : [-1,1,3,4,2,1];

  const shapes: Array<{ label: string; baseFret: number; makeFrets: (f: number) => number[]; fingers: number[] }> = [];
  for (const f of [eFret, eFret + 12]) if (f >= 1 && f <= 19) shapes.push({ label: 'E-shape', baseFret: f, makeFrets: eShape, fingers: eFingers });
  for (const f of [aFret, aFret + 12]) if (f >= 1 && f <= 19) shapes.push({ label: 'A-shape', baseFret: f, makeFrets: aShape, fingers: aFingers });
  if (!shapes.length) return null;

  shapes.sort((a, b) => Math.abs(a.baseFret - targetFret) - Math.abs(b.baseFret - targetFret));
  const best = shapes[0];
  return { frets: best.makeFrets(best.baseFret), fingers: best.fingers, baseFret: best.baseFret, shape: best.label };
}

// Triad voicings on GBE (strings 3,2,1) or DGB (strings 4,3,2)
const D_OPEN = 2, G_OPEN = 7, B_OPEN = 11, E_OPEN = 4;

function getTriadVoicing(chordName: string, inversion: TriadInversion, targetFret: number | null): CalculatedVoicing | null {
  const { rootIndex, quality } = parseChordName(chordName);
  const root = rootIndex;
  const third = (rootIndex + (quality === 'major' ? 4 : 3)) % 12;
  const fifth = (rootIndex + (quality === 'dim' ? 6 : 7)) % 12;

  // n1 = lowest string note, n2 = middle, n3 = highest
  const [n1, n2, n3] = inversion === 'root' ? [root, third, fifth]
    : inversion === '1st'                   ? [third, fifth, root]
    :                                         [fifth, root, third];

  const allCandidates: Array<{ frets: number[]; fingers: number[]; minFret: number }> = [];

  function addCandidates(bases: [number, number, number], makeFrets: (a: number, b: number, c: number) => number[]) {
    for (const o1 of [0, 1]) for (const o2 of [0, 1]) for (const o3 of [0, 1]) {
      const f1 = bases[0] + o1 * 12, f2 = bases[1] + o2 * 12, f3 = bases[2] + o3 * 12;
      const span = Math.max(f1, f2, f3) - Math.min(f1, f2, f3);
      if (span <= 5 && Math.max(f1, f2, f3) <= 22) {
        const frets = makeFrets(f1, f2, f3);
        const unique = [...new Set([f1, f2, f3])].sort((a, b) => a - b);
        const fm: Record<number, number> = {};
        unique.forEach((f, i) => { fm[f] = i + 1; });
        allCandidates.push({ frets, fingers: frets.map(f => f > 0 ? fm[f] : -1), minFret: Math.min(f1, f2, f3) });
      }
    }
  }

  // GBE string set (G=3rd, B=2nd, high E=1st)
  addCandidates(
    [(n1 - G_OPEN + 12) % 12, (n2 - B_OPEN + 12) % 12, (n3 - E_OPEN + 12) % 12],
    (gF, bF, eF) => [-1, -1, -1, gF, bF, eF]
  );
  // DGB string set (D=4th, G=3rd, B=2nd)
  addCandidates(
    [(n1 - D_OPEN + 12) % 12, (n2 - G_OPEN + 12) % 12, (n3 - B_OPEN + 12) % 12],
    (dF, gF, bF) => [-1, -1, dF, gF, bF, -1]
  );

  if (!allCandidates.length) return null;

  const target = targetFret ?? 0;
  allCandidates.sort((a, b) => Math.abs(a.minFret - target) - Math.abs(b.minFret - target));
  const best = allCandidates[0];

  const invLabel = inversion === 'root' ? 'Root pos' : inversion === '1st' ? '1st inv' : '2nd inv';
  return { frets: best.frets, fingers: best.fingers, baseFret: best.minFret, shape: `Triad · ${invLabel}` };
}

// ── Mini chord diagram SVG ───────────────────────────────────────────────────

interface ChordDiagramProps {
  chordName: string;
  calculatedVoicing?: CalculatedVoicing | null;
}

function ChordDiagram({ chordName, calculatedVoicing }: ChordDiagramProps) {
  const voicingSource = calculatedVoicing ?? CHORD_DICTIONARY[chordName];
  if (!voicingSource) {
    return <div className="text-white/30 text-xs text-center py-4">No shape found for {chordName}</div>;
  }

  const { frets, fingers } = voicingSource;
  const numStrings = 6;
  const numFrets = 5;

  const frettedNotes = frets.filter(f => f > 0);
  const minFret = frettedNotes.length > 0 ? Math.min(...frettedNotes) : 1;
  const maxFret = frettedNotes.length > 0 ? Math.max(...frettedNotes) : 1;
  const startFret = minFret > 1 && (maxFret - minFret) < 4 ? minFret : 1;
  const showNut = startFret === 1;

  const colW = 28, rowH = 28, padLeft = 24, padTop = 24, padRight = 10, padBottom = 16;
  const svgWidth = padLeft + (numStrings - 1) * colW + padRight;
  const svgHeight = padTop + numFrets * rowH + padBottom;
  const inlayFrets = [3, 5, 7, 9, 12];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 text-[10px] text-white/30">
        {calculatedVoicing && <span className="text-[#16a34a]/70">{calculatedVoicing.shape}</span>}
        {!showNut && <span>{startFret}fr</span>}
      </div>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width={svgWidth * 1.4} height={svgHeight * 1.4}>
        {showNut && <rect x={padLeft - 2} y={padTop} width={(numStrings - 1) * colW + 4} height={4} fill="#555" rx={1} />}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line key={`fret-${i}`} x1={padLeft} y1={padTop + i * rowH} x2={padLeft + (numStrings - 1) * colW} y2={padTop + i * rowH} stroke="#333" strokeWidth={1} />
        ))}
        {Array.from({ length: numStrings }).map((_, s) => (
          <line key={`str-${s}`} x1={padLeft + s * colW} y1={padTop} x2={padLeft + s * colW} y2={padTop + numFrets * rowH} stroke="#333" strokeWidth={1.5} />
        ))}
        {inlayFrets.map(f => {
          const rel = f - startFret + 1;
          if (rel < 1 || rel > numFrets) return null;
          return <circle key={`inlay-${f}`} cx={padLeft + ((numStrings - 1) / 2) * colW} cy={padTop + (rel - 0.5) * rowH} r={3} fill="#2a2a2a" />;
        })}
        {frets.map((fret, s) => {
          const cx = padLeft + s * colW;
          const cy = padTop - 10;
          if (fret === -1) return <text key={`top-${s}`} x={cx} y={cy} fill="#ff4444" fontSize={11} fontWeight="bold" textAnchor="middle" dominantBaseline="central">×</text>;
          if (fret === 0) return <circle key={`top-${s}`} cx={cx} cy={cy} r={4} fill="none" stroke="#666" strokeWidth={1.5} />;
          return null;
        })}
        {frets.map((fret, s) => {
          if (fret <= 0) return null;
          const relFret = fret - startFret + 1;
          if (relFret < 1 || relFret > numFrets) return null;
          const cx = padLeft + s * colW;
          const cy = padTop + (relFret - 0.5) * rowH;
          return (
            <g key={`dot-${s}`}>
              <circle cx={cx} cy={cy} r={10} fill="#16a34a" />
              {fingers[s] > 0 && <text x={cx} y={cy} fill="#0A0A0A" fontSize={9} fontWeight="bold" textAnchor="middle" dominantBaseline="central">{fingers[s]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CircleOfFifths() {
  const [activeKeyIndex, setActiveKeyIndex] = useState(0);
  const [orientation, setOrientation] = useState<'major' | 'minor'>('major');
  const [showFunctions, setShowFunctions] = useState(false);
  const [showJazzSubs, setShowJazzSubs] = useState(false);
  const [selectedChord, setSelectedChord] = useState<{ name: string; degree: string } | null>(null);
  const [targetFret, setTargetFret] = useState<number | null>(null);
  const [chordMode, setChordMode] = useState<ChordMode>('chords');
  const [triadInversion, setTriadInversion] = useState<TriadInversion>('root');
  const [selectedMode, setSelectedMode] = useState<SelectedMode | null>(null);
  const { setCurrentContext } = useAppContext();
  const { setSelectedKey } = useMusicContext();
  const { theme } = useTheme();
  const dark = theme !== 'light';

  const colors = {
    tonicFill:        '#16a34a',
    diatonicFill:     dark ? '#052e16' : '#dcfce7',
    diatonicStroke:   dark ? '#166534' : '#86efac',
    nonDiatonicFill:  dark ? '#0d0d0d' : '#ececec',
    nonDiatonicStroke:dark ? '#181818' : '#e0e0e0',
    sliceStroke:      dark ? '#0a0a0a' : '#f4f4f5',
    tonicMajorLabel:  '#ffffff',
    diatonicMajorLabel: dark ? '#86efac' : '#166534',
    nonDiatonicMajorLabel: dark ? '#2a2a2a' : '#cccccc',
    degreeI:          dark ? '#4ade80' : '#15803d',
    degreeOther:      '#16a34a',
    diatonicMinorLabel: 'rgba(22,163,74,0.55)',
    nonDiatonicMinorLabel: dark ? '#1e1e1e' : '#e0e0e0',
    frameStroke:      dark ? '#16a34a' : '#15803d',
    centerFill:       dark ? '#0a0a0a' : '#f0f0f0',
    centerStroke:     dark ? '#1a1a1a' : '#dddddd',
    centerPrimaryText: dark ? '#ffffff' : '#0a0a0a',
    centerSecondaryText: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
    modeActive:       dark ? '#16a34a' : '#15803d',
    modeInactive:     dark ? 'rgba(22,163,74,0.45)' : 'rgba(22,163,74,0.5)',
  };

  const activeKey = CIRCLE_OF_FIFTHS[activeKeyIndex];

  useEffect(() => {
    setCurrentContext(`Viewing Circle of Fifths: Key of ${orientation === 'major' ? activeKey.key + ' Major' : activeKey.minor}`);
  }, [activeKey, orientation, setCurrentContext]);

  useEffect(() => { setSelectedChord(null); }, [activeKeyIndex, orientation]);

  useEffect(() => { setSelectedMode(null); }, [activeKeyIndex]);

  const getDiatonicChords = (rootIndex: number, isMinor: boolean) => {
    const scaleNotes = getScaleNotes(rootIndex, isMinor ? 'Natural Minor' : 'Major');
    if (isMinor) {
      return [
        { degree: 'i',   chord: `${getNoteName(scaleNotes[0])}m` },
        { degree: 'II',  chord: getNoteName(scaleNotes[1]) },
        { degree: 'III', chord: getNoteName(scaleNotes[2]) },
        { degree: 'iv',  chord: `${getNoteName(scaleNotes[3])}m` },
        { degree: 'v',   chord: `${getNoteName(scaleNotes[4])}m` },
        { degree: 'VI',  chord: getNoteName(scaleNotes[5]) },
        { degree: 'VII', chord: getNoteName(scaleNotes[6]) },
      ];
    }
    return [
      { degree: 'I',    chord: getNoteName(scaleNotes[0]) },
      { degree: 'ii',   chord: `${getNoteName(scaleNotes[1])}m` },
      { degree: 'iii',  chord: `${getNoteName(scaleNotes[2])}m` },
      { degree: 'IV',   chord: getNoteName(scaleNotes[3]) },
      { degree: 'V',    chord: getNoteName(scaleNotes[4]) },
      { degree: 'vi',   chord: `${getNoteName(scaleNotes[5])}m` },
      { degree: 'VII', chord: getNoteName(scaleNotes[6]) },
    ];
  };

  const diatonicChords = getDiatonicChords(activeKey.index, orientation === 'minor');
  const scaleNotes = getScaleNotes(activeKey.index, orientation === 'minor' ? 'Natural Minor' : 'Major');
  const dominantIndex = (activeKeyIndex + 1) % 12;
  const subdominantIndex = (activeKeyIndex + 11) % 12;

  // Resolve the voicing for the selected chord
  const selectedVoicing: CalculatedVoicing | null = selectedChord
    ? chordMode === 'triads'
      ? getTriadVoicing(selectedChord.name, triadInversion, targetFret)
      : targetFret !== null
        ? getPositionVoicing(selectedChord.name, targetFret)
        : null
    : null;

  // Per-card fret badge
  function getCardBadge(chordName: string): string | null {
    if (chordMode === 'triads') {
      const v = getTriadVoicing(chordName, triadInversion, targetFret);
      return v ? `${v.baseFret}fr` : null;
    }
    if (targetFret !== null) {
      const v = getPositionVoicing(chordName, targetFret);
      return v ? `${v.baseFret}fr` : null;
    }
    return null;
  }

  function toggleMode(mode: ModeEntry, circleIdx: number) {
    const isSelected = selectedMode?.circleIndex === circleIdx;
    setSelectedMode(isSelected ? null : {
      label: mode.label,
      scaleKey: mode.scaleKey,
      semitoneOffset: mode.semitoneOffset,
      circleIndex: circleIdx,
    });
  }

  // Pre-compute window frame coordinates (IV slice left edge → VII slice right edge = 210°)
  const frameStartAngle = ((activeKeyIndex - 1.5) * 30 - 90) * (Math.PI / 180);
  const frameEndAngle   = ((activeKeyIndex + 5.5) * 30 - 90) * (Math.PI / 180);
  const frameOx1 = Math.cos(frameStartAngle) * FRAME_OUTER_R;
  const frameOy1 = Math.sin(frameStartAngle) * FRAME_OUTER_R;
  const frameOx2 = Math.cos(frameEndAngle)   * FRAME_OUTER_R;
  const frameOy2 = Math.sin(frameEndAngle)   * FRAME_OUTER_R;
  const frameIx1 = Math.cos(frameStartAngle) * FRAME_INNER_R;
  const frameIy1 = Math.sin(frameStartAngle) * FRAME_INNER_R;
  const frameIx2 = Math.cos(frameEndAngle)   * FRAME_INNER_R;
  const frameIy2 = Math.sin(frameEndAngle)   * FRAME_INNER_R;

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-500 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Circle of Fifths</h1>
            <InfoTooltip title="Circle of Fifths" sections={COF_INFO} />
          </div>
          <p className="text-[#16a34a] font-light tracking-[0.2em] uppercase text-xs mt-1">Interactive harmonic relationships</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setOrientation(o => o === 'major' ? 'minor' : 'major')}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold tracking-wide uppercase transition-all bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white">
            <RefreshCw className="w-4 h-4" />
            {orientation === 'major' ? 'Switch to Minor' : 'Switch to Major'}
          </button>
          <button onClick={() => setShowFunctions(!showFunctions)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold tracking-wide uppercase transition-all ${showFunctions ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30' : 'bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white'}`}>
            <Layers className="w-4 h-4" />Functions
          </button>
          <button onClick={() => setShowJazzSubs(!showJazzSubs)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold tracking-wide uppercase transition-all ${showJazzSubs ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white'}`}>
            <Layers className="w-4 h-4" />Jazz Subs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Circle */}
        <div className="bg-[#1A1A1A] rounded-[8px] p-4 flex items-center justify-center min-h-[400px]">
          <svg viewBox="-220 -220 440 440" className="w-full max-w-[400px] h-auto overflow-visible">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {CIRCLE_OF_FIFTHS.map((keyObj, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const isSelected = i === activeKeyIndex;
              const isDominant = i === dominantIndex;
              const isSubdominant = i === subdominantIndex;
              const { isDiatonic, degreeLabel } = getSliceDegree(i, activeKeyIndex);

              // Slice geometry
              const sAS = ((i - 0.5) * 30 - 90) * (Math.PI / 180);
              const sAE = ((i + 0.5) * 30 - 90) * (Math.PI / 180);
              const x1 = Math.cos(sAS) * OUTER_R, y1 = Math.sin(sAS) * OUTER_R;
              const x2 = Math.cos(sAE) * OUTER_R, y2 = Math.sin(sAE) * OUTER_R;
              const ix1 = Math.cos(sAS) * INNER_R, iy1 = Math.sin(sAS) * INNER_R;
              const ix2 = Math.cos(sAE) * INNER_R, iy2 = Math.sin(sAE) * INNER_R;
              const slicePath = `M ${ix1} ${iy1} L ${x1} ${y1} A ${OUTER_R} ${OUTER_R} 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A ${INNER_R} ${INNER_R} 0 0 0 ${ix1} ${iy1} Z`;

              // Fill: tonic > functions overlay > diatonic > non-diatonic
              let fillColor: string;
              let strokeColor = colors.sliceStroke;
              if (isSelected) {
                fillColor = colors.tonicFill;
              } else if (showFunctions && isDominant) {
                fillColor = '#b91c1c';
              } else if (showFunctions && isSubdominant) {
                fillColor = '#047857';
              } else if (isDiatonic) {
                fillColor = colors.diatonicFill;
                strokeColor = colors.diatonicStroke;
              } else {
                fillColor = colors.nonDiatonicFill;
                strokeColor = colors.nonDiatonicStroke;
              }

              // Label positions
              const majorX = Math.cos(angle) * MAJOR_R, majorY = Math.sin(angle) * MAJOR_R;
              const degreeX = Math.cos(angle) * DEGREE_R, degreeY = Math.sin(angle) * DEGREE_R;
              const minorX = Math.cos(angle) * MINOR_R, minorY = Math.sin(angle) * MINOR_R;
              const overlayX = Math.cos(angle) * OVERLAY_R, overlayY = Math.sin(angle) * OVERLAY_R;

              const majorLabelFill = isSelected
                ? colors.tonicMajorLabel
                : isDiatonic
                ? colors.diatonicMajorLabel
                : colors.nonDiatonicMajorLabel;

              const minorLabelFill = isDiatonic
                ? colors.diatonicMinorLabel
                : colors.nonDiatonicMinorLabel;

              return (
                <g
                  key={keyObj.key}
                  onClick={() => {
                    setActiveKeyIndex(i);
                    setSelectedKey({ rootIndex: keyObj.index, label: keyObj.key });
                  }}
                  className="cursor-pointer hover:opacity-80"
                >
                  <path
                    d={slicePath}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    className="transition-colors duration-300"
                    filter={isSelected ? 'url(#glow)' : ''}
                  />

                  {/* Major note name — outer ring */}
                  <text
                    x={majorX} y={majorY}
                    fill={majorLabelFill}
                    fontSize={isSelected ? '14' : '12'}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {keyObj.key}
                  </text>

                  {/* Degree label — mid ring, diatonic only */}
                  {degreeLabel && (
                    <text
                      x={degreeX} y={degreeY}
                      fill={degreeLabel === 'I' ? colors.degreeI : colors.degreeOther}
                      fontSize="9"
                      fontWeight={degreeLabel === 'I' ? '900' : '700'}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {degreeLabel}
                    </text>
                  )}

                  {/* Minor note name — inner ring */}
                  <text
                    x={minorX} y={minorY}
                    fill={minorLabelFill}
                    fontSize={isSelected && orientation === 'minor' ? '9' : '8'}
                    fontWeight={isSelected && orientation === 'minor' ? 'bold' : 'normal'}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {keyObj.minor}
                  </text>

                  {/* Functions overlay labels — placed outside the outer arc at r=155 */}
                  {showFunctions && isSelected && (
                    <text x={overlayX} y={overlayY} fill="#16a34a" fontSize="8" fontWeight="bold" textAnchor="middle" dominantBaseline="central">TONIC</text>
                  )}
                  {showFunctions && isDominant && (
                    <text x={overlayX} y={overlayY} fill="#f87171" fontSize="8" fontWeight="bold" textAnchor="middle" dominantBaseline="central">DOM</text>
                  )}
                  {showFunctions && isSubdominant && (
                    <text x={overlayX} y={overlayY} fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle" dominantBaseline="central">IV</text>
                  )}

                  {/* Jazz subs tritone line */}
                  {showJazzSubs && isSelected && (
                    <g>
                      <path
                        d={`M 0 0 L ${Math.cos((i + 6) * 30 * Math.PI / 180 - Math.PI / 2) * 140} ${Math.sin((i + 6) * 30 * Math.PI / 180 - Math.PI / 2) * 140}`}
                        stroke="#10b981" strokeWidth="2" strokeDasharray="4 4"
                      />
                      <text
                        x={Math.cos((i + 6) * 30 * Math.PI / 180 - Math.PI / 2) * 125}
                        y={Math.sin((i + 6) * 30 * Math.PI / 180 - Math.PI / 2) * 125}
                        fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle"
                      >
                        Tritone Sub
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {/* Diatonic window frame — brackets IV through VII (all 7 diatonic keys), 210° */}
            <g className="pointer-events-none" fill="none" stroke={colors.frameStroke} strokeWidth="3.5" strokeLinecap="round">
              <path d={`M ${frameOx1} ${frameOy1} A ${FRAME_OUTER_R} ${FRAME_OUTER_R} 0 1 1 ${frameOx2} ${frameOy2}`} />
              <path d={`M ${frameIx2} ${frameIy2} A ${FRAME_INNER_R} ${FRAME_INNER_R} 0 1 0 ${frameIx1} ${frameIy1}`} />
              <line x1={frameOx1} y1={frameOy1} x2={frameIx1} y2={frameIy1} />
              <line x1={frameOx2} y1={frameOy2} x2={frameIx2} y2={frameIy2} />
            </g>
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
                    toggleMode(mode, circleIdx);
                  }}
                >
                  {mode.label}
                </text>
              );
            })}
            <circle cx="0" cy="0" r="45" fill="#111" />
            <text x="0" y="-5" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="central">{orientation === 'major' ? activeKey.key : activeKey.minor}</text>
            <text x="0" y="15" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle" dominantBaseline="central">{orientation === 'major' ? 'Major' : 'Minor'}</text>
          </svg>
        </div>

        {/* Info Panel */}
        <div className="flex flex-col gap-3">
          {/* Key Signature */}
          <div className="bg-[#1A1A1A] rounded-[8px] p-4">
            <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-3">Key Signature</label>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-extrabold text-[#16a34a]">
                {activeKey.sharps > 0 ? `${activeKey.sharps}♯` : activeKey.flats > 0 ? `${activeKey.flats}♭` : '0'}
              </div>
              <div className="text-white/50 font-light">
                {activeKey.sharps > 0 ? 'Sharps' : activeKey.flats > 0 ? 'Flats' : 'No sharps or flats'}
              </div>
            </div>
          </div>

          {/* Diatonic Chords / Triads */}
          <div className="bg-[#1A1A1A] rounded-[8px] p-4">

            {/* Header row: label + mode toggle */}
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-light tracking-[0.2em] uppercase text-white/50">Diatonic Chords</label>
              <div className="flex rounded-[6px] overflow-hidden border border-white/10">
                {(['chords', 'triads'] as ChordMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setChordMode(mode)}
                    className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-all"
                    style={{
                      background: chordMode === mode ? '#16a34a' : 'transparent',
                      color: chordMode === mode ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Triad inversion selector */}
            {chordMode === 'triads' && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-white/25 uppercase tracking-wide">Inversion</span>
                <div className="flex gap-1">
                  {(['root', '1st', '2nd'] as TriadInversion[]).map(inv => (
                    <button
                      key={inv}
                      onClick={() => setTriadInversion(inv)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                      style={{
                        background: triadInversion === inv ? '#06b6d4' : '#2A2A2A',
                        color: triadInversion === inv ? '#0A0A0A' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {inv === 'root' ? 'Root' : inv}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Position selector */}
            <div className="mb-4">
              <div className="text-[10px] text-white/25 mb-2">
                {targetFret === null
                  ? `Tap a chord to see its shape${chordMode === 'triads' ? ' · top 3 strings' : ''}`
                  : `Position: fret ${targetFret} — showing closest ${chordMode === 'triads' ? 'triad' : 'barre'} voicings`}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setTargetFret(null)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                  style={{ background: targetFret === null ? '#16a34a' : '#2A2A2A', color: targetFret === null ? '#0A0A0A' : 'rgba(255,255,255,0.4)' }}
                >
                  Open
                </button>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(f => (
                  <button key={f} onClick={() => setTargetFret(f)}
                    className="w-7 h-7 rounded-full text-[10px] font-bold transition-all"
                    style={{ background: targetFret === f ? '#16a34a' : '#2A2A2A', color: targetFret === f ? '#0A0A0A' : 'rgba(255,255,255,0.4)' }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Chord grid */}
            <div className="grid grid-cols-4 gap-3">
              {diatonicChords.map((chord, i) => {
                const isSelected = selectedChord?.name === chord.chord;
                const badge = getCardBadge(chord.chord);
                return (
                  <button key={i}
                    onClick={() => setSelectedChord(isSelected ? null : { name: chord.chord, degree: chord.degree })}
                    className="rounded-[6px] p-2 text-center transition-all"
                    style={{ background: isSelected ? '#16a34a18' : '#222', border: `1px solid ${isSelected ? '#16a34a50' : 'transparent'}` }}
                  >
                    <div className="text-[9px] text-white/30 font-bold mb-0.5 tracking-widest uppercase">{chord.degree}</div>
                    <div className="text-base font-bold" style={{ color: isSelected ? '#16a34a' : 'white' }}>{chord.chord}</div>
                    {badge && <div className="text-[9px] text-white/25 mt-0.5">{badge}</div>}
                  </button>
                );
              })}
            </div>

            {/* Diagram panel */}
            {selectedChord && (
              <div className="mt-4 pt-4 border-t border-white/8 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-white font-bold text-base">{selectedChord.name}</span>
                    <span className="text-white/30 text-xs ml-2 tracking-widest uppercase">{selectedChord.degree}</span>
                    {selectedVoicing && (
                      <span className="text-white/20 text-xs ml-2">· {selectedVoicing.shape} · fret {selectedVoicing.baseFret}</span>
                    )}
                  </div>
                  <button onClick={() => setSelectedChord(null)} className="text-white/30 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <ChordDiagram chordName={selectedChord.name} calculatedVoicing={selectedVoicing} />
                </div>
              </div>
            )}
          </div>

          {/* Scale Notes */}
          <div className="bg-[#1A1A1A] rounded-[8px] p-4">
            {selectedMode ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50">
                    {getNoteName((activeKey.index + selectedMode.semitoneOffset) % 12, activeKey.flats > 0)} {selectedMode.label}
                  </label>
                  <button type="button" onClick={() => setSelectedMode(null)} className="text-white/30 hover:text-white transition-colors">
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
                    type="button"
                    key={mode.label}
                    onClick={() => toggleMode(mode, circleIdx)}
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

          {showJazzSubs && (
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-[8px] p-4">
              <label className="block text-xs font-light tracking-[0.2em] uppercase text-emerald-400 mb-3">Jazz Substitutions</label>
              <ul className="space-y-2 text-sm text-white/60">
                <li><strong className="text-emerald-300">Tritone Sub:</strong> Replace V7 ({getNoteName((activeKey.index + 7) % 12, activeKey.flats > 0)}7) with bII7 ({getNoteName((activeKey.index + 1) % 12, true)}7).</li>
                <li><strong className="text-emerald-300">Secondary Dom:</strong> V7/ii ({getNoteName((activeKey.index + 9) % 12, activeKey.flats > 0)}7) → ii ({getNoteName((activeKey.index + 2) % 12, activeKey.flats > 0)}m).</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
