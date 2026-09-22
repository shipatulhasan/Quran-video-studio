export type SyncSegment = { id: string | number; ayah: string; arabic: string; translation: string; start: number; end: number; overlayAssetPath?: string | null };

export function findActiveSegmentIndex(segments: SyncSegment[], time: number) {
  let low = 0;
  let high = segments.length - 1;
  let candidate = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (segments[middle].start <= time) {
      candidate = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return candidate >= 0 && time <= segments[candidate].end ? candidate : -1;
}

export const SAMPLE_SYNC_SEGMENTS: SyncSegment[] = [
  { id: 1, ayah: "1:1", arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.", start: 0, end: 4.2 },
  { id: 2, ayah: "1:2", arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is due to Allah, Lord of the worlds.", start: 4.21, end: 7.8 },
  { id: 3, ayah: "1:3", arabic: "الرَّحْمَٰنِ الرَّحِيمِ", translation: "The Entirely Merciful, the Especially Merciful.", start: 7.81, end: 11.4 },
  { id: 4, ayah: "1:4", arabic: "مَالِكِ يَوْمِ الدِّينِ", translation: "Sovereign of the Day of Recompense.", start: 11.41, end: 15 },
  { id: 5, ayah: "1:5", arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", translation: "It is You we worship and You we ask for help.", start: 15.01, end: 19.6 },
  { id: 6, ayah: "1:6", arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", translation: "Guide us to the straight path.", start: 19.61, end: 23.2 },
  { id: 7, ayah: "1:7", arabic: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ", translation: "The path of those upon whom You have bestowed favor, not of those who have evoked anger or those who are astray.", start: 23.21, end: 30 },
];
