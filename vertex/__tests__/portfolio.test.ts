import { describe, it, expect } from "vitest";
import { enrichHoldings, computePortfolioMetrics, type Holding, type QuoteData } from "@/lib/portfolio";

const mockHoldings: Holding[] = [
  { id: 1, ticker: "AAPL", name: "Apple Inc.", shares: 10, avg_cost: 150, broker: "Default", color: "#555" },
  { id: 2, ticker: "NVDA", name: "NVIDIA Corp.", shares: 20, avg_cost: 50, broker: "Robinhood", color: "#76b900" },
];

const mockQuotes: QuoteData[] = [
  { ticker: "AAPL", price: 200, change: 2, changePercent: 1.0, marketCap: 3e12, peRatio: 30, week52High: 220, week52Low: 140, volume: 50e6 },
  { ticker: "NVDA", price: 140, change: -3, changePercent: -2.1, marketCap: 3.5e12, peRatio: 60, week52High: 150, week52Low: 75, volume: 300e6 },
];

describe("enrichHoldings", () => {
  it("computes value, gainLoss, returnPct correctly", () => {
    const enriched = enrichHoldings(mockHoldings, mockQuotes);

    expect(enriched[0].price).toBe(200);
    expect(enriched[0].value).toBe(2000); // 10 * 200
    expect(enriched[0].gainLoss).toBe(500); // 2000 - 1500
    expect(enriched[0].returnPct).toBeCloseTo(33.33, 1); // 500/1500 * 100

    expect(enriched[1].value).toBe(2800); // 20 * 140
    expect(enriched[1].gainLoss).toBe(1800); // 2800 - 1000
    expect(enriched[1].returnPct).toBe(180); // 1800/1000 * 100
  });

  it("computes dayChange from quote change", () => {
    const enriched = enrichHoldings(mockHoldings, mockQuotes);
    expect(enriched[0].dayChange).toBe(20); // 2 * 10
    expect(enriched[1].dayChange).toBe(-60); // -3 * 20
  });

  it("uses avg_cost as fallback when no quote", () => {
    const enriched = enrichHoldings(mockHoldings, []);
    expect(enriched[0].price).toBe(150);
    expect(enriched[0].gainLoss).toBe(0);
  });
});

describe("computePortfolioMetrics", () => {
  it("computes total value and gain/loss", () => {
    const enriched = enrichHoldings(mockHoldings, mockQuotes);
    const metrics = computePortfolioMetrics(enriched);

    expect(metrics.totalValue).toBe(4800); // 2000 + 2800
    expect(metrics.totalCost).toBe(2500); // 1500 + 1000
    expect(metrics.totalGainLoss).toBe(2300);
    expect(metrics.totalReturnPct).toBeCloseTo(92, 0);
    expect(metrics.holdingsCount).toBe(2);
  });

  it("identifies best and worst performers", () => {
    const enriched = enrichHoldings(mockHoldings, mockQuotes);
    const metrics = computePortfolioMetrics(enriched);

    expect(metrics.bestPerformer?.ticker).toBe("NVDA");
    expect(metrics.worstPerformer?.ticker).toBe("AAPL");
  });

  it("computes allocation percentages", () => {
    const enriched = enrichHoldings(mockHoldings, mockQuotes);
    const metrics = computePortfolioMetrics(enriched);

    const aaplAlloc = metrics.allocation.find((a) => a.ticker === "AAPL");
    expect(aaplAlloc?.percentage).toBeCloseTo(41.67, 0);
  });

  it("handles empty holdings", () => {
    const metrics = computePortfolioMetrics([]);
    expect(metrics.totalValue).toBe(0);
    expect(metrics.holdingsCount).toBe(0);
  });
});
