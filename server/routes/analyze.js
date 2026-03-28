import { Router } from 'express';

const router = Router();

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const ANALYSIS_SYSTEM_PROMPT = `You are a clinical art therapy analysis AI. Analyze the drawing for clinical markers:
- Color histogram: estimate red%, black%, warm/cool distribution
- Line pressure: heavy/medium/light
- Size/placement: isolation indicators (0-5 scale)
- Symbols: storms, darkness, somatic markers, hearts, houses
- Composition: chaos vs order

Output ONLY valid JSON with this exact structure:
{
  "stress_score": <number 1-10>,
  "indicators": { "red_pct": <0-100>, "black_pct": <0-100>, "isolation": <0-5>, "somatic": <boolean>, "line_pressure": "<heavy|medium|light>", "placement": "<centered|corner|scattered|bottom>", "dominant_mood": "<anxious|sad|angry|fearful|calm|mixed>" },
  "pattern": "<1-2 sentence clinical description>",
  "threshold_met": <boolean, true if score >= 7>,
  "feedback_emoji": "<single emoji>",
  "feedback_short": "<warm 10-word feedback>",
  "personal_statement": "<2-3 sentence warm personal interpretation>",
  "clinical_note": { "S": "<subjective>", "O": "<objective>", "A": "<assessment>", "P": "<plan>" },
  "diagnosis": "<ICD-10 code>",
  "insurance_data": { "chief_complaint": "<string>", "symptom_duration": "<string>", "functional_impairment": "<string>", "diagnosis_category": "<string>", "requested_service": "<string>" }
}`;

router.post('/drawing', async (req, res) => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' });

  try {
    const { imageBase64, promptId, promptLabel } = req.body;
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64Data } },
            { type: 'text', text: `Analyze this nonverbal patient's "${promptLabel || promptId}" drawing for clinical stress indicators. Return ONLY the JSON.` },
          ],
        }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content?.[0]?.text || '';
    try {
      const result = JSON.parse(text);
      res.json(result);
    } catch {
      res.json({ raw: text });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sign', async (req, res) => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' });

  try {
    const { frameBase64 } = req.body;
    const base64Data = frameBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64Data } },
            { type: 'text', text: 'Identify any ASL sign in this frame. Return JSON: { "recognized": boolean, "sign": "word", "confidence": "high|medium|low", "description": "brief" }' },
          ],
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    try { res.json(JSON.parse(text)); } catch { res.json({ recognized: false }); }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sign-message', async (req, res) => {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' });

  try {
    const { signedWords } = req.body;
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `A nonverbal person signed these words: ${signedWords.join(', ')}. Interpret as a mental health communication. Return JSON with: personal_statement, clinical_note {S,O,A,P}, stress_score (1-10), indicators, insurance_data.`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    try { res.json(JSON.parse(text)); } catch { res.json({ raw: text }); }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
