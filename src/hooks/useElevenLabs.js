import { useState, useCallback, useRef } from 'react';

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

  const makeRequest = async (url, options, timeoutMs = 30000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('Request timed out');
      throw err;
    }
  };

  const playAudioBlob = useCallback((blob) => {
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

    return audio.play();
  }, [volume, isMuted]);

  const speak = useCallback(async (text) => {
    setLoading(true);
    setError(null);

    // Try server proxy first
    try {
      const response = await makeRequest('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: selectedVoice.id }),
      });
      if (response.ok) {
        const blob = await response.blob();
        await playAudioBlob(blob);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Voice proxy unavailable:', err);
      setError('Voice playback failed. Using browser voice.');
      setLoading(false);
      browserSpeak(text, volume, isMuted);
    }
  }, [selectedVoice, volume, isMuted, playAudioBlob]);

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
