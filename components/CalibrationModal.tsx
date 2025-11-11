'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioEngine } from '@/lib/hooks/useAudioEngine';
import { PHONEMES } from '@/lib/constants';
import { getVolumeThreshold, isNasal, averageSnapshots } from '@/utils/frequencyAnalysis';
import { findBestCluster } from '@/utils/patternMatching';
import { createAudioRecorder } from '@/utils/audioRecording';
import { saveCalibrationToSupabase } from '@/lib/supabaseHelpers';

interface CalibrationModalProps {
  isOpen: boolean;
  letter: string;
  profileId: string | null;
  onClose: () => void;
  onComplete: () => void;
  onNext: () => void;
}

export function CalibrationModal({ isOpen, letter, profileId, onClose, onComplete, onNext }: CalibrationModalProps) {
  const [capturedSnapshots, setCapturedSnapshots] = useState<number[][]>([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningForIndex, setListeningForIndex] = useState(-1);
  const [status, setStatus] = useState('Click box 1 to record first sound');
  const [showNextButton, setShowNextButton] = useState(false);
  const [showArrow, setShowArrow] = useState(true);

  const { isInitialized, initialize, getFrequencyData, getSnapshot, getVolume, stream } = useAudioEngine();
  const audioRecorderRef = useRef(createAudioRecorder());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastPeakTimeRef = useRef(0);
  const audioClipsRef = useRef<Blob[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const phoneme = PHONEMES.find(p => p.letter === letter);
  const SNAPSHOTS_NEEDED = 5;
  const PEAK_COOLDOWN = 500;

  // Initialize audio when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      initialize();
    }
  }, [isOpen, isInitialized, initialize]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCapturedSnapshots([]);
      setIsListening(false);
      setListeningForIndex(-1);
      setStatus('Click box 1 to record first sound');
      setShowNextButton(false);
      setShowArrow(true);
      audioClipsRef.current = [];
      lastPeakTimeRef.current = 0;
    } else {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsListening(false);
    }
  }, [isOpen, letter]);

  // Start peak detection loop when listening
  useEffect(() => {
    if (!isListening || !isInitialized) return;

    const detectPeak = () => {
      if (!isListening) return;

      const volume = getVolume();
      const threshold = getVolumeThreshold(letter);

      const now = Date.now();
      if (volume > threshold && (now - lastPeakTimeRef.current) > PEAK_COOLDOWN) {
        // Peak detected!
        const snapshot = getSnapshot();
        if (snapshot) {
          captureSnapshot(snapshot);
        }
        lastPeakTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(detectPeak);
    };

    detectPeak();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, isInitialized, letter, getVolume, getSnapshot]);

  const captureSnapshot = useCallback((snapshot: number[]) => {
    const index = listeningForIndex;
    if (index < 0 || index >= SNAPSHOTS_NEEDED) return;

    // Stop recording this clip
    if (audioRecorderRef.current.isRecording) {
      audioRecorderRef.current.stop().then(blob => {
        audioClipsRef.current[index] = blob;
        console.log(`✅ Captured audio clip ${index + 1}/5: ${(blob.size / 1024).toFixed(2)} KB`);
      });
    }

    // Store snapshot
    const newSnapshots = [...capturedSnapshots, snapshot];
    setCapturedSnapshots(newSnapshots);

    // Draw visualization
    drawSnapshotToCanvas(snapshot, index);

    setIsListening(false);
    setListeningForIndex(-1);

    if (newSnapshots.length === SNAPSHOTS_NEEDED) {
      // All snapshots captured!
      finishCalibration(newSnapshots);
    } else {
      // Ready for next snapshot
      setStatus(`✓ Captured ${newSnapshots.length}/5. Click box ${newSnapshots.length + 1} to continue.`);
    }
  }, [listeningForIndex, capturedSnapshots, letter]);

  const startCaptureForBox = useCallback((index: number) => {
    if (index !== capturedSnapshots.length) return; // Only allow capturing next box
    if (isListening) return; // Already listening

    setShowArrow(false);
    setListeningForIndex(index);
    setStatus(`Recording ${index + 1}/5... Get ready...`);

    // Wait 400ms to avoid click sound, then start listening
    setTimeout(() => {
      setIsListening(true);
      setStatus(`Recording ${index + 1}/5... Say "${letter}" NOW!`);

      // Start recording audio clip
      if (stream) {
        audioRecorderRef.current.start(stream);
      }
    }, 400);
  }, [capturedSnapshots.length, isListening, letter, stream]);

  const finishCalibration = async (snapshots: number[][]) => {
    setStatus('Processing...');

    // Find best cluster (remove outliers)
    const clusterResult = findBestCluster(snapshots);
    const baseline = averageSnapshots(clusterResult.cluster);

    // Combine all audio clips into one
    const combinedAudioBlob = audioClipsRef.current.length > 0
      ? new Blob(audioClipsRef.current, { type: 'audio/webm' })
      : undefined;

    if (!profileId) {
      setStatus('❌ No profile ID');
      return;
    }

    // Save to Supabase
    const audioUrl = await saveCalibrationToSupabase(
      profileId,
      letter,
      [baseline],
      combinedAudioBlob
    );

    if (audioUrl !== null) {
      setStatus(`✅ Calibrated ${letter}!`);
      setShowNextButton(true);
      onComplete();
    } else {
      setStatus('❌ Failed to save');
    }
  };

  const drawSnapshotToCanvas = (snapshot: number[], index: number) => {
    const canvas = canvasRefs.current[index];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const barWidth = width / snapshot.length;
    snapshot.forEach((value, i) => {
      const barHeight = (value / 255) * height;
      const hue = (i / snapshot.length) * 120 + 100;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
    });
  };

  const playLetterSound = () => {
    if (!phoneme?.audioUrl) return;
    const audio = new Audio(phoneme.audioUrl);
    audio.play().catch(err => console.error('Audio playback failed:', err));
  };

  const handleNext = () => {
    onNext();
  };

  if (!isOpen) return null;

  return (
    <div className="calibration-modal active">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-instructions">
          Click the letter to hear its sound. Click each box below to record 5 sounds.
        </div>

        <div className="modal-letter-container">
          <div className="modal-letter" onClick={playLetterSound}>
            {letter}
          </div>
          <div className="modal-listen-icon" onClick={playLetterSound} title="Click to hear sound">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </div>
        </div>

        <div className="modal-captures" style={{ position: 'relative' }}>
          {showArrow && (
            <div className="click-arrow active">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L12 20M12 20L5 13M12 20L19 13" stroke="#7CB342" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
          )}

          {[0, 1, 2, 3, 4].map((index) => {
            const isCaptured = index < capturedSnapshots.length;
            const isRecording = isListening && listeningForIndex === index;
            const isReady = index === capturedSnapshots.length && !isListening;

            let className = 'modal-capture-box';
            if (isCaptured) className += ' captured';
            if (isRecording) className += ' recording';
            if (isReady) className += ' ready';

            return (
              <div
                key={index}
                className={className}
                onClick={() => startCaptureForBox(index)}
                style={{ cursor: isReady ? 'pointer' : 'not-allowed' }}
              >
                <div className="mic-icon">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"/>
                    <path d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z"/>
                  </svg>
                </div>
                <canvas
                  ref={el => canvasRefs.current[index] = el}
                  width={100}
                  height={80}
                />
              </div>
            );
          })}
        </div>

        <div className="modal-status">{status}</div>

        {showNextButton && (
          <div className="modal-next-button active" onClick={handleNext}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
