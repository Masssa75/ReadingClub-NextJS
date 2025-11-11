# ReadingClub Next.js Migration

**Status:** 🚧 **Foundation Complete** - Ready for Parallel Development

This is a parallel Next.js version of the ReadingClub phonics app, created to enable simultaneous development on different features without file conflicts.

## 🎯 Current State

### ✅ What's Built

**Core Infrastructure:**
- ✅ Next.js 16 + TypeScript + React 19
- ✅ Supabase client configuration
- ✅ Environment variables setup (.env.local)
- ✅ Type definitions (Phoneme, CalibrationData, Profile, etc.)
- ✅ Constants (26 phonemes with pedagogical grouping)
- ✅ Profile management hooks (`usePhonicsApp`)
- ✅ Supabase helper functions (save/load calibrations)
- ✅ Complete CSS styling matching HTML version
- ✅ Tab navigation (Calibrate, Level 1, Tuner, Game, Game 2, Game 3)
- ✅ Basic calibration grid UI with grouped letters

**Development Server:**
- Running at: **http://localhost:3001**
- Hot reload enabled
- TypeScript compilation working

### 🚧 What Needs to Be Built

**Audio System:**
- [ ] Web Audio API setup (`AudioContext`, `AnalyserNode`)
- [ ] Microphone access and stream handling
- [ ] FFT analysis and frequency spectrum processing
- [ ] Peak detection algorithm
- [ ] Pattern matching (S11-Snapshot algorithm)
- [ ] Audio recording (MediaRecorder)

**Calibration Component:**
- [ ] Modal UI for voice recording
- [ ] 5-snapshot capture system
- [ ] Visual feedback (waveforms, snapshot thumbnails)
- [ ] Per-letter sensitivity controls
- [ ] Pause/resume functionality
- [ ] Save to Supabase with audio

**Game Components:**
- [ ] Level 1: Flashcard mode (click to hear sounds)
- [ ] Tuner: Practice mode with real-time detection
- [ ] Game: Falling letters game (3 lives, speed progression)
- [ ] Game 2: Beginner mode with auto-play + success counter
- [ ] Game 3: Voice instruction popups + celebration modals

**Authentication:**
- [ ] Google OAuth integration
- [ ] Magic Link email authentication
- [ ] Anonymous profile → authenticated account linking
- [ ] Profile switching UI

## 📁 Project Structure

```
app/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Main page with tabs + calibration grid
│   └── globals.css             # Complete styling from HTML version
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── supabaseHelpers.ts     # Profile + calibration functions
│   ├── types.ts               # TypeScript interfaces
│   ├── constants.ts           # PHONEMES array + groups
│   └── hooks/
│       └── usePhonicsApp.ts   # Main app state hook
├── components/                 # (Empty - add components here)
├── utils/                      # (Empty - add audio utils here)
├── .env.local                 # Supabase credentials
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── next.config.js             # Next.js config
```

## 🚀 Getting Started

### Running the Dev Server

```bash
cd app
npm run dev
```

Opens at **http://localhost:3001**

### Building for Production

```bash
npm run build
npm start
```

## 🔧 Development Workflow

### Adding New Components

1. Create component in `components/` folder:
   ```tsx
   // components/Calibration.tsx
   'use client';

   import { useState } from 'react';

   export function Calibration() {
     // Component logic here
     return <div>...</div>;
   }
   ```

2. Import in `app/page.tsx`:
   ```tsx
   import { Calibration } from '@/components/Calibration';
   ```

### Using the App State Hook

```tsx
import { usePhonicsApp } from '@/lib/hooks/usePhonicsApp';

export function MyComponent() {
  const {
    currentProfile,
    currentProfileId,
    calibrationData,
    letterSensitivity,
    isLoading,
    switchProfile,
    updateSensitivity,
    reloadCalibration
  } = usePhonicsApp();

  // Use state here
}
```

### Working with Supabase

```tsx
import { saveCalibrationToSupabase, loadCalibrationsFromSupabase } from '@/lib/supabaseHelpers';

// Save calibration
await saveCalibrationToSupabase(
  profileId,
  'A',
  patternData,
  audioBlob
);

// Load calibrations
const data = await loadCalibrationsFromSupabase(profileId);
```

## 📊 Migration Strategy

The original HTML file (`index-1.4.html`) is **~6700 lines** with complex logic. Rather than migrate everything at once, we've created a **solid foundation** that can be built incrementally:

### Recommended Approach

1. **Extract components one at a time** from HTML to React
2. **Test each component** before moving to the next
3. **Keep HTML version stable** during migration
4. **Use the HTML as reference** for complex algorithms

### Priority Order

1. **Audio utilities** (required by all components)
2. **Calibration modal** (core feature)
3. **Game 2 component** (current focus in HTML version)
4. **Game 3 component** (parallel development target)
5. Other components as needed

## 🎨 Styling

All CSS from the HTML version has been extracted to `globals.css`. Classes are identical, so you can copy HTML markup directly and styles will work.

## 🔐 Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://eyrcioeihiaisjwnalkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 🐛 Known Issues

- ⚠️ Turbopack warning about multiple lockfiles (can be ignored)
- ⚠️ Port 3001 used instead of 3000 (by design - HTML version uses 3000)

## 📚 Resources

- **Original HTML:** `../index-1.4.html` (~6700 lines)
- **Documentation:** `../PHONICS-SYSTEM-README.md`
- **Session Logs:** `../logs/`
- **Stable HTML:** `../stable-versions/`

## 🎯 Next Steps

**To continue development:**

1. **Create audio utilities:**
   - Extract Web Audio API logic from HTML
   - Create `utils/audioEngine.ts`
   - Implement FFT analysis and pattern matching

2. **Build calibration modal:**
   - Extract modal HTML/logic
   - Create `components/CalibrationModal.tsx`
   - Wire up audio recording

3. **Add Game 2/3 components:**
   - Create separate component files
   - Extract game logic from HTML
   - Test independently

**Parallel Development:**
- Instance 1: Work on `components/Calibration.tsx`
- Instance 2: Work on `components/Game3.tsx`
- No conflicts because different files!

---

## 💡 Tips

- Use `usePhonicsApp()` hook for shared state
- Import types from `@/lib/types`
- Import constants from `@/lib/constants`
- CSS classes match HTML version exactly
- Check `index-1.4.html` for complex logic reference

Happy coding! 🚀
