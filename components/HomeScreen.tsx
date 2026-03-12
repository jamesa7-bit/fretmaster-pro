'use client';

import {
  Guitar, Activity, Clock, CircleDashed,
  MessageSquare, ListMusic, Music, Layers, Grid3x3, ListOrdered,
  Play, Square, Timer,
} from 'lucide-react';
import { useMetronome } from '@/contexts/MetronomeContext';
import { usePractice } from '@/contexts/PracticeContext';

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatClock(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function dayLabel(dateStr: string) {
  const today = new Date();
  const d = new Date(dateStr + 'T12:00:00');
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yest';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

const tabs = [
  { id: 'diatonic',    label: 'Diatonic Chords',   icon: Music,        desc: 'Chords native to every key',          accent: '#16a34a' },
  { id: 'circle',      label: 'Circle of 5ths',    icon: CircleDashed,  desc: 'Key relationships & jazz subs',       accent: '#06b6d4' },
  { id: 'caged',       label: 'CAGED System',      icon: Grid3x3,       desc: '5-shape fretboard framework',         accent: '#a855f7' },
  { id: 'triads',      label: 'Neck Triads',       icon: Layers,        desc: 'Triads & inversions across the neck', accent: '#f97316' },
  { id: 'scales',      label: 'Scale Library',     icon: Guitar,        desc: 'Visualise scales in every position',  accent: '#3b82f6' },
  { id: 'arpeggios',   label: 'Arpeggio Drills',   icon: Activity,      desc: 'Pick chord tones up the neck',        accent: '#eab308' },
  { id: 'progression', label: 'Chord Progression', icon: ListOrdered,   desc: 'Build & play chord progressions',     accent: '#f59e0b' },
  { id: 'metronome',   label: 'Metronome',         icon: Clock,         desc: 'Tempo & rhythm training',             accent: '#64748b' },
  { id: 'routines',    label: 'Routines',          icon: ListMusic,     desc: 'Build & run practice plans',          accent: '#ec4899' },
  { id: 'coach',       label: 'Theory Coach',      icon: MessageSquare, desc: 'AI-powered music theory help',        accent: '#10b981' },
];

interface Props {
  onNavigate: (id: string) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
  const { isPlaying: metronomePlaying, bpm } = useMetronome();
  const { timerRunning, elapsed, dailyMs, weeklyMs, sessions, startTimer, stopTimer } = usePractice();

  // Build last 7 days for the mini bar chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const ms = sessions.filter(s => s.date === dateStr).reduce((a, s) => a + s.ms, 0)
      + (i === 6 && timerRunning ? elapsed : 0);
    return { dateStr, ms, label: dayLabel(dateStr) };
  });
  const maxMs = Math.max(...last7.map(d => d.ms), 1);
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-full flex flex-col animate-in fade-in duration-500">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <div
          className="flex items-center justify-center rounded-[12px] border-2 border-dashed border-white/15 text-white/20 text-xs tracking-widest uppercase"
          style={{ width: 120, height: 64 }}
        >
          Logo
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold tracking-tight text-white">FretMaster Pro</div>
          <div className="text-xs text-white/30 tracking-[0.2em] uppercase mt-0.5">Guitar Training</div>
        </div>
      </div>

      {/* Metronome running indicator */}
      {metronomePlaying && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#16a34a]/10 border border-[#16a34a]/25">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="text-xs text-[#16a34a] tracking-wide">Metronome running · {bpm} BPM</span>
          <button onClick={() => onNavigate('metronome')} className="ml-auto text-xs text-[#16a34a]/60 hover:text-[#16a34a] transition-colors">Go →</button>
        </div>
      )}

      {/* Practice Timer */}
      <div className="mx-4 mb-3 bg-[#141414] border border-white/8 rounded-[16px] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-4 h-4 text-white/30" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/30">Practice Timer</span>
          {timerRunning && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              <span className="text-[10px] text-[#16a34a] tracking-wide">Recording</span>
            </span>
          )}
        </div>

        <div className="flex items-end justify-between mb-3">
          <div className="text-4xl font-extrabold tabular-nums tracking-tight text-white">
            {formatClock(elapsed)}
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-xs text-white/30">
              Today <span className="ml-1 text-white/70 font-bold">{formatDuration(dailyMs + (timerRunning ? elapsed : 0))}</span>
            </div>
            <div className="text-xs text-white/30">
              This week <span className="ml-1 text-white/70 font-bold">{formatDuration(weeklyMs + (timerRunning ? elapsed : 0))}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-3">
          <button
            onClick={startTimer}
            disabled={timerRunning}
            className={`flex items-center gap-2 px-5 py-2 rounded-[8px] text-sm font-bold transition-all ${
              timerRunning ? 'bg-[#1A1A1A] text-white/20 cursor-not-allowed' : 'bg-[#16a34a] text-[#0A0A0A] hover:bg-[#15803d]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start
          </button>
          <button
            onClick={stopTimer}
            disabled={!timerRunning}
            className={`flex items-center gap-2 px-5 py-2 rounded-[8px] text-sm font-bold transition-all ${
              !timerRunning ? 'bg-[#1A1A1A] text-white/20 cursor-not-allowed' : 'bg-[#1A1A1A] text-white hover:bg-[#222]'
            }`}
          >
            <Square className="w-3.5 h-3.5 fill-current" /> Stop
          </button>
        </div>

        {/* 7-day history mini bar chart */}
        {sessions.length > 0 || timerRunning ? (
          <div className="flex items-end gap-1" style={{ height: 36 }}>
            {last7.map(({ dateStr, ms, label }) => {
              const heightPct = ms > 0 ? Math.max(8, (ms / maxMs) * 100) : 0;
              const isToday = dateStr === todayStr;
              return (
                <div key={dateStr} className="flex-1 flex flex-col items-center gap-0.5" style={{ height: 36 }}>
                  <div className="w-full flex items-end flex-1">
                    <div
                      className="w-full rounded-[2px] transition-all duration-500"
                      style={{
                        height: ms > 0 ? `${heightPct}%` : '2px',
                        backgroundColor: isToday ? '#16a34a' : (ms > 0 ? '#16a34a50' : '#ffffff08'),
                      }}
                      title={ms > 0 ? formatDuration(ms) : ''}
                    />
                  </div>
                  <span className={`text-[6px] uppercase tracking-wide leading-none ${isToday ? 'text-[#16a34a]' : 'text-white/20'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Feature Grid */}
      <div className="px-4 pb-4">
        <div className="text-xs font-bold tracking-[0.2em] uppercase text-white/20 mb-2">Features</div>
        <div className="grid grid-cols-3 gap-3">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className="relative rounded-[14px] p-4 text-left transition-all overflow-hidden group hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: '#141414', border: '1px solid #ffffff0f' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${tab.accent}12 0%, ${tab.accent}06 100%)`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${tab.accent}35`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = '#141414';
                  (e.currentTarget as HTMLElement).style.borderColor = '#ffffff0f';
                }}
              >
                <div className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3" style={{ backgroundColor: `${tab.accent}18` }}>
                  <Icon className="w-4 h-4" style={{ color: tab.accent }} />
                </div>
                <div className="text-[11px] font-bold leading-tight mb-1 text-white/80 group-hover:text-white transition-colors">{tab.label}</div>
                <div className="text-[9px] text-white/25 leading-snug">{tab.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
