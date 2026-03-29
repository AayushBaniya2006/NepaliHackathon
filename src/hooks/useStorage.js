import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEYS = {
  USER_PROFILE: 'mc_user_profile',
  SESSIONS: 'mc_sessions',
  ANALYTICS: 'mc_analytics',
  ONBOARDED: 'mc_onboarded',
  USER_ID: 'mc_user_id',
};

const API_BASE = '/api/storage';

// ── localStorage helpers (instant, offline-capable) ──────
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

// ── API helpers (sync to MongoDB) ────────────────────────
async function api(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('DB sync failed:', err.message);
    return null;
  }
}

function getUserId() {
  let id = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!id) {
    id = crypto.randomUUID?.() || `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, id);
  }
  return id;
}

export function useStorage() {
  const userId = useRef(getUserId()).current;

  const [profile, setProfileState] = useState(() =>
    safeGet(STORAGE_KEYS.USER_PROFILE, null)
  );
  const [sessions, setSessionsState] = useState(() =>
    safeGet(STORAGE_KEYS.SESSIONS, [])
  );
  const [analytics, setAnalyticsState] = useState(() =>
    safeGet(STORAGE_KEYS.ANALYTICS, [])
  );

  // Pull from MongoDB on mount to pick up data from teammates
  useEffect(() => {
    (async () => {
      const [dbProfile, dbSessions, dbAnalytics] = await Promise.all([
        api(`/profile/${userId}`),
        api(`/sessions?userId=${userId}`),
        api(`/analytics?userId=${userId}`),
      ]);

      if (dbProfile) {
        setProfileState(dbProfile);
        safeSet(STORAGE_KEYS.USER_PROFILE, dbProfile);
      }
      if (dbSessions && dbSessions.length > 0) {
        // Merge: keep unique by id, prefer DB version
        setSessionsState(prev => {
          const map = new Map();
          for (const s of prev) map.set(s.id, s);
          for (const s of dbSessions) map.set(s.id, s);
          const merged = [...map.values()].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
          );
          safeSet(STORAGE_KEYS.SESSIONS, merged);
          return merged;
        });
      }
      if (dbAnalytics && dbAnalytics.length > 0) {
        setAnalyticsState(dbAnalytics);
        safeSet(STORAGE_KEYS.ANALYTICS, dbAnalytics);
      }
    })();
  }, [userId]);

  const isOnboarded = useCallback(() => {
    return safeGet(STORAGE_KEYS.ONBOARDED, false);
  }, []);

  const setOnboarded = useCallback((value) => {
    safeSet(STORAGE_KEYS.ONBOARDED, value);
    api('/onboarded', {
      method: 'PUT',
      body: JSON.stringify({ userId, onboarded: value }),
    });
  }, [userId]);

  const setProfile = useCallback((data) => {
    setProfileState(data);
    safeSet(STORAGE_KEYS.USER_PROFILE, data);
    api('/profile', {
      method: 'PUT',
      body: JSON.stringify({ ...data, userId }),
    });
  }, [userId]);

  const saveSession = useCallback((session) => {
    setSessionsState(prev => {
      const id = session.id != null ? session.id : Date.now();
      const entry = { ...session, id, userId, timestamp: session.timestamp ?? new Date().toISOString() };
      const updated = [...prev, entry];
      safeSet(STORAGE_KEYS.SESSIONS, updated);
      // Sync to MongoDB
      api('/sessions', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      return updated;
    });
  }, [userId]);

  const saveAnalytics = useCallback((entry) => {
    setAnalyticsState(prev => {
      const record = { ...entry, userId, timestamp: new Date().toISOString() };
      const updated = [...prev, record];
      safeSet(STORAGE_KEYS.ANALYTICS, updated);
      // Sync to MongoDB
      api('/analytics', {
        method: 'POST',
        body: JSON.stringify(record),
      });
      return updated;
    });
  }, [userId]);

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
    api(`/all/${userId}`, { method: 'DELETE' });
  }, [userId]);

  // Get all team data (for teammates to view)
  const getTeamData = useCallback(async () => {
    return await api('/team/all');
  }, []);

  return {
    profile,
    sessions,
    analytics,
    userId,
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
    getTeamData,
  };
}
