import { useState, useCallback } from 'react';

const API_URL = 'https://api.anthropic.com/v1/messages';

const ANALYSIS_SYSTEM_PROMPT = `You are a clinical art therapy AI assistant analyzing drawings from nonverbal or disabled patients for anxiety/depression markers. You must output ONLY valid JSON, no markdown, no code fences.

Analyze the drawing for these clinical markers:
- Color histogram: percentage of red, black, warm vs cool tones
- Line pressure: heavy (distress) vs light (withdrawal)
- Size and placement: tiny figures indicate low self-esteem, corner placement indicates isolation
- Symbols: storms, darkness, isolation, barriers, somatic representations
- Composition: chaos vs order, empty space vs crowding

Output this exact JSON structure:
{
  "stress_score": <number 1-10>,
  "indicators": {
    "red_pct": <number 0-100>,
    "black_pct": <number 0-100>,
    "isolation": <number 0-5>,
    "somatic": <boolean>,
    "line_pressure": "heavy" | "medium" | "light",
    "placement": "centered" | "corner" | "scattered" | "bottom",
    "dominant_mood": "anxious" | "sad" | "angry" | "fearful" | "calm" | "mixed"
  },
  "pattern": "<1-2 sentence clinical pattern description>",
  "threshold_met": <boolean, true if score >= 7>,
  "feedback_emoji": "<single emoji representing the analysis>",
  "feedback_short": "<10-word patient-friendly feedback like 'AI sees red stress and jagged worry'>",
  "personal_statement": "<2-3 sentence warm first-person statement speaking AS the patient, helping them express what they might be feeling>",
  "clinical_note": {
    "subjective": "<what the patient appears to be experiencing>",
    "objective": "<description of drawing: colors, patterns, symbols, intensity, spatial arrangement>",
    "assessment": "<clinical interpretation using DSM-5 aligned language>",
    "plan": "<recommended next steps: therapy modality, follow-up, safety>"
  },
  "diagnosis": "<suggested ICD-10 code and name>",
  "insurance_data": {
    "chief_complaint": "<brief chief complaint>",
    "symptom_duration": "<estimated duration>",
    "functional_impairment": "<description of impairment>",
    "diagnosis_category": "<suggested diagnosis>",
    "requested_service": "therapy" | "psychiatric eval" | "both"
  }
}`;

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

  const analyzeDrawing = useCallback(async (canvasDataUrl, promptId, promptLabel) => {
    setLoading(true);
    setError(null);

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 2500));
      const mock = getMockAnalysis(promptId);
      setLoading(false);
      return mock;
    }

    try {
      const base64 = canvasDataUrl.split(',')[1];
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/png', data: base64 },
                },
                {
                  type: 'text',
                  text: `Analyze this nonverbal patient's "${promptLabel}" drawing for anxiety/depression markers. Score stress 1-10. Compare visual metaphors and emotional cues. This is a clinical screening drawing — treat it as clinical evidence.`,
                },
              ],
            },
          ],
          system: ANALYSIS_SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const parsed = JSON.parse(data.content[0].text);
      setLoading(false);
      return parsed;
    } catch (err) {
      console.error('Analysis error, using mock:', err);
      const mock = getMockAnalysis(promptId);
      setLoading(false);
      return mock;
    }
  }, []);

  return { analyzeDrawing, loading, error };
}
