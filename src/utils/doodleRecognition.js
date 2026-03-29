/**
 * Sketch Recognition using ML5.js DoodleNet
 * Pre-trained on Google QuickDraw dataset (50M+ sketches)
 * Recognizes 345 classes of sketched objects
 */

import ml5 from 'ml5';

let classifier = null;
let modelLoading = false;

/**
 * Load DoodleNet model (trained on QuickDraw sketches)
 */
export async function loadDoodleModel() {
  if (classifier) return classifier;
  if (modelLoading) {
    while (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return classifier;
  }

  modelLoading = true;

  return new Promise((resolve, reject) => {
    // ml5.js DoodleNet - trained on 345 QuickDraw categories
    classifier = ml5.imageClassifier('DoodleNet', () => {
      console.log('DoodleNet model loaded - ready to recognize sketches!');
      modelLoading = false;
      resolve(classifier);
    }, (error) => {
      console.error('Failed to load DoodleNet:', error);
      modelLoading = false;
      reject(error);
    });
  });
}

/**
 * Recognize what objects are in a sketch
 * @param {HTMLCanvasElement} canvasElement - Canvas containing the drawing
 * @returns {Promise<Object>} Recognition results with clinical interpretation
 */
export async function recognizeSketch(canvasElement) {
  try {
    await loadDoodleModel();

    // Get predictions from model
    const predictions = await new Promise((resolve, reject) => {
      classifier.classify(canvasElement, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });

    // ML5 returns: [{ label: 'tree', confidence: 0.87 }, ...]
    const topPredictions = predictions.slice(0, 5).map(p => ({
      object: p.label,
      confidence: p.confidence,
      category: categorizeObject(p.label)
    }));

    // Clinical interpretation (House-Tree-Person test)
    const htpAnalysis = analyzeHTPElements(topPredictions, canvasElement);

    return {
      detected_objects: topPredictions,
      top_prediction: topPredictions[0],
      htp_analysis: htpAnalysis,
      clinical_flags: htpAnalysis.clinical_flags,
      model_loaded: true,
      model_type: 'DoodleNet (QuickDraw trained)'
    };

  } catch (error) {
    console.error('DoodleNet recognition error:', error);
    return {
      detected_objects: [],
      htp_analysis: null,
      clinical_flags: [],
      model_loaded: false,
      error: error.message
    };
  }
}

/**
 * Categorize detected object for clinical analysis
 */
function categorizeObject(objectName) {
  const lower = objectName.toLowerCase();

  // Human/person related
  if (['person', 'face', 'hand', 'eye', 'body', 'head', 'foot', 'leg', 'arm',
       'man', 'woman', 'boy', 'girl', 'baby', 'smiley face'].some(t => lower.includes(t))) {
    return 'human';
  }

  // Shelter/building related
  if (['house', 'building', 'door', 'window', 'castle', 'church', 'barn',
       'school', 'hospital', 'roof', 'fence'].some(t => lower.includes(t))) {
    return 'shelter';
  }

  // Nature/grounding
  if (['tree', 'flower', 'plant', 'grass', 'bush', 'leaf', 'garden',
       'forest', 'mountain', 'river', 'beach'].some(t => lower.includes(t))) {
    return 'nature';
  }

  // Weather
  if (['sun', 'cloud', 'rain', 'lightning', 'moon', 'star', 'rainbow',
       'tornado', 'hurricane', 'storm'].some(t => lower.includes(t))) {
    return 'weather';
  }

  // Emotion/expression
  if (['heart', 'smiley', 'happy', 'sad', 'angry', 'surprised'].some(t => lower.includes(t))) {
    return 'emotion';
  }

  // Animals
  if (['cat', 'dog', 'bird', 'fish', 'animal', 'butterfly', 'bee', 'spider',
       'snake', 'bear', 'rabbit'].some(t => lower.includes(t))) {
    return 'animal';
  }

  // Isolation/barriers
  if (['wall', 'fence', 'cage', 'jail', 'lock', 'chain'].some(t => lower.includes(t))) {
    return 'barrier';
  }

  // Violence/danger
  if (['knife', 'gun', 'sword', 'fire', 'explosion', 'blood'].some(t => lower.includes(t))) {
    return 'danger';
  }

  return 'other';
}

/**
 * House-Tree-Person (HTP) Clinical Analysis
 * Validated projective psychological test
 */
function analyzeHTPElements(detectedObjects, canvasElement) {
  const categories = {
    human: detectedObjects.filter(o => o.category === 'human'),
    shelter: detectedObjects.filter(o => o.category === 'shelter'),
    nature: detectedObjects.filter(o => o.category === 'nature'),
    weather: detectedObjects.filter(o => o.category === 'weather'),
    emotion: detectedObjects.filter(o => o.category === 'emotion'),
    animal: detectedObjects.filter(o => o.category === 'animal'),
    barrier: detectedObjects.filter(o => o.category === 'barrier'),
    danger: detectedObjects.filter(o => o.category === 'danger')
  };

  const flags = [];
  const insights = [];

  // HTP Clinical Indicators

  // 1. Absence of human figures (social withdrawal)
  if (categories.human.length === 0 && detectedObjects[0]?.confidence > 0.5) {
    flags.push({
      severity: 'moderate',
      indicator: 'No human figure detected',
      interpretation: 'May indicate social withdrawal, isolation, or difficulty with interpersonal relationships',
      clinical_relevance: 'Common in depression, social anxiety, autism spectrum, or trauma',
      confidence: 'high'
    });
  }

  // 2. Absence of grounding elements (instability)
  if (categories.shelter.length === 0 && categories.nature.length === 0 && detectedObjects[0]?.confidence > 0.5) {
    flags.push({
      severity: 'moderate',
      indicator: 'No grounding elements (house/tree)',
      interpretation: 'May indicate feelings of instability, lack of security, or rootlessness',
      clinical_relevance: 'Associated with anxiety, trauma, insecure attachment, or transient stress',
      confidence: 'high'
    });
  }

  // 3. Dark weather (mood disturbance)
  const negativeWeather = categories.weather.filter(w =>
    ['cloud', 'rain', 'storm', 'lightning', 'tornado'].some(term => w.object.toLowerCase().includes(term))
  );
  if (negativeWeather.length > 0 && negativeWeather[0].confidence > 0.4) {
    flags.push({
      severity: 'mild',
      indicator: `Negative weather imagery: ${negativeWeather[0].object}`,
      interpretation: 'May reflect current mood state - sadness, gloom, emotional turbulence, or feeling overwhelmed',
      clinical_relevance: 'Common in depressive episodes, acute stress, or anxiety',
      confidence: 'medium'
    });
  }

  // 4. Barriers/isolation symbols
  if (categories.barrier.length > 0 && categories.barrier[0].confidence > 0.5) {
    flags.push({
      severity: 'moderate',
      indicator: `Barrier imagery: ${categories.barrier[0].object}`,
      interpretation: 'May indicate feelings of being trapped, isolated, or blocked from connection',
      clinical_relevance: 'Can reflect trauma, depression, or relational difficulties',
      confidence: 'high'
    });
  }

  // 5. Danger/violence symbols (trauma/aggression)
  if (categories.danger.length > 0 && categories.danger[0].confidence > 0.5) {
    flags.push({
      severity: 'high',
      indicator: `Danger/violence imagery: ${categories.danger[0].object}`,
      interpretation: 'May indicate exposure to violence, trauma memories, aggressive ideation, or hypervigilance',
      clinical_relevance: 'Requires immediate clinical follow-up for safety assessment',
      confidence: 'high'
    });
  }

  // 6. Positive indicators
  if (categories.emotion.some(e => ['heart', 'smiley'].some(t => e.object.includes(t)))) {
    insights.push('Positive emotional expression detected - healthy emotional awareness and regulation');
  }

  if (categories.animal.length > 0) {
    insights.push('Animal imagery present - may indicate nurturing capacity, connection to nature, or symbolic self-representation');
  }

  // 7. Spatial analysis
  const spatialAnalysis = analyzeSpatialPlacement(canvasElement);
  if (spatialAnalysis.flags.length > 0) {
    flags.push(...spatialAnalysis.flags);
  }

  // 8. Determine overall risk level
  const highSeverityCount = flags.filter(f => f.severity === 'high').length;
  const moderateSeverityCount = flags.filter(f => f.severity === 'moderate').length;

  let overallRisk = 'low';
  if (highSeverityCount > 0) overallRisk = 'high';
  else if (moderateSeverityCount >= 2) overallRisk = 'moderate';
  else if (moderateSeverityCount === 1) overallRisk = 'mild';

  return {
    elements_detected: {
      human_figures: categories.human.length,
      shelter_structures: categories.shelter.length,
      nature_elements: categories.nature.length,
      weather_elements: categories.weather.length,
      emotional_symbols: categories.emotion.length,
      animals: categories.animal.length,
      barriers: categories.barrier.length,
      danger_symbols: categories.danger.length
    },
    clinical_flags: flags,
    positive_indicators: insights,
    overall_risk: overallRisk,
    htp_interpretation: generateHTPInterpretation(categories, flags, overallRisk),
    confidence: detectedObjects[0]?.confidence > 0.6 ? 'high' :
                detectedObjects[0]?.confidence > 0.4 ? 'medium' : 'low'
  };
}

/**
 * Analyze spatial placement (position on canvas)
 */
function analyzeSpatialPlacement(canvasElement) {
  const ctx = canvasElement.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
  const width = canvasElement.width;
  const height = canvasElement.height;

  // Find bounding box of drawing
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let pixelCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (imageData.data[i + 3] > 10) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        pixelCount++;
      }
    }
  }

  if (pixelCount === 0) return { flags: [] };

  const centerX = (minX + maxX) / 2 / width;
  const centerY = (minY + maxY) / 2 / height;
  const drawingWidth = (maxX - minX) / width;
  const drawingHeight = (maxY - minY) / height;
  const size = drawingWidth * drawingHeight;

  const flags = [];

  // Very small drawing (< 10% of canvas)
  if (size < 0.1) {
    flags.push({
      severity: 'moderate',
      indicator: 'Very small drawing size',
      interpretation: 'May indicate low self-esteem, withdrawal, feeling insignificant, or reluctance to engage',
      clinical_relevance: 'Common in depression, social anxiety, trauma, or low confidence',
      confidence: 'high'
    });
  }

  // Drawing in upper left corner (regression/past focus)
  if (centerX < 0.3 && centerY < 0.3) {
    flags.push({
      severity: 'mild',
      indicator: 'Upper-left placement',
      interpretation: 'May indicate focus on the past, regression, or desire to return to earlier times',
      clinical_relevance: 'Can reflect nostalgia, avoidance of present, or difficulty moving forward',
      confidence: 'medium'
    });
  }

  // Drawing in lower right corner (future anxiety)
  if (centerX > 0.7 && centerY > 0.7) {
    flags.push({
      severity: 'mild',
      indicator: 'Lower-right placement',
      interpretation: 'May indicate anxiety about the future or feeling pressured',
      clinical_relevance: 'Can reflect future-focused worry or sense of urgency',
      confidence: 'medium'
    });
  }

  return { flags };
}

/**
 * Generate overall HTP interpretation
 */
function generateHTPInterpretation(categories, flags, overallRisk) {
  if (flags.length === 0) {
    return 'Drawing shows age-appropriate symbolic representation with no significant clinical indicators. Elements detected suggest healthy emotional processing. Continue routine monitoring.';
  }

  const severityCounts = {
    high: flags.filter(f => f.severity === 'high').length,
    moderate: flags.filter(f => f.severity === 'moderate').length,
    mild: flags.filter(f => f.severity === 'mild').length
  };

  if (severityCounts.high > 0) {
    return `⚠️ URGENT: Drawing shows ${severityCounts.high} high-severity indicator(s) requiring immediate clinical follow-up. ${flags.find(f => f.severity === 'high').interpretation} Recommend safety assessment and psychiatric evaluation within 24 hours.`;
  }

  if (severityCounts.moderate >= 2) {
    return `Drawing shows ${severityCounts.moderate} moderate clinical indicator(s). HTP analysis suggests possible areas of concern in emotional wellbeing, social functioning, or sense of security. Recommend comprehensive psychological assessment including mood and anxiety screening. Monitor closely for pattern persistence across sessions.`;
  }

  if (severityCounts.moderate === 1) {
    return `Drawing shows 1 moderate clinical indicator: ${flags.find(f => f.severity === 'moderate').indicator}. Consider targeted assessment in this area. May reflect temporary state or emerging concern requiring monitoring.`;
  }

  return `Drawing shows ${flags.length} mild clinical indicator(s). These may reflect temporary mood states, situational stress, or normal variation. Monitor for patterns across multiple sessions before clinical concern.`;
}

/**
 * Pre-load model on app startup (optional)
 */
export function preloadDoodleModel() {
  loadDoodleModel().catch(err => {
    console.log('Model preload failed (will load on first use):', err);
  });
}
