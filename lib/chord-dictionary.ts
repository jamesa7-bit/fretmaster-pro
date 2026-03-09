export type ChordShape = {
  frets: number[]; // [lowE, A, D, G, B, highE], -1 for muted
  fingers: number[]; // [lowE, A, D, G, B, highE], 0 for open, -1 for muted
};

export const CHORD_DICTIONARY: Record<string, ChordShape> = {
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [-1, 3, 2, 0, 1, 0] },
  'Cm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [-1, 1, 3, 4, 2, 1] },
  'C#': { frets: [-1, 4, 6, 6, 6, 4], fingers: [-1, 1, 2, 3, 4, 1] },
  'C#m': { frets: [-1, 4, 6, 6, 5, 4], fingers: [-1, 1, 3, 4, 2, 1] },
  'Db': { frets: [-1, 4, 6, 6, 6, 4], fingers: [-1, 1, 2, 3, 4, 1] },
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [-1, -1, 0, 1, 3, 2] },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [-1, -1, 0, 2, 3, 1] },
  'D#': { frets: [-1, 6, 8, 8, 8, 6], fingers: [-1, 1, 2, 3, 4, 1] },
  'D#m': { frets: [-1, 6, 8, 8, 7, 6], fingers: [-1, 1, 3, 4, 2, 1] },
  'Eb': { frets: [-1, 6, 8, 8, 8, 6], fingers: [-1, 1, 2, 3, 4, 1] },
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
  'F#': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1] },
  'Gb': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] },
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] },
  'G#': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1] },
  'G#m': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1] },
  'Ab': { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1] },
  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [-1, 0, 1, 2, 3, 0] },
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [-1, 0, 2, 3, 1, 0] },
  'A#': { frets: [-1, 1, 3, 3, 3, 1], fingers: [-1, 1, 2, 3, 4, 1] },
  'A#m': { frets: [-1, 1, 3, 3, 2, 1], fingers: [-1, 1, 3, 4, 2, 1] },
  'Bbm': { frets: [-1, 1, 3, 3, 2, 1], fingers: [-1, 1, 3, 4, 2, 1] },
  'Bb': { frets: [-1, 1, 3, 3, 3, 1], fingers: [-1, 1, 2, 3, 4, 1] },
  'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [-1, 1, 2, 3, 4, 1] },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [-1, 1, 3, 4, 2, 1] },
  
  // Enharmonic minors
  'Dbm': { frets: [-1, 4, 6, 6, 5, 4], fingers: [-1, 1, 3, 4, 2, 1] },
  'Ebm': { frets: [-1, 6, 8, 8, 7, 6], fingers: [-1, 1, 3, 4, 2, 1] },
  'Gbm': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1] },
  'Abm': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1] },
  
  // Diminished chords
  'Cdim': { frets: [-1, 3, 4, 5, 4, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'C#dim': { frets: [-1, 4, 5, 6, 5, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Ddim': { frets: [-1, 5, 6, 7, 6, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'D#dim': { frets: [-1, 6, 7, 8, 7, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Edim': { frets: [-1, 7, 8, 9, 8, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Fdim': { frets: [-1, 8, 9, 10, 9, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'F#dim': { frets: [-1, 9, 10, 11, 10, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Gdim': { frets: [-1, 10, 11, 12, 11, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'G#dim': { frets: [-1, 11, 12, 13, 12, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Adim': { frets: [-1, 0, 1, 2, 1, -1], fingers: [-1, 0, 1, 3, 2, -1] },
  'A#dim': { frets: [-1, 1, 2, 3, 2, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Bdim': { frets: [-1, 2, 3, 4, 3, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  
  // Enharmonic equivalents for diminished
  'Dbdim': { frets: [-1, 4, 5, 6, 5, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Ebdim': { frets: [-1, 6, 7, 8, 7, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Gbdim': { frets: [-1, 9, 10, 11, 10, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Abdim': { frets: [-1, 11, 12, 13, 12, -1], fingers: [-1, 1, 2, 4, 3, -1] },
  'Bbdim': { frets: [-1, 1, 2, 3, 2, -1], fingers: [-1, 1, 2, 4, 3, -1] },
};

export const DIATONIC_KEYS = [
  {
    key: 'C',
    chords: [
      { numeral: 'I Major', name: 'C' },
      { numeral: 'II Minor', name: 'Dm' },
      { numeral: 'III Minor', name: 'Em' },
      { numeral: 'IV Major', name: 'F' },
      { numeral: 'V Major', name: 'G' },
      { numeral: 'VI Minor', name: 'Am' },
      { numeral: 'VII Diminished', name: 'Bdim' },
    ]
  },
  {
    key: 'G',
    chords: [
      { numeral: 'I Major', name: 'G' },
      { numeral: 'II Minor', name: 'Am' },
      { numeral: 'III Minor', name: 'Bm' },
      { numeral: 'IV Major', name: 'C' },
      { numeral: 'V Major', name: 'D' },
      { numeral: 'VI Minor', name: 'Em' },
      { numeral: 'VII Diminished', name: 'F#dim' },
    ]
  },
  {
    key: 'D',
    chords: [
      { numeral: 'I Major', name: 'D' },
      { numeral: 'II Minor', name: 'Em' },
      { numeral: 'III Minor', name: 'F#m' },
      { numeral: 'IV Major', name: 'G' },
      { numeral: 'V Major', name: 'A' },
      { numeral: 'VI Minor', name: 'Bm' },
      { numeral: 'VII Diminished', name: 'C#dim' },
    ]
  },
  {
    key: 'A',
    chords: [
      { numeral: 'I Major', name: 'A' },
      { numeral: 'II Minor', name: 'Bm' },
      { numeral: 'III Minor', name: 'C#m' },
      { numeral: 'IV Major', name: 'D' },
      { numeral: 'V Major', name: 'E' },
      { numeral: 'VI Minor', name: 'F#m' },
      { numeral: 'VII Diminished', name: 'G#dim' },
    ]
  },
  {
    key: 'E',
    chords: [
      { numeral: 'I Major', name: 'E' },
      { numeral: 'II Minor', name: 'F#m' },
      { numeral: 'III Minor', name: 'G#m' },
      { numeral: 'IV Major', name: 'A' },
      { numeral: 'V Major', name: 'B' },
      { numeral: 'VI Minor', name: 'C#m' },
      { numeral: 'VII Diminished', name: 'D#dim' },
    ]
  },
  {
    key: 'B',
    chords: [
      { numeral: 'I Major', name: 'B' },
      { numeral: 'II Minor', name: 'C#m' },
      { numeral: 'III Minor', name: 'D#m' },
      { numeral: 'IV Major', name: 'E' },
      { numeral: 'V Major', name: 'F#' },
      { numeral: 'VI Minor', name: 'G#m' },
      { numeral: 'VII Diminished', name: 'A#dim' },
    ]
  },
  {
    key: 'F#',
    chords: [
      { numeral: 'I Major', name: 'F#' },
      { numeral: 'II Minor', name: 'G#m' },
      { numeral: 'III Minor', name: 'A#m' },
      { numeral: 'IV Major', name: 'B' },
      { numeral: 'V Major', name: 'C#' },
      { numeral: 'VI Minor', name: 'D#m' },
      { numeral: 'VII Diminished', name: 'Fdim' }, // E#dim is enharmonically Fdim
    ]
  },
  {
    key: 'C#',
    chords: [
      { numeral: 'I Major', name: 'C#' },
      { numeral: 'II Minor', name: 'D#m' },
      { numeral: 'III Minor', name: 'Fm' }, // E#m is enharmonically Fm
      { numeral: 'IV Major', name: 'F#' },
      { numeral: 'V Major', name: 'G#' },
      { numeral: 'VI Minor', name: 'A#m' },
      { numeral: 'VII Diminished', name: 'Cdim' }, // B#dim is enharmonically Cdim
    ]
  },
  {
    key: 'F',
    chords: [
      { numeral: 'I Major', name: 'F' },
      { numeral: 'II Minor', name: 'Gm' },
      { numeral: 'III Minor', name: 'Am' },
      { numeral: 'IV Major', name: 'Bb' },
      { numeral: 'V Major', name: 'C' },
      { numeral: 'VI Minor', name: 'Dm' },
      { numeral: 'VII Diminished', name: 'Edim' },
    ]
  },
  {
    key: 'Bb',
    chords: [
      { numeral: 'I Major', name: 'Bb' },
      { numeral: 'II Minor', name: 'Cm' },
      { numeral: 'III Minor', name: 'Dm' },
      { numeral: 'IV Major', name: 'Eb' },
      { numeral: 'V Major', name: 'F' },
      { numeral: 'VI Minor', name: 'Gm' },
      { numeral: 'VII Diminished', name: 'Adim' },
    ]
  },
  {
    key: 'Eb',
    chords: [
      { numeral: 'I Major', name: 'Eb' },
      { numeral: 'II Minor', name: 'Fm' },
      { numeral: 'III Minor', name: 'Gm' },
      { numeral: 'IV Major', name: 'Ab' },
      { numeral: 'V Major', name: 'Bb' },
      { numeral: 'VI Minor', name: 'Cm' },
      { numeral: 'VII Diminished', name: 'Ddim' },
    ]
  },
  {
    key: 'Ab',
    chords: [
      { numeral: 'I Major', name: 'Ab' },
      { numeral: 'II Minor', name: 'Bbm' },
      { numeral: 'III Minor', name: 'Cm' },
      { numeral: 'IV Major', name: 'Db' },
      { numeral: 'V Major', name: 'Eb' },
      { numeral: 'VI Minor', name: 'Fm' },
      { numeral: 'VII Diminished', name: 'Gdim' },
    ]
  },
  {
    key: 'Db',
    chords: [
      { numeral: 'I Major', name: 'Db' },
      { numeral: 'II Minor', name: 'Ebm' },
      { numeral: 'III Minor', name: 'Fm' },
      { numeral: 'IV Major', name: 'Gb' },
      { numeral: 'V Major', name: 'Ab' },
      { numeral: 'VI Minor', name: 'Bbm' },
      { numeral: 'VII Diminished', name: 'Cdim' },
    ]
  }
];
