import { useState, useCallback } from 'react';

interface SearchResult {
  product_id: number;
  product_name: string;
  sku_code: string;
  image_url: string;
  similarity_score: number;
  description: string;
  sale_price: number;
  cost_price: number;
}

interface UseImageSearchResult {
  isLoading: boolean;
  error: string | null;
  results: SearchResult[];
  hasSearched: boolean;
  searchByImage: (file: File, topK?: number, scoreThreshold?: number) => Promise<void>;
  searchByUrl: (imageUrl: string, topK?: number, scoreThreshold?: number) => Promise<void>;
  clearResults: () => void;
}

export const useImageSearch = (): UseImageSearchResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setHasSearched(false);
  }, []);

  const searchByImage = useCallback(
    async (file: File, topK: number = 10, scoreThreshold: number = 0.5) => {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('top_k', topK.toString());
        formData.append('score_threshold', scoreThreshold.toString());

        const token = localStorage.getItem('token');
        const response = await fetch('/api/search-products/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const searchByUrl = useCallback(
    async (imageUrl: string, topK: number = 10, scoreThreshold: number = 0.5) => {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          image_url: imageUrl,
          top_k: topK.toString(),
          score_threshold: scoreThreshold.toString(),
        });

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/search-products-url/?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    results,
    hasSearched,
    searchByImage,
    searchByUrl,
    clearResults,
  };
};
