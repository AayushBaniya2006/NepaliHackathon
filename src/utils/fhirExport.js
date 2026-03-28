export function generateFHIRObservation(analysisResult, sessionImages = [], patientInfo = {}) {
  const now = new Date().toISOString();

  return {
    resourceType: 'Observation',
    id: `mc-obs-${Date.now()}`,
    status: 'final',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'survey',
            display: 'Survey',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '44249-1',
          display: 'PHQ-9 quick depression assessment panel',
        },
      ],
      text: 'Nonverbal Art Therapy Anxiety/Depression Screen',
    },
    subject: {
      display: patientInfo.name || 'Anonymous Patient',
      reference: `Patient/${patientInfo.id || 'unknown'}`,
    },
    effectiveDateTime: now,
    issued: now,
    valueQuantity: {
      value: analysisResult.stress_score || 0,
      unit: '/10',
      system: 'http://unitsofmeasure.org',
      code: '{score}',
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: analysisResult.stress_score >= 7 ? 'H' : 'N',
            display: analysisResult.stress_score >= 7 ? 'High' : 'Normal',
          },
        ],
        text: analysisResult.threshold_met
          ? `Positive - Meets medical necessity for CPT 90834 x12`
          : 'Monitoring - Continue assessment protocol',
      },
    ],
    component: [
      {
        code: { text: 'Red Color Percentage' },
        valueQuantity: { value: analysisResult.indicators?.red_pct || 0, unit: '%' },
      },
      {
        code: { text: 'Isolation Score' },
        valueQuantity: { value: analysisResult.indicators?.isolation || 0, unit: '/5' },
      },
      {
        code: { text: 'Somatic Indicators' },
        valueBoolean: analysisResult.indicators?.somatic || false,
      },
    ],
    derivedFrom: sessionImages.map((img, i) => ({
      reference: img,
      display: `Drawing Session ${i + 1}`,
    })),
    note: [
      {
        text: `Pattern: ${analysisResult.pattern || 'Awaiting sufficient data'}. Based on ${sessionImages.length} drawing sessions analyzed via AI-assisted art therapy screening.`,
      },
    ],
  };
}

export function generateEHRNote(analysisResult, sessions = [], patientInfo = {}) {
  return {
    patient: patientInfo.name || 'Anonymous',
    date: new Date().toLocaleDateString(),
    type: 'Nonverbal Art Therapy Assessment',
    provider: patientInfo.provider || 'MindCanvas AI-Assisted Screening',
    diagnosis: analysisResult.diagnosis || 'F41.1 - Generalized Anxiety Disorder',
    sessions_analyzed: sessions.length,
    stress_trend: sessions.map(s => s.stressScore || 0),
    key_indicators: analysisResult.indicators || {},
    clinical_pattern: analysisResult.pattern || '',
    recommendation: analysisResult.plan || '',
    cpt_codes: ['90834', '96127'],
    medical_necessity: analysisResult.threshold_met
      ? 'MEETS criteria based on sustained elevated anxiety markers across multiple sessions'
      : 'MONITORING - insufficient data for determination',
  };
}

export function downloadFHIRJSON(fhirData) {
  const blob = new Blob([JSON.stringify(fhirData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mindcanvas-fhir-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
