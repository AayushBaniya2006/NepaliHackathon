import { useState, useCallback } from 'react';
import { SYSTEM_PROMPT, RESOURCE_FINDER_PROMPT, SIGN_LANGUAGE_PROMPT, SIGN_MESSAGE_PROMPT } from '../utils/claudePrompts';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Hook for Claude API integration.
 * API key stored in env: VITE_CLAUDE_API_KEY
 */
export function useClaude() {
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

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

    // Try server proxy first
    let response;
    try {
      response = await makeRequest('/api/analyze/drawing', {
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
    } catch { /* proxy unavailable, try direct */ }

    // Fallback: direct API call (only if proxy fails)
    if (apiKey) {
      try {
        const base64 = canvasDataUrl.split(',')[1];

        response = await makeRequest(CLAUDE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'image/png',
                      data: base64,
                    },
                  },
                  {
                    type: 'text',
                    text: `Interpret this drawing from a non-verbal user.
                    CONTEXT: This is a "${assessmentType}" clinical drawing assessment.
                    Please analyze the visual metaphors and emotional state accordingly.`,
                  },
                ],
              },
            ],
            system: SYSTEM_PROMPT,
          }),
        });

        if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

        const data = await response.json();
        const content = data.content[0].text;
        const parsed = JSON.parse(content);
        setResult(parsed);
        setLoading(false);
        return parsed;
      } catch (err) {
        console.error('Claude error, falling back to mock:', err);
      }
    } else {
      console.warn('Claude API key not configured. Using high-fidelity mock data for demo transition.');
    }

    // Final fallback: mock data
    await new Promise(r => setTimeout(r, 2000));
    const mockResult = getMockDrawingResult(assessmentType);
    setResult(mockResult);
    setLoading(false);
    return mockResult;
  }, []);

  /**
   * Recognize a sign language gesture from a webcam frame
   */
  const recognizeSign = useCallback(async (frameDataUrl) => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

    // Try server proxy first
    try {
      const response = await makeRequest('/api/analyze/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: frameDataUrl }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch { /* proxy unavailable, try direct */ }

    // Fallback: direct API call
    if (!apiKey) {
      return { recognized: false, sign: '', confidence: 'low', description: 'API key not configured' };
    }

    try {
      const base64 = frameDataUrl.split(',')[1];

      const response = await makeRequest(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: 'What ASL sign or gesture is this person making? Interpret it.',
                },
              ],
            },
          ],
          system: SIGN_LANGUAGE_PROMPT,
        }),
      });

      if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

      const data = await response.json();
      const parsed = JSON.parse(data.content[0].text);
      return parsed;
    } catch (err) {
      console.error('Sign recognition error:', err);
      return { recognized: false, sign: '', confidence: 'low', description: 'Recognition failed' };
    }
  }, []);

  /**
   * Take accumulated signed words and produce the full clinical pipeline output
   */
  const interpretSignMessage = useCallback(async (signedWords) => {
    setLoading(true);
    setError(null);

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    const message = signedWords.join(' ');

    // Try server proxy first
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
    } catch { /* proxy unavailable, try direct */ }

    // Fallback: direct API call
    if (!apiKey) {
      setError('Claude API key not configured.');
      setLoading(false);
      return null;
    }

    try {
      const response = await makeRequest(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `The user signed the following words/phrases: "${message}"\n\nInterpret this as their mental health communication and generate the clinical output.`,
            },
          ],
          system: SIGN_MESSAGE_PROMPT,
        }),
      });

      if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

      const data = await response.json();
      const parsed = JSON.parse(data.content[0].text);
      setResult(parsed);
      setLoading(false);
      return parsed;
    } catch (err) {
      console.error('Sign message interpretation error:', err);
      setError('Failed to interpret signed message. Please try again.');
      setLoading(false);
      return null;
    }
  }, []);

  const findResources = useCallback(async (location) => {
    setLoading(true);
    setError(null);

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      // Return mock data for demo
      setLoading(false);
      return getMockResources();
    }

    try {
      const response = await fetch(CLAUDE_API_URL, {
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
              content: `Find free or low-cost mental health resources near ${location}. Include crisis resources.`,
            },
          ],
          system: RESOURCE_FINDER_PROMPT,
        }),
      });

      if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

      const data = await response.json();
      const parsed = JSON.parse(data.content[0].text);
      setLoading(false);
      return parsed;
    } catch (err) {
      console.error('Resource finder error:', err);
      setLoading(false);
      return getMockResources();
    }
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
      plan: `1. Weekly individual psychotherapy (CBT model). 2. Referral for psychiatric evaluation for potential pharmacotherapy. 3. Family therapy session in 2 weeks. 4. Continue digital expressive therapy daily.`
    },
    insurance_data: {
      chiefComplaint: `Persistent anxiety and emotional isolation identified through ${assessmentType} assessment.`,
      symptomDuration: '3-6 months',
      functionalImpairment: 'Patient reports difficulty focusing at work and withdrawal from primary social circle.',
      diagnosisCategory: 'Other specified anxiety disorder (F41.8)',
      requestedService: 'both'
    }
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
