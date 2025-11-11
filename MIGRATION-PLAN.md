# ReadingClub Next.js Migration Plan

**Goal:** Complete 1:1 migration from `index-1.4.html` to modular Next.js app

**Status:** 🚧 In Progress - Calibration System Complete

---

## ✅ Phase 1: Foundation (COMPLETE)

- [x] Initialize Next.js project with TypeScript
- [x] Set up Supabase client configuration
- [x] Create type definitions (Phoneme, CalibrationData, Profile, etc.)
- [x] Create constants (PHONEMES array, PLOSIVES, GROUP_TITLES)
- [x] Set up Supabase helper functions (getOrCreateProfile, save/load calibrations)
- [x] Create usePhonicsApp hook for state management
- [x] Extract and apply all CSS from HTML
- [x] Create main page with tab navigation
- [x] Basic calibration grid UI
- [x] Write README and migration documentation

---

## ✅ Phase 2: Audio System (COMPLETE)

### 2.1 Core Audio Engine
- [x] Create `utils/audioEngine.ts`
  - [x] AudioContext setup and initialization
  - [x] Microphone access (getUserMedia)
  - [x] AnalyserNode creation (FFT with 2048 bins)
  - [x] Data array allocation
  - [x] Start/stop audio stream functions
  - [x] Volume calculation
  - [x] Cleanup methods

### 2.2 Frequency Analysis
- [x] Create `utils/frequencyAnalysis.ts`
  - [x] `downsampleFrequencies()` - full data → 64 bins
  - [x] `getFrequencySnapshot()` - capture current spectrum
  - [x] `isPlosive()` / `isNasal()` - phoneme type detection
  - [x] Volume threshold detection (nasal vs plosive)
  - [x] `normalizePattern()` - normalize patterns to 0-1
  - [x] `averageSnapshots()` - average multiple snapshots
  - [x] `calculateSnapshotDistance()` - L1 distance

### 2.3 Pattern Matching
- [x] Create `utils/patternMatching.ts`
  - [x] `findBestCluster()` - cluster-based outlier removal
  - [x] `calculatePatternSimilarity()` - correlation coefficient
  - [x] `matchTargetPattern()` - match with sensitivity
  - [x] `detectBestMatch()` - find best matching letter
  - [x] Dynamic threshold adjustments per phoneme type
  - [x] Sensitivity multiplier application

### 2.4 Audio Recording
- [x] Create `utils/audioRecording.ts`
  - [x] MediaRecorder setup
  - [x] Blob creation from audio chunks
  - [x] WebM format handling
  - [x] Recording start/stop/pause/resume
  - [x] AudioRecorder class with state management

### 2.5 Audio Hooks
- [x] Create `lib/hooks/useAudioEngine.ts`
  - [x] Manage AudioContext lifecycle
  - [x] Initialize microphone
  - [x] Real-time frequency data access
  - [x] Snapshot capture
  - [x] Volume monitoring
  - [x] Cleanup on unmount

---

## ✅ Phase 3: Calibration System (COMPLETE)

### 3.1 Calibration Modal Component
- [x] Create `components/CalibrationModal.tsx`
  - [x] Modal overlay UI
  - [x] Letter display with audio playback button
  - [x] 5 snapshot capture boxes
  - [x] Visual feedback (ready/recording/captured states)
  - [x] Status messages
  - [x] Next button after 5 captures
  - [x] Close button

### 3.2 Peak Detection & Snapshot Capture
- [x] Implement snapshot capture logic
  - [x] Listen for audio peaks
  - [x] 400ms pre-delay before recording
  - [x] Peak detection with cooldown (500ms)
  - [x] Store 5 snapshots per letter
  - [x] Visual feedback in thumbnail canvases
  - [x] Audio recording per snapshot

### 3.3 Pattern Visualization
- [x] Add waveform visualization to thumbnails
  - [x] Mini spectrum display in each capture box
  - [x] Color coding (green = captured, yellow = ready, red = recording)
  - [x] Canvas rendering of frequency data

### 3.4 Calibration Grid Integration
- [x] Wire up click handlers to open modal
- [x] Update grid after successful calibration
  - [x] Reload calibration data from Supabase
  - [x] Update UI to show calibrated state
- [x] Show calibrated state (green border)
- [x] CalibrationModal integrated into main page

### 3.5 Audio Playback
- [x] Implement phoneme sound playback
  - [x] Play reference audio from URLs
  - [x] Click letter or speaker icon to hear sound
  - [x] Audio loading/error handling
  - [x] Record and save audio to Supabase Storage

---

## 📊 Phase 4: Profile Management UI

### 4.1 Profile Selector Component
- [ ] Create `components/ProfileSelector.tsx`
  - [ ] Dropdown to switch profiles
  - [ ] "New Profile" button
  - [ ] Current profile display
  - [ ] Profile creation modal/prompt

### 4.2 Profile Management
- [ ] Integrate profile switching
- [ ] Load calibrations on profile change
- [ ] LocalStorage sync for profile names
- [ ] Clear/reset profile option

---

## 🎯 Phase 5: Tuner Component (Practice Mode)

### 5.1 Tuner UI
- [ ] Create `components/Tuner.tsx`
  - [ ] Large detected letter display
  - [ ] Confidence bar
  - [ ] Spectrum canvas visualization
  - [ ] Start/Stop buttons
  - [ ] Stats (attempts, matches, accuracy)
  - [ ] LISTEN button per letter

### 5.2 Tuner Logic
- [ ] Real-time pattern matching
- [ ] Confidence calculation
- [ ] Letter detection display
- [ ] Attempt tracking
- [ ] Match history

### 5.3 Visualization
- [ ] Live spectrum canvas drawing
  - [ ] FFT visualization
  - [ ] 60fps update rate
  - [ ] Color gradient bars

---

## 🚀 Phase 6: Game 3 Component (Voice Instructions)

### 6.1 Game 3 UI
- [ ] Create `components/Game3.tsx`
  - [ ] Voice instruction popup modal
  - [ ] Celebration modal with confetti
  - [ ] Auto-play instruction audio
  - [ ] Game logic with voice recognition

### 6.2 Voice Instruction Popup
- [ ] Create `components/VoiceInstructionModal.tsx`
  - [ ] Play instruction audio on game start
  - [ ] Close button
  - [ ] Auto-dismiss option

### 6.3 Celebration Modal
- [ ] Create `components/CelebrationModal.tsx`
  - [ ] Confetti animation
  - [ ] Success message
  - [ ] Play success audio
  - [ ] Continue button

### 6.4 Audio File Management
- [ ] Ensure audio files accessible in Next.js public folder
- [ ] Or use Supabase Storage URLs
- [ ] Handle spaces in filenames (decodeURIComponent)

---

## 🔐 Phase 7: Authentication (Optional - Can defer)

### 7.1 Supabase Auth Setup
- [ ] Create `lib/auth.ts`
  - [ ] Google OAuth configuration
  - [ ] Magic Link email setup
  - [ ] Anonymous user creation
  - [ ] Profile linking logic

### 7.2 Auth UI Components
- [ ] Create `components/AuthModal.tsx`
  - [ ] Google sign-in button
  - [ ] Email input for Magic Link
  - [ ] Dismiss option
  - [ ] Show after 3 letters calibrated

### 7.3 Auth Integration
- [ ] Wire up auth state to usePhonicsApp
- [ ] Handle user sessions
- [ ] Link guest profiles to authenticated accounts

---

## 🧪 Phase 8: Testing & Verification

### 8.1 Feature Parity Testing
- [ ] Calibration matches HTML version
- [ ] Tuner works correctly
- [ ] Game 3 functions properly
- [ ] Audio quality matches
- [ ] Detection accuracy matches
- [ ] Profile switching works

### 8.2 Cross-Browser Testing
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Mobile browsers

### 8.3 Performance Testing
- [ ] 60fps on Game 3
- [ ] <100ms detection latency
- [ ] No memory leaks
- [ ] Audio doesn't glitch

---

## 🎨 Phase 9: Polish & Final Touches

### 9.1 UI Polish
- [ ] Smooth transitions
- [ ] Loading states
- [ ] Error messages
- [ ] Responsive design tweaks

### 9.2 Documentation
- [ ] Update README with completed features
- [ ] Add component documentation
- [ ] JSDoc comments on complex functions

### 9.3 Deployment Preparation
- [ ] Environment variable setup
- [ ] Build optimization
- [ ] Production testing

---

## 📝 Execution Notes

**Current Phase:** Phase 4 - Profile Management UI
**Next Steps:**
1. Add profile selector dropdown
2. Create "New Profile" button
3. Implement profile creation flow
4. Profile switching functionality
5. Clear/reset profile option

**Estimated Effort:**
- Phase 2: ✅ Complete (~2-3 hours - critical foundation)
- Phase 3: ✅ Complete (~2-3 hours - complex UI + logic)
- Phase 4: ~30 mins (profile management - optional)
- Phase 5: ~2 hours (Tuner component)
- Phase 6: ~2 hours (Game 3 component)
- Phase 7: ~1 hour (authentication - optional)
- Phases 8-9: ~1-2 hours (testing & polish)

**Total:** ~10-13 hours remaining (5-6 hours already complete)

---

## 🎯 Success Criteria

Migration is complete when:
1. ✅ Calibration system works identically to HTML version
2. ✅ Audio detection accuracy matches or exceeds HTML version
3. ✅ Tuner component functional with real-time detection
4. ✅ Game 3 works with voice instructions and celebration modals
5. ✅ Profile management works (basic functionality)
6. ✅ Supabase integration complete (auth optional)
7. ✅ No regressions in functionality
8. ✅ Code is modular and maintainable
9. ✅ Parallel development is possible (different files)
10. ✅ Production-ready build deploys successfully

**Note:** Level 1, Game, and Game 2 are NOT being migrated (focus on Tuner & Game 3 only)

---

**Last Updated:** 2025-11-11 08:25 UTC
**Status:** Phases 1-3 complete (Foundation, Audio, Calibration). Streamlined plan: removed Level 1, Game, and Game 2. Focus: Tuner & Game 3.
