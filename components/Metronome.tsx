'use client';

import { useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { useAppContext } from './AppContext';
import { useMetronome } from '@/contexts/MetronomeContext';

export default function Metronome() {
  const {
    bpm, setBpm, isPlaying, togglePlay,
    beatsPerMeasure, setBeatsPerMeasure,
    accentedBeats, toggleAccent,
    subdivision, setSubdivision,
    currentBeat,
    speedTrainerActive, setSpeedTrainerActive,
    incrementAmount, setIncrementAmount,
    incrementInterval, setIncrementInterval,
    targetBPM, setTargetBPM,
  } = useMetronome();

  const { setCurrentContext } = useAppContext();

  useEffect(() => {
    setCurrentContext(`Using Metronome: ${bpm} BPM, ${beatsPerMeasure}/4 time signature`);
  }, [bpm, beatsPerMeasure, setCurrentContext]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
      {/* Pulse Line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors duration-75 ${currentBeat !== -1 ? 'bg-[#16a34a]' : 'bg-transparent'}`} />

      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Metronome</h1>
          <p className="text-[#16a34a] font-light tracking-[0.2em] uppercase text-xs mt-1">Precision timing and rhythm</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-6">

          {/* BPM Display */}
          <div className="text-center">
            <div className="text-6xl font-extrabold tracking-tight tabular-nums">{bpm}</div>
            <div className="text-white/50 font-light tracking-[0.2em] uppercase text-sm mt-2">BPM</div>
          </div>

          {/* Beat Grid */}
          <div className="flex justify-center gap-4 w-full">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <button
                key={i}
                onClick={() => toggleAccent(i)}
                className={`flex-1 h-16 rounded-[8px] transition-all duration-75 flex items-center justify-center ${
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
          <div className="bg-[#1A1A1A] rounded-[8px] p-4 w-full">
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
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-[#1A1A1A] rounded-[8px] p-4">
              <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-3">Time Signature</label>
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6, 7].map(ts => (
                  <button
                    key={ts}
                    onClick={() => setBeatsPerMeasure(ts)}
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

            <div className="bg-[#1A1A1A] rounded-[8px] p-4">
              <label className="block text-xs font-light tracking-[0.2em] uppercase text-white/50 mb-3">Subdivision</label>
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

        {/* Bottom Controls */}
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
