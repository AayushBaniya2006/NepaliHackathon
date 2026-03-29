import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

export function useFaceEmotion(videoRef, onEmotionChange) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const animFrameRef = useRef(null);
  const lastEmotionRef = useRef(null);
  const emotionCallback = useRef(onEmotionChange);
  const processFrameRef = useRef(() => {});
  const isModelLoadedRef = useRef(false);

  useEffect(() => {
    emotionCallback.current = onEmotionChange;
  }, [onEmotionChange]);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);

      isModelLoadedRef.current = true;
      setIsLoaded(true);
    } catch (err) {
      console.error('face-api.js model loading error:', err);
      setError('Could not load emotion detection models. Please check your connection.');
    }
  }, []);

  // Detect emotion from video frame
  const detectEmotion = useCallback(async (video) => {
    if (!video || !isModelLoadedRef.current || video.readyState < 2) {
      return null;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        }))
        .withFaceExpressions();

      if (!detection) {
        return { emotion: 'no_face', confidence: 0, expressions: null };
      }

      const expressions = detection.expressions;

      // Get dominant emotion
      const emotionScores = [
        { emotion: 'happy', score: expressions.happy },
        { emotion: 'sad', score: expressions.sad },
        { emotion: 'angry', score: expressions.angry },
        { emotion: 'fearful', score: expressions.fearful },
        { emotion: 'disgusted', score: expressions.disgusted },
        { emotion: 'surprised', score: expressions.surprised },
        { emotion: 'neutral', score: expressions.neutral }
      ];

      emotionScores.sort((a, b) => b.score - a.score);
      const dominant = emotionScores[0];

      return {
        emotion: dominant.emotion,
        confidence: dominant.score,
        expressions: {
          happy: expressions.happy,
          sad: expressions.sad,
          angry: expressions.angry,
          fearful: expressions.fearful,
          disgusted: expressions.disgusted,
          surprised: expressions.surprised,
          neutral: expressions.neutral
        }
      };
    } catch (err) {
      console.error('Face detection error:', err);
      return null;
    }
  }, []);

  // Process video frames
  const processFrame = useCallback(async () => {
    const video = videoRef.current;

    if (!video || !isModelLoadedRef.current || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(() => processFrameRef.current());
      return;
    }

    const result = await detectEmotion(video);

    if (result && result.emotion !== 'no_face') {
      // Only trigger callback if emotion changed or confidence is high
      if (lastEmotionRef.current !== result.emotion || result.confidence > 0.7) {
        lastEmotionRef.current = result.emotion;
        emotionCallback.current?.(result);
      }
    } else if (result && result.emotion === 'no_face') {
      // No face detected
      if (lastEmotionRef.current !== 'no_face') {
        lastEmotionRef.current = 'no_face';
        emotionCallback.current?.(result);
      }
    }

    // Run at ~10 FPS (less intensive than hand tracking)
    setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(() => processFrameRef.current());
    }, 100);
  }, [videoRef, detectEmotion]);

  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  const startTracking = useCallback(() => {
    if (isModelLoadedRef.current) {
      processFrameRef.current();
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    lastEmotionRef.current = null;
  }, []);

  useEffect(() => {
    loadModels();
    return () => {
      stopTracking();
    };
  }, [loadModels, stopTracking]);

  return { isLoaded, error, startTracking, stopTracking };
}
