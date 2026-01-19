/**
 * useAISearch Hook
 * Handles AI search with loading states and error handling
 */

import { useState, useCallback } from 'react';
import { aiSearch } from '../services/ai.service';
import { AISearchInput, MergedSearchResult, LoadingState } from '../types/aiTypes';

interface UseAISearchResult {
  loadingState: LoadingState;
  results: MergedSearchResult | null;
  error: string | null;
  searchInput: AISearchInput | null;
  search: (input: AISearchInput) => Promise<void>;
  reset: () => void;
}

interface UseAISearchOptions {
  onSuccess?: (results: MergedSearchResult) => void;
  onError?: (error: string) => void;
}

export const useAISearch = (options: UseAISearchOptions = {}): UseAISearchResult => {
  const { onSuccess, onError } = options;

  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [results, setResults] = useState<MergedSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<AISearchInput | null>(null);

  const reset = useCallback(() => {
    setLoadingState('idle');
    setResults(null);
    setError(null);
    setSearchInput(null);
  }, []);

  const search = useCallback(async (input: AISearchInput) => {
    try {
      setLoadingState('loading');
      setError(null);
      setSearchInput(input);

      const response = await aiSearch(input);

      setResults(response.data);
      setLoadingState('success');
      onSuccess?.(response.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Search failed';
      setError(errorMsg);
      setLoadingState('error');
      onError?.(errorMsg);
    }
  }, [onSuccess, onError]);

  return {
    loadingState,
    results,
    error,
    searchInput,
    search,
    reset,
  };
};

export default useAISearch;
