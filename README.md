# MindCanvas -- Patient Application

## Project Overview

MindCanvas is an AI-powered mental health assessment platform designed to break through the barriers of language, literacy, and cultural stigma that prevent marginalized populations from accessing mental healthcare. Instead of traditional verbal questionnaires, patients express their emotional state by drawing on a live camera canvas using hand gestures. The AI analyzes color patterns, line pressure, spatial composition, and symbolic content from these drawings to generate DSM-5-aligned clinical assessments, SOAP notes, and insurance-ready documentation -- all without requiring the patient to speak a single word about their condition.

This repository contains the **patient-facing application** -- the front end where patients onboard, draw, receive AI analysis, connect with vetted volunteer doctors worldwide, manage their Care Board, and access culturally-informed resources.

### Core Problem Statement

Over 450 million people globally suffer from mental health conditions, yet the majority never receive treatment. In conservative societies, immigrant communities, and populations with disabilities, the barriers are compounded: language gaps with providers, cultural stigma around verbalizing distress, lack of insurance knowledge, and difficulty accessing clinicians who understand their context. MindCanvas bypasses all of these by turning a simple drawing into a clinically meaningful assessment.

### Key Features

- **Hand Gesture Drawing** -- Patients draw on a transparent canvas overlaying their live camera feed using MediaPipe hand tracking. Index finger draws, pinch erases, fist clears, and open hand submits for analysis. No physical contact with the screen is required.
- **AI Drawing Analysis** -- Each drawing is analyzed by Anthropic Claude for color distribution, line pressure patterns, spatial composition, symbol detection, and emotional markers. The system produces a stress score (0-10), clinical SOAP note, DSM-5 code suggestions, personal statement interpretation, and indicator breakdowns.
- **Multilingual Support** -- Full internationalization via i18next with English and Nepali locales. The personal statement can be spoken aloud in the patient's language using ElevenLabs text-to-speech, or translated to English for clinician review.
- **Sign Language Recognition** -- An alternative input mode where patients sign at the camera. Claude interprets ASL/BSL gestures captured at 3-second intervals and assembles them into coherent clinical communications.
- **Doctor Discovery and Connection** -- A volunteer doctor directory featuring vetted clinicians from 30+ countries who offer free or sliding-scale consultations. Includes a "Women Mode" toggle that restricts results to women clinicians only, with a full pink UI theme, for patients (particularly abuse or trauma survivors) who feel safer sharing with women providers.
- **NPI Registry Integration** -- Live search against the US National Provider Identifier registry to find licensed US-based clinicians by name, specialty, or state.
- **Session Replay with Azure Blob** -- Completed drawing sessions, including canvas snapshots and metadata, are uploaded to Azure Blob Storage. Clinicians using the companion Doctor SaaS application can replay these sessions frame-by-frame.
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
|   |-- index.js                   # API server (Claude proxy, ElevenLabs proxy, auth)
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
|   |   |-- useMediaPipe.js        # MediaPipe hand landmark detection
|   |   |-- useAnalysis.js         # Drawing analysis via Claude API
|   |   |-- useClaude.js           # Claude API communication layer
|   |   |-- useElevenLabs.js       # ElevenLabs TTS integration
|   |   +-- useStorage.js          # localStorage persistence for sessions
|   |-- utils/
|   |   |-- azureBlob.js           # Azure Blob Storage upload/download
|   |   |-- claudePrompts.js       # Structured prompts for Claude analysis
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

- Node.js version 18 or higher
- npm version 9 or higher
- A webcam (required for hand gesture drawing; mouse fallback is available)
- Anthropic Claude API key (required for drawing analysis)
- ElevenLabs API key (optional, for text-to-speech)
- Azure Blob Storage account (optional, for session replay sharing with clinicians)

### Step 1: Clone the Repository

```bash
git clone https://github.com/AceSen1a-BTT/MindCanvas-Patient.git
cd MindCanvas-Patient
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

Edit `.env` with the following values:

```
CLAUDE_API_KEY=sk-ant-your-anthropic-api-key
ELEVENLABS_API_KEY=xi-your-elevenlabs-key (optional)
JWT_SECRET=generate-a-random-32-byte-base64-string
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
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

### Frontend

| Dependency | Purpose |
|---|---|
| React 19 | Core UI framework |
| React Router DOM 7 | Client-side routing |
| Framer Motion 12 | Page transitions, gesture animations, layout animations |
| MediaPipe Tasks Vision | Real-time hand landmark detection via webcam |
| i18next / react-i18next | Internationalization (English, Nepali) |
| jsPDF | Client-side PDF generation for clinical notes |

### Backend

| Dependency | Purpose |
|---|---|
| Express 5 | API server for Claude and ElevenLabs proxy calls |
| Helmet | HTTP security headers |
| CORS | Cross-origin request handling |
| express-rate-limit | API rate limiting |
| dotenv | Environment variable management |
| jsonwebtoken | JWT authentication |
| MongoDB driver | Database persistence (optional) |
| ws | WebSocket server for real-time features |

### External APIs

| Service | Usage |
|---|---|
| Anthropic Claude API | Drawing analysis, sign language interpretation, clinical note generation |
| ElevenLabs API | Text-to-speech for personal statement playback |
| Azure Blob Storage | Session replay upload and retrieval for clinician review |
| NPI Registry API | US doctor search by name, specialty, and state |

### Development Tools

| Tool | Purpose |
|---|---|
| Vite 8 | Build tool and development server with hot module replacement |
| ESLint 9 | JavaScript and React linting |
| concurrently | Run frontend and backend in parallel during development |


## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `CLAUDE_API_KEY` | Yes | Anthropic API key for drawing analysis |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API key for text-to-speech |
| `JWT_SECRET` | Yes (for backend) | Secret for signing JWT tokens |
| `PORT` | No | Backend server port (default: 3001) |
| `ALLOWED_ORIGINS` | No | CORS allowed origins (default: http://localhost:5173) |
| `VITE_AZURE_STORAGE_ACCOUNT` | No | Azure Storage account name |
| `VITE_AZURE_STORAGE_CONTAINER` | No | Azure Blob container name |
| `VITE_AZURE_STORAGE_SAS` | No | Azure SAS token for blob access |
| `VITE_VOICECANVAS_PATIENT_ID` | No | Patient identifier for session uploads |


## Team Members and Roles

| Name | Role | Responsibilities |
|---|---|---|
| Koshish Rimal | Team Lead / Full-Stack Developer | Architecture design, AI integration, patient app development, drawing analysis pipeline, system integration |
| Sagar Paudel | Frontend Developer | Patient dashboard UI, landing page, onboarding flow, responsive design, CSS design system |
| Member 3 | Backend Developer | Express API server, authentication, database integration, deployment configuration |
| Member 4 | AI/ML Research | Claude prompt engineering, clinical validation, DSM-5 alignment, drawing analysis accuracy |


## How It Works

1. **Onboarding** -- The patient selects their language, enters basic profile information, and optionally specifies their disability type and insurance status.

2. **Drawing Session** -- The patient is given a clinically designed drawing prompt (e.g., "Fill this area with lines and colors that show your energy right now"). They draw on a transparent canvas overlaid on their live camera feed using hand gestures detected by MediaPipe.

3. **AI Analysis** -- When the patient submits the drawing, the canvas image is sent to Anthropic Claude. The AI evaluates color distribution percentages, line pressure indicators, spatial composition patterns, symbolic content, and emotional markers. It outputs a structured JSON response containing a stress score, clinical SOAP note, DSM-5 code suggestions, a personal statement (a first-person narrative of what the patient seems to be feeling), and quantified indicators.

4. **Results and Voice** -- The patient views their results including the stress score visualization, indicator breakdowns, personal statement, and clinical note. The personal statement can be read aloud in the patient's language via ElevenLabs.

5. **Doctor Connection** -- The patient can send their session to a vetted volunteer doctor. Women Mode ensures trauma survivors can restrict their data to women clinicians only.

6. **Care Board** -- Family members can visit a public link to leave supportive notes that appear on the patient's personal Care Board.

7. **Insurance Automation** -- Session data automatically populates CMS-1500 insurance claim forms with appropriate CPT and DSM-5 codes, enabling patients to seek reimbursement for art therapy sessions.


## License

This project was built for the Accenture Hackathon 2026.
