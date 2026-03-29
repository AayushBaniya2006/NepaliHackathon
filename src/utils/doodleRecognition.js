/**
 * Sketch / DoodleNet path (ml5) disabled: ml5 v1 + face-api.js both register TensorFlow.js
 * and trigger WebGPU/WebGL conflicts and DoodleNet input-shape errors in the browser.
 * Drawing analysis uses GPT-4o (server) plus fractal metrics (client) instead.
 */

export async function loadDoodleModel() {
  return null;
}

export async function recognizeSketch(_canvasElement) {
  return {
    detected_objects: [],
    top_prediction: null,
    htp_analysis: null,
    clinical_flags: [],
    model_loaded: false,
    model_type: 'disabled (use server vision + fractal analysis)',
    error: null,
  };
}

export function preloadDoodleModel() {
  /* no-op */
}
