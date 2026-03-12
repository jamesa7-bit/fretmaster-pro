'use client';

import { useState, useEffect } from 'react';
import { Play, Plus, Trash2, Save, X, ListMusic } from 'lucide-react';
import { NOTES, SCALES, ARPEGGIOS } from '@/lib/music-theory';
import { useAppContext } from './AppContext';

export type RoutineItemType = 'Scale' | 'Arpeggio' | 'Metronome';

export interface RoutineItem {
  id: string;
  type: RoutineItemType;
  rootNote?: number;
  scaleType?: string;
  arpeggioType?: string;
  bpm?: number;
  timeSignature?: number;
  durationMinutes: number;
}

export interface Routine {
  id: string;
  name: string;
  items: RoutineItem[];
}

export default function RoutineBuilder() {
  const { setCurrentContext } = useAppContext();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editItems, setEditItems] = useState<RoutineItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('fretmaster_routines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => { setRoutines(parsed); }, 0);
      } catch (e) {
        console.error('Failed to parse routines', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fretmaster_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    if (activeRoutine) {
      setCurrentContext(`Playing Routine: ${activeRoutine.name}`);
    } else if (isEditing) {
      setCurrentContext('Building a Practice Routine');
    } else {
      setCurrentContext('Viewing Practice Routines');
    }
  }, [activeRoutine, isEditing, setCurrentContext]);

  const startNewRoutine = () => {
    setEditName('My Custom Routine');
    setEditItems([]);
    setEditId(null);
    setIsEditing(true);
    setActiveRoutine(null);
  };

  const editExistingRoutine = (routine: Routine) => {
    setEditName(routine.name);
    setEditItems([...routine.items]);
    setEditId(routine.id);
    setIsEditing(true);
    setActiveRoutine(null);
  };

  const saveRoutine = () => {
    if (!editName.trim() || editItems.length === 0) return;

    if (editId) {
      setRoutines(prev => prev.map(r =>
        r.id === editId ? { ...r, name: editName, items: editItems } : r
      ));
    } else {
      setRoutines(prev => [...prev, {
        id: Date.now().toString(),
        name: editName,
        items: editItems,
      }]);
    }

    setIsEditing(false);
    setEditId(null);
  };

  const deleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const addItem = (type: RoutineItemType) => {
    const newItem: RoutineItem = {
      id: Date.now().toString() + Math.random().toString(),
      type,
      durationMinutes: 5,
      ...(type === 'Scale' ? { rootNote: 0, scaleType: 'Major' } : {}),
      ...(type === 'Arpeggio' ? { rootNote: 0, arpeggioType: 'Major' } : {}),
      ...(type === 'Metronome' ? { bpm: 120, timeSignature: 4 } : {}),
    };
    setEditItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<RoutineItem>) => {
    setEditItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setEditItems(prev => prev.filter(item => item.id !== id));
  };

  const inputClass = 'w-full bg-[#222] text-white rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#16a34a] border border-white/5';
  const labelClass = 'block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5';

  if (activeRoutine) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ec4899]" />
        <div className="p-4 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{activeRoutine.name}</h1>
              <p className="text-[#ec4899] font-light tracking-[0.2em] uppercase text-xs mt-1">
                {activeRoutine.items.length} items · {activeRoutine.items.reduce((a, i) => a + i.durationMinutes, 0)} min total
              </p>
            </div>
            <button
              onClick={() => setActiveRoutine(null)}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] rounded-[8px] text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="bg-[#1A1A1A] rounded-[8px] p-4 space-y-3">
            <p className="text-xs text-white/30 mb-4">Routine playback is a placeholder — in a future update this will auto-step through each item with a timer.</p>
            {activeRoutine.items.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-[#222] rounded-[8px]">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#ec4899]/20 text-[#ec4899] flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {item.type === 'Scale' && `${NOTES[item.rootNote || 0]} ${item.scaleType} Scale`}
                      {item.type === 'Arpeggio' && `${NOTES[item.rootNote || 0]} ${item.arpeggioType} Arpeggio`}
                      {item.type === 'Metronome' && `Metronome Practice (${item.bpm} BPM)`}
                    </h3>
                    <p className="text-xs text-white/30">{item.durationMinutes} minutes</p>
                  </div>
                </div>
                <button className="w-9 h-9 rounded-full bg-[#ec4899] flex items-center justify-center hover:bg-[#db2777] transition-colors">
                  <Play className="w-3.5 h-3.5 text-white fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ec4899]" />
        <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="text-2xl font-extrabold tracking-tight bg-transparent border-b border-white/15 focus:border-[#16a34a] focus:outline-none pb-1 flex-1"
              placeholder="Routine Name"
            />
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] rounded-[8px] text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRoutine}
                disabled={editItems.length === 0}
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] disabled:bg-[#1A1A1A] disabled:text-white/20 text-[#0A0A0A] rounded-[8px] text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          {/* Add buttons */}
          <div className="flex gap-3">
            {(['Scale', 'Arpeggio', 'Metronome'] as RoutineItemType[]).map(type => (
              <button
                key={type}
                onClick={() => addItem(type)}
                className="px-4 py-2 bg-[#1A1A1A] border border-white/10 hover:border-[#16a34a]/40 hover:bg-[#16a34a]/5 rounded-[8px] text-sm font-medium text-white/70 hover:text-white transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> {type}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-3">
            {editItems.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A1A] border border-white/8 border-dashed rounded-[8px] text-white/20 text-sm">
                Add items to build your routine
              </div>
            ) : (
              editItems.map((item, index) => (
                <div key={item.id} className="bg-[#1A1A1A] border border-white/8 rounded-[8px] p-4 flex flex-col md:flex-row gap-5 relative group">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-3 right-3 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-[#ec4899]/15 flex items-center justify-center font-bold text-[#ec4899] shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1 md:col-span-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">{item.type} Practice</span>
                    </div>

                    {item.type === 'Scale' && (
                      <>
                        <div>
                          <label className={labelClass}>Root Note</label>
                          <select value={item.rootNote} onChange={e => updateItem(item.id, { rootNote: parseInt(e.target.value) })} className={inputClass}>
                            {NOTES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Scale Type</label>
                          <select value={item.scaleType} onChange={e => updateItem(item.id, { scaleType: e.target.value })} className={inputClass}>
                            {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {item.type === 'Arpeggio' && (
                      <>
                        <div>
                          <label className={labelClass}>Root Note</label>
                          <select value={item.rootNote} onChange={e => updateItem(item.id, { rootNote: parseInt(e.target.value) })} className={inputClass}>
                            {NOTES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Arpeggio Type</label>
                          <select value={item.arpeggioType} onChange={e => updateItem(item.id, { arpeggioType: e.target.value })} className={inputClass}>
                            {Object.keys(ARPEGGIOS).map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {item.type === 'Metronome' && (
                      <>
                        <div>
                          <label className={labelClass}>BPM</label>
                          <input type="number" min="20" max="300" value={item.bpm} onChange={e => updateItem(item.id, { bpm: parseInt(e.target.value) || 120 })} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Time Signature</label>
                          <select value={item.timeSignature} onChange={e => updateItem(item.id, { timeSignature: parseInt(e.target.value) })} className={inputClass}>
                            {[3, 4, 5, 6, 7].map(ts => <option key={ts} value={ts}>{ts}/4</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    <div>
                      <label className={labelClass}>Duration (min)</label>
                      <input type="number" min="1" max="60" value={item.durationMinutes} onChange={e => updateItem(item.id, { durationMinutes: parseInt(e.target.value) || 5 })} className={inputClass} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ec4899]" />

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Practice Routines</h1>
            <p className="text-[#ec4899] font-light tracking-[0.2em] uppercase text-xs mt-1">Build and save custom practice sessions</p>
          </div>
          <button
            onClick={startNewRoutine}
            className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-[#0A0A0A] rounded-[8px] text-sm font-bold transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> New Routine
          </button>
        </div>

        {routines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 bg-[#1A1A1A] border border-white/8 border-dashed rounded-[8px]">
            <ListMusic className="w-14 h-14 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-extrabold tracking-tight text-white/50 mb-2">No routines yet</h2>
            <p className="text-white/25 text-sm mb-6 max-w-xs mx-auto">Combine scales, arpeggios, and metronome drills into a timed practice plan.</p>
            <button
              onClick={startNewRoutine}
              className="px-5 py-2.5 bg-[#1A1A1A] border border-white/10 hover:border-[#16a34a]/40 text-white/70 hover:text-white rounded-[8px] text-sm font-medium transition-all"
            >
              Create Routine
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routines.map(routine => {
              const totalMinutes = routine.items.reduce((acc, item) => acc + item.durationMinutes, 0);
              return (
                <div key={routine.id} className="bg-[#1A1A1A] border border-white/8 rounded-[8px] p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-extrabold tracking-tight text-white">{routine.name}</h3>
                      <p className="text-xs text-white/30 mt-0.5">{routine.items.length} items · {totalMinutes} min</p>
                    </div>
                    <button
                      onClick={() => deleteRoutine(routine.id)}
                      className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-[6px] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {routine.items.slice(0, 3).map((item, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#222] rounded-[4px] text-[10px] font-bold uppercase tracking-wide text-white/50">
                          {item.type}
                        </span>
                      ))}
                      {routine.items.length > 3 && (
                        <span className="px-2 py-0.5 bg-[#222] rounded-[4px] text-[10px] font-bold text-white/25">
                          +{routine.items.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setActiveRoutine(routine)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#ec4899] hover:bg-[#db2777] text-white rounded-[8px] text-sm font-bold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play
                    </button>
                    <button
                      onClick={() => editExistingRoutine(routine)}
                      className="px-4 py-2 bg-[#222] hover:bg-[#333] text-white/70 hover:text-white rounded-[8px] text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
