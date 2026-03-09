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
  
  // Edit state
  const [editName, setEditName] = useState('');
  const [editItems, setEditItems] = useState<RoutineItem[]>([]);

  // Load routines from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fretmaster_routines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => {
          setRoutines(parsed);
        }, 0);
      } catch (e) {
        console.error('Failed to parse routines', e);
      }
    }
  }, []);

  // Save routines to localStorage
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
    setIsEditing(true);
    setActiveRoutine(null);
  };

  const editExistingRoutine = (routine: Routine) => {
    setEditName(routine.name);
    setEditItems([...routine.items]);
    setIsEditing(true);
    setActiveRoutine(null);
  };

  const saveRoutine = () => {
    if (!editName.trim() || editItems.length === 0) return;

    const newRoutine: Routine = {
      id: Date.now().toString(),
      name: editName,
      items: editItems,
    };

    setRoutines(prev => {
      // If editing existing (we don't track ID currently, so just add new or we could track editId)
      // For simplicity, just add as new. In a real app, we'd update if editing.
      return [...prev, newRoutine];
    });
    
    setIsEditing(false);
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

  if (activeRoutine) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{activeRoutine.name}</h1>
          <button 
            onClick={() => setActiveRoutine(null)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Routines
          </button>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 mb-6">Routine playback is a placeholder. In a full implementation, this would step through each item with a timer, showing the relevant Fretboard or Metronome component automatically.</p>
          
          <div className="space-y-4">
            {activeRoutine.items.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-200">
                      {item.type === 'Scale' && `${NOTES[item.rootNote || 0]} ${item.scaleType} Scale`}
                      {item.type === 'Arpeggio' && `${NOTES[item.rootNote || 0]} ${item.arpeggioType} Arpeggio`}
                      {item.type === 'Metronome' && `Metronome Practice (${item.bpm} BPM)`}
                    </h3>
                    <p className="text-sm text-zinc-400">{item.durationMinutes} minutes</p>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center hover:bg-indigo-600 transition-colors">
                  <Play className="w-4 h-4 text-white fill-current" />
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
      <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <input 
            type="text" 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="text-3xl font-bold tracking-tight bg-transparent border-b border-zinc-700 focus:border-indigo-500 focus:outline-none pb-1"
            placeholder="Routine Name"
          />
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={saveRoutine}
              disabled={editItems.length === 0}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <button onClick={() => addItem('Scale')} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-indigo-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Scale
          </button>
          <button onClick={() => addItem('Arpeggio')} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-indigo-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Arpeggio
          </button>
          <button onClick={() => addItem('Metronome')} className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-indigo-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Metronome
          </button>
        </div>

        <div className="space-y-4">
          {editItems.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl text-zinc-500">
              Add items to build your routine
            </div>
          ) : (
            editItems.map((item, index) => (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 relative group">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xl shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-3">
                    <h3 className="font-bold text-lg text-indigo-400">{item.type} Practice</h3>
                  </div>
                  
                  {item.type === 'Scale' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Root Note</label>
                        <select 
                          value={item.rootNote} 
                          onChange={(e) => updateItem(item.id, { rootNote: parseInt(e.target.value) })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          {NOTES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Scale Type</label>
                        <select 
                          value={item.scaleType} 
                          onChange={(e) => updateItem(item.id, { scaleType: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {item.type === 'Arpeggio' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Root Note</label>
                        <select 
                          value={item.rootNote} 
                          onChange={(e) => updateItem(item.id, { rootNote: parseInt(e.target.value) })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          {NOTES.map((n, i) => <option key={i} value={i}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Arpeggio Type</label>
                        <select 
                          value={item.arpeggioType} 
                          onChange={(e) => updateItem(item.id, { arpeggioType: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          {Object.keys(ARPEGGIOS).map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {item.type === 'Metronome' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">BPM</label>
                        <input 
                          type="number" 
                          min="20" max="300"
                          value={item.bpm} 
                          onChange={(e) => updateItem(item.id, { bpm: parseInt(e.target.value) || 120 })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Time Signature</label>
                        <select 
                          value={item.timeSignature} 
                          onChange={(e) => updateItem(item.id, { timeSignature: parseInt(e.target.value) })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          {[3, 4, 5, 6, 7].map(ts => <option key={ts} value={ts}>{ts}/4</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Duration (min)</label>
                    <input 
                      type="number" 
                      min="1" max="60"
                      value={item.durationMinutes} 
                      onChange={(e) => updateItem(item.id, { durationMinutes: parseInt(e.target.value) || 5 })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Routines</h1>
          <p className="text-zinc-400 mt-1">Build and save custom practice sessions.</p>
        </div>
        
        <button
          onClick={startNewRoutine}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> New Routine
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <ListMusic className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-300 mb-2">No routines yet</h2>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto">Create your first custom practice routine by combining scales, arpeggios, and metronome drills.</p>
          <button
            onClick={startNewRoutine}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
          >
            Create Routine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routines.map(routine => {
            const totalMinutes = routine.items.reduce((acc, item) => acc + item.durationMinutes, 0);
            
            return (
              <div key={routine.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{routine.name}</h3>
                    <p className="text-sm text-zinc-400">{routine.items.length} items • {totalMinutes} mins</p>
                  </div>
                  <button 
                    onClick={() => deleteRoutine(routine.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 mb-6">
                  <div className="flex flex-wrap gap-2">
                    {routine.items.slice(0, 3).map((item, i) => (
                      <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-xs font-medium text-zinc-300">
                        {item.type}
                      </span>
                    ))}
                    {routine.items.length > 3 && (
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-medium text-zinc-500">
                        +{routine.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-auto">
                  <button 
                    onClick={() => setActiveRoutine(routine)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" /> Play
                  </button>
                  <button 
                    onClick={() => editExistingRoutine(routine)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
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
  );
}
