'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SelectedKey {
  rootIndex: number; // chromatic index 0-11
  label: string;     // display name, e.g. "C", "F#", "Db"
}

interface MusicContextType {
  selectedKey: SelectedKey;
  setSelectedKey: (key: SelectedKey) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const DEFAULT_KEY: SelectedKey = { rootIndex: 0, label: 'C' };

export function MusicContextProvider({ children }: { children: ReactNode }) {
  const [selectedKey, setSelectedKey] = useState<SelectedKey>(() => {
    if (typeof window === 'undefined') return DEFAULT_KEY;
    try {
      const saved = localStorage.getItem('fretmaster_key');
      if (saved) return JSON.parse(saved) as SelectedKey;
    } catch {}
    return DEFAULT_KEY;
  });

  useEffect(() => {
    localStorage.setItem('fretmaster_key', JSON.stringify(selectedKey));
  }, [selectedKey]);

  return (
    <MusicContext.Provider value={{ selectedKey, setSelectedKey }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusicContext must be used within a MusicContextProvider');
  }
  return context;
}
