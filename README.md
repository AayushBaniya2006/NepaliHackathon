# VoiceCanvas

**Live Demo**: https://voicecanvas-one.vercel.app : Client Side
Doctor Saas : https://nepal-hackathon-doctor-side.vercel.app/dashboard
Community Shareable Link" https://voicecanvas-one.vercel.app/care/demo-patient


Mental health assessment platform that converts gesture-based drawings into clinical evaluations with multilingual AI voice feedback. Built for 30M+ people who struggle with verbal communication due to language barriers, trauma, autism, anxiety, or cultural stigma.

## Problem & Solution

Over 450 million people worldwide suffer from mental health conditions but never receive treatment. Traditional verbal assessment fails for non-English speakers, nonverbal individuals, and those facing cultural stigma around discussing mental health.

VoiceCanvas bypasses verbal communication entirely. Patients draw their feelings using webcam-tracked hand gestures. AI analyses the drawings using fine tuned open source ml5 model, research-backed fractal dimension algorithms, and real-time facial emotion detection with tensorflow. Results are delivered via natural voice synthesis in the patient's language (English, Nepali). Clinicians receive DSM-5 aligned SOAP notes and insurance-ready documentation.

## Core Features

**Patient Flow**

- Webcam gesture drawing (MediaPipe hand tracking: index finger draws, pinch erases, fist clears)
- Real-time facial emotion detection (TensorFlow.js via face-api.js: 7 emotions at 10 FPS)
- Deterministic analysis with dedicated ml models + fractal dimension algorithm (box-counting across 7 scales)
- Multilingual voice feedback (ElevenLabs eleven_v3 with Nepali language_code support)
- Session replay with emotion overlays burned into video and stored in Azure
- Care Board for family/friend supportive notes
- Doctor directory with Women Mode for trauma survivors
- 5 clinical drawing prompts: Energy Circle, Body Map, Weather Mood, Safe Place, Worry Shape

**Clinical Workflow**

- DSM-5 aligned SOAP notes with stress scores (0-10)
- CMS-1500 insurance claim automation with CPT codes
- FHIR R4 export for EHR interoperability
- PDF report generation with jsPDF
- NPI Registry integration for US provider lookup
- Azure Blob session archival (video, PNG, emotion timeline JSON)

## Technical Stack

MindHaven uses React 19, React Router 7, Vite 8, Framer Motion, i18next, HTML5 Canvas, localStorage, Web APIs (MediaDevices, MediaRecorder, Web Speech where used), jsPDF, FHIR R4 export utilities, Azure Blob Storage (SAS, WebM/MP4 + PNG uploads), Express 5 (optional patient server) with cors, helmet, express-rate-limit, MongoDB Node driver, WebSocket (ws), JWT, Anthropic Messages API (Claude Sonnet 4 for drawing/sign vision), ElevenLabs TTS (eleven_monolingual_v1), CMS NPI Registry (proxied lookup), Google MediaPipe Tasks Vision (in-browser hands), Puppeteer (clinic automation), Flask, flask-cors, PyMongo, python-dotenv, OpenAI API (gpt-4o-mini, text-embedding-3-small), NumPy, Google Gmail APIs (OAuth client libraries), plus  DSM-5–aligned prompts (not a trained DSM model), and MHPAEA-oriented denial-analysis copy in the appeals flow with HIPPA frameworks and Color theory framework

**AI Analysis Pipeline**

1. MediaPipe tracks hand landmarks for gesture classification (draw/erase/clear/submit)
2. TensorFlow.js runs TinyFaceDetector + faceExpressionNet at 10 FPS (7 emotions with confidence scores)
3. Client calculates fractal dimension via box-counting algorithm (scales: 2, 4, 8, 16, 32, 64, 128 pixels)
4. Drawing image + fractal metrics + emotion timeline sent to GPT-4o with structured JSON schema
5. Server returns stress score (0-10), SOAP notes, DSM-5 codes, personal statement in patient language
6. ElevenLabs eleven_v3 synthesizes personal statement with language_code (ne for Nepali)
7. Session composited to video with emotion overlays burned in via Canvas API + MediaRecorder
8. Azure Blob stores replay.webm, drawing.png, emotions-timeline.json

**Research Foundation**: Fractal dimension correlates with mental health. Depression (1.1-1.3) shows simplified patterns, healthy baseline (1.4-1.6) shows balance, anxiety/mania (1.7-1.9) shows chaotic complexity.

## Setup & Run

**Requirements**: Node.js 18+, MongoDB, webcam, OpenAI API key

```bash
npm install
cp .env.example .env
# Edit .env with keys: OPENAI_API_KEY, ELEVENLABS_API_KEY, MONGODB_URI

npm run dev:all          # Frontend (5173) + Backend (3001)
npm run dev              # Frontend only
npm run build && npm run preview   # Production build
```

**Key Environment Variables**

- `OPENAI_API_KEY` - Required for GPT-4o analysis
- `ELEVENLABS_API_KEY` - Optional for Nepali voice synthesis
- `MONGODB_URI` - Session/user persistence
- `JWT_SECRET` - Auth token signing
- `VITE_AZURE_STORAGE_`* - Optional session replay uploads

## API Routes & Endpoints

**Patient Routes**
`/` Landing → `/onboarding` Profile → `/draw` Session → `/session-results` Analysis → `/dashboard` History
`/find-doctor` Clinician directory → `/care/:patientId` Public Care Board → `/resources` Mental health directory

**Clinical Routes**
`/clinician` Session replay dashboard → `/insurance` CMS-1500 form generation

**API Endpoints**
`POST /api/analyze/drawing` GPT-4o vision + fractal analysis
`POST /api/voice/speak` ElevenLabs TTS with language_code
`GET /api/sessions` Patient history | `POST /api/sessions` Create session
`POST /api/auth/register` User registration | `POST /api/auth/login` JWT token

## Key Dependencies

`@mediapipe/tasks-vision` (0.10.34), `face-api.js` (0.22.2) with TensorFlow.js, `react` (19.2.4), `framer-motion` (12.38.0), `i18next` (26.0.1), `jspdf` (4.2.1), `express` (5.2.1), `mongodb` (7.1.1), `jsonwebtoken` (9.0.3)

ML models loaded from CDN: TinyFaceDetector, faceExpressionNet, MediaPipe HandLandmarker

## License

Built for Nepal-US Hackathon 2026.
