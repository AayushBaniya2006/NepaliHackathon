import { useState, useCallback, useRef } from 'react';

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm & gentle' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm & clear' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Soft & kind' },
];

/**
 * @typedef {Object} SpeakOptions
 * @property {string} [voiceId] - ElevenLabs voice id
 * @property {string} [modelId] - e.g. eleven_multilingual_v2 for Nepali / mixed languages
 * @property {string} [browserLang] - BCP-47 for speechSynthesis fallback (e.g. ne-NP)
 * @property {string} [languageCode] - ISO 639-1 for ElevenLabs (e.g. ne)
 */

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
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;

    const audio = new Audio(url);
    audio.playsInline = true;
    audio.setAttribute('playsinline', '');
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    audio.onended = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);

    return audio.play();
  }, [volume, isMuted]);

  /**
   * @param {string} text
   * @param {SpeakOptions} [opts]
   * @returns {Promise<boolean>} true if ElevenLabs audio played
   */
  const speak = useCallback(async (text, opts = {}) => {
    setLoading(true);
    setError(null);

    const voiceId = opts.voiceId ?? selectedVoice.id;
    const payload = { text, voiceId };
    if (opts.modelId) payload.modelId = opts.modelId;
    if (opts.languageCode) payload.languageCode = opts.languageCode;

    try {
      const response = await makeRequest('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const blob = await response.blob();
        try {
          await playAudioBlob(blob);
          setLoading(false);
          return true;
        } catch (playErr) {
          setLoading(false);
          if (playErr?.name === 'NotAllowedError') {
            setError('Audio is ready — if you hear nothing, tap Play (browser blocked autoplay).');
            return false;
          }
          console.warn('TTS play failed:', playErr);
          setError('Could not play audio. Using browser voice.');
          browserSpeak(text, volume, isMuted, opts.browserLang || 'en-US');
          return false;
        }
      }

      const errTxt = await response.text().catch(() => '');
      console.warn('TTS HTTP', response.status, errTxt?.slice(0, 200));
      setError('Cloud voice unavailable. Using your browser voice.');
      setLoading(false);
      browserSpeak(text, volume, isMuted, opts.browserLang || 'en-US');
      return false;
    } catch (err) {
      console.error('TTS request failed:', err);
      setError(err?.message?.includes('timed out') ? 'Voice request timed out.' : 'Voice request failed. Using browser voice.');
      setLoading(false);
      browserSpeak(text, volume, isMuted, opts.browserLang || 'en-US');
      return false;
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

function browserSpeak(text, volume, muted, lang = 'en-US') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const loadVoices = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = muted ? 0 : volume;
    utterance.lang = lang;

    const voices = window.speechSynthesis.getVoices();
    const primary = lang.split('-')[0].toLowerCase();
    const match =
      voices.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase())) ||
      voices.find(v => v.lang.toLowerCase().startsWith(`${primary}-`)) ||
      voices.find(v => v.lang.toLowerCase().startsWith(primary));
    if (match) utterance.voice = match;

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length) {
    loadVoices();
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}
