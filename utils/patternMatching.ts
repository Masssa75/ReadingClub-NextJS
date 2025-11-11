import { CalibrationData } from '@/lib/types';
import { calculateSnapshotDistance, normalizePattern } from './frequencyAnalysis';

export interface ClusterResult {
  cluster: number[][];
  indices: number[];
}

export function findBestCluster(snapshots: number[][]): ClusterResult {
  if (snapshots.length <= 3) {
    return {
      cluster: snapshots,
      indices: snapshots.map((_, i) => i)
    };
  }

  const distances: { i: number; j: number; dist: number }[] = [];
  for (let i = 0; i < snapshots.length; i++) {
    for (let j = i + 1; j < snapshots.length; j++) {
      const dist = calculateSnapshotDistance(snapshots[i], snapshots[j]);
      distances.push({ i, j, dist });
    }
  }

  distances.sort((a, b) => a.dist - b.dist);

  const pair = distances[0];
  const candidates = [pair.i, pair.j];

  let bestThird: number | null = null;
  let bestAvgDist = Infinity;

  for (let k = 0; k < snapshots.length; k++) {
    if (candidates.includes(k)) continue;

    const dist1 = calculateSnapshotDistance(snapshots[k], snapshots[candidates[0]]);
    const dist2 = calculateSnapshotDistance(snapshots[k], snapshots[candidates[1]]);
    const avgDist = (dist1 + dist2) / 2;

    if (avgDist < bestAvgDist) {
      bestAvgDist = avgDist;
      bestThird = k;
    }
  }

  if (bestThird !== null) {
    candidates.push(bestThird);
  }

  return {
    cluster: candidates.map(i => snapshots[i]),
    indices: candidates
  };
}

export function calculatePatternSimilarity(pattern1: number[][], pattern2: number[][]): number {
  let sumProduct = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;
  let count = 0;

  const minLength = Math.min(pattern1.length, pattern2.length);

  for (let t = 0; t < minLength; t++) {
    const slice1 = pattern1[t];
    const slice2 = pattern2[t];
    const minBins = Math.min(slice1.length, slice2.length);

    for (let f = 0; f < minBins; f++) {
      sumProduct += slice1[f] * slice2[f];
      sum1Sq += slice1[f] * slice1[f];
      sum2Sq += slice2[f] * slice2[f];
      count++;
    }
  }

  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  if (denominator === 0) return 0;

  return sumProduct / denominator;
}

export function matchTargetPattern(
  currentPattern: number[][],
  targetLetter: string,
  calibrationData: CalibrationData,
  sensitivity: number = 1.0
): number {
  if (!calibrationData[targetLetter]) return 0;

  const normalized = normalizePattern(currentPattern);
  const storedPattern = calibrationData[targetLetter].pattern;

  const score = calculatePatternSimilarity(normalized, storedPattern);

  const adjustedScore = score * sensitivity;
  return Math.min(100, Math.max(0, adjustedScore * 100));
}

export interface DetectionResult {
  letter: string;
  confidence: number;
}

export function detectBestMatch(
  currentSnapshot: number[],
  calibrationData: CalibrationData,
  letterSensitivity: Record<string, number>
): DetectionResult | null {
  let bestLetter: string | null = null;
  let bestScore = 0;

  const letters = Object.keys(calibrationData);

  for (const letter of letters) {
    const calibration = calibrationData[letter];
    const storedPattern = calibration.pattern;

    if (!storedPattern || storedPattern.length === 0) continue;

    const currentPattern = [currentSnapshot];
    const score = matchTargetPattern(
      currentPattern,
      letter,
      calibrationData,
      letterSensitivity[letter] || 1.0
    );

    if (score > bestScore) {
      bestScore = score;
      bestLetter = letter;
    }
  }

  if (bestLetter && bestScore > 30) {
    return {
      letter: bestLetter,
      confidence: bestScore
    };
  }

  return null;
}
