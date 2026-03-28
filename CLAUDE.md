# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VoiceCanvas — a Nepal-US Hackathon 2026 mental health app. Two user flows in one SPA:
- **Patient:** gesture-draw feelings → Claude AI vision interprets → ElevenLabs voice playback
- **Clinician:** review patient sessions → generate SOAP notes → build insurance claims → export FHIR/PDF

Target users: ~30M+ people who struggle with verbal communication (nonverbal, limited English, anxiety, trauma, autism).

## Commands

```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint (React hooks rules)
```

No test framework is currently configured.

## Architecture

React 19 + Vite 8 SPA. No TypeScript — vanilla JSX throughout.

**Routing** (React Router, 8 routes defined in `src/App.jsx`):
`/` Landing → `/onboarding` → `/draw` DrawingSession → `/session-results` → `/clinician` ClinicianDashboard → `/insurance` InsuranceForm → `/resources` ResourceFinder, plus `/dashboard` for patient history.

**Key hooks** (`src/hooks/`):
- `useClaude.js` — Claude API integration (vision analysis + clinical note generation)
- `useMediaPipe.js` — MediaPipe Hands gesture detection from webcam
- `useAnalysis.js` — Drawing analysis pipeline
- `useElevenLabs.js` — Text-to-speech via ElevenLabs
- `useStorage.js` — localStorage persistence (demo mode, no backend)

**Utilities** (`src/utils/`):
- `claudePrompts.js` / `drawingPrompts.js` — AI prompt templates
- `fhirExport.js` — FHIR R4 medical record export
- `pdfExport.js` — jsPDF session report generation
- `formMapper.js` — Maps session data to insurance form fields

**Core flow:** DrawingSession captures gesture input via MediaPipe → canvas drawing → Claude vision API interprets emotional content → structured analysis → SOAP note for clinicians → optional FHIR/PDF export.

## Environment Variables

API keys go in `.env` (not committed):
- Claude API key (for vision analysis and clinical notes)
- ElevenLabs API key (for voice playback)

## Key Dependencies

Framer Motion for route transitions, MediaPipe Tasks Vision for hand tracking, jsPDF for PDF export, React Router for navigation.
