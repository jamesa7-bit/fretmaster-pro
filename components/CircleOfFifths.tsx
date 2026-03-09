'use client';

import { useState, useEffect } from 'react';
import { CIRCLE_OF_FIFTHS, getScaleNotes, getNoteName } from '@/lib/music-theory';
import { Layers, RefreshCw } from 'lucide-react';
import { useAppContext } from './AppContext';
import { useMusicContext } from '@/contexts/MusicContext';
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

export default function CircleOfFifths() {
  const [activeKeyIndex, setActiveKeyIndex] = useState(0);
  const [orientation, setOrientation] = useState<'major' | 'minor'>('major');
  const [showFunctions, setShowFunctions] = useState(false);
  const [showJazzSubs, setShowJazzSubs] = useState(false);
  const { setCurrentContext } = useAppContext();
  const { setSelectedKey } = useMusicContext();

  const activeKey = CIRCLE_OF_FIFTHS[activeKeyIndex];

  useEffect(() => {
    setCurrentContext(`Viewing Circle of Fifths: Key of ${orientation === 'major' ? activeKey.key + ' Major' : activeKey.minor}`);
  }, [activeKey, orientation, setCurrentContext]);

  const getDiatonicChords = (rootIndex: number, isMinor: boolean) => {
    const scaleNotes = getScaleNotes(rootIndex, isMinor ? 'Natural Minor' : 'Major');
    if (isMinor) {
      return [
        { degree: 'i', chord: `${getNoteName(scaleNotes[0])}m` },
        { degree: 'ii°', chord: `${getNoteName(scaleNotes[1])}dim` },
        { degree: 'III', chord: getNoteName(scaleNotes[2]) },
        { degree: 'iv', chord: `${getNoteName(scaleNotes[3])}m` },
        { degree: 'v', chord: `${getNoteName(scaleNotes[4])}m` },
        { degree: 'VI', chord: getNoteName(scaleNotes[5]) },
        { degree: 'VII', chord: getNoteName(scaleNotes[6]) },
      ];
    } else {
      return [
        { degree: 'I', chord: getNoteName(scaleNotes[0]) },
        { degree: 'ii', chord: `${getNoteName(scaleNotes[1])}m` },
        { degree: 'iii', chord: `${getNoteName(scaleNotes[2])}m` },
        { degree: 'IV', chord: getNoteName(scaleNotes[3]) },
        { degree: 'V', chord: getNoteName(scaleNotes[4]) },
        { degree: 'vi', chord: `${getNoteName(scaleNotes[5])}m` },
        { degree: 'vii°', chord: `${getNoteName(scaleNotes[6])}dim` },
      ];
    }
  };

  const diatonicChords = getDiatonicChords(activeKey.index, orientation === 'minor');
  const scaleNotes = getScaleNotes(activeKey.index, orientation === 'minor' ? 'Natural Minor' : 'Major');

  const dominantIndex = (activeKeyIndex + 1) % 12;
  const subdominantIndex = (activeKeyIndex + 11) % 12;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-extrabold tracking-tighter">Circle of Fifths</h1>
            <InfoTooltip title="Circle of Fifths" sections={COF_INFO} />
          </div>
          <p className="text-[#16a34a] font-light tracking-[0.2em] uppercase text-xs mt-3">Interactive harmonic relationships</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setOrientation(o => o === 'major' ? 'minor' : 'major')}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold tracking-wide uppercase transition-all bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            {orientation === 'major' ? 'Switch to Minor' : 'Switch to Major'}
          </button>

          <button
            onClick={() => setShowFunctions(!showFunctions)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold tracking-wide uppercase transition-all ${
              showFunctions
                ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30'
                : 'bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Functions
          </button>

          <button
            onClick={() => setShowJazzSubs(!showJazzSubs)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs font-bold tracking-wide uppercase transition-all ${
              showJazzSubs
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Jazz Subs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Circle Visualization */}
        <div className="bg-[#1A1A1A] rounded-[8px] p-8 flex items-center justify-center min-h-[500px]">
          <svg viewBox="-200 -200 400 400" className="w-full max-w-[400px] h-auto overflow-visible">
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

              const outerRadius = 140;
              const outerX = Math.cos(angle) * outerRadius;
              const outerY = Math.sin(angle) * outerRadius;

              const innerRadius = 90;
              const innerX = Math.cos(angle) * innerRadius;
              const innerY = Math.sin(angle) * innerRadius;

              const sliceAngleStart = ((i - 0.5) * 30 - 90) * (Math.PI / 180);
              const sliceAngleEnd = ((i + 0.5) * 30 - 90) * (Math.PI / 180);

              const x1 = Math.cos(sliceAngleStart) * 180;
              const y1 = Math.sin(sliceAngleStart) * 180;
              const x2 = Math.cos(sliceAngleEnd) * 180;
              const y2 = Math.sin(sliceAngleEnd) * 180;

              const ix1 = Math.cos(sliceAngleStart) * 50;
              const iy1 = Math.sin(sliceAngleStart) * 50;
              const ix2 = Math.cos(sliceAngleEnd) * 50;
              const iy2 = Math.sin(sliceAngleEnd) * 50;

              const slicePath = `M ${ix1} ${iy1} L ${x1} ${y1} A 180 180 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A 50 50 0 0 0 ${ix1} ${iy1} Z`;

              let fillColor = '#1A1A1A';
              if (isSelected) fillColor = '#16a34a';
              else if (showFunctions) {
                if (isDominant) fillColor = '#b91c1c';
                else if (isSubdominant) fillColor = '#047857';
              }

              const majorTextFill = isSelected && orientation === 'major' ? '#0A0A0A' : 'rgba(255,255,255,0.65)';
              const minorTextFill = isSelected && orientation === 'minor' ? '#0A0A0A' : 'rgba(255,255,255,0.35)';

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
                    stroke="#0A0A0A"
                    strokeWidth="2"
                    className="transition-colors duration-300"
                    filter={isSelected ? 'url(#glow)' : ''}
                  />

                  <text
                    x={outerX} y={outerY}
                    fill={majorTextFill}
                    fontSize={isSelected && orientation === 'major' ? '24' : '18'}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="transition-all duration-300"
                  >
                    {keyObj.key}
                  </text>

                  <text
                    x={innerX} y={innerY}
                    fill={minorTextFill}
                    fontSize={isSelected && orientation === 'minor' ? '18' : '14'}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="transition-all duration-300"
                  >
                    {keyObj.minor}
                  </text>

                  {keyObj.sharps > 0 && (
                    <text x={outerX} y={outerY + 20} fill="rgba(255,255,255,0.2)" fontSize="10" textAnchor="middle" dominantBaseline="central">
                      {keyObj.sharps}#
                    </text>
                  )}
                  {keyObj.flats > 0 && (
                    <text x={outerX} y={outerY + 20} fill="rgba(255,255,255,0.2)" fontSize="10" textAnchor="middle" dominantBaseline="central">
                      {keyObj.flats}b
                    </text>
                  )}

                  {showFunctions && isSelected && (
                    <text x={outerX} y={outerY - 25} fill="#16a34a" fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                      TONIC
                    </text>
                  )}
                  {showFunctions && isDominant && (
                    <text x={outerX} y={outerY - 25} fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                      DOMINANT
                    </text>
                  )}
                  {showFunctions && isSubdominant && (
                    <text x={outerX} y={outerY - 25} fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                      SUBDOM
                    </text>
                  )}

                  {showJazzSubs && isSelected && (
                    <g>
                      <path
                        d={`M 0 0 L ${Math.cos((i + 6) * 30 * Math.PI / 180 - Math.PI / 2) * 180} ${Math.sin((i + 6) * 30 * Math.PI / 180 - Math.PI / 2) * 180}`}
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={Math.cos((i + 6) * 30 * Math.PI / 180 - Math.PI / 2) * 150}
                        y={Math.sin((i + 6) * 30 * Math.PI / 180 - Math.PI / 2) * 150}
                        fill="#10b981"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        Tritone Sub
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            <circle cx="0" cy="0" r="45" fill="#111" />
            <text x="0" y="-5" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
              {orientation === 'major' ? activeKey.key : activeKey.minor}
            </text>
            <text x="0" y="15" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle" dominantBaseline="central">
              {orientation === 'major' ? 'Major' : 'Minor'}
            </text>
          </svg>
        </div>

        {/* Info Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#1A1A1A] rounded-[8px] p-6">
            <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-4">Key Signature</label>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-extrabold text-[#16a34a]">
                {activeKey.sharps > 0 ? `${activeKey.sharps}♯` : activeKey.flats > 0 ? `${activeKey.flats}♭` : '0'}
              </div>
              <div className="text-white/50 font-light">
                {activeKey.sharps > 0 ? 'Sharps' : activeKey.flats > 0 ? 'Flats' : 'No sharps or flats'}
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-[8px] p-6">
            <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-4">Diatonic Chords</label>
            <div className="grid grid-cols-4 gap-3">
              {diatonicChords.map((chord, i) => (
                <div key={i} className="bg-[#222] rounded-[6px] p-3 text-center">
                  <div className="text-xs text-white/30 font-bold mb-1 tracking-widest uppercase">{chord.degree}</div>
                  <div className="text-lg font-bold text-white">{chord.chord}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-[8px] p-6">
            <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-4">Scale Notes</label>
            <div className="flex flex-wrap gap-2">
              {scaleNotes.map((noteIndex, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center font-bold text-white/70 text-sm">
                  {getNoteName(noteIndex, activeKey.flats > 0)}
                </div>
              ))}
            </div>
          </div>

          {showJazzSubs && (
            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-[8px] p-6">
              <label className="block text-xs font-light tracking-[0.2em] uppercase text-emerald-400 mb-4">Jazz Substitutions</label>
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
