'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface SelectedKey {
  rootIndex: number; // chromatic index 0-11
  label: string;     // display name, e.g. "C", "F#", "Db"
}

interface MusicContextType {
  selectedKey: SelectedKey;
  setSelectedKey: (key: SelectedKey) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicContextProvider({ children }: { children: ReactNode }) {
  const [selectedKey, setSelectedKey] = useState<SelectedKey>({
    rootIndex: 0,
    label: 'C',
  });

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
