import { CHROMATIC_SCALE, FLAT_MAP } from "./transpose";

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

const normalizeNote = (note: string): string => FLAT_MAP[note] || note;

const extractChordRoots = (content: string): string[] => {
  const chordRegex = /\b([A-G][#b]?)(m|maj|min|dim|aug|sus|add|\d+)*\b/g;
  const roots: string[] = [];
  let match;
  while ((match = chordRegex.exec(content)) !== null) {
    const normalized = normalizeNote(match[1]);
    if (CHROMATIC_SCALE.includes(normalized)) {
      roots.push(normalized);
    }
  }
  return roots;
};

const buildFrequencyMap = (roots: string[]): Record<string, number> => {
  return roots.reduce((map, note) => {
    map[note] = (map[note] || 0) + 1;
    return map;
  }, {} as Record<string, number>);
};

const getDiatonicNotes = (rootIndex: number): string[] => {
  return MAJOR_SCALE_INTERVALS.map(
    (interval) => CHROMATIC_SCALE[(rootIndex + interval) % 12]
  );
};

export const detectKey = (content: string): string | null => {
  const roots = extractChordRoots(content);
  if (roots.length === 0) return null;

  const freqMap = buildFrequencyMap(roots);
  let bestKey: string | null = null;
  let bestScore = -Infinity;

  CHROMATIC_SCALE.forEach((note, rootIndex) => {
    const diatonic = new Set(getDiatonicNotes(rootIndex));
    let score = 0;

    for (const [chord, count] of Object.entries(freqMap)) {
      if (diatonic.has(chord)) {
        score += count;
      } else {
        score -= count * 0.5;
      }
    }

    if (
      score > bestScore ||
      (score === bestScore && (freqMap[note] || 0) > (freqMap[bestKey || ""] || 0))
    ) {
      bestScore = score;
      bestKey = note;
    }
  });

  return bestKey;
};
