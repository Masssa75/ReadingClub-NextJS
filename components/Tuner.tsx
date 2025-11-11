'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioEngine } from '@/lib/hooks/useAudioEngine';
import { usePhonicsApp } from '@/lib/hooks/usePhonicsApp';
import { PHONEMES } from '@/lib/constants';
import { detectBestMatch } from '@/utils/patternMatching';
import { downsampleFrequencies } from '@/utils/frequencyAnalysis';

interface TrialResult {
  letter: string;
  success: boolean;
  score: number;
  timestamp: number;
}

export function Tuner() {
  const [isRunning, setIsRunning] = useState(false);
  const [targetLetter, setTargetLetter] = useState<string>('?');
  const [matchScore, setMatchScore] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [status, setStatus] = useState('Click Start to begin');
  const [alphabetMode, setAlphabetMode] = useState(false);
  const [alphabetProgress, setAlphabetProgress] = useState('');
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [trials, setTrials] = useState<TrialResult[]>([]);

  const { isInitialized, initialize, getFrequencyData, getVolume } = useAudioEngine();
  const { calibrationData, letterSensitivity } = usePhonicsApp();

  const animationFrameRef = useRef<number | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentIndexRef = useRef(0);

  const SUCCESS_THRESHOLD = 70; // 70% match score to succeed

  // Get all calibrated letters
  const calibratedLetters = Object.keys(calibrationData);

  // Set initial target letter
  useEffect(() => {
    if (calibratedLetters.length > 0 && targetLetter === '?') {
      setNextTarget();
    }
  }, [calibratedLetters.length]);

  const setNextTarget = () => {
    if (calibratedLetters.length === 0) {
      setTargetLetter('?');
      setStatus('No calibrated letters. Go to Calibrate tab first.');
      return;
    }

    if (alphabetMode) {
      // A→Z loop mode
      const currentLetter = PHONEMES[currentIndexRef.current]?.letter;
      if (calibrationData[currentLetter]) {
        setTargetLetter(currentLetter);
        setAlphabetProgress(`${currentIndexRef.current + 1} / 26`);
      } else {
        // Skip uncalibrated letters
        currentIndexRef.current++;
        if (currentIndexRef.current >= PHONEMES.length) {
          currentIndexRef.current = 0;
          setStatus('✅ Completed full alphabet! Starting over...');
        }
        setNextTarget();
        return;
      }
    } else {
      // Random elimination mode
      const randomIndex = Math.floor(Math.random() * calibratedLetters.length);
      setTargetLetter(calibratedLetters[randomIndex]);
    }

    setMatchScore(0);
    setShowTryAgain(false);
    setStatus('Listening...');
  };

  const skipLetter = () => {
    if (alphabetMode) {
      currentIndexRef.current++;
      if (currentIndexRef.current >= PHONEMES.length) {
        currentIndexRef.current = 0;
      }
    }
    setNextTarget();
  };

  const tryAgain = () => {
    setShowTryAgain(false);
    setMatchScore(0);
    setIsRunning(true);
    setStatus('Listening...');
  };

  // Analysis loop
  useEffect(() => {
    if (!isRunning || !isInitialized) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const analyze = () => {
      if (!isRunning) return;

      // Get frequency data
      const freqData = getFrequencyData();
      if (freqData) {
        const downsampled = downsampleFrequencies(freqData, 64);

        // Try to match target
        const result = detectBestMatch(downsampled, calibrationData, letterSensitivity);

        if (result && result.letter === targetLetter) {
          setMatchScore(result.confidence);

          // Check for success
          if (result.confidence >= SUCCESS_THRESHOLD) {
            setIsRunning(false);
            setStatus(`✅ SUCCESS! Matched ${targetLetter} (${result.confidence}%)`);
            setShowTryAgain(false);

            // Record trial
            setTrials(prev => [...prev, {
              letter: targetLetter,
              success: true,
              score: result.confidence,
              timestamp: Date.now()
            }]);

            // Auto-advance after 1 second
            setTimeout(() => {
              setNextTarget();
              setIsRunning(true);
            }, 1000);
          }
        } else if (result) {
          // Wrong letter detected
          setMatchScore(0);
          setStatus(`Heard: ${result.letter} (${result.confidence}%) - Try ${targetLetter}`);
        }
      }

      // Update volume
      const vol = getVolume();
      setVolume(Math.round(vol));

      // Draw spectrum
      drawSpectrum();

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isInitialized, targetLetter, calibrationData, letterSensitivity, getFrequencyData, getVolume]);

  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frequencyData = getFrequencyData();
    if (!frequencyData) return;

    const downsampled = downsampleFrequencies(frequencyData, 64);

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / downsampled.length;
    downsampled.forEach((value, i) => {
      const barHeight = (value / 255) * height;
      const hue = (i / downsampled.length) * 120 + 100;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
    });
  }, [getFrequencyData]);

  const toggleTuner = async () => {
    if (!isRunning) {
      // Start
      if (!isInitialized) {
        await initialize();
      }
      setIsRunning(true);
      if (targetLetter === '?') {
        setNextTarget();
      }
    } else {
      // Stop
      setIsRunning(false);
      setStatus('Stopped');
    }
  };

  const toggleAlphabetMode = () => {
    const newMode = !alphabetMode;
    setAlphabetMode(newMode);
    if (newMode) {
      currentIndexRef.current = 0;
      setAlphabetProgress('1 / 26');
    } else {
      setAlphabetProgress('');
    }
    setNextTarget();
  };

  const playCalibrationRecording = () => {
    const calibration = calibrationData[targetLetter];
    if (calibration?.audioUrl) {
      const audio = new Audio(calibration.audioUrl);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    }
  };

  const viewStats = () => {
    const successCount = trials.filter(t => t.success).length;
    const avgScore = trials.length > 0
      ? Math.round(trials.reduce((sum, t) => sum + t.score, 0) / trials.length)
      : 0;

    alert(`Stats:\n\nTotal Trials: ${trials.length}\nSuccessful: ${successCount}\nAverage Score: ${avgScore}%`);
  };

  const exportResults = () => {
    const csv = 'Letter,Success,Score,Timestamp\n' +
      trials.map(t => `${t.letter},${t.success},${t.score},${new Date(t.timestamp).toISOString()}`).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tuner-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confidenceBarColor = matchScore >= SUCCESS_THRESHOLD ? '#7CB342' : matchScore >= 50 ? '#FDD835' : '#F4511E';

  return (
    <div className="tuner-original">
      <div style={{ textAlign: 'center', marginBottom: '20px', color: '#ddd', fontSize: '18px' }}>
        Say this sound:
        <span
          onClick={playCalibrationRecording}
          style={{
            cursor: 'pointer',
            fontSize: '24px',
            marginLeft: '10px',
            display: 'inline-block',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          title="Play my recording"
        >
          🔊
        </span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <label style={{ color: '#ddd', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={alphabetMode}
            onChange={toggleAlphabetMode}
            style={{ marginRight: '5px' }}
          />
          Alphabet Test Mode (A→Z loop)
        </label>
        {alphabetProgress && (
          <span style={{ marginLeft: '15px', color: '#FDD835' }}>{alphabetProgress}</span>
        )}
      </div>

      <div
        id="targetLetter"
        style={{
          textAlign: 'center',
          fontSize: '180px',
          fontWeight: 'bold',
          color: '#FDD835',
          margin: '20px 0',
          textShadow: '0 10px 30px rgba(253, 216, 53, 0.5)',
          transition: 'all 0.3s'
        }}
      >
        {targetLetter}
      </div>

      <div className="confidence-bar">
        <div
          className="confidence-fill"
          style={{
            width: `${matchScore}%`,
            backgroundColor: confidenceBarColor
          }}
        />
      </div>

      <div className="stats">
        <div className="stat-item">
          <div>Match Score</div>
          <div className="stat-value">{matchScore}%</div>
        </div>
        <div className="stat-item">
          <div>Volume</div>
          <div className="stat-value">{volume}%</div>
        </div>
      </div>

      <canvas
        ref={el => { canvasRef.current = el; }}
        id="spectrumCanvas"
        width={800}
        height={150}
      />

      <div
        id="status"
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.4,
          color: '#aaa',
          marginTop: '10px',
          textAlign: 'center'
        }}
      >
        {status}
      </div>

      <div className="actions">
        <button className="btn" onClick={toggleTuner}>
          {isRunning ? '⏸ Stop Game' : '▶ Start Game'}
        </button>
        {showTryAgain && (
          <button className="btn" onClick={tryAgain} style={{ background: '#7CB342' }}>
            🔄 Try Again
          </button>
        )}
        <button className="btn" onClick={skipLetter} style={{ background: '#999' }}>
          Skip
        </button>
      </div>

      <div className="actions" style={{ marginTop: '15px' }}>
        <button className="btn" onClick={viewStats} style={{ background: '#5E35B1' }}>
          📊 View Stats ({trials.length} trials)
        </button>
        <button className="btn" onClick={exportResults} style={{ background: '#00897B' }}>
          💾 Export Results
        </button>
      </div>
    </div>
  );
}
