'use client';

import { useState, useEffect } from 'react';
import { CalibrationData, LetterSensitivity, Profile } from '../types';
import { PHONEMES } from '../constants';
import {
  getOrCreateProfile,
  loadCalibrationsFromSupabase
} from '../supabaseHelpers';

export function usePhonicsApp() {
  const [currentProfile, setCurrentProfile] = useState<string>('Default');
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [calibrationData, setCalibrationData] = useState<CalibrationData>({});
  const [letterSensitivity, setLetterSensitivity] = useState<LetterSensitivity>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize profile on mount
  useEffect(() => {
    initializeProfile();
  }, []);

  async function initializeProfile() {
    setIsLoading(true);

    // Check for saved profile name
    const savedProfileName = localStorage.getItem('currentProfile') || 'Default';
    setCurrentProfile(savedProfileName);

    // Get or create profile in Supabase
    const profile = await getOrCreateProfile(savedProfileName);
    if (profile) {
      setCurrentProfileId(profile.id);
      await loadCalibration(profile.id);
    }

    setIsLoading(false);
  }

  async function loadCalibration(profileId: string) {
    const supabaseData = await loadCalibrationsFromSupabase(profileId);
    setCalibrationData(supabaseData);

    // Load letter sensitivity from localStorage
    const savedSensitivity = localStorage.getItem(`letterSensitivity_${currentProfile}`);
    if (savedSensitivity) {
      setLetterSensitivity(JSON.parse(savedSensitivity));
    } else {
      // Initialize default sensitivity (1.0 = 100%)
      const defaultSensitivity: LetterSensitivity = {};
      PHONEMES.forEach(p => {
        defaultSensitivity[p.letter] = 1.0;
      });
      setLetterSensitivity(defaultSensitivity);
    }
  }

  async function switchProfile(profileName: string) {
    setCurrentProfile(profileName);
    localStorage.setItem('currentProfile', profileName);

    const profile = await getOrCreateProfile(profileName);
    if (profile) {
      setCurrentProfileId(profile.id);
      await loadCalibration(profile.id);
    }
  }

  function updateSensitivity(letter: string, sensitivity: number) {
    const newSensitivity = { ...letterSensitivity, [letter]: sensitivity };
    setLetterSensitivity(newSensitivity);
    localStorage.setItem(`letterSensitivity_${currentProfile}`, JSON.stringify(newSensitivity));
  }

  return {
    currentProfile,
    currentProfileId,
    calibrationData,
    letterSensitivity,
    isLoading,
    switchProfile,
    updateSensitivity,
    reloadCalibration: () => currentProfileId && loadCalibration(currentProfileId)
  };
}
