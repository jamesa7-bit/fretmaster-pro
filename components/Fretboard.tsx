'use client';

import React, { useMemo } from 'react';
import { STANDARD_TUNING, getNoteName, getIntervalName, getScaleDegree, CAGEDShape, CAGED_OFFSETS, CAGED_COLORS } from '@/lib/music-theory';
import { useTheme } from '@/contexts/ThemeContext';

export type LabelMode = 'name' | 'degree' | 'interval' | 'none';

export interface FretMarker {
  string: number; // 0-5 (high E to low E)
  fret: number; // 0-24
  label?: string;
  isRoot?: boolean;
  isActive?: boolean;
  color?: string;
  isMuted?: boolean;
}

interface FretboardProps {
  markers?: FretMarker[];
  rootNote?: number;
  notes?: number[]; // Array of note indices (0-11) to highlight
  labelMode?: LabelMode;
  numFrets?: number;
  startFret?: number;
  showNut?: boolean;
  cagedOverlay?: { shape: CAGEDShape; rootNote: number } | null;
  compact?: boolean;   // smaller fret/string spacing for mini displays
  dense?: boolean;     // medium density — between compact and full
  maxWidth?: number;   // cap SVG width (px) to control proportional height
  spacious?: boolean;  // larger string spacing so the neck is taller at screen width
}

export default function Fretboard({
  markers = [],
  rootNote = 0,
  notes = [],
  labelMode = 'name',
  numFrets = 15,
  startFret = 0,
  showNut = true,
  cagedOverlay = null,
  compact = false,
  dense = false,
  maxWidth,
  spacious = false,
}: FretboardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware SVG colors
  const clr = {
    boardBg:     isDark ? '#0A0A0A' : '#F8F8F8',
    boardBorder: isDark ? '#1A1A1A' : '#DDDDDD',
    nut:         isDark ? '#333333' : '#AAAAAA',
    fret:        isDark ? '#1A1A1A' : '#CCCCCC',
    string:      isDark ? '#333333' : '#BBBBBB',
    inlay:       isDark ? '#606060' : '#AAAAAA',
    fretLabel:   isDark ? '#888888' : '#666666',
    markerStroke: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
    markerTextRoot: '#0A0A0A',
    markerTextOther: isDark ? '#FFFFFF' : '#0A0A0A',
    muteX:       '#ff4444',
  };

  const strings = 6;

  // Calculate markers if not explicitly provided
  const displayMarkers = useMemo(() => {
    if (markers.length > 0) return markers;
    
    const calculated: FretMarker[] = [];
    if (notes.length === 0) return calculated;

    for (let s = 0; s < strings; s++) {
      const stringTune = STANDARD_TUNING[s];
      for (let f = startFret; f <= startFret + numFrets; f++) {
        const noteIndex = (stringTune + f) % 12;
        if (notes.includes(noteIndex)) {
          const isRoot = noteIndex === rootNote;
          let label = '';
          if (labelMode === 'name') label = getNoteName(noteIndex, false); // Simplified, could use flats based on key
          else if (labelMode === 'interval') label = getIntervalName(rootNote, noteIndex);
          else if (labelMode === 'degree') label = getScaleDegree(rootNote, noteIndex);
          else if (labelMode === 'none') label = '';

          calculated.push({
            string: s,
            fret: f,
            label,
            isRoot,
            isActive: true,
          });
        }
      }
    }
    return calculated;
  }, [markers, notes, rootNote, labelMode, numFrets, startFret]);

  // CAGED overlay fret range
  const cagedFretRange = useMemo(() => {
    if (!cagedOverlay) return null;
    const { shape, rootNote: r } = cagedOverlay;
    // Root on low E string (STANDARD_TUNING[5] = 4 = E)
    const baseFret = ((r - STANDARD_TUNING[5]) % 12 + 12) % 12;
    const [relStart, relEnd] = CAGED_OFFSETS[shape];
    return {
      startFretAbs: baseFret + relStart,
      endFretAbs: baseFret + relEnd,
      color: CAGED_COLORS[shape],
    };
  }, [cagedOverlay]);

  // Fretboard dimensions
  const fretWidth = compact ? 52 : dense ? 62 : spacious ? 72 : 80;
  const stringSpacing = compact ? 24 : dense ? 30 : spacious ? 54 : 40;
  const markerRadius = compact ? 10 : dense ? 13 : spacious ? 17 : 18;
  const labelFontSize = compact ? 9 : dense ? 11 : spacious ? 14 : 16;
  const width = numFrets * fretWidth + (showNut && startFret === 0 ? 20 : 0) + 40;
  const fretLabelHeight = compact ? 14 : dense ? 16 : 18;
  const height = (strings - 1) * stringSpacing + 40 + fretLabelHeight;

  const nutOffset = showNut && startFret === 0 ? 20 : 0;

  // Standard inlay positions
  const inlays = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  return (
    <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{
          minWidth: (!compact && !dense && !spacious && numFrets > 8) ? '800px' : (!compact && dense && numFrets > 8) ? '600px' : 'auto',
          maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        }}
      >
        {/* Background */}
        <rect
          x={nutOffset}
          y={20}
          width={numFrets * fretWidth}
          height={(strings - 1) * stringSpacing}
          fill={clr.boardBg}
          stroke={clr.boardBorder}
          strokeWidth={2}
          rx={0}
        />

        {/* Nut */}
        {showNut && startFret === 0 && (
          <rect
            x={14}
            y={16}
            width={6}
            height={(strings - 1) * stringSpacing + 8}
            fill={clr.nut}
            rx={0}
          />
        )}

        {/* Frets */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => {
          const actualFret = startFret + i;
          if (actualFret === 0) return null;
          const x = nutOffset + i * fretWidth;
          return (
            <line
              key={`fret-${i}`}
              x1={x}
              y1={20}
              x2={x}
              y2={height - 20}
              stroke={clr.fret}
              strokeWidth={2}
            />
          );
        })}

        {/* Inlays + fret number labels */}
        {inlays.map(fret => {
          if (fret < startFret || fret > startFret + numFrets) return null;
          const relativeFret = fret - startFret;
          const x = nutOffset + (relativeFret - 0.5) * fretWidth;
          const yCenter = 20 + ((strings - 1) * stringSpacing) / 2;

          return (
            <g key={`inlay-${fret}`}>
              {fret === 12 || fret === 24 ? (
                <>
                  <circle cx={x} cy={yCenter - stringSpacing} r={compact ? 3 : spacious ? 8 : 5} fill={clr.inlay} />
                  <circle cx={x} cy={yCenter + stringSpacing} r={compact ? 3 : spacious ? 8 : 5} fill={clr.inlay} />
                </>
              ) : (
                <circle cx={x} cy={yCenter} r={compact ? 3 : spacious ? 8 : 5} fill={clr.inlay} />
              )}
              <text
                x={x}
                y={20 + (strings - 1) * stringSpacing + (compact ? 10 : 14)}
                fill={clr.fretLabel}
                fontSize={compact ? 8 : 11}
                textAnchor="middle"
                dominantBaseline="hanging"
                fontWeight="bold"
              >
                {fret}
              </text>
            </g>
          );
        })}

        {/* CAGED Overlay */}
        {cagedFretRange && (() => {
          const rs = cagedFretRange.startFretAbs - startFret;
          const re = cagedFretRange.endFretAbs - startFret;
          if (re < 1 || rs > numFrets) return null;
          const x1 = nutOffset + Math.max(rs - 1, 0) * fretWidth;
          const x2 = nutOffset + Math.min(re, numFrets) * fretWidth;
          return (
            <rect
              x={x1}
              y={20}
              width={x2 - x1}
              height={(strings - 1) * stringSpacing}
              fill={cagedFretRange.color}
              rx={4}
            />
          );
        })()}

        {/* Strings */}
        {Array.from({ length: strings }).map((_, i) => {
          const y = 20 + i * stringSpacing;
          return (
            <line
              key={`string-${i}`}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke={clr.string}
              strokeWidth={2}
            />
          );
        })}

        {/* Markers */}
        {displayMarkers.map((marker, i) => {
          if (marker.fret < startFret || marker.fret > startFret + numFrets) return null;
          
          const relativeFret = marker.fret - startFret;
          const x = marker.fret === 0 
            ? 15 
            : nutOffset + (relativeFret - 0.5) * fretWidth;
          const y = 20 + marker.string * stringSpacing;
          
          const isRoot = marker.isRoot;

          return (
            <g key={`marker-${i}`} className="transition-all duration-300" style={{ transformOrigin: `${x}px ${y}px` }}>
              {marker.isMuted ? (
                <text
                  x={x}
                  y={y}
                  fill={clr.muteX}
                  fontSize={compact ? 14 : 20}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="select-none pointer-events-none"
                >
                  X
                </text>
              ) : (
                <>
                  <circle
                    cx={x}
                    cy={y}
                    r={markerRadius}
                    fill={isRoot ? '#16a34a' : (marker.color || 'transparent')}
                    stroke={isRoot || marker.color ? 'none' : clr.markerStroke}
                    strokeWidth={compact ? 1.5 : 2}
                  />
                  {marker.label && labelMode !== 'none' && (
                    <text
                      x={x}
                      y={y}
                      fill={isRoot ? clr.markerTextRoot : clr.markerTextOther}
                      fontSize={labelFontSize}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="select-none pointer-events-none"
                    >
                      {marker.label}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
