'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Guitar, Activity, Clock, CircleDashed,
  MessageSquare, ListMusic, Music, Layers, Grid3x3,
  Play, Square, Timer,
} from 'lucide-react';
import { useMetronome } from '@/contexts/MetronomeContext';

const STORAGE_KEY = 'fretmaster_practice_sessions';

interface Session {
  date: string;   // YYYY-MM-DD
  ms: number;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function loadSessions(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

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

const tabs = [
  { id: 'diatonic',  label: 'Diatonic Chords', icon: Music,        desc: 'Chords native to every key',          accent: '#16a34a' },
  { id: 'circle',    label: 'Circle of 5ths',  icon: CircleDashed,  desc: 'Key relationships & jazz subs',       accent: '#06b6d4' },
  { id: 'caged',     label: 'CAGED System',    icon: Grid3x3,       desc: '5-shape fretboard framework',         accent: '#a855f7' },
  { id: 'triads',    label: 'Neck Triads',     icon: Layers,        desc: 'Triads & inversions across the neck', accent: '#f97316' },
  { id: 'scales',    label: 'Scale Library',   icon: Guitar,        desc: 'Visualise scales in every position',  accent: '#3b82f6' },
  { id: 'arpeggios', label: 'Arpeggio Drills', icon: Activity,      desc: 'Pick chord tones up the neck',        accent: '#eab308' },
  { id: 'metronome', label: 'Metronome',       icon: Clock,         desc: 'Tempo & rhythm training',             accent: '#64748b' },
  { id: 'routines',  label: 'Routines',        icon: ListMusic,     desc: 'Build & run practice plans',          accent: '#ec4899' },
  { id: 'coach',     label: 'Theory Coach',    icon: MessageSquare, desc: 'AI-powered music theory help',        accent: '#10b981' },
];

interface Props {
  onNavigate: (id: string) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
  const { isPlaying: metronomePlaying, bpm } = useMetronome();

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dailyMs, setDailyMs] = useState(0);
  const [weeklyMs, setWeeklyMs] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved totals on mount
  useEffect(() => {
    const sessions = loadSessions();
    const today = todayStr();
    const wStart = weekStart();

    const daily = sessions
      .filter(s => s.date === today)
      .reduce((acc, s) => acc + s.ms, 0);
    const weekly = sessions
      .filter(s => s.date >= wStart)
      .reduce((acc, s) => acc + s.ms, 0);

    setDailyMs(daily);
    setWeeklyMs(weekly);
  }, []);

  const startTimer = () => {
    if (timerRunning) return;
    startTimeRef.current = Date.now() - elapsed;
    setTimerRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current!);
    }, 1000);
  };

  const stopTimer = () => {
    if (!timerRunning) return;
    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    setTimerRunning(false);

    const duration = elapsed;
    if (duration < 1000) return; // ignore sub-second stops

    const today = todayStr();
    const sessions = loadSessions();
    sessions.push({ date: today, ms: duration });
    saveSessions(sessions);

    setDailyMs(prev => prev + duration);
    setWeeklyMs(prev => prev + duration);
    setElapsed(0);
    startTimeRef.current = null;
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="min-h-full flex flex-col animate-in fade-in duration-500">

      {/* Top bar: logo + branding */}
      <div className="flex items-center justify-between px-8 pt-8 pb-6 flex-shrink-0">

        {/* Logo placeholder */}
        <div
          className="flex items-center justify-center rounded-[12px] border-2 border-dashed border-white/15 text-white/20 text-xs tracking-widest uppercase"
          style={{ width: 120, height: 64 }}
        >
          Logo
        </div>

        {/* App name */}
        <div className="text-right">
          <div className="text-2xl font-extrabold tracking-tight text-white">FretMaster Pro</div>
          <div className="text-xs text-white/30 tracking-[0.2em] uppercase mt-0.5">Guitar Training</div>
        </div>
      </div>

      {/* Metronome running indicator */}
      {metronomePlaying && (
        <div className="mx-8 mb-4 flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#16a34a]/10 border border-[#16a34a]/25">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          <span className="text-xs text-[#16a34a] tracking-wide">Metronome running · {bpm} BPM</span>
          <button
            onClick={() => onNavigate('metronome')}
            className="ml-auto text-xs text-[#16a34a]/60 hover:text-[#16a34a] transition-colors"
          >
            Go →
          </button>
        </div>
      )}

      {/* Practice Timer */}
      <div className="mx-8 mb-6 bg-[#141414] border border-white/8 rounded-[16px] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Timer className="w-4 h-4 text-white/30" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/30">Practice Timer</span>
        </div>

        {/* Clock */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-5xl font-extrabold tabular-nums tracking-tight text-white">
              {formatClock(elapsed)}
            </div>
            {timerRunning && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                <span className="text-xs text-[#16a34a] tracking-wide">Recording</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="text-right space-y-1">
            <div className="text-xs text-white/30 tracking-wide">
              Today
              <span className="ml-2 text-white/70 font-bold">{formatDuration(dailyMs + (timerRunning ? elapsed : 0))}</span>
            </div>
            <div className="text-xs text-white/30 tracking-wide">
              This week
              <span className="ml-2 text-white/70 font-bold">{formatDuration(weeklyMs + (timerRunning ? elapsed : 0))}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={startTimer}
            disabled={timerRunning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-bold transition-all ${
              timerRunning
                ? 'bg-[#1A1A1A] text-white/20 cursor-not-allowed'
                : 'bg-[#16a34a] text-[#0A0A0A] hover:bg-[#15803d]'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            Start
          </button>
          <button
            onClick={stopTimer}
            disabled={!timerRunning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-bold transition-all ${
              !timerRunning
                ? 'bg-[#1A1A1A] text-white/20 cursor-not-allowed'
                : 'bg-[#1A1A1A] text-white hover:bg-[#222]'
            }`}
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="px-8 pb-8">
        <div className="text-xs font-bold tracking-[0.2em] uppercase text-white/20 mb-4">Features</div>
        <div className="grid grid-cols-3 gap-3">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className="relative rounded-[14px] p-4 text-left transition-all overflow-hidden group hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: '#141414',
                  border: `1px solid #ffffff0f`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${tab.accent}12 0%, ${tab.accent}06 100%)`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${tab.accent}35`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = '#141414';
                  (e.currentTarget as HTMLElement).style.borderColor = '#ffffff0f';
                }}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${tab.accent}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color: tab.accent }} />
                </div>

                {/* Label */}
                <div className="text-[11px] font-bold leading-tight mb-1 text-white/80 group-hover:text-white transition-colors">
                  {tab.label}
                </div>

                {/* Desc */}
                <div className="text-[9px] text-white/25 leading-snug">
                  {tab.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
