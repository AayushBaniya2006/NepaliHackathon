# VoiceCanvas

**Nepal–US Hackathon 2026** — Mental health expression through webcam gestures, drawing, and AI-assisted clinical documentation.

VoiceCanvas is a browser-based app for people who struggle to communicate verbally (nonverbal users, limited English, anxiety, etc.). Users draw with hand gestures; AI interprets the drawing into structured notes; optional voice playback helps users hear their feelings articulated.

## Tech stack

- React (Vite)
- MediaPipe Hands (gesture / drawing)
- OpenAI GPT-4o (vision + clinical note generation via server proxy)
- ElevenLabs (optional text-to-speech)
- Local storage for demo sessions

## Setup

```bash
npm install
npm run dev
```

Create a `.env` file in the project root with your API keys (never commit `.env`; it is gitignored).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Disclaimer

Demo / hackathon build — not a medical device, not HIPAA compliant, not for clinical use without proper review.

---

Repository: [NepaliHackathon](https://github.com/AayushBaniya2006/NepaliHackathon)
