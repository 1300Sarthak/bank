"use client";

import useSWR from "swr";
import type { QuoteData } from "@/lib/portfolio";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useQuotes(tickers: string[]) {
  const key =
    tickers.length > 0
      ? `/api/quotes?tickers=${tickers.join(",")}`
      : null;

  const { data, error, isLoading } = useSWR<QuoteData[]>(key, fetcher, {
    refreshInterval: 60_000,
  });

  return {
    quotes: data ?? [],
    isLoading,
    error,
  };
}
