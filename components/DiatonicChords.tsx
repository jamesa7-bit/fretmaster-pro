'use client';

import { useState, useEffect } from 'react';
import { DIATONIC_KEYS, CHORD_DICTIONARY, ChordShape } from '@/lib/chord-dictionary';
import Fretboard, { FretMarker } from './Fretboard';
import { useAppContext } from './AppContext';
import { ChevronDown, Music } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const DIATONIC_INFO = [
  {
    heading: 'What are Diatonic Chords?',
    content: 'Diatonic chords are the 7 chords built from the notes of a major scale — no outside notes. They are the harmonic vocabulary of a key. In C major: C, Dm, Em, F, G, Am, Bdim.',
  },
  {
    heading: 'Roman numeral functions',
    content: 'Each chord has a role: I (tonic, home), ii (supertonic), iii (mediant), IV (subdominant), V (dominant, tension), vi (relative minor), vii° (leading tone). Understanding these roles lets you analyse and predict chord progressions in any key.',
  },
  {
    heading: 'How to use this tool',
    content: 'Select a key to see all 7 diatonic chords with their voicings on the fretboard. Each chord shows finger numbers and muted strings. Use this to learn which chord shapes naturally belong to a key before improvising or writing progressions.',
  },
];

function getChordFretboardProps(shape: ChordShape) {
  const markers: FretMarker[] = [];
  let minFret = 24;
  let maxFret = 0;

  shape.frets.forEach((fret) => {
    if (fret > 0) {
      if (fret < minFret) minFret = fret;
      if (fret > maxFret) maxFret = fret;
    }
  });

  if (minFret === 24) minFret = 1;

  let startFret = Math.max(0, minFret - 1);
  if (startFret === 0) startFret = 0;

  shape.frets.forEach((fret, stringIdx) => {
    if (fret >= 0) {
      const finger = shape.fingers[stringIdx];
      markers.push({
        string: 5 - stringIdx,
        fret: fret,
        label: fret === 0 ? 'O' : (finger > 0 ? finger.toString() : ''),
        color: fret === 0 ? '#ffffff' : '#16a34a',
      });
    } else {
      markers.push({
        string: 5 - stringIdx,
        fret: 0,
        isMuted: true,
      });
    }
  });

  return { markers, startFret, numFrets: Math.max(4, maxFret - startFret + 1) };
}

export default function DiatonicChords() {
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(0);
  const { setCurrentContext } = useAppContext();

  const activeKey = DIATONIC_KEYS[selectedKeyIndex];

  useEffect(() => {
    setCurrentContext(`Viewing Diatonic Chords for Key of ${activeKey.key} Major`);
  }, [activeKey, setCurrentContext]);

  return (
    <div className="flex flex-col h-full w-full p-4 lg:p-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight mb-0.5">Diatonic Chords</h1>
            <InfoTooltip title="Diatonic Chords" sections={DIATONIC_INFO} />
          </div>
          <p className="text-zinc-400 max-w-xl text-xs">
            Explore the 7 diatonic chords (triads and 7ths) for every major key, complete with standard voicings.
          </p>
        </div>

        <div className="relative">
          <select
            value={selectedKeyIndex}
            onChange={(e) => setSelectedKeyIndex(Number(e.target.value))}
            className="appearance-none bg-[#1A1A1A] border border-white/10 text-white py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-sm font-medium"
          >
            {DIATONIC_KEYS.map((k, i) => (
              <option key={k.key} value={i}>
                Key of {k.key} Major
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pb-4">
        {activeKey.chords.map((chord, idx) => {
          const shape = CHORD_DICTIONARY[chord.name];
          const { markers, startFret, numFrets } = shape 
            ? getChordFretboardProps(shape) 
            : { markers: [], startFret: 0, numFrets: 4 };

          return (
            <div key={idx} className="bg-[#141414] border border-white/5 rounded-xl p-3 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-[#16a34a] font-mono text-[10px] mb-0.5 leading-none">{chord.numeral}</div>
                  <h3 className="text-lg font-bold leading-none">{chord.name}</h3>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                  <Music className="w-3 h-3 text-zinc-400" />
                </div>
              </div>

              <div className="flex-1 bg-[#0A0A0A] rounded-lg p-1.5 overflow-hidden flex flex-col justify-center min-h-[90px]">
                {shape ? (
                  <Fretboard 
                    markers={markers} 
                    startFret={startFret} 
                    numFrets={numFrets} 
                    showNut={startFret === 0}
                    labelMode="name"
                  />
                ) : (
                  <div className="text-center text-zinc-500 text-xs">
                    Voicing not available
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
