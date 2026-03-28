import { useState, useCallback, useRef } from 'react';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm & gentle' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm & clear' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Soft & kind' },
];

export function useElevenLabs() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const speak = useCallback(async (text) => {
    setLoading(true);
    setError(null);

    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      // Fallback to browser TTS
      setLoading(false);
      browserSpeak(text, volume, isMuted);
      return;
    }

    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/${selectedVoice.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.5,
          },
        }),
      });

      if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`);

      const blob = await response.blob();
      
      // Clean up previous audio
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      
      const audio = new Audio(url);
      audio.volume = isMuted ? 0 : volume;
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);

      await audio.play();
      setLoading(false);
    } catch (err) {
      console.error('ElevenLabs error:', err);
      setError('Voice playback failed. Using browser voice.');
      setLoading(false);
      browserSpeak(text, volume, isMuted);
    }
  }, [selectedVoice, volume, isMuted]);

  const replay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.play();
    }
  }, [volume, isMuted]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    window.speechSynthesis?.cancel();
  }, []);

  const updateVolume = useCallback((v) => {
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : v;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : volume;
      }
      return next;
    });
  }, [volume]);

  return {
    speak,
    replay,
    stop,
    isPlaying,
    loading,
    error,
    voices: VOICES,
    selectedVoice,
    setSelectedVoice,
    volume,
    updateVolume,
    isMuted,
    toggleMute,
  };
}

function browserSpeak(text, volume, muted) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = muted ? 0 : volume;
  // Try to select a female voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google UK English Female'));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}
