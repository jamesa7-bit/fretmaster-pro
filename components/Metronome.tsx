'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Minus, Plus, Settings2 } from 'lucide-react';
import { useAppContext } from './AppContext';

export default function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [accentedBeats, setAccentedBeats] = useState<number[]>([0]); // 0-indexed
  const [subdivision, setSubdivision] = useState(1); // 1 = quarter, 2 = eighth, 3 = triplet, 4 = sixteenth
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [currentSubdivision, setCurrentSubdivision] = useState(-1);
  const [speedTrainerActive, setSpeedTrainerActive] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(5);
  const [incrementInterval, setIncrementInterval] = useState(4);
  const [targetBPM, setTargetBPM] = useState(160);
  const { setCurrentContext } = useAppContext();

  useEffect(() => {
    setCurrentContext(`Using Metronome: ${bpm} BPM, ${beatsPerMeasure}/4 time signature`);
  }, [bpm, beatsPerMeasure, setCurrentContext]);

  // Keep refs in sync with state to avoid stale closures in scheduler
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { speedTrainerActiveRef.current = speedTrainerActive; }, [speedTrainerActive]);
  useEffect(() => { incrementAmountRef.current = incrementAmount; }, [incrementAmount]);
  useEffect(() => { incrementIntervalRef.current = incrementInterval; }, [incrementInterval]);
  useEffect(() => { targetBPMRef.current = targetBPM; }, [targetBPM]);

  // Reset bar counter when speed trainer toggled off
  useEffect(() => { if (!speedTrainerActive) barCounterRef.current = 0; }, [speedTrainerActive]);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatInMeasureRef = useRef(0);
  const currentSubdivisionIndexRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(120);
  const barCounterRef = useRef(0);
  const speedTrainerActiveRef = useRef(false);
  const incrementAmountRef = useRef(5);
  const incrementIntervalRef = useRef(4);
  const targetBPMRef = useRef(160);

  const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpmRef.current;
    const secondsPerSubdivision = secondsPerBeat / subdivision;
    
    nextNoteTimeRef.current += secondsPerSubdivision;
    
    currentSubdivisionIndexRef.current++;
    if (currentSubdivisionIndexRef.current === subdivision) {
      currentSubdivisionIndexRef.current = 0;
      currentBeatInMeasureRef.current++;
      if (currentBeatInMeasureRef.current === beatsPerMeasure) {
        currentBeatInMeasureRef.current = 0;
        // Speed Trainer: increment BPM every N bars
        if (speedTrainerActiveRef.current) {
          barCounterRef.current++;
          if (barCounterRef.current % incrementIntervalRef.current === 0) {
            setBpm(prev =>
              prev < targetBPMRef.current
                ? Math.min(targetBPMRef.current, prev + incrementAmountRef.current)
                : prev
            );
          }
        }
      }
    }
  }, [subdivision, beatsPerMeasure]);

  const playClick = useCallback((time: number, beatNumber: number, subIndex: number) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    const isAccent = subIndex === 0 && accentedBeats.includes(beatNumber);
    const isBeat = subIndex === 0;

    if (isAccent) {
      osc.frequency.value = 1200.0;
      gainNode.gain.value = 1.0;
    } else if (isBeat) {
      osc.frequency.value = 800.0;
      gainNode.gain.value = 0.5;
    } else {
      osc.frequency.value = 600.0;
      gainNode.gain.value = 0.2; // Subdivision click
    }

    osc.start(time);
    osc.stop(time + 0.05);

    // Update UI
    setTimeout(() => {
      setCurrentBeat(beatNumber);
      setCurrentSubdivision(subIndex);
    }, (time - audioContextRef.current.currentTime) * 1000);
  }, [accentedBeats]);

  const scheduler = useCallback(function scheduler() {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      playClick(nextNoteTimeRef.current, currentBeatInMeasureRef.current, currentSubdivisionIndexRef.current);
      nextNote();
    }
    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  }, [nextNote, playClick]);

  useEffect(() => {
    if (isPlaying) {
      initAudioContext();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      if (timerIDRef.current === null) {
        nextNoteTimeRef.current = audioContextRef.current!.currentTime + 0.05;
        scheduler();
      }
    } else {
      if (timerIDRef.current !== null) {
        window.clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
      setCurrentBeat(-1);
      setCurrentSubdivision(-1);
      barCounterRef.current = 0;
    }

    return () => {
      if (timerIDRef.current !== null) {
        window.clearTimeout(timerIDRef.current);
      }
    };
  }, [isPlaying, scheduler]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!isPlaying) {
      currentBeatInMeasureRef.current = 0;
      currentSubdivisionIndexRef.current = 0;
    }
    setIsPlaying(!isPlaying);
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setBpm(Math.min(300, Math.max(20, val)));
    }
  };

  const toggleAccent = (index: number) => {
    setAccentedBeats(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const timeSignatures = [
    { label: '4/4', beats: 4 },
    { label: '3/4', beats: 3 },
    { label: '6/8', beats: 6 },
    { label: '5/4', beats: 5 },
    { label: '7/8', beats: 7 },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
      {/* Pulse Line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors duration-75 ${currentBeat !== -1 ? 'bg-[#16a34a]' : 'bg-transparent'}`} />

      <div className="p-8 flex-1 flex flex-col">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tighter">Metronome</h1>
          <p className="text-[#16a34a] font-light tracking-[0.2em] uppercase text-xs mt-3">Precision timing and rhythm</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-12">
          
          {/* BPM Display */}
          <div className="text-center">
            <div className="text-8xl font-extrabold tracking-tighter tabular-nums">{bpm}</div>
            <div className="text-white/50 font-light tracking-[0.2em] uppercase text-sm mt-2">BPM</div>
          </div>

          {/* Beat Grid */}
          <div className="flex justify-center gap-4 w-full">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <button
                key={i}
                onClick={() => toggleAccent(i)}
                className={`flex-1 h-24 rounded-[8px] transition-all duration-75 flex items-center justify-center ${
                  currentBeat === i 
                    ? 'bg-[#16a34a] shadow-[0_0_30px_rgba(22,163,74,0.3)]' 
                    : accentedBeats.includes(i)
                      ? 'bg-[#1A1A1A] border-b-4 border-[#16a34a]'
                      : 'bg-[#1A1A1A]'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${currentBeat === i ? 'bg-[#0A0A0A]' : accentedBeats.includes(i) ? 'bg-[#16a34a]' : 'bg-white/20'}`} />
              </button>
            ))}
          </div>

          {/* Speed Trainer */}
          <div className="bg-[#1A1A1A] rounded-[8px] p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-light tracking-[0.2em] uppercase text-white/50">Speed Trainer</label>
              <button
                onClick={() => setSpeedTrainerActive(s => !s)}
                className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                  speedTrainerActive ? 'bg-[#16a34a]' : 'bg-[#333]'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  speedTrainerActive ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
            {speedTrainerActive && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-white/30 mb-2 tracking-widest uppercase">+BPM</label>
                  <input
                    type="number"
                    value={incrementAmount}
                    min={1}
                    max={20}
                    onChange={e => setIncrementAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#222] text-white rounded-[6px] p-2 text-center font-bold text-lg focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-2 tracking-widest uppercase">Every N Bars</label>
                  <input
                    type="number"
                    value={incrementInterval}
                    min={1}
                    max={32}
                    onChange={e => setIncrementInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#222] text-white rounded-[6px] p-2 text-center font-bold text-lg focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/30 mb-2 tracking-widest uppercase">Target BPM</label>
                  <input
                    type="number"
                    value={targetBPM}
                    min={bpm + 1}
                    max={300}
                    onChange={e => setTargetBPM(Math.min(300, Math.max(bpm + 1, parseInt(e.target.value) || bpm + 1)))}
                    className="w-full bg-[#222] text-white rounded-[6px] p-2 text-center font-bold text-lg focus:outline-none focus:ring-1 focus:ring-[#16a34a]"
                  />
                </div>
              </div>
            )}
            {!speedTrainerActive && (
              <p className="text-xs text-white/20">Automatically ramp BPM up to a target tempo</p>
            )}
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="bg-[#1A1A1A] rounded-[8px] p-6">
              <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-4">Time Signature</label>
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6, 7].map(ts => (
                  <button
                    key={ts}
                    onClick={() => {
                      setBeatsPerMeasure(ts);
                      setAccentedBeats([0]); // Reset accents on change
                    }}
                    className={`px-4 py-2 rounded-[6px] font-bold transition-all ${
                      beatsPerMeasure === ts 
                        ? 'bg-[#16a34a] text-[#0A0A0A]' 
                        : 'bg-[#222] text-white/70 hover:bg-[#333]'
                    }`}
                  >
                    {ts}/4
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-[8px] p-6">
              <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-4">Subdivision</label>
              <div className="flex gap-2">
                {[
                  { val: 1, label: '♩' },
                  { val: 2, label: '♫' },
                  { val: 3, label: '3' },
                  { val: 4, label: '♬' }
                ].map(sub => (
                  <button
                    key={sub.val}
                    onClick={() => setSubdivision(sub.val)}
                    className={`flex-1 py-2 rounded-[6px] text-xl transition-all ${
                      subdivision === sub.val 
                        ? 'bg-[#16a34a] text-[#0A0A0A]' 
                        : 'bg-[#222] text-white/70 hover:bg-[#333]'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls (Thumb Zone) */}
        <div className="absolute bottom-8 left-8">
          <button 
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#16a34a] hover:bg-[#222] transition-colors shadow-lg"
          >
            {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-2" />}
          </button>
        </div>
        <div className="absolute bottom-8 right-8">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setBpm(b => Math.min(300, b + 5))}
              className="w-20 h-10 rounded-t-full bg-[#1A1A1A] flex items-center justify-center text-white/50 hover:text-white transition-colors text-lg font-bold shadow-lg"
            >
              +
            </button>
            <button 
              onClick={() => setBpm(b => Math.max(20, b - 5))}
              className="w-20 h-10 rounded-b-full bg-[#1A1A1A] flex items-center justify-center text-white/50 hover:text-white transition-colors text-lg font-bold shadow-lg"
            >
              -
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
