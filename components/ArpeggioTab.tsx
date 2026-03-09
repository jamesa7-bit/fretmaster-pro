'use client';

import React from 'react';
import { FretMarker } from './Fretboard';

interface ArpeggioTabProps {
  markers: FretMarker[];
  activeNoteIndex: number;
}

const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']; // string 0–5, displayed top to bottom
const LINE_SPACING = 20;
const LABEL_WIDTH = 20;
const COLUMN_WIDTH = 44;
const H_PADDING = 16;
const V_PADDING = 14;
const FONT_SIZE = 13;

export default function ArpeggioTab({ markers, activeNoteIndex }: ArpeggioTabProps) {
  if (markers.length === 0) {
    return (
      <div className="text-white/30 text-sm text-center py-4">No notes to display</div>
    );
  }

  const numColumns = markers.length;
  const svgWidth = LABEL_WIDTH + H_PADDING + numColumns * COLUMN_WIDTH + H_PADDING;
  const svgHeight = 5 * LINE_SPACING + V_PADDING * 2;

  return (
    <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        height={svgHeight}
        className="w-auto"
        style={{ minWidth: `${svgWidth}px` }}
      >
        {/* String lines */}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = V_PADDING + i * LINE_SPACING;
          return (
            <line
              key={`line-${i}`}
              x1={LABEL_WIDTH}
              y1={y}
              x2={svgWidth - H_PADDING}
              y2={y}
              stroke="#333"
              strokeWidth={1}
            />
          );
        })}

        {/* String labels */}
        {STRING_LABELS.map((label, i) => (
          <text
            key={`label-${i}`}
            x={LABEL_WIDTH - 6}
            y={V_PADDING + i * LINE_SPACING}
            fill="#555"
            fontSize={10}
            textAnchor="end"
            dominantBaseline="central"
            fontFamily="monospace"
          >
            {label}
          </text>
        ))}

        {/* Fret number columns */}
        {markers.map((marker, colIndex) => {
          const x = LABEL_WIDTH + H_PADDING + colIndex * COLUMN_WIDTH + COLUMN_WIDTH / 2;
          const y = V_PADDING + marker.string * LINE_SPACING;
          const isActive = colIndex === activeNoteIndex;
          const fretText = String(marker.fret);
          const isWide = fretText.length > 1;
          const rectW = isWide ? 24 : 18;

          return (
            <g key={`note-${colIndex}`}>
              <rect
                x={x - rectW / 2}
                y={y - 9}
                width={rectW}
                height={18}
                fill={isActive ? '#16a34a' : '#111'}
                rx={3}
              />
              <text
                x={x}
                y={y}
                fill={isActive ? '#0A0A0A' : '#CCCCCC'}
                fontSize={FONT_SIZE}
                fontWeight={isActive ? 'bold' : 'normal'}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="monospace"
                className="select-none"
              >
                {fretText}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
