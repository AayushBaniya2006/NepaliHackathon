import { Router } from 'express';

const router = Router();

router.post('/speak', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });

  try {
    const { text, voiceId } = req.body;
    if (!text || typeof text !== 'string' || text.length > 5000) {
      return res.status(400).json({ error: 'Invalid text input' });
    }
    const allowedVoices = ['EXAVITQu4vr4xnSDxMaL', '21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlld'];
    const vid = allowedVoices.includes(voiceId) ? voiceId : allowedVoices[0];

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.75, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) return res.status(response.status).json({ error: 'ElevenLabs error' });

    res.set('Content-Type', 'audio/mpeg');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Voice error:', err);
    res.status(500).json({ error: 'Voice generation failed. Please try again.' });
  }
});

export default router;
