'use client';

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';

interface MetronomeContextType {
  bpm: number;
  setBpm: (v: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  beatsPerMeasure: number;
  setBeatsPerMeasure: (n: number) => void;
  accentedBeats: number[];
  toggleAccent: (index: number) => void;
  setAccentedBeats: (beats: number[]) => void;
  subdivision: number;
  setSubdivision: (s: number) => void;
  currentBeat: number;
  currentSubdivision: number;
  speedTrainerActive: boolean;
  setSpeedTrainerActive: (v: boolean | ((prev: boolean) => boolean)) => void;
  incrementAmount: number;
  setIncrementAmount: (n: number) => void;
  incrementInterval: number;
  setIncrementInterval: (n: number) => void;
  targetBPM: number;
  setTargetBPM: (n: number) => void;
}

const MetronomeContext = createContext<MetronomeContextType | undefined>(undefined);

export function MetronomeProvider({ children }: { children: ReactNode }) {
  const [bpm, setBpmState] = useState(() => {
    if (typeof window === 'undefined') return 120;
    const saved = parseInt(localStorage.getItem('fretmaster_bpm') ?? '', 10);
    return Number.isFinite(saved) && saved >= 20 && saved <= 300 ? saved : 120;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasureState] = useState(4);
  const [accentedBeats, setAccentedBeats] = useState<number[]>([0]);
  const [subdivision, setSubdivisionState] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [currentSubdivision, setCurrentSubdivision] = useState(-1);
  const [speedTrainerActive, setSpeedTrainerActive] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(5);
  const [incrementInterval, setIncrementInterval] = useState(4);
  const [targetBPM, setTargetBPM] = useState(160);

  // Refs — these live for the lifetime of the provider, not the Metronome component
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
  const beatsPerMeasureRef = useRef(4);
  const subdivisionRef = useRef(1);
  const accentedBeatsRef = useRef<number[]>([0]);

  // Persist BPM across sessions
  useEffect(() => { localStorage.setItem('fretmaster_bpm', String(bpm)); }, [bpm]);

  // Keep refs in sync
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { speedTrainerActiveRef.current = speedTrainerActive; }, [speedTrainerActive]);
  useEffect(() => { incrementAmountRef.current = incrementAmount; }, [incrementAmount]);
  useEffect(() => { incrementIntervalRef.current = incrementInterval; }, [incrementInterval]);
  useEffect(() => { targetBPMRef.current = targetBPM; }, [targetBPM]);
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure; }, [beatsPerMeasure]);
  useEffect(() => { subdivisionRef.current = subdivision; }, [subdivision]);
  useEffect(() => { accentedBeatsRef.current = accentedBeats; }, [accentedBeats]);
  useEffect(() => { if (!speedTrainerActive) barCounterRef.current = 0; }, [speedTrainerActive]);

  const lookahead = 25.0;
  const scheduleAheadTime = 0.1;

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpmRef.current;
    const secondsPerSubdivision = secondsPerBeat / subdivisionRef.current;
    nextNoteTimeRef.current += secondsPerSubdivision;

    currentSubdivisionIndexRef.current++;
    if (currentSubdivisionIndexRef.current === subdivisionRef.current) {
      currentSubdivisionIndexRef.current = 0;
      currentBeatInMeasureRef.current++;
      if (currentBeatInMeasureRef.current === beatsPerMeasureRef.current) {
        currentBeatInMeasureRef.current = 0;
        if (speedTrainerActiveRef.current) {
          barCounterRef.current++;
          if (barCounterRef.current % incrementIntervalRef.current === 0) {
            setBpmState(prev =>
              prev < targetBPMRef.current
                ? Math.min(targetBPMRef.current, prev + incrementAmountRef.current)
                : prev
            );
          }
        }
      }
    }
  }, []);

  const playClick = useCallback((time: number, beatNumber: number, subIndex: number) => {
    if (!audioContextRef.current) return;
    const osc = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    const isAccent = subIndex === 0 && accentedBeatsRef.current.includes(beatNumber);
    const isBeat = subIndex === 0;

    if (isAccent) {
      osc.frequency.value = 1200.0;
      gainNode.gain.value = 1.0;
    } else if (isBeat) {
      osc.frequency.value = 800.0;
      gainNode.gain.value = 0.5;
    } else {
      osc.frequency.value = 600.0;
      gainNode.gain.value = 0.38;
    }

    osc.start(time);
    osc.stop(time + 0.05);

    setTimeout(() => {
      setCurrentBeat(beatNumber);
      setCurrentSubdivision(subIndex);
    }, (time - audioContextRef.current!.currentTime) * 1000);
  }, []);

  const scheduler = useCallback(function schedulerFn() {
    if (!audioContextRef.current) return;
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      playClick(nextNoteTimeRef.current, currentBeatInMeasureRef.current, currentSubdivisionIndexRef.current);
      nextNote();
    }
    timerIDRef.current = window.setTimeout(schedulerFn, lookahead);
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
  }, [isPlaying, scheduler, initAudioContext]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev) {
        currentBeatInMeasureRef.current = 0;
        currentSubdivisionIndexRef.current = 0;
      }
      return !prev;
    });
  }, []);

  const setBpm = useCallback((v: number | ((prev: number) => number)) => {
    setBpmState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      return Math.min(300, Math.max(20, next));
    });
  }, []);

  const setBeatsPerMeasure = useCallback((n: number) => {
    setBeatsPerMeasureState(n);
    setAccentedBeats([0]);
  }, []);

  const setSubdivision = useCallback((s: number) => {
    setSubdivisionState(s);
  }, []);

  const toggleAccent = useCallback((index: number) => {
    setAccentedBeats(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }, []);

  return (
    <MetronomeContext.Provider value={{
      bpm, setBpm, isPlaying, togglePlay,
      beatsPerMeasure, setBeatsPerMeasure,
      accentedBeats, toggleAccent, setAccentedBeats,
      subdivision, setSubdivision,
      currentBeat, currentSubdivision,
      speedTrainerActive, setSpeedTrainerActive,
      incrementAmount, setIncrementAmount,
      incrementInterval, setIncrementInterval,
      targetBPM, setTargetBPM,
    }}>
      {children}
    </MetronomeContext.Provider>
  );
}

export function useMetronome() {
  const ctx = useContext(MetronomeContext);
  if (!ctx) throw new Error('useMetronome must be used within MetronomeProvider');
  return ctx;
}
