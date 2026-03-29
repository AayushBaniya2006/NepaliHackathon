/**
 * Fractal Dimension Analysis for Depression Detection
 *
 * Based on research showing correlation between drawing complexity
 * (measured via fractal dimension) and mental health states.
 *
 * Research:
 * - Depression: Lower fractal dimension (1.1-1.3) - simplified, repetitive patterns
 * - Healthy: Moderate dimension (1.4-1.6) - balanced complexity
 * - Anxiety/Mania: Higher dimension (1.7-1.9) - chaotic, complex patterns
 *
 * Method: Box-counting algorithm (standard in fractal analysis)
 */

/**
 * Calculate fractal dimension of a drawing
 * @param {HTMLCanvasElement} canvasElement - The canvas with the drawing
 * @returns {Object} Fractal analysis results
 */
export function calculateFractalDimension(canvasElement) {
  const ctx = canvasElement.getContext('2d');
  const width = canvasElement.width;
  const height = canvasElement.height;
  const imageData = ctx.getImageData(0, 0, width, height);

  // Convert to binary grid (drawn vs empty)
  const binary = createBinaryGrid(imageData, width, height);

  // Box-counting at different scales
  const scales = [2, 4, 8, 16, 32, 64, 128];
  const counts = scales.map(size => countFilledBoxes(binary, width, height, size));

  // Filter out invalid data points (zero counts)
  const validPoints = scales
    .map((size, i) => ({ size, count: counts[i] }))
    .filter(p => p.count > 0);

  if (validPoints.length < 3) {
    return {
      fractalDimension: 0,
      depressionRisk: 'insufficient_data',
      interpretation: 'Drawing too sparse for fractal analysis',
      confidence: 0
    };
  }

  // Calculate fractal dimension via linear regression
  const logSizes = validPoints.map(p => Math.log(1 / p.size));
  const logCounts = validPoints.map(p => Math.log(p.count));

  const regression = linearRegression(logSizes, logCounts);
  const dimension = regression.slope;

  // Clinical interpretation
  const analysis = interpretFractalDimension(dimension, regression.r2);

  return {
    fractalDimension: dimension,
    rSquared: regression.r2,
    ...analysis
  };
}

/**
 * Convert image data to binary grid
 */
function createBinaryGrid(imageData, width, height) {
  const binary = new Array(height);

  for (let y = 0; y < height; y++) {
    binary[y] = new Array(width);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Check alpha channel - if any opacity, consider it drawn
      binary[y][x] = imageData.data[i + 3] > 10 ? 1 : 0;
    }
  }

  return binary;
}

/**
 * Count boxes that contain at least one drawn pixel
 */
function countFilledBoxes(binary, width, height, boxSize) {
  let count = 0;

  for (let y = 0; y < height; y += boxSize) {
    for (let x = 0; x < width; x += boxSize) {
      if (boxContainsPixel(binary, x, y, boxSize, width, height)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Check if a box contains any drawn pixels
 */
function boxContainsPixel(binary, startX, startY, boxSize, width, height) {
  for (let dy = 0; dy < boxSize; dy++) {
    const y = startY + dy;
    if (y >= height) break;

    for (let dx = 0; dx < boxSize; dx++) {
      const x = startX + dx;
      if (x >= width) break;

      if (binary[y][x] === 1) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Linear regression to calculate fractal dimension
 */
function linearRegression(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared (goodness of fit)
  const meanY = sumY / n;
  const ssTotal = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
  const ssResidual = y.reduce((acc, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return acc + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = 1 - (ssResidual / ssTotal);

  return { slope, intercept, r2 };
}

/**
 * Clinical interpretation of fractal dimension
 */
function interpretFractalDimension(dimension, r2) {
  // Low confidence if poor fit
  const confidence = r2 > 0.85 ? 'high' : r2 > 0.7 ? 'medium' : 'low';

  // Clinical thresholds based on research
  if (dimension < 1.0) {
    return {
      depressionRisk: 'very_low_complexity',
      interpretation: 'Extremely simplified patterns - may indicate severe cognitive simplification or minimal engagement',
      clinicalNote: 'Fractal dimension < 1.0 suggests very simple, possibly avoidant drawing behavior',
      confidence,
      recommendation: 'Clinical follow-up recommended for assessment of cognitive function and engagement'
    };
  } else if (dimension < 1.3) {
    return {
      depressionRisk: 'elevated',
      interpretation: 'Low complexity patterns - consistent with depressive cognitive style',
      clinicalNote: 'Fractal dimension 1.0-1.3 correlates with simplified thinking patterns often seen in depression',
      confidence,
      recommendation: 'Consider depression screening (PHQ-9) and mood assessment'
    };
  } else if (dimension < 1.6) {
    return {
      depressionRisk: 'low',
      interpretation: 'Normal complexity - organized, balanced thought patterns',
      clinicalNote: 'Fractal dimension 1.3-1.6 indicates typical cognitive complexity',
      confidence,
      recommendation: 'Continue routine monitoring'
    };
  } else if (dimension < 1.9) {
    return {
      depressionRisk: 'low_but_elevated_anxiety',
      interpretation: 'High complexity - may indicate elevated cognitive activity, anxiety, or racing thoughts',
      clinicalNote: 'Fractal dimension 1.6-1.9 suggests complex, possibly chaotic thought patterns',
      confidence,
      recommendation: 'Screen for anxiety disorders; assess for rumination or hypervigilance'
    };
  } else {
    return {
      depressionRisk: 'very_high_complexity',
      interpretation: 'Very high complexity - chaotic patterns may indicate severe anxiety or manic features',
      clinicalNote: 'Fractal dimension > 1.9 indicates highly complex, disorganized patterns',
      confidence,
      recommendation: 'Clinical evaluation recommended for mood instability or thought disorder'
    };
  }
}

/**
 * Calculate drawing entropy (alternative complexity measure)
 */
export function calculateEntropy(canvasElement) {
  const ctx = canvasElement.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);

  // Build grayscale histogram
  const histogram = new Array(256).fill(0);
  let totalPixels = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i + 3];
    if (alpha > 10) { // Only count drawn pixels
      const gray = Math.floor(
        0.299 * imageData.data[i] +     // R
        0.587 * imageData.data[i + 1] + // G
        0.114 * imageData.data[i + 2]   // B
      );
      histogram[gray]++;
      totalPixels++;
    }
  }

  if (totalPixels === 0) {
    return { entropy: 0, interpretation: 'No drawing detected' };
  }

  // Calculate Shannon entropy
  let entropy = 0;
  for (const count of histogram) {
    if (count > 0) {
      const p = count / totalPixels;
      entropy -= p * Math.log2(p);
    }
  }

  return {
    entropy: entropy,
    interpretation: entropy < 3 ? 'Very low variety (repetitive)' :
                   entropy < 5 ? 'Low-moderate variety' :
                   entropy < 7 ? 'Normal variety' :
                   'High variety (complex color usage)',
    normalized: entropy / 8 // Normalize to 0-1 range
  };
}

/**
 * Quick assessment combining both measures
 */
export function assessDrawingComplexity(canvasElement) {
  const fractal = calculateFractalDimension(canvasElement);
  const entropy = calculateEntropy(canvasElement);

  return {
    fractal_dimension: fractal.fractalDimension.toFixed(3),
    depression_risk: fractal.depressionRisk,
    complexity_score: ((fractal.fractalDimension - 1.0) * 2).toFixed(2), // Scale to 0-2
    entropy: entropy.entropy.toFixed(2),
    clinical_interpretation: fractal.interpretation,
    clinical_note: fractal.clinicalNote,
    recommendation: fractal.recommendation,
    confidence: fractal.confidence
  };
}
