'use client';

import { useState } from 'react';
import {
  MoreHorizontal, X, Guitar, Activity, Clock, CircleDashed,
  MessageSquare, ListMusic, Music, Layers, Grid3x3,
} from 'lucide-react';
import ScaleDiagrams from '@/components/ScaleDiagrams';
import ArpeggioDrills from '@/components/ArpeggioDrills';
import Metronome from '@/components/Metronome';
import CircleOfFifths from '@/components/CircleOfFifths';
import TheoryCoach from '@/components/TheoryCoach';
import RoutineBuilder from '@/components/RoutineBuilder';
import DiatonicChords from '@/components/DiatonicChords';
import NeckTriads from '@/components/NeckTriads';
import CAGEDSystem from '@/components/CAGEDSystem';
import { AppProvider } from '@/components/AppContext';
import { MusicContextProvider } from '@/contexts/MusicContext';

const tabs = [
  { id: 'diatonic',  label: 'Diatonic Chords', icon: Music,        desc: 'Chords native to every key',         accent: '#16a34a' },
  { id: 'circle',    label: 'Circle of 5ths',  icon: CircleDashed,  desc: 'Key relationships & jazz subs',      accent: '#06b6d4' },
  { id: 'caged',     label: 'CAGED System',    icon: Grid3x3,       desc: '5-shape fretboard framework',        accent: '#a855f7' },
  { id: 'triads',    label: 'Neck Triads',     icon: Layers,        desc: 'Triads & inversions across the neck', accent: '#f97316' },
  { id: 'scales',    label: 'Scale Library',   icon: Guitar,        desc: 'Visualise scales in every position',  accent: '#3b82f6' },
  { id: 'arpeggios', label: 'Arpeggio Drills', icon: Activity,      desc: 'Pick chord tones up the neck',        accent: '#eab308' },
  { id: 'metronome', label: 'Metronome',       icon: Clock,         desc: 'Tempo & rhythm training',             accent: '#64748b' },
  { id: 'routines',  label: 'Routines',        icon: ListMusic,     desc: 'Build & run practice plans',          accent: '#ec4899' },
  { id: 'coach',     label: 'Theory Coach',    icon: MessageSquare, desc: 'AI-powered music theory help',        accent: '#10b981' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('diatonic');
  const [showMenu, setShowMenu] = useState(false);

  const active = tabs.find(t => t.id === activeTab)!;

  return (
    <MusicContextProvider>
    <AppProvider>
      <div className="h-screen w-screen bg-[#0A0A0A] text-white overflow-hidden flex flex-col font-sans selection:bg-[#16a34a]/30">

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-end px-6 h-12 z-40">
          <button onClick={() => setShowMenu(true)} className="p-2">
            <MoreHorizontal className="w-7 h-7 text-white/30 hover:text-white transition-colors" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto flex flex-col w-full min-h-0">
          {activeTab === 'diatonic'  && <DiatonicChords />}
          {activeTab === 'scales'    && <ScaleDiagrams />}
          {activeTab === 'triads'    && <NeckTriads />}
          {activeTab === 'arpeggios' && <ArpeggioDrills />}
          {activeTab === 'metronome' && <Metronome />}
          {activeTab === 'routines'  && <RoutineBuilder />}
          {activeTab === 'circle'    && <CircleOfFifths />}
          {activeTab === 'coach'     && <TheoryCoach />}
          {activeTab === 'caged'     && <CAGEDSystem />}
        </main>

        {/* Menu overlay */}
        {showMenu && (
          <div className="absolute inset-0 z-50 backdrop-blur-[14px] bg-[#0A0A0A]/85 flex flex-col animate-in fade-in duration-200">

            {/* Close */}
            <div className="flex justify-end px-6 pt-5">
              <button onClick={() => setShowMenu(false)} className="p-1.5 text-white/30 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Branding */}
            <div className="px-6 pt-2 pb-4">
              <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/20 mb-0.5">FretMaster Pro</div>
              <div
                className="text-xs font-light tracking-[0.15em] uppercase"
                style={{ color: active.accent }}
              >
                {active.label}
              </div>
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
                      {/* Active dot */}
                      {isActive && (
                        <span
                          className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tab.accent }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-2.5"
                        style={{
                          backgroundColor: isActive ? tab.accent + '22' : '#ffffff08',
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: isActive ? tab.accent : '#ffffff40' }}
                        />
                      </div>

                      {/* Label */}
                      <div
                        className="text-[11px] font-bold leading-tight mb-0.5"
                        style={{ color: isActive ? '#ffffff' : '#ffffff70' }}
                      >
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
        )}
      </div>
    </AppProvider>
    </MusicContextProvider>
  );
}
