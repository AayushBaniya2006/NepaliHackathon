# MindHaven- Client Side

**Live Demo**:Client Side https://voicecanvas-one.vercel.app : 
Doctor Saas : https://nepal-hackathon-doctor-side.vercel.app/dashboard
Community Shareable Link" https://voicecanvas-one.vercel.app/care/demo-patient


Mental health assessment platform that converts gesture-based drawings into clinical evaluations with multilingual AI voice feedback. Built for millions of people who struggle with verbal communication due to language barriers, trauma, autism, anxiety, or cultural stigma.

## Problem & Solution

Over 450 million people worldwide suffer from mental health conditions but never receive treatment. Traditional verbal assessment fails for non-English speakers, nonverbal individuals, and those facing cultural stigma around discussing mental health.

VoiceCanvas bypasses verbal communication entirely. Patients draw their feelings using webcam-tracked hand gestures. AI analyses the drawings using fine tuned open source ml5 model, research-backed fractal dimension algorithms, and real-time facial emotion detection with tensorflow. Results are delivered via natural voice synthesis in the patient's language (English, Nepali). Clinicians receive DSM-5 aligned SOAP notes and insurance-ready documentation.

## Full patient feature list

Accurate to this codebase. *Demo / hackathon build — not a medical device; see in-app disclaimers.*

### Draw your feelings

- Hand in front of the **webcam** — no stylus. **Google MediaPipe Hands** (in the browser): **index finger draws**, **pinch erases**, **fist clears**; gestures can also **trigger analyze** (speak gesture).
- **Stamp system** — Side **Stamps** panel: click a stamp to place it at the **last canvas point** (or a default center). Built-in stamps include **Person**, **Tree**, **Heart**, **House**, **Star**, **Cloud** (each has optional gesture hints in `stamps.js` for future gesture-to-stamp flows).
- If the camera is denied or unavailable, a **mouse drawing fallback** is offered on the drawing screen.
- **Five guided prompts** (see `src/utils/drawingPrompts.js`): **Energy Circle**, **Body Map**, **Day Weather**, **Safe Thing**, **Worry Shape** — each includes a short clinical-style blurb in the UI.
- **Session timer** during the draw flow.
- **Solo vs Live** mode toggle (how the session is framed for interpretation).
- **Draw vs Sign** mode: sign mode periodically captures camera frames and can send them through the **Claude** proxy for sign-related interpretation when the backend is up.
- **Brain activity** panel — Toggle **Brain** on the drawing header: animated **brain regions** (e.g. motor, visual, emotional areas) light up based on **gesture and drawing state** as **biofeedback-style engagement** (illustrative UI, not a medical brain scan).
- **Caregiver notes** (drawing session) — Optional **Notes** panel: quick context such as **skipped meals**, **meltdown count**, and **sleep** quality; saved with the session when you analyze.
- **Live session metrics** (drawing session, side column) — While drawing, the UI can show **stroke-speed sparkline** (`LiveSparkline`), **canvas coverage heatmap** (`CanvasHeatmap`), and **gesture confidence** — telemetry that supports the “evidence for the AI” story (stored/analytics paths vary by setup).
- **Emotion readout** (drawing + results) — After analysis, an **Emotion** card shows the model’s **dominant mood** label and **emoji** from AI indicators; during processing it shows a **detecting** state. This reflects **LLM output** on the drawing, not a separate real-time facial classifier.

### Photos

- **Dashboard — caregiver / context photos** — Patients can **upload photos** (e.g. environment or caregiver context) from the dashboard; images are kept on the **profile** (`caregiverPhotos` in local storage) for a richer record alongside sessions.
- **Care Board** — Visitors with the share link can attach a **photo** with their supportive note (see Care Board section below).

### AI reads your art

- On submit, the **canvas image** is sent to **`/api/analyze/drawing`** (Express proxy → **Anthropic Claude**) when configured. The model returns structured fields: **stress score**, **mood-style indicators**, **color/line/placement** cues, **pattern text**, **SOAP-style clinical note** (subjective / objective / assessment / plan), **personal statement**, and **insurance-oriented** text where populated.
- If the server is down or keys are missing, **`useAnalysis`** can use **built-in mock responses** so the UI still demos end-to-end.

### Hear your results

- **ElevenLabs** text-to-speech via **`/api/voice/speak`** (`eleven_monolingual_v1` on the server) when keys are set.
- Falls back to the **browser Web Speech API** when ElevenLabs is unavailable.
- **Onboarding** captures **language preference**; **i18next** drives UI strings (e.g. **en** / **ne**).

### Session history and dashboard (metrics)

- **Session list** — Recent **draw sessions** with prompt, stress score, and navigation to review flow.
- **Weekly progress** — Progress **ring** vs **`WEEKLY_GOAL`** (sessions per week from `drawingPrompts.js`).
- **Stress analytics** — **`StressChart`** and stored **analytics** entries (`useStorage`) for trend-style views; **average stress** across logged analytics.
- **Mini sparkline** — Small **stress-over-time** polyline built from recent session scores on the dashboard card.
- **Mood check-in** — **Emoji mood picker** (happy, calm, angry, sad, anxious, numb); last choice can persist in **sessionStorage** for the session.
- **Care Board** widget on the home dashboard — quick access to the same board as the full Care Board flow.

### After each session (results screen)

- **Crisis banner** when stress is high or a crisis flag is set: **988** and **text HOME to 741741** links.
- **Send to a doctor** opens **DoctorSelector** (bottom sheet) with the same **Women Mode** filter as Find Doctor.
- **Download clinical PDF** (jsPDF).
- **Health apps & wearables** sheet: **FHIR R4 JSON** observation download and **wellness JSON** bundle for bridging to apps or clinicians.
- Optional **Azure Blob** upload: **MediaRecorder** webcam **replay** (WebM or MP4 per browser) + **drawing PNG** + **latest-replay.json** / **sessions-manifest.json** for the **Doctor SaaS** replay page (same `VITE_VOICECANVAS_PATIENT_ID` as the clinic app).

### Care Board

- Shareable route **`/care/:patientId`**: trusted contacts can leave **text notes or upload a photo** **without an account**; items appear as **sticky-note** style entries on the patient’s **Care Board** (also surfaced on the **Dashboard**).

### Find a doctor

- **FindDoctor** page: demo **provider cards** with filters (language, specialty, telehealth, etc.).
- **Women Mode** toggle: restricts the list to **female** clinicians and applies a distinct theme.
- **NPI Registry**: dev server **proxies** the CMS **NPI** API for US provider lookup where wired in the UI.

### Other patient-app surfaces

- **Landing** — marketing story, metrics, how it works.
- **Onboarding** — profile and preferences.
- **InsuranceForm** — **CMS-1500–style** demo form with parity-flavored copy; **not** a real submission (**demo disclaimers** in UI).
- **ResourceFinder** — crisis and support resources.
- **ClinicianDashboard** (embedded **`/clinician`**) — lightweight clinician-style view inside the same SPA for demos.
- **AppExperience** — product-style walkthrough page.

## Core Features

**VoiceCanvas — Full feature list (for patients)

Draw your feelings

Use your hand in front of the camera — no stylus required. Index finger draws, pinch erases, fist clears; you can also use stamps and (if the camera isn’t available) draw with the mouse on a fallback canvas.
Pick from five guided prompts: Energy Circle, Body Map, Day Weather, Safe Thing, and Worry Shape (each tied to a short clinical-style description in the app).
Optional sign mode for camera-based sign capture with AI-assisted interpretation when the backend is connected.
Solo vs live session mode for how the session is framed.
A session timer and a “brain activity” panel that reacts to your gestures as on-screen feedback (not medical brain imaging).
AI reads your art

When you finish, the app sends your drawing image to a vision AI (Anthropic Claude when the server is running) and returns a stress score, mood-style indicators, color and line cues, a short pattern summary, a SOAP-style clinical note, text suited for insurance-style fields, and a first-person style personal statement. If the API isn’t available, the app can still run with built-in demo analysis so the flow works offline.
Hear your results

The personal summary can be read aloud with AI voice (ElevenLabs via the server when configured), or with your browser’s built-in text-to-speech. Onboarding language helps tailor the experience; the app supports multiple languages in the UI (e.g. English and Nepali) where implemented.
Session history & dashboard

See past sessions, stress trends, and shortcuts to draw again or open other tools.
Care board

Share a private link so family or friends can leave notes or photos on your board without creating an account.
Find a doctor

Browse sample / demo providers with filters (e.g. language, specialty). Women Mode shows women clinicians only when you need that.
After each session

Send your session to a doctor from a picker sheet (same Women Mode available there).
Download a clinical PDF, open health apps & wearables helpers (FHIR JSON and wellness export for your care team).
When Azure is configured, the app can upload webcam replay + drawing so your clinic can open the same session on their side.
Crisis support

If your stress score is high or a crisis flag appears, the app surfaces 988 and crisis text line options on the results screen.
More in the app

Onboarding (profile and preferences), resource finder for support links, a demo insurance / claims-style form (clearly marked as demo), and an embedded clinician-style view for walkthroughs — all in the same patient app.

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
