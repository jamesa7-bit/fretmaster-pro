'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  currentContext: string;
  setCurrentContext: (context: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentContext, setCurrentContext] = useState('General Practice');

  return (
    <AppContext.Provider value={{ currentContext, setCurrentContext }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
