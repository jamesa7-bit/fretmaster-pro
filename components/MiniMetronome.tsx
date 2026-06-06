'use client';

import { Play, Square } from 'lucide-react';
import { useMetronome } from '@/contexts/MetronomeContext';

interface MiniMetronomeProps {
  accent?: string;
}

export default function MiniMetronome({ accent = '#16a34a' }: MiniMetronomeProps) {
  const { bpm, setBpm, isPlaying, togglePlay, currentBeat, beatsPerMeasure } = useMetronome();

  return (
    <div className="flex items-center gap-2">
      {/* Beat dots */}
      <div className="flex gap-1">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-75"
            style={{ backgroundColor: currentBeat === i ? accent : 'rgba(255,255,255,0.12)' }}
          />
        ))}
      </div>

      <div className="w-px h-4 bg-white/10" />

      {/* BPM ± control */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setBpm(b => Math.max(20, b - 5))}
          className="w-5 text-center text-sm font-bold text-white/40 hover:text-white transition-colors leading-none"
        >
          −
        </button>
        <span className="text-xs font-bold tabular-nums w-7 text-center">{bpm}</span>
        <button
          onClick={() => setBpm(b => Math.min(300, b + 5))}
          className="w-5 text-center text-sm font-bold text-white/40 hover:text-white transition-colors leading-none"
        >
          +
        </button>
      </div>

      <span className="text-[9px] text-white/25 uppercase tracking-widest">BPM</span>

      <div className="w-px h-4 bg-white/10" />

      {/* Play / Stop */}
      <button
        onClick={togglePlay}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
          isPlaying
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'text-[#0A0A0A] hover:opacity-80'
        }`}
        style={!isPlaying ? { backgroundColor: accent } : undefined}
      >
        {isPlaying
          ? <Square className="w-2.5 h-2.5 fill-current" />
          : <Play className="w-2.5 h-2.5 fill-current ml-px" />}
      </button>
    </div>
  );
}
