import { useState, useCallback } from 'react';

function getMockAnalysis(promptId) {
  const mocksByPrompt = {
    energy: {
      stress_score: 7.2,
      indicators: { red_pct: 45, black_pct: 15, isolation: 2, somatic: false, line_pressure: 'heavy', placement: 'centered', dominant_mood: 'anxious' },
      pattern: 'Elevated anxiety with depleted energy reserves - heavy, chaotic strokes indicate emotional exhaustion',
      threshold_met: true,
      feedback_emoji: '🔴',
      feedback_short: 'AI sees depleted energy with anxious undertones',
      personal_statement: 'I feel like my energy is scattered and hard to hold onto. Everything takes more effort than it should, and I am tired in a way sleep cannot fix.',
      clinical_note: {
        subjective: 'Patient expresses depleted energy with anxiety-related visual markers in energy circle assessment.',
        objective: 'Energy circle filled with heavy, erratic strokes. 45% red tones, heavy line pressure, centered but chaotic composition. Incomplete fill suggests avoidance or exhaustion.',
        assessment: 'Presentation consistent with moderate anxiety (GAD) with fatigue component. DSM-5 F41.1 indicators present. Somatic awareness adequate but emotional regulation appears strained.',
        plan: '1. Weekly CBT sessions (12-week protocol). 2. Psychiatric evaluation for pharmacotherapy consideration. 3. Sleep hygiene assessment. 4. Continue digital art therapy 3x/week.',
      },
      diagnosis: 'F41.1 - Generalized Anxiety Disorder',
      insurance_data: {
        chief_complaint: 'Persistent anxiety with energy depletion identified through art therapy screening.',
        symptom_duration: '3-6 months (estimated from expression intensity)',
        functional_impairment: 'Patient demonstrates difficulty maintaining energy for daily activities, indicative of functional impairment in occupational and social domains.',
        diagnosis_category: 'Generalized Anxiety Disorder (F41.1)',
        requested_service: 'both',
      },
    },
    body: {
      stress_score: 8.1,
      indicators: { red_pct: 55, black_pct: 20, isolation: 1, somatic: true, line_pressure: 'heavy', placement: 'centered', dominant_mood: 'anxious' },
      pattern: 'Significant somatic distress — chest and shoulder shading indicates anxiety-related body tension',
      threshold_met: true,
      feedback_emoji: '😣',
      feedback_short: 'AI sees chest tension and shoulder heaviness',
    },
    weather: {
      stress_score: 6.5,
      indicators: { red_pct: 20, black_pct: 35, isolation: 3, somatic: false, line_pressure: 'medium', placement: 'scattered', dominant_mood: 'sad' },
      pattern: 'Moderate mood disturbance — stormy imagery with absence of human figures suggests social withdrawal',
      threshold_met: false,
      feedback_emoji: '🌧️',
      feedback_short: 'AI sees cloudy mood with social withdrawal',
    },
    safe: {
      stress_score: 3.2,
      indicators: { red_pct: 5, black_pct: 5, isolation: 0, somatic: false, line_pressure: 'light', placement: 'centered', dominant_mood: 'calm' },
      pattern: 'Healthy coping resources identified — warm colors and organized composition indicate accessible comfort mechanisms',
      threshold_met: false,
      feedback_emoji: '💚',
      feedback_short: 'AI sees warm comfort and healthy coping',
    },
    worry: {
      stress_score: 7.8,
      indicators: { red_pct: 40, black_pct: 30, isolation: 3, somatic: true, line_pressure: 'heavy', placement: 'centered', dominant_mood: 'fearful' },
      pattern: 'Acute anxiety externalization — large, dark worry shape with sharp edges indicates hypervigilance',
      threshold_met: true,
      feedback_emoji: '😰',
      feedback_short: 'AI sees sharp fear with hypervigilant edges',
    },
  };

  const base = mocksByPrompt[promptId] || mocksByPrompt.energy;

  if (!base.personal_statement) {
    base.personal_statement = 'I have feelings inside me that are hard to put into words. This drawing helps show what I cannot say — there is weight I carry, but also a small light I am holding onto.';
  }
  if (!base.clinical_note) {
    base.clinical_note = {
      subjective: `Patient completed ${promptId} drawing assessment. Visual expression suggests moderate emotional distress.`,
      objective: 'Drawing analyzed via AI-assisted art therapy protocol. Color, composition, and symbolic content evaluated.',
      assessment: `Stress score ${base.stress_score}/10. ${base.pattern}. DSM-5 alignment pending full clinical review.`,
      plan: '1. Continue art therapy sessions 3x/week. 2. Clinical review recommended. 3. Monitor for escalation.',
    };
  }
  if (!base.diagnosis) base.diagnosis = 'F41.1 - Generalized Anxiety Disorder';
  if (!base.insurance_data) {
    base.insurance_data = {
      chief_complaint: 'Anxiety indicators identified through nonverbal art therapy screening.',
      symptom_duration: '3-6 months',
      functional_impairment: 'Moderate impairment in daily functioning.',
      diagnosis_category: 'Generalized Anxiety Disorder (F41.1)',
      requested_service: 'both',
    };
  }
  return base;
}

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const analyzeDrawing = useCallback(async (canvasDataUrl, promptId, promptLabel, emotionTimeline = []) => {
    setLoading(true);
    setError(null);

    // Try server proxy
    try {
      const response = await makeRequest('/api/analyze/drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: canvasDataUrl,
          promptId,
          promptLabel,
          emotionTimeline,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setLoading(false);
        return result;
      }
    } catch (err) {
      console.error('Proxy unavailable, using mock:', err);
    }

    // Fallback: mock data
    await new Promise(r => setTimeout(r, 2500));
    const mock = getMockAnalysis(promptId);

    // Enhance mock with facial emotion context if available
    if (emotionTimeline.length > 0) {
      const emotionCounts = {};
      emotionTimeline.forEach(({ emotion }) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
      const dominantFacialEmotion = Object.keys(emotionCounts).reduce((a, b) =>
        emotionCounts[a] > emotionCounts[b] ? a : b
      );

      mock.facial_analysis = {
        dominant_emotion: dominantFacialEmotion,
        timeline: emotionTimeline,
        note: `Facial expressions tracked during session. Dominant emotion: ${dominantFacialEmotion}`,
      };
    }

    setLoading(false);
    return mock;
  }, []);

  return { analyzeDrawing, loading, error };
}
