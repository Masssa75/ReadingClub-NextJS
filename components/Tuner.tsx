'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioEngine } from '@/lib/hooks/useAudioEngine';
import { usePhonicsApp } from '@/lib/hooks/usePhonicsApp';
import { PHONEMES } from '@/lib/constants';
import { detectBestMatch } from '@/utils/patternMatching';
import { downsampleFrequencies } from '@/utils/frequencyAnalysis';

interface TunerStats {
  attempts: number;
  matches: number;
  accuracy: number;
}

export function Tuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedLetter, setDetectedLetter] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [stats, setStats] = useState<TunerStats>({ attempts: 0, matches: 0, accuracy: 0 });
  const [lastDetection, setLastDetection] = useState<string>('');

  const { isInitialized, initialize, getFrequencyData, getSnapshot } = useAudioEngine();
  const { calibrationData, letterSensitivity } = usePhonicsApp();

  const animationFrameRef = useRef<number | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectionCooldownRef = useRef<number>(0);

  const DETECTION_COOLDOWN = 500; // ms between detections
  const CONFIDENCE_THRESHOLD = 30; // Minimum confidence to show detection

  // Real-time detection loop
  useEffect(() => {
    if (!isListening || !isInitialized) return;

    const detectLoop = () => {
      if (!isListening) return;

      const now = Date.now();

      // Get current snapshot
      const snapshot = getSnapshot();
      if (snapshot) {
        // Run pattern matching
        const result = detectBestMatch(snapshot, calibrationData, letterSensitivity);

        if (result && result.confidence >= CONFIDENCE_THRESHOLD) {
          setDetectedLetter(result.letter);
          setConfidence(result.confidence);

          // Track stats (only if enough time passed since last detection)
          if (now - detectionCooldownRef.current > DETECTION_COOLDOWN) {
            const isMatch = result.letter === lastDetection;
            setStats(prev => {
              const newAttempts = prev.attempts + 1;
              const newMatches = isMatch ? prev.matches + 1 : prev.matches;
              return {
                attempts: newAttempts,
                matches: newMatches,
                accuracy: Math.round((newMatches / newAttempts) * 100)
              };
            });
            setLastDetection(result.letter);
            detectionCooldownRef.current = now;
          }
        } else {
          // No confident detection
          setDetectedLetter('');
          setConfidence(0);
        }

        // Draw spectrum visualization
        drawSpectrum();
      }

      animationFrameRef.current = requestAnimationFrame(detectLoop);
    };

    detectLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, isInitialized, calibrationData, letterSensitivity, getSnapshot, lastDetection]);

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
      const hue = (i / downsampled.length) * 120 + 100; // Green to blue
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    });
  }, [getFrequencyData]);

  const handleStart = async () => {
    if (!isInitialized) {
      await initialize();
    }
    setIsListening(true);
  };

  const handleStop = () => {
    setIsListening(false);
    setDetectedLetter('');
    setConfidence(0);
  };

  const handleReset = () => {
    setStats({ attempts: 0, matches: 0, accuracy: 0 });
    setLastDetection('');
    detectionCooldownRef.current = 0;
  };

  const playLetterSound = (letter: string) => {
    const phoneme = PHONEMES.find(p => p.letter === letter);
    if (!phoneme?.audioUrl) return;
    const audio = new Audio(phoneme.audioUrl);
    audio.play().catch(err => console.error('Audio playback failed:', err));
  };

  // Check if user has any calibrations
  const hasCalibrations = Object.keys(calibrationData).length > 0;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 70) return '#7CB342'; // Green
    if (conf >= 50) return '#FDD835'; // Yellow
    return '#F4511E'; // Red
  };

  return (
    <div className="tuner-container">
      <h2>Tuner - Practice Mode</h2>

      {!hasCalibrations && (
        <div className="info-box" style={{ backgroundColor: '#FFF3CD', color: '#856404', marginBottom: '20px' }}>
          ⚠️ You need to calibrate at least one letter before using the Tuner.
        </div>
      )}

      <div className="tuner-content">
        {/* Detection Display */}
        <div className="tuner-detection">
          <div className="tuner-letter-display">
            {detectedLetter || '?'}
          </div>
          <div className="tuner-confidence-label">
            {detectedLetter ? `${confidence}% confidence` : 'Waiting for sound...'}
          </div>
          <div className="tuner-confidence-bar">
            <div
              className="tuner-confidence-fill"
              style={{
                width: `${confidence}%`,
                backgroundColor: getConfidenceColor(confidence)
              }}
            />
          </div>
        </div>

        {/* Spectrum Visualization */}
        <div className="tuner-spectrum">
          <canvas
            ref={el => { canvasRef.current = el; }}
            width={600}
            height={150}
            style={{ width: '100%', height: '150px', borderRadius: '8px', backgroundColor: '#1a1a1a' }}
          />
        </div>

        {/* Controls */}
        <div className="tuner-controls">
          {!isListening ? (
            <button
              className="tuner-btn tuner-btn-start"
              onClick={handleStart}
              disabled={!hasCalibrations}
            >
              Start Listening
            </button>
          ) : (
            <button
              className="tuner-btn tuner-btn-stop"
              onClick={handleStop}
            >
              Stop
            </button>
          )}
          <button
            className="tuner-btn tuner-btn-reset"
            onClick={handleReset}
          >
            Reset Stats
          </button>
        </div>

        {/* Stats */}
        <div className="tuner-stats">
          <div className="tuner-stat">
            <div className="tuner-stat-value">{stats.attempts}</div>
            <div className="tuner-stat-label">Attempts</div>
          </div>
          <div className="tuner-stat">
            <div className="tuner-stat-value">{stats.matches}</div>
            <div className="tuner-stat-label">Matches</div>
          </div>
          <div className="tuner-stat">
            <div className="tuner-stat-value">{stats.accuracy || 0}%</div>
            <div className="tuner-stat-label">Accuracy</div>
          </div>
        </div>

        {/* Letter Reference Grid */}
        <div className="tuner-letters">
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Reference Sounds</h3>
          <div className="tuner-letter-grid">
            {PHONEMES.map((phoneme) => {
              const isCalibrated = !!calibrationData[phoneme.letter];
              return (
                <button
                  key={phoneme.letter}
                  className={`tuner-letter-btn ${isCalibrated ? 'calibrated' : 'not-calibrated'}`}
                  onClick={() => playLetterSound(phoneme.letter)}
                  disabled={!isCalibrated}
                  title={isCalibrated ? `Click to hear ${phoneme.letter}` : 'Not calibrated'}
                >
                  <div className="tuner-letter-text">{phoneme.letter}</div>
                  {isCalibrated && (
                    <div className="tuner-letter-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
