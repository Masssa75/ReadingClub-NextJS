import { PLOSIVES } from '@/lib/constants';

export const PATTERN_LENGTH = 30;
export const PATTERN_BINS = 64;

export function downsampleFrequencies(fullData: Uint8Array, targetBins: number): number[] {
  const pattern: number[] = [];
  const binSize = Math.floor(fullData.length / targetBins);

  for (let i = 0; i < targetBins; i++) {
    let sum = 0;
    const start = i * binSize;
    const end = Math.min(start + binSize, fullData.length);

    for (let j = start; j < end; j++) {
      sum += fullData[j];
    }

    pattern.push(sum / binSize);
  }

  return pattern;
}

export function getFrequencySnapshot(dataArray: Uint8Array): number[] {
  return downsampleFrequencies(dataArray, PATTERN_BINS);
}

export function isPlosive(letter: string): boolean {
  return PLOSIVES.includes(letter);
}

export const NASALS = ['M', 'N'];

export function isNasal(letter: string): boolean {
  return NASALS.includes(letter);
}

export function getVolumeThreshold(letter: string): number {
  return isNasal(letter) ? 8 : 15;
}

export function normalizePattern(pattern2D: number[][]): number[][] {
  return pattern2D.map(slice => {
    const max = Math.max(...slice);
    if (max === 0) return slice;
    return slice.map(v => v / max);
  });
}

export function averageSnapshots(snapshots: number[][]): number[] {
  const numBins = snapshots[0].length;
  const averaged = new Array(numBins).fill(0);

  for (const snapshot of snapshots) {
    for (let i = 0; i < numBins; i++) {
      averaged[i] += snapshot[i];
    }
  }

  return averaged.map(v => v / snapshots.length);
}

export function calculateSnapshotDistance(snap1: number[], snap2: number[]): number {
  let sum = 0;
  const len = Math.min(snap1.length, snap2.length);
  for (let i = 0; i < len; i++) {
    sum += Math.abs(snap1[i] - snap2[i]);
  }
  return sum / len;
}
