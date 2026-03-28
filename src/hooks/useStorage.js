import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEYS = {
  USER_PROFILE: 'mc_user_profile',
  SESSIONS: 'mc_sessions',
  ANALYTICS: 'mc_analytics',
  ONBOARDED: 'mc_onboarded',
};

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

export function useStorage() {
  const [profile, setProfileState] = useState(() =>
    safeGet(STORAGE_KEYS.USER_PROFILE, null)
  );
  const [sessions, setSessionsState] = useState(() =>
    safeGet(STORAGE_KEYS.SESSIONS, [])
  );
  const [analytics, setAnalyticsState] = useState(() =>
    safeGet(STORAGE_KEYS.ANALYTICS, [])
  );

  const isOnboarded = useCallback(() => {
    return safeGet(STORAGE_KEYS.ONBOARDED, false);
  }, []);

  const setOnboarded = useCallback((value) => {
    safeSet(STORAGE_KEYS.ONBOARDED, value);
  }, []);

  const setProfile = useCallback((data) => {
    setProfileState(data);
    safeSet(STORAGE_KEYS.USER_PROFILE, data);
  }, []);

  const saveSession = useCallback((session) => {
    setSessionsState(prev => {
      const updated = [...prev, { ...session, id: Date.now(), timestamp: new Date().toISOString() }];
      safeSet(STORAGE_KEYS.SESSIONS, updated);
      return updated;
    });
  }, []);

  const saveAnalytics = useCallback((entry) => {
    setAnalyticsState(prev => {
      const updated = [...prev, { ...entry, timestamp: new Date().toISOString() }];
      safeSet(STORAGE_KEYS.ANALYTICS, updated);
      return updated;
    });
  }, []);

  const getWeekNumber = useCallback(() => {
    if (!profile?.startDate) return 1;
    const start = new Date(profile.startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(diff + 1, 1), 4);
  }, [profile]);

  const getWeekSessions = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return sessions.filter(s => new Date(s.timestamp) >= weekStart);
  }, [sessions]);

  const getRecentSessions = useCallback((count = 5) => {
    return sessions.slice(-count);
  }, [sessions]);

  const getStressHistory = useCallback(() => {
    return analytics.map(a => ({
      date: a.timestamp,
      score: a.stressScore || 0,
      promptId: a.promptId,
    }));
  }, [analytics]);

  const getAverageStress = useCallback(() => {
    if (analytics.length === 0) return 0;
    const scores = analytics.map(a => a.stressScore || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [analytics]);

  const clearAll = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setProfileState(null);
    setSessionsState([]);
    setAnalyticsState([]);
  }, []);

  return {
    profile,
    sessions,
    analytics,
    isOnboarded,
    setOnboarded,
    setProfile,
    saveSession,
    saveAnalytics,
    getWeekNumber,
    getWeekSessions,
    getRecentSessions,
    getStressHistory,
    getAverageStress,
    clearAll,
  };
}
