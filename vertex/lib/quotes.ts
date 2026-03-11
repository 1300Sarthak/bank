import "server-only";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

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

export async function getQuotes(tickers: string[]): Promise<QuoteData[]> {
  if (tickers.length === 0) return [];

  try {
    const results = await yahooFinance.quote(tickers);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes: any[] = Array.isArray(results) ? results : [results];

    return quotes.map((q) => ({
      ticker: q.symbol as string,
      price: (q.regularMarketPrice as number) ?? 0,
      change: (q.regularMarketChange as number) ?? 0,
      changePercent: (q.regularMarketChangePercent as number) ?? 0,
      marketCap: (q.marketCap as number) ?? null,
      peRatio: (q.trailingPE as number) ?? null,
      week52High: (q.fiftyTwoWeekHigh as number) ?? null,
      week52Low: (q.fiftyTwoWeekLow as number) ?? null,
      volume: (q.regularMarketVolume as number) ?? null,
    }));
  } catch (error) {
    console.error("Yahoo Finance error:", error);
    return [];
  }
}
