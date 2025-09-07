import { useState, useCallback } from 'react';

export interface GlobalResult {
  id: string;
  name: string;
  url: string;
  processingDetails?: any;
  source: 'single' | 'batch';
  timestamp: number;
}

export const useGlobalResults = () => {
  const [globalResults, setGlobalResults] = useState<GlobalResult[]>([]);

  const addResults = useCallback((results: { name: string; url: string; processingDetails?: any }[], source: 'single' | 'batch') => {
    const newResults: GlobalResult[] = results.map((result, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      name: result.name,
      url: result.url,
      processingDetails: result.processingDetails,
      source,
      timestamp: Date.now()
    }));

    setGlobalResults(prev => [...prev, ...newResults]);
    return newResults;
  }, []);

  const clearResults = useCallback(() => {
    setGlobalResults([]);
  }, []);

  const removeResult = useCallback((id: string) => {
    setGlobalResults(prev => prev.filter(result => result.id !== id));
  }, []);

  return {
    globalResults,
    addResults,
    clearResults,
    removeResult
  };
};