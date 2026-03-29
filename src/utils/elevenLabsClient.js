/**
 * Direct ElevenLabs REST calls from the browser (Vercel static / no Node backend).
 * Set VITE_ELEVENLABS_API_KEY in Vercel env — the key is embedded in the client bundle (public).
 * For production, prefer a serverless proxy to hide the key.
 */

const DEFAULT_VOICE = 'EXAVITQu4vr4xnSDxMaL';
const ALLOWED_VOICES = new Set([
  'EXAVITQu4vr4xnSDxMaL',
  '21m00Tcm4TlvDq8ikWAM',
  'AZnzlk1XvdvUeBnXmlld',
]);

const ALLOWED_MODELS = new Set([
  'eleven_v3',
  'eleven_flash_v2_5',
  'eleven_turbo_v2_5',
  'eleven_multilingual_v2',
  'eleven_turbo_v2',
]);

export function getElevenLabsKeyFromEnv() {
  const k =
    import.meta.env.VITE_ELEVENLABS_API_KEY ||
    import.meta.env.VITE_ELEVEN_LABS_API_KEY ||
    '';
  return String(k).trim();
}

export function isElevenLabsClientConfigured() {
  return Boolean(getElevenLabsKeyFromEnv());
}

function resolveModelId(requested) {
  const t = typeof requested === 'string' ? requested.trim() : '';
  if (t && ALLOWED_MODELS.has(t)) return t;
  const env = (
    import.meta.env.VITE_ELEVENLABS_MODEL_ID ||
    import.meta.env.VITE_TTS_PATIENT_MODEL_ID ||
    'eleven_v3'
  ).trim();
  return ALLOWED_MODELS.has(env) ? env : 'eleven_v3';
}

/**
 * @param {{ text: string, voiceId?: string, modelId?: string, languageCode?: string }} p
 * @returns {Promise<Response>}
 */
export async function elevenLabsTtsDirect(p) {
  const apiKey = getElevenLabsKeyFromEnv();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'VITE_ELEVENLABS_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { text, voiceId, modelId: clientModelId, languageCode } = p;
  if (!text || typeof text !== 'string' || text.length > 10000) {
    return new Response(JSON.stringify({ error: 'Invalid text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const vid = ALLOWED_VOICES.has(voiceId) ? voiceId : DEFAULT_VOICE;
  const model_id = resolveModelId(clientModelId);
  const textForModel =
    model_id === 'eleven_v3' && text.length > 5000 ? text.slice(0, 5000) : text;

  const lc =
    typeof languageCode === 'string' && /^[a-z]{2}$/i.test(languageCode)
      ? languageCode.toLowerCase()
      : null;

  const buildBody = (includeLangCode) => {
    const body = {
      text: textForModel,
      model_id,
      voice_settings: { stability: 0.75, similarity_boost: 0.75 },
    };
    if (includeLangCode && lc) body.language_code = lc;
    return body;
  };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${vid}`;

  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify(buildBody(true)),
  });

  if (!response.ok && lc) {
    const detail = await response.clone().text().catch(() => '');
    if (response.status === 422 || /language/i.test(detail)) {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify(buildBody(false)),
      });
    }
  }

  return response;
}

