'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from '@/utils/audioEngine';
import { getFrequencySnapshot } from '@/utils/frequencyAnalysis';

export function useAudioEngine() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const audioEngineRef = useRef(audioEngine);

  const initialize = useCallback(async () => {
    try {
      await audioEngineRef.current.initialize();
      setIsInitialized(true);
      setIsError(false);
    } catch (error: any) {
      setIsError(true);
      setErrorMessage(error.message || 'Failed to initialize audio');
      console.error('Audio initialization failed:', error);
    }
  }, []);

  const getFrequencyData = useCallback((): Uint8Array | null => {
    return audioEngineRef.current.getFrequencyData();
  }, []);

  const getSnapshot = useCallback((): number[] | null => {
    const data = getFrequencyData();
    if (!data) return null;
    return getFrequencySnapshot(data);
  }, [getFrequencyData]);

  const getVolume = useCallback((): number => {
    return audioEngineRef.current.getVolume();
  }, []);

  const cleanup = useCallback(() => {
    audioEngineRef.current.cleanup();
    setIsInitialized(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isInitialized,
    isError,
    errorMessage,
    initialize,
    getFrequencyData,
    getSnapshot,
    getVolume,
    cleanup,
    audioContext: audioEngineRef.current.audioContext,
    analyser: audioEngineRef.current.analyser,
    stream: audioEngineRef.current.stream
  };
}
