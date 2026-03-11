export interface Holding {
  id: number;
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  broker: string;
  color: string;
}

export interface QuoteData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number | null;
  peRatio: number | null;
  week52High: number | null;
  week52Low: number | null;
  volume: number | null;
}

export interface EnrichedHolding extends Holding {
  price: number;
  value: number;
  gainLoss: number;
  returnPct: number;
  dayChange: number;
  dayChangePct: number;
}

export function enrichHoldings(
  holdings: Holding[],
  quotes: QuoteData[]
): EnrichedHolding[] {
  const quoteMap = new Map(quotes.map((q) => [q.ticker, q]));

  return holdings.map((h) => {
    const q = quoteMap.get(h.ticker);
    const price = q?.price ?? h.avg_cost;
    const value = price * h.shares;
    const costBasis = h.avg_cost * h.shares;
    const gainLoss = value - costBasis;
    const returnPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    const dayChange = (q?.change ?? 0) * h.shares;
    const dayChangePct = q?.changePercent ?? 0;

    return {
      ...h,
      price,
      value,
      gainLoss,
      returnPct,
      dayChange,
      dayChangePct,
    };
  });
}

export function computePortfolioMetrics(holdings: EnrichedHolding[]) {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.avg_cost * h.shares, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalReturnPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const dayChange = holdings.reduce((sum, h) => sum + h.dayChange, 0);

  let bestPerformer = holdings[0];
  let worstPerformer = holdings[0];
  for (const h of holdings) {
    if (h.returnPct > (bestPerformer?.returnPct ?? -Infinity)) bestPerformer = h;
    if (h.returnPct < (worstPerformer?.returnPct ?? Infinity)) worstPerformer = h;
  }

  const allocation = holdings.map((h) => ({
    ticker: h.ticker,
    value: h.value,
    percentage: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
    color: h.color,
  }));

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalReturnPct,
    dayChange,
    bestPerformer,
    worstPerformer,
    allocation,
    holdingsCount: holdings.length,
  };
}
