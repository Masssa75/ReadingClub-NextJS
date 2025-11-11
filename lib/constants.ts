import { Phoneme } from './types';

export const PHONEMES: Phoneme[] = [
  // ===== VOWELS =====
  { letter: 'A', hint: 'Say: aaa (like "apple")', type: 'vowel', group: 'vowels', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-a.mp3' },
  { letter: 'E', hint: 'Say: eee (like "egg")', type: 'vowel', group: 'vowels', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-e.mp3' },
  { letter: 'I', hint: 'Say: iii (like "igloo")', type: 'vowel', group: 'vowels', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-i.mp3' },
  { letter: 'O', hint: 'Say: ooo (like "octopus")', type: 'vowel', group: 'vowels', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-o-sh.mp3' },
  { letter: 'U', hint: 'Say: uuu (like "umbrella")', type: 'vowel', group: 'vowels', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-u-sh.mp3' },

  // ===== EASY CONSONANTS =====
  { letter: 'M', hint: 'Say: mmm (hum)', type: 'nasal', group: 'easy', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-m.mp3' },
  { letter: 'S', hint: 'Say: sss (like "snake")', type: 'fricative', group: 'easy', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-z.mp3' },
  { letter: 'T', hint: 'Repeat: tuh, tuh', type: 'plosive', group: 'easy', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-t.mp3' },
  { letter: 'B', hint: 'Repeat: buh, buh', type: 'plosive', group: 'easy', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-b.mp3' },
  { letter: 'F', hint: 'Say: fff (like "fan")', type: 'fricative', group: 'easy', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-f.mp3' },
  { letter: 'N', hint: 'Say: nnn (like "no")', type: 'nasal', group: 'easy', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-n.mp3' },

  // ===== COMMON CONSONANTS =====
  { letter: 'P', hint: 'Repeat: puh, puh', type: 'plosive', group: 'common', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-p-2.mp3' },
  { letter: 'D', hint: 'Repeat: duh, duh (like "dog")', type: 'plosive', group: 'common', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-d.mp3' },
  { letter: 'L', hint: 'Say: lll (like "lion")', type: 'liquid', group: 'common', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-l.mp3' },
  { letter: 'R', hint: 'Say: rrr (like "run")', type: 'liquid', group: 'common', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-r.mp3' },
  { letter: 'C', hint: 'Repeat: cuh, cuh (like "cat")', type: 'plosive', group: 'common', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-c.mp3' },
  { letter: 'G', hint: 'Repeat: guh, guh (like "go")', type: 'plosive', group: 'common', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-g.mp3' },
  { letter: 'H', hint: 'Say: hhh (like "hat")', type: 'fricative', group: 'common', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-h.mp3' },

  // ===== ADVANCED =====
  { letter: 'W', hint: 'Say: www (like "water")', type: 'semivowel', group: 'advanced', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-w.mp3' },
  { letter: 'Y', hint: 'Say: yuh (like "yes")', type: 'semivowel', group: 'advanced', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/btalpha-i-long.mp3' },
  { letter: 'J', hint: 'Say: juh (like "jump")', type: 'affricate', group: 'advanced', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-j.mp3' },
  { letter: 'K', hint: 'Repeat: kuh, kuh', type: 'plosive', group: 'advanced', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-k.mp3' },
  { letter: 'V', hint: 'Say: vvv (like "van")', type: 'fricative', group: 'advanced', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-v.mp3' },
  { letter: 'Z', hint: 'Say: zzz (like "zoo")', type: 'fricative', group: 'advanced', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-z.mp3' },
  { letter: 'X', hint: 'Say: ks (like "fox")', type: 'affricate', group: 'advanced', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-x.mp3' },
  { letter: 'Q', hint: 'Say: kwuh (like "queen")', type: 'affricate', group: 'advanced', audioUrl: 'https://www.soundcityreading.net/uploads/3/7/6/1/37611941/alphasounds-q.mp3' }
];

export const PLOSIVES = ['B', 'C', 'D', 'G', 'K', 'P', 'T'];

export const GROUP_TITLES: Record<string, string> = {
  vowels: 'Vowels (A, E, I, O, U)',
  easy: 'Easy Consonants',
  common: 'Common Consonants',
  advanced: 'Advanced Letters'
};
