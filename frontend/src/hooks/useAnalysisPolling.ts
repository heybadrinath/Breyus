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
    pollingInterval = 3000,
    maxPolls = 100,
    maxRetries = 0,
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
  }, [stopPolling]);

  const poll = useCallback(async () => {
    if (!jobIdRef.current) return;

    try {
      pollCountRef.current += 1;

      // Update progress based on poll count with easing (faster at start, slower near end)
      const rawProgress = pollCountRef.current / maxPolls;
      const easedProgress = 1 - Math.pow(1 - rawProgress, 2); // Quadratic ease-out
      setProgress(Math.min(95, Math.round(easedProgress * 100)));

      const response = await getAnalysisResults(jobIdRef.current);
      const data = response.data;

      // Update progress from server if available (overrides estimate)
      if (data.progress !== undefined && data.progress > 0) {
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

      // Auto-retry on network errors if retries remaining
      if (retryCount < maxRetries && (errorMsg.includes('network') || errorMsg.includes('timeout'))) {
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

    jobIdRef.current = jobId;
    startTimeRef.current = Date.now();
    setStatus('pending');
    setIsPolling(true);

    // Start elapsed time tracker
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
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
