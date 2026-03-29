import { Router } from 'express';

const router = Router();

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o';

function validateBase64(str, maxSizeMB = 5) {
  if (typeof str !== 'string') return false;
  const sizeBytes = (str.length * 3) / 4;
  return sizeBytes < maxSizeMB * 1024 * 1024;
}

/** Accept raw base64 or full data URL; return a data URL OpenAI accepts */
function toDataImageUrl(input) {
  if (typeof input !== 'string') return null;
  if (input.startsWith('data:image/')) return input;
  const cleaned = input.replace(/^data:image\/\w+;base64,/, '');
  return `data:image/png;base64,${cleaned}`;
}

function parseAssistantJson(text) {
  if (!text || typeof text !== 'string') return null;
  let t = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m.exec(t);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

async function openaiChat(apiKey, { system, userContent, maxTokens = 1500 }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: userContent });

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: maxTokens,
      messages,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data.error?.message || response.statusText || 'OpenAI request failed';
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }
  if (data.error) {
    const msg = data.error.message || 'OpenAI request failed';
    const err = new Error(msg);
    err.status = response.status || 500;
    throw err;
  }
  return data.choices?.[0]?.message?.content?.trim() || '';
}

const ANALYSIS_SYSTEM_PROMPT = `You are a clinical art therapy analysis AI. Analyze the drawing for clinical markers:
- Color histogram: estimate red%, black%, warm/cool distribution
- Line pressure: heavy/medium/light
- Size/placement: isolation indicators (0-5 scale)
- Symbols: storms, darkness, somatic markers, hearts, houses
- Composition: chaos vs order

NARRATIVE (most important for the patient):
- personal_statement and personal_statement_en must be a short, vivid first-person story (2-4 sentences), not a list of symptoms. Write as if the patient is speaking: concrete sensory detail from the drawing (colors, shapes, space), a clear emotional arc (e.g. weight → small relief, or chaos → one steady thing), and warm authenticity. Avoid clichés, clinical labels, and generic phrases like "I feel stressed" without imagery tied to what you see in the image.

Output ONLY valid JSON with this exact structure:
{
  "stress_score": <number 1-10>,
  "indicators": { "red_pct": <0-100>, "black_pct": <0-100>, "isolation": <0-5>, "somatic": <boolean>, "line_pressure": "<heavy|medium|light>", "placement": "<centered|corner|scattered|bottom>", "dominant_mood": "<anxious|sad|angry|fearful|calm|mixed>" },
  "pattern": "<1-2 sentence clinical description>",
  "threshold_met": <boolean, true if score >= 7>,
  "feedback_emoji": "<single emoji>",
  "feedback_short": "<warm 10-word feedback>",
  "personal_statement": "<2-4 sentence first-person narrative in the patient's language — story-like, grounded in the drawing>",
  "personal_statement_en": "<same narrative meaning in fluent English for the clinician>",
  "clinical_note": { "S": "<subjective>", "O": "<objective>", "A": "<assessment>", "P": "<plan>" },
  "diagnosis": "<ICD-10 code>",
  "insurance_data": { "chief_complaint": "<string>", "symptom_duration": "<string>", "functional_impairment": "<string>", "diagnosis_category": "<string>", "requested_service": "<string>" }
}`;

router.post('/drawing', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    const { imageBase64, promptId, promptLabel, language, emotionTimeline } = req.body;
    if (!imageBase64 || !validateBase64(imageBase64)) {
      return res.status(400).json({ error: 'Invalid or oversized image data' });
    }
    if (promptLabel && promptLabel.length > 200) {
      return res.status(400).json({ error: 'Prompt label too long' });
    }
    const imageUrl = toDataImageUrl(imageBase64);
    if (!imageUrl) return res.status(400).json({ error: 'Invalid image data' });

    // Language mapping for GPT-4o
    const langMap = {
      ne: 'Nepali',
      es: 'Spanish',
      zh: 'Mandarin Chinese',
      hi: 'Hindi',
      ar: 'Arabic',
      fr: 'French',
      pt: 'Portuguese',
      tl: 'Tagalog',
      vi: 'Vietnamese',
      ko: 'Korean',
      so: 'Somali',
      en: 'English',
    };
    const patientLanguage = langMap[language] || 'English';

    // Build user text with emotion context if available
    let userText = `Analyze this nonverbal patient's "${promptLabel || promptId}" drawing for clinical stress indicators.`;

    if (emotionTimeline && emotionTimeline.length > 0) {
      const emotionSummary = emotionTimeline.map(e => e.emotion).join(', ');
      userText += ` Facial emotions detected during session: ${emotionSummary}.`;
    }

    userText += `\n\nIMPORTANT: Generate personal_statement in ${patientLanguage}, and personal_statement_en in English. Make both read as one coherent narrative (same emotional beats); personal_statement_en must faithfully mirror personal_statement. Return ONLY the JSON.`;

    if (language === 'ne') {
      userText += `

CRITICAL NEPALI (ne) RULES:
- personal_statement MUST be natural, literary Nepali written ONLY in Devanagari script (Unicode). Do NOT write Nepali in Latin letters.
- Aim for idiomatic, emotionally resonant phrasing — like spoken testimony, not a form — while staying tied to what appears in the drawing.
- personal_statement_en MUST be a fluent English translation of the same meaning (for the clinician).
- pattern, feedback_short, clinical_note, and insurance fields may remain in English for clinical records.`;
    }

    const userContent = [
      { type: 'image_url', image_url: { url: imageUrl } },
      { type: 'text', text: userText },
    ];

    const text = await openaiChat(apiKey, {
      system: ANALYSIS_SYSTEM_PROMPT,
      userContent,
      maxTokens: 1500,
    });

    const parsed = parseAssistantJson(text);
    if (parsed) return res.json(parsed);
    return res.json({ raw: text });
  } catch (err) {
    console.error('Analysis error:', err);
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
});

const SIGN_USER_INSTRUCTION = 'Identify any ASL sign in this frame. Return JSON: { "recognized": boolean, "sign": "word", "confidence": "high|medium|low", "description": "brief" }';

router.post('/sign', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    const frame = req.body.frameBase64 ?? req.body.imageBase64;
    if (!frame || !validateBase64(frame)) {
      return res.status(400).json({ error: 'Invalid or oversized frame data' });
    }
    const imageUrl = toDataImageUrl(frame);
    if (!imageUrl) return res.status(400).json({ error: 'Invalid frame data' });

    const userContent = [
      { type: 'image_url', image_url: { url: imageUrl } },
      { type: 'text', text: SIGN_USER_INSTRUCTION },
    ];

    const text = await openaiChat(apiKey, {
      system: 'You assist with ASL and gesture recognition for accessibility. Reply with only valid JSON, no markdown.',
      userContent,
      maxTokens: 256,
    });

    const parsed = parseAssistantJson(text);
    if (parsed) return res.json(parsed);
    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.json({ recognized: false });
    }
  } catch (err) {
    console.error('Analysis error:', err);
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
});

router.post('/sign-message', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    const { signedWords } = req.body;
    if (!signedWords || !Array.isArray(signedWords) || signedWords.length > 100) {
      return res.status(400).json({ error: 'Invalid signed words' });
    }

    const userText = `A nonverbal person signed these words: ${signedWords.join(', ')}. Interpret as a mental health communication. Return JSON with: personal_statement, clinical_note {S,O,A,P}, stress_score (1-10), indicators, insurance_data. Return ONLY valid JSON, no markdown.`;

    const text = await openaiChat(apiKey, {
      system: 'You are an empathetic mental health communication assistant. Output only valid JSON.',
      userContent: userText,
      maxTokens: 1024,
    });

    const parsed = parseAssistantJson(text);
    if (parsed) return res.json(parsed);
    return res.json({ raw: text });
  } catch (err) {
    console.error('Analysis error:', err);
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
});

export default router;
