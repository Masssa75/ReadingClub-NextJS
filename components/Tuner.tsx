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

  const { isInitialized, initialize, getFrequencyData, getVolume, audioContext } = useAudioEngine();
  const { calibrationData, letterSensitivity } = usePhonicsApp();

  const animationFrameRef = useRef<number | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentIndexRef = useRef(0);
  const targetLetterRef = useRef<HTMLDivElement | null>(null);

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
            celebrateMatch();
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

  const createConfetti = (centerEl: HTMLElement) => {
    const rect = centerEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const colors = ['#FDD835', '#7CB342', '#00BCD4', '#FF5722', '#9C27B0'];

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.width = '10px';
      particle.style.height = '10px';
      particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';

      document.body.appendChild(particle);

      const angle = (Math.PI * 2 * i) / 20;
      const velocity = 100 + Math.random() * 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      let x = 0, y = 0, time = 0;
      const gravity = 500;

      const animate = () => {
        time += 0.016; // ~60fps
        x = vx * time;
        y = vy * time + 0.5 * gravity * time * time;

        particle.style.transform = `translate(${x}px, ${y}px) rotate(${time * 360}deg)`;
        particle.style.opacity = Math.max(0, 1 - time * 1.5).toString();

        if (time < 1) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      };

      requestAnimationFrame(animate);
    }
  };

  const celebrateMatch = () => {
    const targetEl = targetLetterRef.current;
    if (!targetEl) return;

    // Play success sound
    if (audioContext) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    }

    // Exciting animation sequence
    targetEl.style.transition = 'all 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    // Bounce and color sequence
    targetEl.style.transform = 'scale(1.5) rotate(5deg)';
    targetEl.style.color = '#FDD835';

    setTimeout(() => {
      targetEl.style.transform = 'scale(1.3) rotate(-5deg)';
      targetEl.style.color = '#7CB342';
    }, 150);

    setTimeout(() => {
      targetEl.style.transform = 'scale(1.6) rotate(0deg)';
      targetEl.style.color = '#00BCD4';
    }, 300);

    setTimeout(() => {
      targetEl.style.transform = 'scale(1.2)';
      targetEl.style.color = '#FF5722';
    }, 450);

    setTimeout(() => {
      targetEl.style.transform = 'scale(1.4)';
      targetEl.style.color = '#9C27B0';
    }, 600);

    setTimeout(() => {
      targetEl.style.transition = 'all 0.3s ease-out';
      targetEl.style.transform = 'scale(1)';
      targetEl.style.color = '#FDD835';
    }, 800);

    // Create confetti particles
    createConfetti(targetEl);
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
        ref={el => { targetLetterRef.current = el; }}
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
