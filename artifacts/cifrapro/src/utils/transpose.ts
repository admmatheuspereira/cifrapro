export const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const FLAT_MAP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
};

const normalizeNote = (note: string): string => {
  return FLAT_MAP[note] || note;
};

const getNoteIndex = (note: string): number => {
  const normalized = normalizeNote(note);
  return CHROMATIC_SCALE.indexOf(normalized);
};

export const transposeKey = (key: string, semitones: number): string => {
  if (!key) return key;
  const match = key.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return key;

  const root = match[1];
  const suffix = match[2];

  const index = getNoteIndex(root);
  if (index === -1) return key;

  // Javascript modulo of negative number can be negative
  const newIndex = ((index + semitones) % 12 + 12) % 12;
  return CHROMATIC_SCALE[newIndex] + suffix;
};

export const transposeContent = (content: string, semitones: number): string => {
  if (!content) return content;
  if (semitones === 0) return content;

  // Regex to match chords loosely within typical text structure
  // This looks for word boundaries and common chord structures
  const chordRegex = /\b([A-G][#b]?)(m|maj|min|dim|aug|sus|add|\d+)*\b/g;

  return content.replace(chordRegex, (match, root, suffix) => {
    const index = getNoteIndex(root);
    if (index === -1) return match;

    const newIndex = ((index + semitones) % 12 + 12) % 12;
    return CHROMATIC_SCALE[newIndex] + (suffix || '');
  });
};
