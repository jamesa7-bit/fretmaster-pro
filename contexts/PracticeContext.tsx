'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

const STORAGE_KEY = 'fretmaster_practice_sessions';

export interface Session {
  date: string; // YYYY-MM-DD
  ms: number;
}

interface PracticeContextValue {
  timerRunning: boolean;
  elapsed: number;
  dailyMs: number;
  weeklyMs: number;
  sessions: Session[];
  startTimer: () => void;
  stopTimer: () => void;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

function todayStr() { return new Date().toISOString().slice(0, 10); }

function weekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function loadSessions(): Session[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveSessions(s: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dailyMs, setDailyMs] = useState(0);
  const [weeklyMs, setWeeklyMs] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a ref to latest sessions for the beforeunload handler
  const sessionsRef = useRef<Session[]>([]);
  const elapsedRef = useRef(0);
  const timerRunningRef = useRef(false);

  sessionsRef.current = sessions;
  elapsedRef.current = elapsed;
  timerRunningRef.current = timerRunning;

  // Load on mount
  useEffect(() => {
    const sess = loadSessions();
    setSessions(sess);
    const today = todayStr();
    const wStart = weekStart();
    setDailyMs(sess.filter(s => s.date === today).reduce((a, s) => a + s.ms, 0));
    setWeeklyMs(sess.filter(s => s.date >= wStart).reduce((a, s) => a + s.ms, 0));
  }, []);

  // Auto-save on page close
  useEffect(() => {
    const handleUnload = () => {
      if (timerRunningRef.current && elapsedRef.current >= 1000) {
        const updated = [...sessionsRef.current, { date: todayStr(), ms: elapsedRef.current }];
        saveSessions(updated);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

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
    if (duration < 1000) { setElapsed(0); return; }

    const newSession = { date: todayStr(), ms: duration };
    const updated = [...sessions, newSession];
    saveSessions(updated);
    setSessions(updated);
    setDailyMs(prev => prev + duration);
    setWeeklyMs(prev => prev + duration);
    setElapsed(0);
    startTimeRef.current = null;
  };

  return (
    <PracticeContext.Provider value={{ timerRunning, elapsed, dailyMs, weeklyMs, sessions, startTimer, stopTimer }}>
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice() {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error('usePractice must be used within PracticeProvider');
  return ctx;
}
