export interface Phoneme {
  letter: string;
  hint: string;
  type: 'vowel' | 'nasal' | 'fricative' | 'plosive' | 'liquid' | 'semivowel' | 'affricate';
  group: 'vowels' | 'easy' | 'common' | 'advanced';
  audioUrl: string;
}

export interface CalibrationPattern {
  pattern: number[][];
  timestamp: number;
  audioUrl?: string;
}

export interface Profile {
  id: string;
  name: string;
  created_at: string;
  user_id?: string;
}

export interface CalibrationData {
  [letter: string]: CalibrationPattern;
}

export interface LetterSensitivity {
  [letter: string]: number;
}

export interface AudioRecordings {
  [letter: string]: string;
}
