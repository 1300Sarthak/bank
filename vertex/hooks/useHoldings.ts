"use client";

import useSWR from "swr";
import type { Holding } from "@/lib/portfolio";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useHoldings() {
  const { data, error, isLoading, mutate } = useSWR<Holding[]>(
    "/api/holdings",
    fetcher
  );

  return {
    holdings: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
