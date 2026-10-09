'use client';

import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

export interface FetchedTitle {
  title: string;
  siteName: string;
}

function isHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function useFetchTitle(url: string, { enabled = true } = {}) {
  const debouncedUrl = useDebouncedValue(url.trim(), 500);
  const canFetch = enabled && !!debouncedUrl && isHttpUrl(debouncedUrl);
  return useQuery<FetchedTitle>({
    queryKey: ['fetch-title', debouncedUrl],
    enabled: canFetch,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(debouncedUrl)}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `${res.status}`);
      }
      return (await res.json()) as FetchedTitle;
    },
  });
}
