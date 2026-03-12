'use client';

import { useState } from 'react';
import {
  MoreHorizontal, X, Guitar, Activity, Clock, CircleDashed,
  MessageSquare, ListMusic, Music, Layers, Grid3x3, ChevronLeft, ListOrdered,
  Sun, Moon,
} from 'lucide-react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import ScaleDiagrams from '@/components/ScaleDiagrams';
import ArpeggioDrills from '@/components/ArpeggioDrills';
import Metronome from '@/components/Metronome';
import CircleOfFifths from '@/components/CircleOfFifths';
import TheoryCoach from '@/components/TheoryCoach';
import RoutineBuilder from '@/components/RoutineBuilder';
import DiatonicChords from '@/components/DiatonicChords';
import NeckTriads from '@/components/NeckTriads';
import CAGEDSystem from '@/components/CAGEDSystem';
import ChordProgressionBuilder from '@/components/ChordProgressionBuilder';
import HomeScreen from '@/components/HomeScreen';
import { AppProvider } from '@/components/AppContext';
import { MusicContextProvider } from '@/contexts/MusicContext';
import { MetronomeProvider } from '@/contexts/MetronomeContext';
import { PracticeProvider } from '@/contexts/PracticeContext';

const tabs = [
  { id: 'diatonic',  label: 'Diatonic Chords', icon: Music,        desc: 'Chords native to every key',          accent: '#16a34a' },
  { id: 'circle',    label: 'Circle of 5ths',  icon: CircleDashed,  desc: 'Key relationships & jazz subs',       accent: '#06b6d4' },
  { id: 'caged',     label: 'CAGED System',    icon: Grid3x3,       desc: '5-shape fretboard framework',         accent: '#a855f7' },
  { id: 'triads',    label: 'Neck Triads',     icon: Layers,        desc: 'Triads & inversions across the neck', accent: '#f97316' },
  { id: 'scales',    label: 'Scale Library',   icon: Guitar,        desc: 'Visualise scales in every position',  accent: '#3b82f6' },
  { id: 'arpeggios', label: 'Arpeggio Drills', icon: Activity,      desc: 'Pick chord tones up the neck',        accent: '#eab308' },
  { id: 'metronome', label: 'Metronome',       icon: Clock,         desc: 'Tempo & rhythm training',             accent: '#64748b' },
  { id: 'progression', label: 'Chord Progression', icon: ListOrdered,   desc: 'Build & play chord progressions',     accent: '#f59e0b' },
  { id: 'routines',  label: 'Routines',        icon: ListMusic,     desc: 'Build & run practice plans',          accent: '#ec4899' },
  { id: 'coach',     label: 'Theory Coach',    icon: MessageSquare, desc: 'AI-powered music theory help',        accent: '#10b981' },
];

function AppShell() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const active = tabs.find(t => t.id === activeTab);

  return (
      <div className="h-screen w-screen bg-[#0A0A0A] text-white overflow-hidden flex flex-col font-sans selection:bg-[#16a34a]/30" data-theme={theme}>

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 h-12 z-40">
          {/* Back / Home button — only show when on a feature screen */}
          {activeTab !== null ? (
            <button
              onClick={() => setActiveTab(null)}
              className="flex items-center gap-1 p-2 text-white/30 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs tracking-wide">Home</span>
            </button>
          ) : (
            <div className="w-20" /> // spacer to keep menu icon right-aligned
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 text-white/30 hover:text-white transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setShowMenu(true)} className="p-2">
              <MoreHorizontal className="w-7 h-7 text-white/30 hover:text-white transition-colors" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto flex flex-col w-full min-h-0">
          {activeTab === null      && <HomeScreen onNavigate={setActiveTab} />}
          {activeTab === 'diatonic'  && <DiatonicChords />}
          {activeTab === 'scales'    && <ScaleDiagrams />}
          {activeTab === 'triads'    && <NeckTriads />}
          {activeTab === 'arpeggios' && <ArpeggioDrills />}
          {activeTab === 'metronome' && <Metronome />}
          {activeTab === 'routines'  && <RoutineBuilder />}
          {activeTab === 'circle'    && <CircleOfFifths />}
          {activeTab === 'coach'     && <TheoryCoach />}
          {activeTab === 'caged'        && <CAGEDSystem />}
          {activeTab === 'progression'  && <ChordProgressionBuilder />}
        </main>

        {/* Menu overlay */}
        {showMenu && (
          <div className="absolute inset-0 z-50 backdrop-blur-[14px] bg-[#0A0A0A]/85 flex flex-col animate-in fade-in duration-200">

            <div className="flex justify-between items-center px-6 pt-5">
              <button
                onClick={() => { setActiveTab(null); setShowMenu(false); }}
                className="text-xs text-white/30 hover:text-white transition-colors tracking-wide"
              >
                ← Home
              </button>
              <button onClick={() => setShowMenu(false)} className="p-1.5 text-white/30 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Branding */}
            <div className="px-6 pt-2 pb-4">
              <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/20 mb-0.5">FretMaster Pro</div>
              {active && (
                <div
                  className="text-xs font-light tracking-[0.15em] uppercase"
                  style={{ color: active.accent }}
                >
                  {active.label}
                </div>
              )}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setShowMenu(false); }}
                      className="relative rounded-[12px] p-3.5 text-left transition-all overflow-hidden group"
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${tab.accent}1A 0%, ${tab.accent}08 100%)`
                          : '#141414',
                        border: `1px solid ${isActive ? tab.accent + '50' : '#ffffff10'}`,
                      }}
                    >
                      {isActive && (
                        <span
                          className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tab.accent }}
                        />
                      )}

                      <div
                        className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-2.5"
                        style={{ backgroundColor: isActive ? tab.accent + '22' : '#ffffff08' }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: isActive ? tab.accent : '#ffffff40' }}
                        />
                      </div>

                      <div
                        className="text-[11px] font-bold leading-tight mb-0.5"
                        style={{ color: isActive ? '#ffffff' : '#ffffff70' }}
                      >
                        {tab.label}
                      </div>

                      <div className="text-[9px] text-white/25 leading-snug">
                        {tab.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <MusicContextProvider>
    <MetronomeProvider>
    <PracticeProvider>
    <AppProvider>
      <AppShell />
    </AppProvider>
    </PracticeProvider>
    </MetronomeProvider>
    </MusicContextProvider>
    </ThemeProvider>
  );
}
