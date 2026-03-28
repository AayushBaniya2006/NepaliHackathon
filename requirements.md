# VoiceCanvas — Full Product Requirements Document
### Hackathon: Nepal–US Hackathon 2026 / Mental Health Theme
### Version: 3.0 | Team Size: 5 | Status: In Progress

---

## OVERVIEW: Two Apps, One Platform

We are building **two separate but connected applications** that share data through localStorage (demo) and eventually a shared API (production):

| App | Name | Who Uses It | Core Purpose |
|---|---|---|---|
| **App 1** | VoiceCanvas (Patient App) | Patients, caregivers | Draw feelings, hear interpretation, connect to a doctor |
| **App 2** | VoiceCanvas Clinic (Doctor App) | Clinicians, therapists | Review sessions, write notes, fight insurance denials |

They live in the same codebase (routing separates them) but feel like completely different products with different design tones, different data needs, and different goals.

---

## PROBLEM STATEMENT

Over **1 in 4 people with disabilities** never seek mental health care. The barrier isn't access — it's **articulation.**

People who cannot speak, or struggle to communicate due to disability, anxiety, trauma, autism, selective mutism, limited English, or cultural stigma face a compounding crisis:

- They **can't explain symptoms** clearly to clinicians
- This leads to **under-diagnosis** and poor clinical documentation
- Poor documentation leads to **insurance denials**
- Language barriers mean immigrants are excluded from care entirely
- Fear of denial stops people from **seeking care at all**

### Who is most affected

| Group | Scale | Problem |
|---|---|---|
| Non-verbal / limited speech | ~7.6M Americans | Can't participate in talk therapy |
| Limited English speakers | ~25M in US | No therapist speaks their language |
| Immigrant workers (PEO-employed) | ~4.5M via PEOs | Insurance + language + cultural barriers at once |
| Children with autism / selective mutism | ~1M+ | Parents can't communicate how child feels to doctors |
| Solo mental health practices | ~180,000 practitioners | Denied claims, no legal resources to fight back |

**VoiceCanvas gives them all a voice — without words.**

---

---

# APP 1: VoiceCanvas (Patient-Facing)

**Route:** `/` → `/onboarding` → `/dashboard` → `/draw` → `/results` → `/find-doctor` → `/resources`

**Tone:** Warm, calm, safe, non-clinical. Never overwhelming. Feels like a trusted friend, not a hospital form.

**Design:** Soft backgrounds, large readable text, minimal words, visual-first.

---

## A1 — Landing Page (`/`)

### What it shows:
- Hero headline: **"Your drawings speak louder than words"**
- Subtext (1 sentence): *"Express how you feel — no words, no English needed"*
- Two primary CTAs:
  - **"Start Drawing"** → goes to onboarding
  - **"I'm a Clinician"** → goes to doctor app landing
- Small text link: "For Employers" → employer pitch section (same page, scrolls down)
- Background: subtle animated gradient (calm, slow-breathing orbs)
- No walls of text — judges should understand the product in 5 seconds

### Employer section (bottom of landing):
- Headline: *"Offer mental health care your employees can actually use"*
- 3 stat pills: $500B lost to untreated MH / 25M LEP workers in US / $2/employee/month
- How it works: Employee opens Gusto/Rippling benefits → launches VoiceCanvas → language + insurance pre-filled
- CTA: "Partner with us" (mock, just shows a toast "We'll be in touch")

### Status: Built (needs employer section added)

---

## A2 — Onboarding (`/onboarding`)

### Step 1: Language Selection
- Grid of flags + language names (show top 12, "more" expands)
- Languages: English, Spanish, Nepali, Mandarin, Hindi, Arabic, French, Portuguese, Tagalog, Vietnamese, Korean, Somali + more
- Selecting a language immediately switches all UI text to that language
- Stored in localStorage as `profile.language`

### Step 2: Camera Permission
- Show live webcam preview
- Clear explanation of why camera is needed (drawing, not surveillance)
- If denied: show fallback instructions, still allow mouse drawing

### Step 3: Gesture Calibration
- One by one, guide user through gestures:
  - "Hold up 1 finger" → green check when detected
  - "Hold up 2 fingers" → green check
  - "Hold up open hand" → green check
  - "Make a fist" → green check
- Visual hand illustration alongside webcam
- If gesture not detected in 5s: "Try again" with hint
- Builds confidence AND proves the tech works for judges

### Step 4: Quick Profile
- Name (optional — shown as "Friend" if skipped)
- Age range: Under 18 / 18–30 / 30–50 / 50+
- Communication level (used to tailor AI prompts + ElevenLabs voice style):
  - "I speak fluently"
  - "I can speak a little"
  - "I mostly don't speak"
  - "I cannot speak"
- Anything you want your doctor to know? (optional free text or skip)

### Step 5: Consent
- 3 bullet points maximum:
  - Your drawings are private
  - Nothing is shared without your tap
  - This is not a medical diagnosis
- Crisis line always displayed: "If you're in crisis, dial 988"
- "I understand, let's start" button → Dashboard

### Status: Built (needs language switching + gesture calibration step)

---

## A3 — Patient Dashboard (`/dashboard`)

### Top section:
- Greeting: "Good morning, [Name]" in patient's language
- **Mood tap row** — 5 colored circles (no text needed), patient taps one
  - Teal = calm, Yellow = anxious, Orange = frustrated, Red = distressed, Gray = numb
  - Mood saved to session log

### Caregiver prompt card (if parent uploaded a photo):
- Shows the uploaded photo
- Prompt below: "How does this make you feel? Draw it." (in patient's language)
- "Start drawing" button → goes to drawing session with photo as context

### Today's drawing prompt card:
- Visual icon + short text prompt (in patient's language)
- Examples: "Draw your safe place" / "Draw what's heavy today" / "Draw who you miss"
- Rotates daily, 5 prompts per day max

### Stress trajectory chart:
- Line chart of stress scores across all past sessions
- X-axis: dates, Y-axis: 0-10
- Color zones: green (0-4), yellow (5-7), red (8-10)
- If trending down: "You're making progress" badge
- If trending up: gentle suggestion to "Talk to your doctor"

### Past sessions:
- Thumbnail grid of past drawings
- Each shows: drawing image, date, short AI interpretation (1 line), stress score dot
- Tap any → expands to full SessionResults view with replay audio

### Footer:
- Crisis banner always visible: "In crisis? Call 988" (localized to language)
- "Find a Doctor" button
- "Find Free Care" button

### Status: Built (needs stress chart, caregiver photo prompt section)

---

## A4 — Drawing Session (`/draw`)

### Layout: Meeting-style, two-column

**Left column (large):**
- Live webcam feed (mirrored)
- Drawing canvas overlaid on top of webcam
- Recording dot (pulsing coral) — indicates session is being captured
- Canvas is transparent over webcam so user draws "on themselves"

**Right column (panels, stacked):**
- Gesture indicator (current gesture + what it means)
- Stamps panel (2=person, 3=tree, 4=heart; house/star/cloud = tap to place)
- Brain activity toggle (expandable panel)
- Sign language panel toggle (expandable panel)

**Top bar:**
- Session timer (counts up)
- Prompt text (in patient's language)
- Mode toggles: Draw / Sign

**Bottom bar (gesture hints):**
- Shown in patient's language
- "1 finger = draw | pinch = erase | 2 fingers = person | 3 = tree | 4 = heart | fist = clear | open hand = submit"

### Gesture controls (complete spec):
| Gesture | Action | Visual Feedback |
|---|---|---|
| 1 finger (index up) | Draw — glowing bezier line follows fingertip | Teal glow dot |
| Pinch (thumb + index close) | Erase — circular eraser at pinch point | Coral eraser ring |
| 2 fingers (peace sign) | Place Person stamp at finger midpoint | Violet flash |
| 3 fingers up | Place Tree stamp | Violet flash |
| 4 fingers up | Place Heart stamp | Sky blue flash |
| Fist (hold 2 seconds) | Clear canvas | Red countdown ring |
| Open hand (hold 1.5 seconds) | Submit → AI analysis | Lime glow, freeze canvas |
| No hand detected | Pause drawing | Gray indicator |

### Stamp assets (selectable by gesture or sidebar tap):
| Stamp | Gesture | Notes |
|---|---|---|
| Person | 2 fingers | Simple stick figure |
| Tree | 3 fingers | Triangle + trunk shape |
| Heart | 4 fingers | Classic heart outline |
| House | Tap in sidebar | Rectangle + triangle roof |
| Star | Tap in sidebar | 5-point star |
| Cloud | Tap in sidebar | Bumpy oval cloud |

### During session — background capture:
- Webcam frames sampled every 3 seconds
- Stored as base64 array in session object
- NOT shown to user — only available to doctor in replay
- Used by Claude for facial expression analysis on submission

### Status: Built (stamps, gestures, smoothing done; facial frame capture needed)

---

## A5 — AI Processing (between Draw and Results)

### What happens on submit:
1. Canvas frozen, gentle "Listening to your drawing..." animation
2. Canvas image captured as base64 (PNG)
3. Stored webcam frames sent alongside drawing (for facial analysis)
4. Claude API called with:
   - Drawing image
   - Session prompt
   - Patient language preference
   - Communication level
   - Past session context (stress trend, recurring themes)
5. Claude returns:

```json
{
  "personal_statement": "Text in patient's language",
  "personal_statement_en": "Same text in English",
  "feedback_short": "One-line warm response",
  "stress_score": 7.2,
  "crisis_flag": false,
  "indicators": {
    "isolation": true,
    "anxiety": true,
    "grief": false,
    "anger": false
  },
  "facial_analysis": {
    "dominant_affect": "masked depression",
    "emotional_arc": "suppression → tension → near-release → relief",
    "key_moments": [
      { "time": "0:45", "note": "Suppressed crying detected", "intensity": 0.8 },
      { "time": "1:30", "note": "Jaw tension released, emotional relief", "intensity": 0.4 }
    ],
    "cultural_note": "Emotional suppression pattern consistent with cultural context"
  },
  "clinical_note": {
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "..."
  },
  "insurance_data": {
    "chief_complaint": "...",
    "symptom_duration": "...",
    "functional_impairment": "...",
    "diagnosis_category": "..."
  }
}
```

6. Session object saved to localStorage

### Status: Built (needs patient language output + facial analysis prompt)

---

## A6 — Session Results (`/results`)

### Layout:

**Top:**
- Drawing thumbnail (patient's drawing)
- Prompt label

**Hero statement (large, centered):**
- Personal statement in patient's language
- Large, warm typography — this is the emotional center of the product

**Voice playback:**
- Auto-plays ElevenLabs TTS in patient's language on page load
- Voice: warm, calm, age-appropriate
- Controls: Play / Pause / Replay
- Language toggle: "Hear in English" switches to English TTS
- Fallback: browser speechSynthesis if ElevenLabs unavailable

**Stress score card:**
- Large number (e.g. "7.2") with color coding
- Label: "Moderate stress" / "High stress" / "Low stress" (in patient's language)
- Comparison to last session: "↓ from 8.1 last time"

**Indicators:**
- Pill tags: Isolation / Anxiety / Grief / Anger / Hope / etc.
- Color coded by type

**Crisis banner (conditional):**
- Appears if stress_score >= 8 OR crisis_flag = true
- Full-width, warm (not alarming) color
- Text: "It sounds like you're going through a lot. You don't have to face this alone."
- One-tap: Call 988 | Text HOME to 741741
- Available in patient's language

**Clinical note (collapsed by default):**
- Expandable SOAP accordion
- Download as PDF button

**Action buttons:**
- "Listen again" — replays voice
- "Share with my doctor" — marks session as shared; if no doctor connected, prompts to find one
- "Find a doctor" → Doctor Finder
- "Find free care" → Resource Finder
- "Draw again" → new session

### Status: Built (needs ElevenLabs, language toggle, crisis auto-surface, "share" button)

---

## A7 — Doctor Finder (`/find-doctor`)

### Search bar:
- Zip code input OR "Use my location" button
- Radius selector: 5 / 10 / 25 / 50 miles / Anywhere (telehealth)

### Filters (horizontal pill row):
- Language (dropdown, matches patient's profile language by default)
- Specialty: Anxiety / Trauma / Autism / Immigrant MH / Pediatric / General
- Insurance: Aetna / UHC / Cigna / BCBS / Medicaid / Sliding Scale / Self-Pay
- Availability: Telehealth / In-person / Both

### Doctor cards:
Each card shows:
- Name + credentials (LCSW / PhD / MD / LPC)
- Photo (avatar if no photo)
- Languages spoken (flags)
- Specialty tags
- Insurance accepted
- Distance + telehealth badge
- **"VoiceCanvas Compatible"** badge (green) — key differentiator; means this doctor uses the Clinic app
- Next available (mock)
- "Connect" button

### Connect flow:
- Patient taps Connect
- Confirmation: "Share your session history with Dr. [Name]?"
- On confirm: doctor gets a notification in Clinic app
- Patient's dashboard shows "Connected with Dr. [Name]"

### Data: Mock data (5-8 doctors for demo). Real implementation uses a curated network.

### Status: Not built

---

## A8 — Resource Finder (`/resources`)

### Crisis resources (always first, always visible):
- 988 Suicide & Crisis Lifeline — Call or text
- Crisis Text Line — Text HOME to 741741
- Localized crisis resource if patient's language is detected

### Location-based resources (Claude-powered):
- Free/sliding-scale mental health clinics
- Telehealth options with no-cost sessions
- Local government mental health grants
- Support groups

### Each resource card:
- Name, type badge (clinic / telehealth / crisis / grant)
- Address, phone, website
- "Free" or "Sliding scale $X–$Y" label
- Distance from patient's location

### Status: Built

---

## A9 — Live Session Mode (toggle inside `/draw`)

### Activation:
- Toggle in top bar: "Solo Practice" ↔ "Live Session (with doctor)"
- Switching to Live shows a note: "Your drawings will be spoken aloud in English for your doctor"

### Behavior in Live mode:
- All drawing/gesture features same as Solo
- After each submission → ElevenLabs speaks English version to the room (patient's speakers or headphones out)
- Patient still sees their language on screen
- Doctor hears English without looking at a screen
- Each exchange saved to shared session log visible in Clinic app in real time

### Status: Not built

---

## A10 — Caregiver / Parent View

### Access:
- Patient shares a "caregiver link" from their settings
- Caregiver opens link → sees limited view

### What caregiver can do:
- View session history: drawing thumbnails + AI interpretations
- See stress trajectory chart
- Upload photos as drawing prompts (these appear on patient's dashboard)
- Receive push/email alert if crisis_flag triggered (mock for demo — just show a UI state)

### What caregiver CANNOT see:
- Full SOAP clinical notes (patient privacy)
- Insurance information
- Doctor communication

### Status: Not built (photo upload is priority piece)

---

---

# APP 2: VoiceCanvas Clinic (Doctor-Facing)

**Route:** `/clinic` → `/clinic/dashboard` → `/clinic/patient/:id` → `/clinic/replay/:sessionId` → `/clinic/insurance` → `/clinic/reclaimant`

**Tone:** Professional, data-rich, efficient. Feels like a clinical SaaS product. Dense information, clean layout, dark header.

**Design:** White cards on gray background, teal brand accents, data tables, charts, clear CTAs.

---

## B1 — Clinic Landing (`/clinic`)

### What it shows:
- Header: VoiceCanvas Clinic logo + "For Mental Health Professionals"
- Value props (3 columns):
  - **For patients:** "Your non-verbal patients finally have a voice"
  - **For notes:** "AI writes your SOAP notes from session recordings"
  - **For insurance:** "Reclaimant recovers denied claims automatically"
- Stats bar: $35K avg annual recovery / 71% appeal win rate / 2× MH denial rate
- CTA: "Enter Clinic Dashboard" (demo: no auth required)

### Status: Not built (currently goes directly to dashboard)

---

## B2 — Clinic Dashboard (`/clinic/dashboard`)

### Top stats bar (4 cards):
- Active patients: N
- Total sessions analyzed: N
- Pending insurance actions: N (red badge if any)
- Recovered this quarter: $X,XXX (via Reclaimant)

### Patient list:
Each patient card shows:
- Name, language flag, communication level badge
- Session count
- Latest stress score + color-coded trend arrow (↑↓→)
- Last session date
- Alert badges:
  - 🔴 Crisis risk (stress ≥ 8 or crisis_flag)
  - 🟡 Clinical threshold met (stress ≥ 7 for 3+ sessions)
  - 🟢 Improving (stress dropping for 2+ sessions)
  - 🔵 Pending connection request (patient connected, not yet accepted)

### Actions from dashboard:
- Click patient → Patient Detail View
- "Accept" on pending connection requests
- Insurance quick-action: "1 pending claim" → click → Insurance page

### Filter/sort:
- Sort by: stress score, last session, name, alert priority
- Filter by: language, alert type, insurance status

### Status: Built (needs insurer dropdown, better alert badges, connection request flow)

---

## B3 — Patient Detail View (`/clinic/patient/:id`)

### Left panel — Session timeline:
- Scrollable list of all sessions (newest first)
- Each session: drawing thumbnail, date, stress score dot, duration
- Click any session → loads in right panel

### Right panel — Current session detail:
- **Drawing image** (full display)
- **Personal statement** — shown in both patient's language AND English
- **Play button** — ElevenLabs reads English clinical summary for doctor
- **SOAP note** — fully expanded, editable inline
  - Subjective / Objective / Assessment / Plan
  - "Edit" pencil on each field
  - "Save changes" button
- **Facial expression summary** (from session capture):
  - Dominant affect label
  - Emotional arc description
  - Key moment annotations
- **Stress score** with session comparison

### Session actions:
- **"Replay Session"** → goes to Session Replay
- **"Export FHIR JSON"** → downloads FHIR R4 formatted clinical data
- **"Download PDF"** → formatted clinical note PDF
- **"Submit to Insurance"** → opens Insurance flow for this patient

### Status: Built (needs ElevenLabs playback, facial analysis display, SOAP inline editing)

---

## B4 — Session Replay (`/clinic/replay/:sessionId`)

This is the most complex and impressive feature for judges.

### Layout:
Split screen, two columns:

**Left — Canvas replay:**
- Drawing canvas reconstructed stroke-by-stroke
- Plays at original drawing speed (so doctor feels the hesitation, speed, pressure)
- Scrubber bar at bottom to jump to any point
- Play / Pause / Restart controls
- Speed control: 0.5× / 1× / 2×

**Right — Webcam replay:**
- Patient's face (recorded frames, stitched into pseudo-video)
- AI facial expression overlay — colored regions on face:
  - Red tint = tension/distress
  - Blue tint = suppression
  - Green tint = relief/calm
- Timeline bar below showing emotional arc (same as described in patient story)

### Timeline annotations (below both panels):
- Horizontal bar with labeled markers at key emotional moments
- Doctor clicks any marker → both canvas and face panels jump to that moment
- Annotations:
  - "0:45 — Suppressed crying detected" (clickable)
  - "1:10 — Drawing pressure increased, frustration indicated"
  - "1:30 — Emotional release — jaw tension dropped"

### Notes panel (right side, alongside replay):
- Rich text editor
- Doctor types notes WHILE watching replay (no need to remember)
- Pre-populated with AI SOAP draft
- "Save Notes" → updates patient's clinical record

### Export:
- After notes saved: "Export PDF" or "Export FHIR"

### Status: Not built (largest remaining feature)

---

## B5 — Insurance Submission (`/clinic/insurance`)

### Step 1: Select Insurance Provider
Dropdown with:
- Aetna
- UnitedHealth
- Cigna
- Blue Cross Blue Shield
- Humana
- Medicaid (select state)
- Tricare
- Self-pay / No insurance
- Other (manual entry)

On selection, sidebar shows insurer-specific data:
- MH denial rate for this insurer (e.g., "UnitedHealth: 22%")
- Average appeal processing time
- Known MHPAEA violation patterns for this insurer
- "Win rate on appeals against this insurer: 71%"

### Step 2: Pre-Auth Form (auto-populated)
Sections:
1. **Clinical Information** (from AI analysis)
   - Chief complaint
   - Symptom duration
   - Functional impairment
   - Diagnosis category (ICD-10 suggested, not confirmed)
   - Requested service type: Therapy / Psychiatric eval / Both

2. **Patient Information**
   - Name, DOB, insurance ID, group number

3. **Provider Information**
   - Provider name, NPI number, practice address

4. **Session Evidence**
   - Auto-list of sessions: date, stress score, clinical threshold status
   - "X sessions documented, clinical threshold met Y times"

### Step 3: Parity Guard Analysis
- AI scans the form and selected insurer for MHPAEA violations
- Shows detected violations with severity (high / medium):
  - NQTL violations (documentation requirements)
  - Quantitative limit violations (session caps)
  - Medical necessity standard violations
- Each violation shows: type, description, federal code reference

### Step 4: Submit
- Mock submission (shows success screen)
- "Download PDF" option
- Triggers simulated denial option for Reclaimant demo

### Status: Built (needs insurer dropdown + insurer-specific content)

---

## B6 — Reclaimant Auto-Appeal (`/clinic/reclaimant`)

### Triggered by:
- Doctor clicks "Simulate Denial" (demo)
- OR real denial received (future: webhook from insurer)

### Step-by-step engine UI:

**Step 1 — Denial NLP Scan** (auto, shows result)
- Denial reason parsed
- Parity violation category identified
- "Triggered: MHPAEA § 712(c)(4) — medical necessity documentation standard"

**Step 2 — Precedent Database Match** (auto, shows result)
- Filtered to specific insurer (e.g., "Searching Aetna cases...")
- Shows matched cases:
  - Case name, year, outcome (Patient won / Settled)
  - Relevance reason
  - Win rate %
- Overall win probability shown prominently

**Step 3 — Generate Appeal Letter** (doctor triggers)
- Doctor clicks "Generate Appeal"
- Letter appears with:
  - Patient name, insurer, claim ID
  - MHPAEA violation citations (specific sections)
  - Session evidence summary (N sessions, stress scores, thresholds met)
  - Matched legal precedents
  - Demand: "Approve within 30 days per regulatory requirements"
- Doctor can edit any part inline
- Win probability shown: "Based on matched precedents: 71% appeal success rate"

**Step 4 — Submit Appeal** (doctor triggers)
- Mock submission
- Appeal tracker appears: Submitted → Under Review → Pending → Decision
- Estimated recovery shown: "$1,440 (12 sessions × $120)"

**Dashboard impact:**
- "Recovered this quarter" counter updates
- Patient card shows "Appeal submitted" status

### Status: Built (needs insurer-specific filtering)

---

---

# SHARED DATA MODEL

Both apps read/write from the same localStorage structure (demo) or API (production):

```javascript
// localStorage keys

profile: {
  name: string,
  language: string,          // 'en' | 'ne' | 'es' | 'zh' | etc.
  communicationLevel: string, // 'fluent' | 'limited' | 'mostly-no' | 'cannot'
  isNonverbal: boolean,
  connectedDoctorId: string | null,
  caregiverPhotos: string[],  // base64 images
}

sessions: [
  {
    id: string,
    timestamp: number,
    promptId: string,
    canvasImage: string,       // base64 PNG of drawing
    webcamFrames: string[],    // base64 frames sampled every 3s
    strokeData: [...],         // array of {x, y, t} for replay
    result: {
      personal_statement: string,
      personal_statement_en: string,
      stress_score: number,
      crisis_flag: boolean,
      indicators: {},
      facial_analysis: {},
      clinical_note: { subjective, objective, assessment, plan },
      insurance_data: {},
    },
    sharedWithDoctor: boolean,
    language: string,
  }
]

analytics: [
  {
    sessionId: string,
    stressScore: number,
    thresholdMet: boolean,
    timestamp: number,
  }
]
```

---

---

# TEAM TASK BREAKDOWN (5 People)

## Person 1: Patient App — Core Experience
**Owns:** Onboarding, Dashboard, Drawing Session, Results

### Tasks in priority order:
1. Add language selector to onboarding (Step 1) — store to `profile.language`
2. Add gesture calibration step to onboarding (Step 3)
3. Add stress trajectory chart to Dashboard (use localStorage sessions)
4. Wire **ElevenLabs** on SessionResults — auto-play personal statement on page load
5. Add language toggle on results: "Hear in English" button switches TTS
6. Add **crisis auto-surface** on results: if stress ≥ 8 or crisis_flag → show 988 banner
7. Add "Share with my doctor" button on results
8. Add caregiver photo prompt card on Dashboard

---

## Person 2: Doctor App — Dashboard + Patient Detail
**Owns:** Clinic Dashboard, Patient Detail View, SOAP editing

### Tasks in priority order:
1. Add **insurance provider dropdown** to ClinicianDashboard / InsuranceForm
2. Add insurer-specific copy in sidebar (denial rate, appeal time, violation patterns)
3. Add better alert badges to patient cards (crisis / threshold / improving)
4. Add "connection request" flow — patient connecting shows as pending on doctor side
5. Add ElevenLabs playback of clinical summary on Patient Detail view
6. Make SOAP note fields **inline editable** in Patient Detail (click to edit, save)
7. Add facial analysis summary card in Patient Detail view (from session data)
8. Connect Reclaimant to insurer-specific precedent filtering

---

## Person 3: Doctor App — Session Replay + Facial Analysis
**Owns:** Session Replay page, facial frame capture, emotional arc

### Tasks in priority order:
1. During DrawingSession, sample webcam frames every 3 seconds → store in session
2. Store stroke data `{x, y, timestamp}` for every draw point → store in session
3. Build Session Replay page:
   - Canvas replay: reconstruct strokes at original speed using stroke timestamps
   - Scrubber bar to jump to any time
   - Speed controls (0.5× / 1× / 2×)
4. Build webcam panel: stitch stored frames into pseudo-slideshow synced to timeline
5. Send webcam frames to Claude with prompt for facial expression analysis
6. Render emotional arc timeline with clickable annotation markers
7. Add notes editor alongside replay (rich text, pre-populated with AI SOAP)
8. Wire export: save notes → update patient record → FHIR / PDF export

---

## Person 4: Doctor Finder + Live Session + Multilingual
**Owns:** Doctor Finder page, Live Session mode, multilingual Claude prompts

### Tasks in priority order:
1. Build **Doctor Finder page** (`/find-doctor`):
   - Zip/location input
   - Mock doctor cards (8 doctors with realistic data)
   - Filter by language, specialty, insurance, telehealth, VoiceCanvas badge
   - "Connect" button → stores connectedDoctorId, shows on patient dashboard
2. Build **Live Session toggle** in DrawingSession:
   - Toggle "Solo" ↔ "Live Session" in top bar
   - In Live mode: after each submission, ElevenLabs speaks English interpretation aloud
   - Patient's screen still shows their language
   - Each exchange saved to shared session log
3. Update Claude prompts to output **both patient language AND English**:
   - Add `personal_statement` (in `profile.language`) and `personal_statement_en` (always English)
   - Update ElevenLabs calls to use correct language code
4. Build **caregiver photo upload**:
   - Simple file upload on Dashboard (if linked as caregiver)
   - Stores photo in `profile.caregiverPhotos[]`
   - Appears as prompt card on patient's dashboard

---

## Person 5: Clinic Landing + PEO Section + Insurance UX + Polish
**Owns:** Clinic landing page, PEO landing section, insurance provider UX, overall polish

### Tasks in priority order:
1. Build **Clinic Landing page** (`/clinic`):
   - Professional tone, value props, stats bar
   - "Enter Clinic Dashboard" CTA
   - No auth required for demo
2. Add **"For Employers" section** to Patient Landing page:
   - Value prop, how it works, $2/employee pricing
   - "Partner with us" mock CTA (shows toast)
3. Improve **InsuranceForm UX**:
   - Move insurance flow to be clinician-primary (not patient-primary)
   - Add insurer selector as Step 1 (before form renders)
   - Update Parity Guard to use insurer-specific copy
   - Add session evidence summary section to form
4. Improve **Reclaimant UX**:
   - Filter precedent matching by selected insurer
   - Show insurer-specific stats throughout
5. Add **session trajectory chart** to both patient dashboard and clinician patient detail
6. Overall CSS polish: fix any inconsistencies between pages, ensure all colors/spacing are consistent
7. Write **demo script polish** — prepare the Raju walkthrough for presentation

---

---

# DEMO SCRIPT (3 Minutes for Judges)

> *"Meet Raju. He's 28. He moved from Kathmandu to Dallas 8 months ago. He works at a warehouse. He hasn't slept properly in months. He hears his father's voice telling him he failed. He wants help — but he can't explain how he feels in English. And in Nepali culture, you don't talk about these things.*
>
> *But he can draw."*

---

**[Patient App — 90 seconds]**

1. Open VoiceCanvas → picks **Nepali** → UI switches to Nepali
2. Gesture calibration: "1 finger... ✓ 2 fingers... ✓ open hand... ✓"
3. Drawing session: draws a small figure, dark scribbles above the head, a bed at 3 AM
4. Holds open hand 1.5 seconds → canvas freezes → "Listening to your drawing..."
5. **ElevenLabs speaks in Nepali** — warm voice, 2 sentences
   - *[Pause. Let it land. Judges will feel it.]*
6. Stress score: 7.8 / 10. Crisis banner appears: "988 — available in Nepali"
7. Toggle "Hear in English" → plays English version
8. Tap "Find a Doctor" → Dr. Priya Sharma (bilingual, VoiceCanvas compatible)
9. Tap "Connect" → "Session shared with Dr. Sharma"

---

**[Switch to Clinic App — 90 seconds]**

10. Dr. Sharma opens Clinic Dashboard → Raju's card: stress 7.8 ↑, crisis flag
11. Clicks Session Replay → watches Raju's drawing build stroke by stroke
12. Right panel shows Raju's face — timeline bar annotated: "0:45 — suppressed emotion detected"
13. Dr. Sharma types notes in the notes panel alongside replay
14. SOAP note pre-generated → she edits one line → "Save"
15. Clicks "Submit Insurance" → selects UnitedHealth → form auto-fills → submits
16. "Claim Denied" — Reclaimant activates
17. 3 UnitedHealth precedents matched, 71% win rate shown
18. "Generate Appeal" → letter appears, citing Raju's 5 sessions as evidence
19. "Submit Appeal" → tracker: Submitted ✓

---

> *"In under 3 minutes: Raju expressed himself for the first time in his life. He heard his feelings spoken in his own language. He connected with a doctor. That doctor had everything she needed to treat him and fight for his insurance — without Raju ever saying a word."*

---

---

# TECH STACK

```
Patient App + Clinic App (shared codebase)
├── React 19 (Vite)
├── React Router (client-side routing, /clinic/* for doctor app)
├── Framer Motion (page + component animations)
└── Custom CSS design system
    ├── Patient palette: warm teal, coral, soft backgrounds
    └── Clinic palette: professional, data-dense, white cards on gray

Drawing / Gestures
├── MediaPipe Hands (@mediapipe/tasks-vision) — hand landmark detection
├── HTML5 Canvas API — drawing, stamps, bezier smoothing
└── Webcam frame capture — sampled every 3s during session

AI
├── Claude API (Anthropic)
│   ├── Vision: drawing image → personal statement + SOAP + stress score
│   ├── Multilingual: outputs in patient language + English
│   ├── Facial: webcam frames → emotional arc analysis
│   └── Resources: location → nearby free care options
└── ElevenLabs API
    ├── Patient voice: speaks personal statement in patient's language
    ├── Doctor voice: speaks English clinical summary in clinic app
    └── Live session: speaks English in real-time after each drawing

Utilities
├── jsPDF — clinical PDF, insurance form PDF
├── Browser Geolocation — doctor finder + resource finder
└── localStorage — all session + profile data (demo scope)

Distribution (pitch only)
└── PEO API (Gusto, Rippling, Deel) — employee benefits portal integration
```

---

# REVENUE MODEL

| Stream | Who Pays | How | Est. Value |
|---|---|---|---|
| Clinician SaaS | Solo therapists / practices | $50/month per clinician | $600/yr per seat |
| Reclaimant | Same clinicians | 10% of recovered claim OR $99 flat | $144–$3,500 per appeal |
| PEO benefit | Employer via PEO | $2/employee/month | Scales with headcount |
| VoiceCanvas Network | Therapists wanting referrals | Premium directory listing | $29/month |

---

# FEATURE STATUS SUMMARY

| # | Feature | App | Status | Owner |
|---|---|---|---|---|
| 1 | Language selection + UI switch | Patient | Partial | Person 1 |
| 2 | Gesture calibration in onboarding | Patient | Not built | Person 1 |
| 3 | Stress trajectory chart | Patient + Clinic | Not built | Person 1 / 5 |
| 4 | ElevenLabs on SessionResults | Patient | Not built | Person 1 |
| 5 | Language toggle (patient ↔ English) | Patient | Not built | Person 1 |
| 6 | Crisis auto-surface on results | Patient | Not built | Person 1 |
| 7 | "Share with my doctor" button | Patient | Not built | Person 1 |
| 8 | Caregiver photo upload + prompt card | Patient | Not built | Person 4 |
| 9 | Insurance provider dropdown | Clinic | Not built | Person 2 |
| 10 | Insurer-specific copy + Parity Guard | Clinic | Not built | Person 2 / 5 |
| 11 | Alert badges on patient cards | Clinic | Partial | Person 2 |
| 12 | Doctor connection request flow | Both | Not built | Person 2 / 4 |
| 13 | SOAP inline editing | Clinic | Not built | Person 2 |
| 14 | Facial analysis display in detail | Clinic | Not built | Person 2 |
| 15 | Webcam frame capture during session | Patient | Not built | Person 3 |
| 16 | Stroke data capture for replay | Patient | Not built | Person 3 |
| 17 | Session Replay page (full) | Clinic | Not built | Person 3 |
| 18 | Facial expression timeline + overlays | Clinic | Not built | Person 3 |
| 19 | Notes editor alongside replay | Clinic | Not built | Person 3 |
| 20 | Doctor Finder page | Patient | Not built | Person 4 |
| 21 | Live Session mode | Patient | Not built | Person 4 |
| 22 | Multilingual Claude prompts | Both | Not built | Person 4 |
| 23 | Clinic landing page | Clinic | Not built | Person 5 |
| 24 | PEO / employer section on landing | Patient | Not built | Person 5 |
| 25 | Insurance UX improvements | Clinic | Partial | Person 5 |
| 26 | Reclaimant insurer filtering | Clinic | Partial | Person 5 |
| 27 | Demo polish + CSS consistency | Both | Ongoing | Person 5 |

---

# NON-FEATURES (Out of Scope for Hackathon)

- Real insurer API integration (Aetna, BCBS, etc.)
- Real EHR integration (Epic, Cerner)
- HIPAA compliance (demo only — disclaimer must be shown)
- Mobile support (desktop Chrome / Edge only)
- Real PEO API integration
- User authentication / accounts (localStorage only)
- Real doctor directory (mock 8 cards)
- Multi-device sync
- Video calling built-in (user uses external tool alongside VoiceCanvas)

---

# RISK REGISTER

| Risk | Likelihood | Mitigation |
|---|---|---|
| MediaPipe gesture accuracy | Medium | Calibration step proves it works; mouse fallback available |
| ElevenLabs latency | Low | Show loading state; cache audio; browser TTS as fallback |
| Claude misinterprets drawing | Medium | Text input fallback; "Edit my statement" option on results |
| Camera permission denied | Low | Clear instructions + fallback to mouse drawing mode |
| Facial expression accuracy | Medium | Frame as "AI-assisted observation" not diagnostic |
| Session replay feels fake | Medium | Use real stroke timestamps + real webcam frames |
| 5-person coordination | High | This doc. Clear ownership per person. No overlapping routes. |

---

*Built for Nepal–US Hackathon 2026 · Mental Health Theme*
*Demo only — not a medical device. Not HIPAA compliant. Not for clinical use.*
