/**
 * useAnalysisPolling Hook
 * Handles async market analysis polling with progress tracking
 * Features:
 * - Automatic progress estimation
 * - Timeout handling with user-friendly messages
 * - Retry capability
 * - Elapsed time tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAnalysisResults } from '../services/ai.service';
import { AnalysisResult, AnalysisStatus } from '../types/aiTypes';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// These can be adjusted based on server performance and requirements
// ═══════════════════════════════════════════════════════════════

/** Default polling interval in milliseconds */
export const DEFAULT_POLLING_INTERVAL_MS = 3000;

/** Default maximum number of polls before timeout (100 * 3s = 5 minutes) */
export const DEFAULT_MAX_POLLS = 100;

/** Default maximum automatic retries on transient errors */
export const DEFAULT_MAX_RETRIES = 0;

/** Estimated duration for analysis in seconds (for progress estimation) */
export const ESTIMATED_ANALYSIS_DURATION_SECONDS = 90;

interface UseAnalysisPollingResult {
  status: 'idle' | 'pending' | 'completed' | 'failed' | 'timeout';
  progress: number;
  result: AnalysisResult | null;
  error: string | null;
  isPolling: boolean;
  elapsedSeconds: number;      // Time elapsed since polling started
  estimatedRemaining: number;  // Estimated seconds remaining
  retryCount: number;          // Number of retries attempted
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
  reset: () => void;
  retry: () => void;           // Retry the last job
}

interface UseAnalysisPollingOptions {
  pollingInterval?: number;  // ms between polls (default: 3000)
  maxPolls?: number;         // max number of polls before timeout (default: 100 = 5 min)
  maxRetries?: number;       // max automatic retries on failure (default: 0)
  onComplete?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
}

export const useAnalysisPolling = (
  options: UseAnalysisPollingOptions = {}
): UseAnalysisPollingResult => {
  const {
    pollingInterval = DEFAULT_POLLING_INTERVAL_MS,
    maxPolls = DEFAULT_MAX_POLLS,
    maxRetries = DEFAULT_MAX_RETRIES,
    onComplete,
    onError,
    onTimeout,
  } = options;

  const [status, setStatus] = useState<'idle' | 'pending' | 'completed' | 'failed' | 'timeout'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const pollCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  // Track server-provided progress to prioritize it over local estimates
  const serverProgressRef = useRef<number | null>(null);

  // Calculate estimated remaining time
  const estimatedTotalSeconds = (maxPolls * pollingInterval) / 1000;
  const estimatedRemaining = Math.max(0, Math.round(estimatedTotalSeconds - elapsedSeconds));

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setElapsedSeconds(0);
    setRetryCount(0);
    pollCountRef.current = 0;
    jobIdRef.current = null;
    startTimeRef.current = null;
    serverProgressRef.current = null;
  }, [stopPolling]);

  const poll = useCallback(async () => {
    if (!jobIdRef.current) return;

    try {
      pollCountRef.current += 1;

      const response = await getAnalysisResults(jobIdRef.current);
      const data = response.data;

      // Prioritize server-provided progress over local estimates
      if (data.progress !== undefined && data.progress > 0) {
        serverProgressRef.current = data.progress;
        // Server progress takes precedence - update immediately
        setProgress(data.progress);
      }

      if (data.status === 'COMPLETED' && data.result) {
        setResult(data.result);
        setStatus('completed');
        setProgress(100);
        stopPolling();
        onComplete?.(data.result);
        return;
      }

      if (data.status === 'FAILED') {
        const errorMsg = data.error || 'Analysis failed';
        setError(errorMsg);
        setStatus('failed');
        stopPolling();
        onError?.(errorMsg);
        return;
      }

      // Check for timeout
      if (pollCountRef.current >= maxPolls) {
        const totalMinutes = Math.round(estimatedTotalSeconds / 60);
        const timeoutError = `Analysis is taking longer than expected (${totalMinutes} min). The AI server may be under heavy load. You can try again or check back later.`;
        setError(timeoutError);
        setStatus('timeout');
        stopPolling();
        onTimeout?.();
        onError?.(timeoutError);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch results';
      const lowerErrorMsg = errorMsg.toLowerCase();

      // Auto-retry on transient errors if retries remaining
      // Covers: network errors, timeouts, server errors (500, 502, 503, 504), fetch failures
      const isTransientError =
        lowerErrorMsg.includes('network') ||
        lowerErrorMsg.includes('timeout') ||
        lowerErrorMsg.includes('fetch') ||
        lowerErrorMsg.includes('failed to') ||
        lowerErrorMsg.includes('connection') ||
        lowerErrorMsg.includes('503') ||
        lowerErrorMsg.includes('502') ||
        lowerErrorMsg.includes('504') ||
        lowerErrorMsg.includes('500') ||
        err instanceof TypeError; // fetch network errors often throw TypeError

      if (retryCount < maxRetries && isTransientError) {
        setRetryCount(prev => prev + 1);
        return; // Don't stop polling, will retry on next interval
      }

      setError(errorMsg);
      setStatus('failed');
      stopPolling();
      onError?.(errorMsg);
    }
  }, [maxPolls, maxRetries, retryCount, estimatedTotalSeconds, stopPolling, onComplete, onError, onTimeout]);

  const startPolling = useCallback((jobId: string) => {
    // Reset state
    reset();
    serverProgressRef.current = null;

    jobIdRef.current = jobId;
    startTimeRef.current = Date.now();
    setStatus('pending');
    setIsPolling(true);

    // Start with initial progress to show immediate feedback
    setProgress(5);

    // Start elapsed time tracker with smooth progress estimation
    // Only use time-based estimate when server doesn't provide progress
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);

        // Only use time-based progress if server hasn't provided progress yet
        // This prevents jitter between server and local estimates
        if (serverProgressRef.current === null) {
          // Use smooth logarithmic curve with configurable estimated duration
          // Analysis typically takes 30-120 seconds depending on commodity
          const timeProgress = Math.min(85, Math.round((1 - Math.exp(-elapsed / (ESTIMATED_ANALYSIS_DURATION_SECONDS / 2.5))) * 90));

          // Smooth update - only increase, never decrease
          setProgress(prev => Math.max(prev, timeProgress));
        }
      }
    }, 1000);

    // Start polling
    intervalRef.current = setInterval(poll, pollingInterval);

    // Initial poll
    poll();
  }, [poll, pollingInterval, reset]);

  const retry = useCallback(() => {
    if (jobIdRef.current) {
      const jobId = jobIdRef.current;
      setRetryCount(prev => prev + 1);
      startPolling(jobId);
    }
  }, [startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    status,
    progress,
    result,
    error,
    isPolling,
    elapsedSeconds,
    estimatedRemaining,
    retryCount,
    startPolling,
    stopPolling,
    reset,
    retry,
  };
};

export default useAnalysisPolling;
