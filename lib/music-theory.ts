export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const INTERVALS = ['Root', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
export const SCALE_DEGREES = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

export const SCALES: Record<string, number[]> = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10],
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
};

export const ARPEGGIOS: Record<string, number[]> = {
  'Major': [0, 4, 7],
  'Minor': [0, 3, 7],
  'Dominant 7th': [0, 4, 7, 10],
  'Major 7th': [0, 4, 7, 11],
  'Minor 7th': [0, 3, 7, 10],
  'Diminished 7th': [0, 3, 6, 9],
  'Half-Diminished 7th': [0, 3, 6, 10],
};

// Triads: intervals from root, interval labels, and colors for neck visualization
export const TRIADS: Record<string, { intervals: number[]; labels: string[]; colors: string[] }> = {
  'Major':      { intervals: [0, 4, 7],  labels: ['R', '3',  '5'],  colors: ['#16a34a', '#f59e0b', '#94a3b8'] },
  'Minor':      { intervals: [0, 3, 7],  labels: ['R', 'b3', '5'],  colors: ['#16a34a', '#f59e0b', '#94a3b8'] },
  'Diminished': { intervals: [0, 3, 6],  labels: ['R', 'b3', 'b5'], colors: ['#16a34a', '#f59e0b', '#94a3b8'] },
  'Augmented':  { intervals: [0, 4, 8],  labels: ['R', '3',  '#5'], colors: ['#16a34a', '#f59e0b', '#94a3b8'] },
  'Sus2':       { intervals: [0, 2, 7],  labels: ['R', '2',  '5'],  colors: ['#16a34a', '#f59e0b', '#94a3b8'] },
  'Sus4':       { intervals: [0, 5, 7],  labels: ['R', '4',  '5'],  colors: ['#16a34a', '#f59e0b', '#94a3b8'] },
};

// Standard tuning: E A D G B E (from low to high)
// Note indices in NOTES array: E=4, A=9, D=2, G=7, B=11, E=4
export const STANDARD_TUNING = [4, 11, 7, 2, 9, 4]; // High E to Low E

export function getNoteName(noteIndex: number, useFlats: boolean = false): string {
  const normalizedIndex = ((noteIndex % 12) + 12) % 12;
  return useFlats ? FLAT_NOTES[normalizedIndex] : NOTES[normalizedIndex];
}

export function getIntervalName(rootIndex: number, noteIndex: number): string {
  const interval = ((noteIndex - rootIndex) % 12 + 12) % 12;
  return INTERVALS[interval];
}

export function getScaleDegree(rootIndex: number, noteIndex: number): string {
  const interval = ((noteIndex - rootIndex) % 12 + 12) % 12;
  return SCALE_DEGREES[interval];
}

export function getScaleNotes(rootIndex: number, scaleType: string): number[] {
  const intervals = SCALES[scaleType] || SCALES['Major'];
  return intervals.map(interval => (rootIndex + interval) % 12);
}

export function getArpeggioNotes(rootIndex: number, arpeggioType: string): number[] {
  const intervals = ARPEGGIOS[arpeggioType] || ARPEGGIOS['Major'];
  return intervals.map(interval => (rootIndex + interval) % 12);
}

export type CAGEDShape = 'C' | 'A' | 'G' | 'E' | 'D';

// Fret range offsets relative to root-on-low-E-string position
// e.g. root C is at fret 8 on low E (STANDARD_TUNING[5]=4, so (0-4+12)%12=8)
export const CAGED_OFFSETS: Record<CAGEDShape, [number, number]> = {
  E: [0, 3],
  D: [2, 5],
  C: [4, 7],
  A: [7, 10],
  G: [9, 12],
};

export const CAGED_COLORS: Record<CAGEDShape, string> = {
  C: 'rgba(20,184,166,0.25)',   // teal
  A: 'rgba(245,158,11,0.25)',   // amber
  G: 'rgba(34,197,94,0.25)',    // green
  E: 'rgba(249,115,22,0.25)',   // orange
  D: 'rgba(236,72,153,0.25)',   // pink
};

export const CIRCLE_OF_FIFTHS = [
  { key: 'C', minor: 'Am', sharps: 0, flats: 0, index: 0 },
  { key: 'G', minor: 'Em', sharps: 1, flats: 0, index: 7 },
  { key: 'D', minor: 'Bm', sharps: 2, flats: 0, index: 2 },
  { key: 'A', minor: 'F#m', sharps: 3, flats: 0, index: 9 },
  { key: 'E', minor: 'C#m', sharps: 4, flats: 0, index: 4 },
  { key: 'B', minor: 'G#m', sharps: 5, flats: 0, index: 11 },
  { key: 'F#', minor: 'D#m', sharps: 6, flats: 6, index: 6 },
  { key: 'Db', minor: 'Bbm', sharps: 0, flats: 5, index: 1 },
  { key: 'Ab', minor: 'Fm', sharps: 0, flats: 4, index: 8 },
  { key: 'Eb', minor: 'Cm', sharps: 0, flats: 3, index: 3 },
  { key: 'Bb', minor: 'Gm', sharps: 0, flats: 2, index: 10 },
  { key: 'F', minor: 'Dm', sharps: 0, flats: 1, index: 5 },
];
