'use client';

import { useState } from 'react';
import { usePhonicsApp } from '@/lib/hooks/usePhonicsApp';
import { PHONEMES, GROUP_TITLES } from '@/lib/constants';
import { CalibrationModal } from '@/components/CalibrationModal';
import { Tuner } from '@/components/Tuner';

export default function Home() {
  const [activeTab, setActiveTab] = useState('calibrate');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState('');
  const {
    currentProfile,
    currentProfileId,
    calibrationData,
    letterSensitivity,
    isLoading,
    reloadCalibration
  } = usePhonicsApp();

  const handleOpenModal = (letter: string) => {
    setSelectedLetter(letter);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLetter('');
  };

  const handleCalibrationComplete = async () => {
    // Reload calibration data from Supabase
    await reloadCalibration();
  };

  const handleNext = () => {
    // Find current letter index in PHONEMES
    const currentIndex = PHONEMES.findIndex(p => p.letter === selectedLetter);

    // Look for next uncalibrated letter after current
    for (let i = currentIndex + 1; i < PHONEMES.length; i++) {
      const nextLetter = PHONEMES[i].letter;
      if (!calibrationData[nextLetter]) {
        // Found next uncalibrated letter
        setSelectedLetter(nextLetter);
        return;
      }
    }

    // If no uncalibrated letters after current, check from beginning
    for (let i = 0; i < currentIndex; i++) {
      const nextLetter = PHONEMES[i].letter;
      if (!calibrationData[nextLetter]) {
        setSelectedLetter(nextLetter);
        return;
      }
    }

    // All letters calibrated - close modal
    handleCloseModal();
  };

  const tabs = [
    { id: 'calibrate', name: 'Calibrate' },
    { id: 'tuner', name: 'Tuner' },
    { id: 'game3', name: 'Game 3' },
  ];

  // Group phonemes by category
  const groupedPhonemes = PHONEMES.reduce((acc, phoneme) => {
    if (!acc[phoneme.group]) {
      acc[phoneme.group] = [];
    }
    acc[phoneme.group].push(phoneme);
    return acc;
  }, {} as Record<string, typeof PHONEMES>);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <>
      <h1>ReadingClub</h1>
      <div className="subtitle">Voice-Based Phonics Training</div>
      <div className="subtitle" style={{ fontSize: '14px', marginTop: '-15px' }}>
        Profile: {currentProfile} {currentProfileId && `(${currentProfileId.substring(0, 8)}...)`}
      </div>

      <div className="container">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Calibration Tab */}
        <div className={`tab-content ${activeTab === 'calibrate' ? 'active' : ''}`}>
          <h2 style={{ marginBottom: '20px' }}>Calibration</h2>
          <div className="info-box">
            Click each letter to calibrate your voice. The system will learn to recognize when you say each phonics sound.
          </div>

          <div className="calibration-grid">
            {Object.entries(groupedPhonemes).map(([group, phonemes]) => (
              <div key={group} style={{ gridColumn: '1 / -1' }}>
                <div className="calibration-group-header">
                  {GROUP_TITLES[group]}
                </div>
                {phonemes.map((phoneme) => {
                  const isCalibrated = !!calibrationData[phoneme.letter];
                  return (
                    <div
                      key={phoneme.letter}
                      className={`phoneme-card ${isCalibrated ? 'calibrated' : ''}`}
                      onClick={() => handleOpenModal(phoneme.letter)}
                      style={{ display: 'inline-block', margin: '10px' }}
                    >
                      <div className="phoneme-letter">{phoneme.letter}</div>
                      <div className="phoneme-hint">{phoneme.hint}</div>
                      <div className="phoneme-status">
                        {isCalibrated ? '✓ Calibrated' : 'Click to record'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Tuner Tab */}
        <div className={`tab-content ${activeTab === 'tuner' ? 'active' : ''}`}>
          <Tuner />
        </div>

        <div className={`tab-content ${activeTab === 'game3' ? 'active' : ''}`}>
          <h2>Game 3 - Advanced Features</h2>
          <p>Game 3 component will go here</p>
        </div>
      </div>

      <CalibrationModal
        isOpen={modalOpen}
        letter={selectedLetter}
        profileId={currentProfileId}
        onClose={handleCloseModal}
        onComplete={handleCalibrationComplete}
        onNext={handleNext}
      />
    </>
  );
}
