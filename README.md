# MindCanvas -- Patient Application

## Project Overview

MindCanvas is an AI-powered mental health assessment platform designed to break through the barriers of language, literacy, and cultural stigma that prevent marginalized populations from accessing mental healthcare. Instead of traditional verbal questionnaires, patients express their emotional state by drawing on a live camera canvas using hand gestures. The AI analyzes color patterns, line pressure, spatial composition, and symbolic content from these drawings to generate DSM-5-aligned clinical assessments, SOAP notes, and insurance-ready documentation -- all without requiring the patient to speak a single word about their condition.

This repository contains the **patient-facing application** -- the front end where patients onboard, draw, receive AI analysis, connect with vetted volunteer doctors worldwide, manage their Care Board, and access culturally-informed resources.

### Core Problem Statement

Over 450 million people globally suffer from mental health conditions, yet the majority never receive treatment. In conservative societies, immigrant communities, and populations with disabilities, the barriers are compounded: language gaps with providers, cultural stigma around verbalizing distress, lack of insurance knowledge, and difficulty accessing clinicians who understand their context. MindCanvas bypasses all of these by turning a simple drawing into a clinically meaningful assessment.

### Key Features

- **Hand Gesture Drawing** -- Patients draw on a transparent canvas overlaying their live camera feed using MediaPipe hand tracking. Index finger draws, pinch erases, fist clears, and open hand submits for analysis. No physical contact with the screen is required.
- **AI Drawing Analysis** -- Each drawing is analyzed with **OpenAI GPT-4o (vision)** via a server proxy: color distribution, line pressure, spatial composition, symbolic content, and (optionally) client-side **fractal-dimension** metrics. Outputs include a stress score (0-10), clinical-style note fields, DSM-style code suggestion, multilingual personal statement, and indicator breakdowns. **Facial emotion** (live) uses **face-api.js** (TinyFaceDetector + face expressions) on the webcam feed; samples feed the LLM context and can be stored with the session.
- **Multilingual Support** -- Full internationalization via i18next with English and Nepali locales. The personal statement can be spoken aloud in the patient's language using ElevenLabs text-to-speech, or translated to English for clinician review.
- **Sign Language Recognition** -- An alternative input mode where patients sign at the camera. Frames are sent to the same **OpenAI**-backed analysis route for interpretation on an interval.
- **Doctor Discovery and Connection** -- A volunteer doctor directory featuring vetted clinicians from 30+ countries who offer free or sliding-scale consultations. Includes a "Women Mode" toggle that restricts results to women clinicians only, with a full pink UI theme, for patients (particularly abuse or trauma survivors) who feel safer sharing with women providers.
- **NPI Registry Integration** -- Live search against the US National Provider Identifier registry to find licensed US-based clinicians by name, specialty, or state.
- **Session Replay with Azure Blob** -- Completed sessions can upload **webcam replay** (composited video includes live **emotion sticker** overlay), **drawing PNG**, and **`emotions-timeline.json`** (sampled facial emotions) to Azure Blob Storage, plus metadata manifests for clinician review.
- **Care Board** -- A personal board of supportive notes from family, friends, and community members. Anyone with a shareable link (e.g., /care/demo-patient) can leave a text note or photo that appears on the patient's board. No login required for senders.
- **Brain Activity Visualization** -- A real-time simulated brain activity display showing which cognitive regions are activated during drawing, providing biofeedback-style engagement.
- **Insurance Form Automation** -- Pre-populated CMS-1500 insurance claim forms using session data, parity analysis, and DSM-5 codes extracted from the AI assessment.
- **Clinical PDF Export** -- One-click download of SOAP notes as formatted PDF documents for clinician review or insurance submission.
- **FHIR Export** -- Session data can be exported in HL7 FHIR R4 format for interoperability with electronic health record systems.
- **Wearable Integration Panel** -- UI for future integration with Apple Health, Fitbit, and Garmin devices to correlate physiological data with drawing assessments.
- **Drawing Prompts** -- Clinically designed drawing exercises (Energy Circle, Safe Place, Family Drawing, Weather Mood, Body Map) each targeting specific DSM-5 assessment domains.
- **Stamp System** -- Mouse-clickable stamps (Person, Tree, Heart, House, Star, Cloud) for patients who want to add symbolic elements to drawings without freehand drawing.
- **Caregiver Notes** -- Optional 3-tap contextual input (skipped meals, meltdown count, sleep quality) for caregivers to supplement the AI assessment.
- **Resource Finder** -- Curated mental health resources including crisis hotlines, culturally specific support organizations, and local services.


## Architecture

```
voicecanvas/
|-- index.html                     # Entry point
|-- vite.config.js                 # Vite configuration with proxy rules
|-- package.json                   # Dependencies and scripts
|-- .env.example                   # Environment variable template
|-- server/                        # Express.js backend
|   |-- index.js                   # API server (OpenAI proxy, ElevenLabs TTS proxy, auth, sessions)
|   |-- db.js                      # MongoDB connection manager
|   |-- ws.js                      # WebSocket server for real-time features
|   |-- middleware/                 # Auth middleware (JWT)
|   +-- routes/                    # API route handlers
|-- src/
|   |-- main.jsx                   # React entry point
|   |-- App.jsx                    # Router configuration
|   |-- index.css                  # Global design system (CSS custom properties)
|   |-- pages/
|   |   |-- Landing.jsx/css        # Marketing landing page
|   |   |-- Onboarding.jsx/css     # Patient profile setup and language selection
|   |   |-- Dashboard.jsx/css      # Patient home with session history and analytics
|   |   |-- DrawingSession.jsx/css # Core drawing canvas with hand tracking
|   |   |-- SessionResults.jsx/css # AI analysis results display
|   |   |-- FindDoctor.jsx/css     # Doctor card grid with Women Mode
|   |   |-- CareNote.jsx/css       # Public shareable care note sender
|   |   |-- InsuranceForm.jsx/css  # CMS-1500 form builder
|   |   |-- ResourceFinder.jsx/css # Mental health resource directory
|   |   |-- AppExperience.jsx/css  # App experience showcase
|   |   +-- ClinicianDashboard.*   # Embedded clinician view (shared code)
|   |-- components/
|   |   |-- DrawingCanvas.jsx      # HTML5 Canvas with draw/erase/stamp methods
|   |   |-- GestureIndicator.jsx   # Real-time gesture feedback display
|   |   |-- GestureConfidenceBar.* # Gesture detection confidence meter
|   |   |-- DoctorSelector.jsx/css # Bottom-sheet doctor search with Women Mode
|   |   |-- CareBoard.jsx/css      # Sticky-note style care board
|   |   |-- BrainActivity.jsx/css  # Brain region activation visualizer
|   |   |-- SignLanguagePanel.*    # Sign language recognition UI
|   |   |-- StressChart.jsx/css    # Session-over-session stress trend chart
|   |   |-- GlobalNav.jsx/css      # Site-wide navigation header
|   |   |-- LanguageSelector.*     # Language picker component
|   |   |-- LiveSparkline.jsx      # Real-time stroke speed graph
|   |   |-- CanvasHeatmap.jsx      # Canvas coverage heat grid
|   |   |-- WaveformAnimation.*    # Audio playback waveform visual
|   |   |-- ProgressiveTextStream.*# Typewriter-style text reveal
|   |   |-- ResourceCard.jsx/css   # Individual resource display
|   |   |-- IntegrationShowcase.*  # Wearable device integration UI
|   |   |-- WearableIntegration.*  # Wearable data sheet
|   |   +-- HoldTimerRing.jsx      # Circular progress hold indicator
|   |-- hooks/
|   |   |-- useMediaPipe.js        # MediaPipe Hand Landmarker (gestures / drawing)
|   |   |-- useFaceEmotion.js      # face-api.js: live facial expression → emotion label
|   |   |-- useAnalysis.js         # Drawing analysis: GPT-4o + fractal + sketch stub
|   |   |-- useLlm.js              # LLM helpers (sign / misc; server routes do vision JSON)
|   |   |-- useElevenLabs.js       # ElevenLabs TTS via `/api/voice/speak`
|   |   +-- useStorage.js          # localStorage + optional API sync for sessions
|   |-- utils/
|   |   |-- azureBlob.js           # Azure Blob: video, drawing, emotions JSON, manifests
|   |   |-- fractalAnalysis.js     # Client-side fractal dimension / complexity heuristics
|   |   |-- doodleRecognition.js   # Sketch path stub (ml5/DoodleNet disabled; avoid TF conflicts)
|   |   |-- audioUnlock.js         # Browser autoplay priming for TTS
|   |   |-- llmPrompts.js          # Prompt strings for LLM-backed flows
|   |   |-- drawingPrompts.js      # Clinical drawing exercise definitions
|   |   |-- stamps.js              # Stamp shape definitions and renderers
|   |   |-- pdfExport.js           # SOAP note PDF generation (jsPDF)
|   |   |-- fhirExport.js          # HL7 FHIR R4 export utility
|   |   |-- formMapper.js          # Session data to form field mapper
|   |   +-- motionVariants.js      # Framer Motion animation presets
|   +-- i18n/
|       |-- index.js               # i18next configuration
|       +-- locales/               # en/, ne/ translation JSON files
+-- public/                        # Static assets
```


## Setup and Run Instructions

### Prerequisites

- Node.js 18+ and npm 9+
- Webcam (hand gestures + optional emotion detection; mouse drawing fallback if camera unavailable)
- **OpenAI API key** (`OPENAI_API_KEY`) — required for drawing analysis, sign frames, and related JSON routes
- **MongoDB** running locally (default `mongodb://localhost:27017/`) or `MONGODB_URI` — required for the Express server to start (sessions, auth persistence)
- **ElevenLabs API key** (optional) — multilingual TTS (e.g. Nepali with `eleven_v3` + `language_code` on server)
- **Azure Blob Storage** (optional) — session replay uploads (`VITE_*` variables in `.env`)

### Step 1: Clone the Repository

```bash
git clone <your-fork-or-repo-url>
cd NepaliHackathon   # or your project folder name
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` (see `.env.example`) — at minimum:

```
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=xi-...          # optional, for TTS
JWT_SECRET=...                     # required in production for auth
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/   # or Atlas
```

For Azure Blob Storage integration (optional), also add to a `.env` file or directly in the Vite config:

```
VITE_AZURE_STORAGE_ACCOUNT=your-storage-account-name
VITE_AZURE_STORAGE_CONTAINER=session-replays
VITE_AZURE_STORAGE_SAS=your-sas-token
VITE_VOICECANVAS_PATIENT_ID=pt-001
```

### Step 4: Run the Application

**Frontend only (recommended for demo):**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

**Frontend and backend together:**

```bash
npm run dev:all
```

This starts both the Vite dev server (port 5173) and the Express API server (port 3001) using `concurrently`.

**Backend only:**

```bash
npm run dev:server
```

### Step 5: Build for Production

```bash
npm run build
npm run preview
```


## Dependencies and Tools Used

### Frontend (npm)

| Dependency | Purpose |
|---|---|
| React 19 | Core UI framework |
| React Router DOM 7 | Client-side routing |
| Framer Motion 12 | Page transitions and UI motion |
| **@mediapipe/tasks-vision** | **HandLandmarker** — hand landmarks → draw / erase / gesture classify |
| **face-api.js** | **TinyFaceDetector + faceExpressionNet** (models loaded from CDN) — live facial emotion labels |
| i18next / react-i18next | Internationalization (e.g. English, Nepali) |
| jsPDF | Client-side PDF export for clinical-style notes |
| **Web platform APIs** | **`MediaRecorder`**, **`canvas.captureStream()`** — session webcam replay with emotion overlay composited on a hidden canvas |

### Client-side analysis (no extra npm ML stack)

| Module | Purpose |
|---|---|
| `src/utils/fractalAnalysis.js` | Box-counting **fractal dimension** and related heuristics on the drawing canvas (feeds analysis context / mock enrichment) |
| `src/utils/doodleRecognition.js` | Stub / disabled DoodleNet path (TensorFlow conflicts with face-api avoided; use server vision + fractals) |

### Backend (npm)

| Dependency | Purpose |
|---|---|
| Express 5 | REST API: `/api/analyze/*`, `/api/voice/speak`, auth, sessions, storage proxies |
| Helmet | HTTP security headers |
| CORS | Cross-origin handling for Vite dev server |
| express-rate-limit | Throttle analyze / voice routes |
| dotenv | Load `.env` for Node |
| jsonwebtoken | JWT for protected routes |
| **mongodb** | **MongoDB** — users, sessions, analytics sync when API is used |
| ws | WebSocket server (`server/ws.js`) |

### External APIs and cloud services

| Service | Usage |
|---|---|
| **OpenAI** (`gpt-4o`, Chat Completions + vision image URL) | Drawing interpretation JSON, sign-frame interpretation, structured clinical-style output (`server/routes/analyze.js`) |
| **ElevenLabs** | TTS proxy at `POST /api/voice/speak` — e.g. **eleven_v3** + `language_code` for Nepali (`ne`) |
| **Azure Blob Storage** | Optional upload of replay video, drawing PNG, `emotions-timeline.json`, `latest-replay.json`, `sessions-manifest.json` (`src/utils/azureBlob.js`) |
| **NPI Registry** (via app proxy) | US provider lookup in Find Doctor flow |
| **Spotify** | *Not integrated in this repo*; search/playback would use Spotify Web API separately |

### Development tools

| Tool | Purpose |
|---|---|
| Vite 8 | Dev server, HMR, proxy `/api` → backend |
| ESLint 9 | Linting |
| concurrently | `npm run dev:all` — Vite + Node server together |

### Optional dev scripts

| Path | Purpose |
|---|---|
| `scripts/test_elevenlabs_nepali.py` | Minimal ElevenLabs REST check (Nepali `language_code: ne`, `eleven_v3`) — requires `requests`, `python-dotenv` |


## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes (for AI routes) | OpenAI key for GPT-4o vision + text routes |
| `ELEVENLABS_API_KEY` or `ELEVEN_LABS_API_KEY` | No | ElevenLabs TTS (`/api/voice/speak`) |
| `ELEVENLABS_MODEL_ID` | No | Server default TTS model (code defaults toward `eleven_v3` for multilingual) |
| `JWT_SECRET` | Production | JWT signing secret |
| `PORT` | No | API port (default `3001`) |
| `ALLOWED_ORIGINS` | No | CORS allowlist (e.g. `http://localhost:5173`) |
| `MONGODB_URI` | For server | Mongo connection string (default local) |
| `MONGODB_PATIENTS_DB` | No | Database name override |
| `VITE_AZURE_STORAGE_*` / `VITE_VOICECANVAS_PATIENT_ID` | No | Azure replay uploads from the browser |
| `VITE_TTS_PATIENT_MODEL_ID` | No | Frontend hint for patient-language TTS model |
| `VITE_DEFAULT_PATIENT_LANGUAGE` | No | e.g. `ne` for hackathon demos |

See **`.env.example`** for the full list and comments.

### Further docs in this repo

| File | Contents |
|---|---|
| `ADVANCED_ANALYSIS.md` | Deeper notes on analysis pipeline / metrics |
| `MODELS_EXPLAINED.md` | Model and stack explanations |
| `requirements.md`, `ai.md` | Legacy / planning notes (may lag the code) |

## How It Works

1. **Onboarding** -- The patient selects their language, enters basic profile information, and optionally specifies their disability type and insurance status.

2. **Drawing Session** -- A drawing prompt is shown. The patient draws on a canvas over the live camera; **MediaPipe Hand Landmarker** maps hand landmarks to gestures. **face-api.js** runs on the video for live **facial expressions** (timeline sampled for analysis and optional Azure JSON). **Webcam recording** uses a composited canvas stream so **emotion labels appear burned into the replay video** alongside the mirror-corrected camera feed.

3. **AI Analysis** -- On submit, the image (and optional **emotion timeline** / fractal metadata from the client) is sent to the backend, which calls **OpenAI GPT-4o** with a vision + JSON schema style prompt. The model returns structured fields (stress score, notes, personal statements in patient language + English, etc.).

4. **Results and Voice** -- Results and clinical-style sections are shown; **ElevenLabs** can read the personal statement via the server proxy (`eleven_v3` + ISO language codes such as `ne` for Nepali where applicable).

5. **Doctor Connection** -- The patient can send their session to a vetted volunteer doctor. Women Mode ensures trauma survivors can restrict their data to women clinicians only.

6. **Care Board** -- Family members can visit a public link to leave supportive notes that appear on the patient's personal Care Board.

7. **Insurance Automation** -- Session data automatically populates CMS-1500 insurance claim forms with appropriate CPT and DSM-5 codes, enabling patients to seek reimbursement for art therapy sessions.


## License

This project was built for the Accenture Hackathon 2026.
