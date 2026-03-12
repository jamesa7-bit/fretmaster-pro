'use client';

import { useState, useMemo, useEffect } from 'react';
import { NOTES, SCALES, getScaleNotes, CAGEDShape } from '@/lib/music-theory';
import Fretboard, { LabelMode } from './Fretboard';
import { useAppContext } from './AppContext';
import { useMusicContext } from '@/contexts/MusicContext';

export default function ScaleDiagrams() {
  const [rootNote, setRootNote] = useState(0); // 0 = C
  const [scaleType, setScaleType] = useState('Major');
  const [labelMode, setLabelMode] = useState<LabelMode>('name');
  const [syncWithCircle, setSyncWithCircle] = useState(false);
  const [showCaged, setShowCaged] = useState(false);
  const [cagedShape, setCagedShape] = useState<CAGEDShape | null>(null);
  const { setCurrentContext } = useAppContext();
  const { selectedKey } = useMusicContext();

  const effectiveRoot = syncWithCircle ? selectedKey.rootIndex : rootNote;
  const effectiveLabel = syncWithCircle ? selectedKey.label : NOTES[rootNote];

  useEffect(() => {
    setCurrentContext(`Viewing Scale: ${effectiveLabel} ${scaleType}`);
  }, [effectiveRoot, scaleType, setCurrentContext, effectiveLabel]);

  const scaleNotes = useMemo(() => getScaleNotes(effectiveRoot, scaleType), [effectiveRoot, scaleType]);

  return (
    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-500 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Scale Library</h1>
          <p className="text-[#16a34a] font-light tracking-[0.2em] uppercase text-xs mt-1">Explore scales across the entire fretboard</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync with Circle of Fifths toggle */}
          <button
            onClick={() => setSyncWithCircle(s => !s)}
            className={`px-4 py-2 rounded-[6px] text-xs font-bold tracking-wide uppercase transition-all ${
              syncWithCircle
                ? 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30'
                : 'bg-[#1A1A1A] text-white/50 hover:bg-[#222] hover:text-white'
            }`}
          >
            {syncWithCircle ? `⟳ Synced: ${selectedKey.label}` : 'Sync with Circle'}
          </button>

          <div className="flex bg-[#1A1A1A] rounded-[8px] p-1">
            {(['name', 'degree', 'interval', 'none'] as LabelMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLabelMode(mode)}
                className={`px-4 py-2 rounded-[6px] text-xs font-light tracking-wide transition-all ${
                  labelMode === mode
                    ? 'bg-[#16a34a] text-[#0A0A0A] font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compact controls bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-[#1A1A1A] rounded-[8px] px-4 py-3 shrink-0">
        {!syncWithCircle && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Root</span>
            <select
              value={rootNote}
              onChange={e => setRootNote(Number(e.target.value))}
              className="bg-[#222] text-white rounded-[6px] px-2 py-1.5 text-sm font-bold focus:outline-none cursor-pointer"
            >
              {NOTES.map((note, i) => <option key={note} value={i}>{note}</option>)}
            </select>
          </div>
        )}
        {!syncWithCircle && <div className="w-px h-5 bg-white/10" />}

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Scale</span>
          <select
            value={scaleType}
            onChange={e => setScaleType(e.target.value)}
            className="bg-[#222] text-white rounded-[6px] px-2 py-1.5 text-sm font-bold focus:outline-none cursor-pointer"
          >
            {Object.keys(SCALES).map(scale => <option key={scale} value={scale}>{scale}</option>)}
          </select>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">CAGED</span>
          <button
            onClick={() => setShowCaged(s => !s)}
            className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${showCaged ? 'bg-[#16a34a]' : 'bg-[#333]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showCaged ? 'left-4' : 'left-0.5'}`} />
          </button>
          {showCaged && (
            <div className="flex gap-1">
              {(['C', 'A', 'G', 'E', 'D'] as CAGEDShape[]).map(shape => (
                <button
                  key={shape}
                  onClick={() => setCagedShape(s => s === shape ? null : shape)}
                  className={`w-7 h-7 rounded-[4px] text-xs font-bold transition-all ${
                    cagedShape === shape ? 'bg-[#16a34a] text-[#0A0A0A]' : 'bg-[#222] text-white/70 hover:bg-[#333]'
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[#1A1A1A] rounded-[8px] p-2 overflow-hidden flex flex-col min-h-[300px]">
        <div className="px-3 pt-2 pb-1 shrink-0 flex items-center gap-2">
          <span className="text-base font-bold tracking-tight">{effectiveLabel} {scaleType}</span>
          {showCaged && cagedShape && (
            <span className="text-xs font-light text-white/40 tracking-widest uppercase">{cagedShape} shape</span>
          )}
        </div>
        <div className="flex-1 overflow-hidden flex items-center">
          <Fretboard
            rootNote={effectiveRoot}
            notes={scaleNotes}
            labelMode={labelMode}
            numFrets={22}
            cagedOverlay={showCaged && cagedShape ? { shape: cagedShape, rootNote: effectiveRoot } : null}
          />
        </div>
      </div>
    </div>
  );
}
