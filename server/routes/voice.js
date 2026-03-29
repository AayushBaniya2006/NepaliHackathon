import { Router } from 'express';

const router = Router();

function resolveElevenLabsKey() {
  const candidates = [
    process.env.ELEVENLABS_API_KEY,
    process.env.ELEVEN_LABS_API_KEY,
    process.env.VITE_ELEVENLABS_API_KEY,
    process.env.VITE_ELEVEN_LABS_API_KEY,
  ];
  for (const k of candidates) {
    const t = k?.trim();
    if (t) return t;
  }
  return '';
}

/** Client may request a model per utterance. eleven_v3 = 70+ langs incl. Nepali (nep); v2/Flash omit Nepali per ElevenLabs docs. */
const ALLOWED_TTS_MODELS = new Set([
  'eleven_v3',
  'eleven_flash_v2_5',
  'eleven_turbo_v2_5',
  'eleven_multilingual_v2',
  'eleven_turbo_v2',
]);

function resolveModelId(requested) {
  const t = typeof requested === 'string' ? requested.trim() : '';
  if (t && ALLOWED_TTS_MODELS.has(t)) return t;
  // Default v3 so Nepali (language_code ne) works when the client omits modelId; override with ELEVENLABS_MODEL_ID if needed.
  const env = (process.env.ELEVENLABS_MODEL_ID || 'eleven_v3').trim();
  return ALLOWED_TTS_MODELS.has(env) ? env : 'eleven_v3';
}

router.post('/speak', async (req, res) => {
  const apiKey = resolveElevenLabsKey();
  if (!apiKey) {
    return res.status(500).json({
      error: 'ElevenLabs API key not configured. Set ELEVENLABS_API_KEY (or ELEVEN_LABS_API_KEY / VITE_ELEVEN_LABS_API_KEY) in server .env.',
    });
  }

  try {
    const { text, voiceId, modelId: clientModelId, languageCode } = req.body;
    // eleven_v3 max ~5k chars; other models allow more — keep a safe cap
    if (!text || typeof text !== 'string' || text.length > 10000) {
      return res.status(400).json({ error: 'Invalid text input' });
    }
    const allowedVoices = ['EXAVITQu4vr4xnSDxMaL', '21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlld'];
    const vid = allowedVoices.includes(voiceId) ? voiceId : allowedVoices[0];

    const model_id = resolveModelId(clientModelId);
    const textForModel =
      model_id === 'eleven_v3' && text.length > 5000 ? text.slice(0, 5000) : text;

    const lc = typeof languageCode === 'string' && /^[a-z]{2}$/i.test(languageCode)
      ? languageCode.toLowerCase()
      : null;

    // v3: Nepali must be `ne` in the REST API (`nep` returns unsupported_language).
    const languageCodeForApi = lc;

    const buildBody = (includeLangCode) => {
      const body = {
        text: textForModel,
        model_id,
        voice_settings: { stability: 0.75, similarity_boost: 0.75 },
      };
      if (includeLangCode && languageCodeForApi) body.language_code = languageCodeForApi;
      return body;
    };

    let response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(buildBody(true)),
    });

    // Some models reject unknown language_code; retry without it
    if (!response.ok && languageCodeForApi) {
      const detail = await response.text().catch(() => '');
      if (response.status === 422 || /language/i.test(detail)) {
        response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify(buildBody(false)),
        });
      } else {
        console.error('ElevenLabs HTTP', response.status, detail?.slice(0, 400));
        return res.status(502).json({ error: 'ElevenLabs request failed', status: response.status });
      }
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('ElevenLabs HTTP', response.status, detail?.slice(0, 400));
      return res.status(502).json({ error: 'ElevenLabs request failed', status: response.status });
    }

    res.set('Content-Type', 'audio/mpeg');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Voice error:', err);
    res.status(500).json({ error: 'Voice generation failed. Please try again.' });
  }
});

export default router;
