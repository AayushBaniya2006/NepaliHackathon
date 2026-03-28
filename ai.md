# AI/ML/CV Task Tracker

## Completed

### 1. Webcam Frame Capture (DrawingSession.jsx)
- Samples webcam every 3s as timestamped JPEG base64 (0.5 quality)
- Stored in `session.webcamFrames[]` for doctor replay + Claude facial analysis
- **Branch:** `drawingstuff`

### 2. Stroke Data Capture (DrawingCanvas.jsx + DrawingSession.jsx)
- Records `{x, y, t}` for every draw point (gesture + mouse)
- `onStrokePoint` callback prop on DrawingCanvas
- Stored in `session.strokeData[]` for stroke-by-stroke replay
- **Branch:** `drawingstuff`

### 3. Gesture Calibration in Onboarding (Onboarding.jsx)
- 4-step onboarding: Consent → Camera → Calibration → Profile
- Calibrates: 1 finger, 2 fingers, open hand, fist
- Green check on detection, 5s timeout with retry hint
- Uses `useMediaPipe` hook, skips gracefully if camera denied
- **Branch:** `drawingstuff`

### 4. Share with Doctor Button (SessionResults.jsx)
- Marks session `sharedWithDoctor: true` in localStorage
- Button disables after sharing
- **Branch:** `quickadds`

### 5. Voice Language Toggle (SessionResults.jsx)
- Browser `speechSynthesis` reads personal statement
- "My Language" / "Hear in English" switcher
- Play/Stop controls, language-mapped voice codes
- **Branch:** `quickadds`

### 6. Crisis Auto-Surface (SessionResults.jsx)
- Banner appears when `stress_score >= 8` or `crisis_flag === true`
- One-tap: Call 988 / Text HOME to 741741
- **Branch:** `quickadds`

---

## Remaining

### High Impact (Judge-Impressive)

#### 7. Session Replay Page (`/clinic/replay/:sessionId`)
- **Owner:** Person 3
- **Status:** Not built (largest remaining feature)
- Canvas replay: reconstruct strokes at original speed using `strokeData` timestamps
- Scrubber bar to jump to any time
- Speed controls: 0.5x / 1x / 2x
- Webcam panel: stitch stored `webcamFrames` into slideshow synced to timeline
- Facial expression overlay: red=distress, blue=suppression, green=relief tints
- Emotional arc timeline with clickable annotation markers from Claude `key_moments`
- Notes editor alongside replay (rich text, pre-populated with AI SOAP)
- Export: save notes → update patient record → FHIR/PDF

#### 8. Facial Analysis Display (Clinician Patient Detail)
- **Owner:** Person 2
- **Status:** Not built
- Render `facial_analysis` from Claude: dominant affect, emotional arc, key moments
- Card in the patient detail right panel

### Medium Impact

#### 9. Stress Trajectory Chart (Dashboard + Clinician Detail)
- **Owner:** Person 1 / Person 5
- **Status:** Not built
- Line chart of stress scores across sessions
- X-axis: dates, Y-axis: 0-10
- Color zones: green (0-4), yellow (5-7), red (8-10)
- "You're making progress" or "Talk to your doctor" badges

#### 10. SOAP Inline Editing (Clinician Patient Detail)
- **Owner:** Person 2
- **Status:** Not built
- Click pencil icon on S/O/A/P fields → editable text
- "Save changes" button → update session in localStorage

#### 11. Doctor Finder Page (`/find-doctor`)
- **Owner:** Person 4
- **Status:** Not built
- Zip/location search, mock doctor cards (8 doctors)
- Filter: language, specialty, insurance, telehealth
- "VoiceCanvas Compatible" badge
- "Connect" button → stores `connectedDoctorId`

#### 12. Clinic Landing Page (`/clinic`)
- **Owner:** Person 5
- **Status:** Not built
- Professional tone, value props, stats bar
- "Enter Clinic Dashboard" CTA

### Smaller Items

#### 13. Caregiver Photo Upload (Dashboard)
- **Owner:** Person 4
- **Status:** Not built
- File upload stores photos in `profile.caregiverPhotos[]`
- Appears as prompt card on patient's dashboard

#### 14. Insurance Provider Dropdown + Insurer-Specific Stats
- **Owner:** Person 2 / Person 5
- **Status:** Not built
- Dropdown: Aetna, UHC, Cigna, BCBS, Humana, Medicaid, Tricare, etc.
- Sidebar shows: MH denial rate, appeal processing time, MHPAEA violations, win rate

#### 15. Live Session Mode (toggle in `/draw`)
- **Owner:** Person 4
- **Status:** Not built
- "Solo" ↔ "Live Session" toggle in top bar
- In Live: ElevenLabs speaks English interpretation after each submission
- Patient sees their language on screen

#### 16. Employer Section on Landing Page
- **Owner:** Person 5
- **Status:** Not built
- Value prop, $2/employee pricing, "Partner with us" mock CTA

#### 17. Multilingual Claude Prompts
- **Owner:** Person 4
- **Status:** Not built
- Update `claudePrompts.js` / `drawingPrompts.js` to output both `personal_statement` (patient language) and `personal_statement_en` (English)
- Update ElevenLabs calls to use correct language code

#### 18. ElevenLabs Integration (SessionResults + Clinician)
- **Owner:** Person 1 / Person 2
- **Status:** Not built (browser speechSynthesis is wired as fallback)
- Auto-play personal statement on results page load
- Doctor-side: speak English clinical summary
- Requires `VITE_ELEVENLABS_API_KEY` in `.env`
