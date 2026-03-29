import { useState, useCallback } from 'react';

/**
 * LLM calls via server proxy (GPT-4o). All requests go through /api/analyze/*.
 */
export function useLlm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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

  const interpretDrawing = useCallback(async (canvasDataUrl, assessmentType = 'Free Expression') => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest('/api/analyze/drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: canvasDataUrl, promptId: assessmentType, promptLabel: assessmentType }),
      });
      if (response.ok) {
        const result = await response.json();
        setResult(result);
        setLoading(false);
        return result;
      }
    } catch {
      /* proxy unavailable, fall through to mock */
    }

    await new Promise(r => setTimeout(r, 2000));
    const mockResult = getMockDrawingResult(assessmentType);
    setResult(mockResult);
    setLoading(false);
    return mockResult;
  }, []);

  const recognizeSign = useCallback(async (frameDataUrl) => {
    try {
      const response = await makeRequest('/api/analyze/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameBase64: frameDataUrl }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      /* proxy unavailable */
    }

    return { recognized: false, sign: '', confidence: 'low', description: 'Server unavailable' };
  }, []);

  const interpretSignMessage = useCallback(async (signedWords) => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest('/api/analyze/sign-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedWords }),
      });
      if (response.ok) {
        const parsed = await response.json();
        setResult(parsed);
        setLoading(false);
        return parsed;
      }
    } catch {
      /* proxy unavailable */
    }

    setError('Server unavailable. Please try again.');
    setLoading(false);
    return null;
  }, []);

  const findResources = useCallback(async (_location) => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest('/api/resources', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setLoading(false);
        return data;
      }
    } catch {
      /* proxy unavailable */
    }

    setLoading(false);
    return getMockResources();
  }, []);

  return { interpretDrawing, recognizeSign, interpretSignMessage, findResources, loading, error, result };
}

function getMockDrawingResult(assessmentType = 'Free Expression') {
  return {
    personal_statement: `My drawing for the ${assessmentType} session reflects a deep-seated feeling of isolation, though I've used brighter colors to represent a small spark of hope I still carry inside. This expression is about the weight of recent changes in my life.`,
    clinical_note: {
      subjective: `Patient completed a ${assessmentType} assessment. Reports feelings of persistent low mood and situational anxiety. Noted preference for quiet activities and avoids large social gatherings.`,
      objective: `Visual expression displays significant center-placement on canvas. Line quality is varying but controlled. Color palette includes both cool and warm tones, indicating complex emotional processing. Participant was cooperative and took approximately 4 minutes to complete the task.`,
      assessment: `Signs of moderate anxiety consistent with situational stress. No acute markers of psychosis or self-harm but indicates a need for regular therapeutic outpatient care. Personality indicators suggest a resourceful but currently overwhelmed individual.`,
      plan: `1. Weekly individual psychotherapy (CBT model). 2. Referral for psychiatric evaluation for potential pharmacotherapy. 3. Family therapy session in 2 weeks. 4. Continue digital expressive therapy daily.`,
    },
    insurance_data: {
      chiefComplaint: `Persistent anxiety and emotional isolation identified through ${assessmentType} assessment.`,
      symptomDuration: '3-6 months',
      functionalImpairment: 'Patient reports difficulty focusing at work and withdrawal from primary social circle.',
      diagnosisCategory: 'Other specified anxiety disorder (F41.8)',
      requestedService: 'both',
    },
  };
}

function getMockResources() {
  return [
    {
      name: '988 Suicide & Crisis Lifeline',
      type: 'crisis_line',
      address: 'N/A',
      phone: '988',
      website: 'https://988lifeline.org',
      cost: 'Free',
      description: '24/7 crisis support via call or text. Available for anyone in emotional distress.',
      hours: '24/7',
    },
    {
      name: 'Crisis Text Line',
      type: 'crisis_line',
      address: 'N/A',
      phone: 'Text HOME to 741741',
      website: 'https://crisistextline.org',
      cost: 'Free',
      description: 'Free 24/7 text-based mental health support from trained crisis counselors.',
      hours: '24/7',
    },
    {
      name: 'SAMHSA National Helpline',
      type: 'crisis_line',
      address: 'N/A',
      phone: '1-800-662-4357',
      website: 'https://www.samhsa.gov/find-help/national-helpline',
      cost: 'Free',
      description: 'Free referral service for mental health and substance abuse treatment facilities.',
      hours: '24/7',
    },
    {
      name: 'Open Path Collective',
      type: 'telehealth',
      address: 'Online Only',
      phone: 'N/A',
      website: 'https://openpathcollective.org',
      cost: 'Low cost ($30-$80/session)',
      description: 'Affordable teletherapy network with licensed therapists offering reduced rates.',
      hours: 'Varies by provider',
    },
    {
      name: 'NAMI HelpLine',
      type: 'support_group',
      address: 'N/A',
      phone: '1-800-950-NAMI (6264)',
      website: 'https://www.nami.org/help',
      cost: 'Free',
      description: 'Information, referrals, and support for individuals and families affected by mental illness.',
      hours: 'Mon-Fri 10am-10pm ET',
    },
  ];
}
