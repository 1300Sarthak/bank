"use client";

import { createContext, useContext, useMemo } from "react";
import { useHoldings } from "@/hooks/useHoldings";
import { useQuotes } from "@/hooks/useQuotes";
import {
  enrichHoldings,
  computePortfolioMetrics,
  type EnrichedHolding,
} from "@/lib/portfolio";

interface PortfolioContextValue {
  holdings: EnrichedHolding[];
  metrics: ReturnType<typeof computePortfolioMetrics>;
  isLoading: boolean;
  mutateHoldings: () => void;
}

const defaultMetrics = computePortfolioMetrics([]);

const PortfolioContext = createContext<PortfolioContextValue>({
  holdings: [],
  metrics: defaultMetrics,
  isLoading: true,
  mutateHoldings: () => {},
});

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { holdings: rawHoldings, isLoading: holdingsLoading, mutate } = useHoldings();
  const tickers = useMemo(
    () => rawHoldings.map((h) => h.ticker),
    [rawHoldings]
  );
  const { quotes, isLoading: quotesLoading } = useQuotes(tickers);

  const holdings = useMemo(
    () => enrichHoldings(rawHoldings, quotes),
    [rawHoldings, quotes]
  );

  const metrics = useMemo(() => computePortfolioMetrics(holdings), [holdings]);

  return (
    <PortfolioContext.Provider
      value={{
        holdings,
        metrics,
        isLoading: holdingsLoading || quotesLoading,
        mutateHoldings: mutate,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}
