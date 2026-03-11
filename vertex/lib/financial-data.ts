import "server-only";

const BASE_URL = "https://www.alphavantage.co/query";

function getApiKey(): string {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) throw new Error("ALPHAVANTAGE_API_KEY not set");
  return key;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function avApi(func: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(BASE_URL);
  url.searchParams.set("function", func);
  url.searchParams.set("apikey", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Alpha Vantage HTTP error: ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as Record<string, any>;

  // Free tier rate limit / info messages
  if (data.Note) throw new Error(`Alpha Vantage rate limit: ${data.Note}`);
  if (data.Information) throw new Error(`Alpha Vantage: ${data.Information}`);

  return data;
}

// ──── Income Statements ────
export async function getIncomeStatements(
  ticker: string,
  period: "annual" | "quarterly" = "annual",
  limit = 4
) {
  const data = await avApi("INCOME_STATEMENT", { symbol: ticker });
  const reports =
    period === "quarterly"
      ? (data.quarterlyReports ?? []).slice(0, limit)
      : (data.annualReports ?? []).slice(0, limit);
  return { income_statements: reports, symbol: data.symbol };
}

// ──── Balance Sheets ────
export async function getBalanceSheets(
  ticker: string,
  period: "annual" | "quarterly" = "annual",
  limit = 4
) {
  const data = await avApi("BALANCE_SHEET", { symbol: ticker });
  const reports =
    period === "quarterly"
      ? (data.quarterlyReports ?? []).slice(0, limit)
      : (data.annualReports ?? []).slice(0, limit);
  return { balance_sheets: reports, symbol: data.symbol };
}

// ──── Cash Flow Statements ────
export async function getCashFlowStatements(
  ticker: string,
  period: "annual" | "quarterly" = "annual",
  limit = 4
) {
  const data = await avApi("CASH_FLOW", { symbol: ticker });
  const reports =
    period === "quarterly"
      ? (data.quarterlyReports ?? []).slice(0, limit)
      : (data.annualReports ?? []).slice(0, limit);
  // Annotate with computed free cash flow
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = reports.map((r: any) => ({
    ...r,
    free_cash_flow: String(
      Number(r.operatingCashflow ?? 0) - Math.abs(Number(r.capitalExpenditures ?? 0))
    ),
  }));
  return { cash_flow_statements: enriched, symbol: data.symbol };
}

// ──── Financial Metrics (uses OVERVIEW) ────
export async function getFinancialMetrics(
  ticker: string,
  _period?: string,
  _limit?: number
) {
  const data = await avApi("OVERVIEW", { symbol: ticker });
  return {
    financial_metrics: [
      {
        symbol: data.Symbol,
        name: data.Name,
        sector: data.Sector,
        industry: data.Industry,
        market_cap: data.MarketCapitalization,
        pe_ratio: data.PERatio,
        peg_ratio: data.PEGRatio,
        forward_pe: data.ForwardPE,
        trailing_pe: data.TrailingPE,
        price_to_book: data.PriceToBookRatio,
        price_to_sales_ttm: data.PriceToSalesRatioTTM,
        ev_to_revenue: data.EVToRevenue,
        ev_to_ebitda: data.EVToEBITDA,
        beta: data.Beta,
        eps: data.EPS,
        diluted_eps_ttm: data.DilutedEPSTTM,
        revenue_ttm: data.RevenueTTM,
        gross_profit_ttm: data.GrossProfitTTM,
        ebitda: data.EBITDA,
        profit_margin: data.ProfitMargin,
        operating_margin_ttm: data.OperatingMarginTTM,
        return_on_assets_ttm: data.ReturnOnAssetsTTM,
        return_on_equity_ttm: data.ReturnOnEquityTTM,
        quarterly_earnings_growth_yoy: data.QuarterlyEarningsGrowthYOY,
        quarterly_revenue_growth_yoy: data.QuarterlyRevenueGrowthYOY,
        dividend_yield: data.DividendYield,
        dividend_per_share: data.DividendPerShare,
        book_value: data.BookValue,
        shares_outstanding: data.SharesOutstanding,
        week_52_high: data["52WeekHigh"],
        week_52_low: data["52WeekLow"],
        moving_avg_50: data["50DayMovingAverage"],
        moving_avg_200: data["200DayMovingAverage"],
        fiscal_year_end: data.FiscalYearEnd,
        latest_quarter: data.LatestQuarter,
        analyst_target_price: data.AnalystTargetPrice,
        analyst_strong_buy: data.AnalystRatingStrongBuy,
        analyst_buy: data.AnalystRatingBuy,
        analyst_hold: data.AnalystRatingHold,
        analyst_sell: data.AnalystRatingSell,
        analyst_strong_sell: data.AnalystRatingStrongSell,
      },
    ],
  };
}

// ──── Analyst Estimates (uses EARNINGS) ────
export async function getAnalystEstimates(ticker: string, limit = 4) {
  const data = await avApi("EARNINGS", { symbol: ticker });
  return {
    annual_earnings: (data.annualEarnings ?? []).slice(0, limit),
    quarterly_earnings: (data.quarterlyEarnings ?? []).slice(0, limit),
    symbol: data.symbol,
    note: "Alpha Vantage free tier provides historical earnings. Forward estimates are in get_financial_metrics (analyst_target_price, forward_pe).",
  };
}

// ──── Price Targets (from OVERVIEW) ────
export async function getPriceTargets(ticker: string, _limit = 10) {
  const data = await avApi("OVERVIEW", { symbol: ticker });
  return {
    analyst_target_price: data.AnalystTargetPrice,
    analyst_strong_buy: data.AnalystRatingStrongBuy,
    analyst_buy: data.AnalystRatingBuy,
    analyst_hold: data.AnalystRatingHold,
    analyst_sell: data.AnalystRatingSell,
    analyst_strong_sell: data.AnalystRatingStrongSell,
    current_pe: data.TrailingPE,
    forward_pe: data.ForwardPE,
    symbol: data.Symbol,
    note: "Per-analyst price targets require a premium data tier. Consensus data shown above.",
  };
}

// ──── Insider Trades ────
export async function getInsiderTrades(ticker: string, limit = 20) {
  const data = await avApi("INSIDER_TRANSACTIONS", { symbol: ticker });
  const trades = (data.data ?? []).slice(0, limit);
  return { insider_trades: trades, symbol: ticker };
}

// ──── Company News (with sentiment) ────
export async function getCompanyNews(ticker: string, limit = 10) {
  const data = await avApi("NEWS_SENTIMENT", { tickers: ticker, limit: String(limit) });
  return {
    news: data.feed ?? [],
    sentiment_score_definition: data.sentiment_score_definition,
    relevance_score_definition: data.relevance_score_definition,
  };
}

// ──── SEC Filings (not available free — delegates to web search note) ────
export async function getSecFilings(ticker: string, type?: string, _limit = 5) {
  return {
    note: "Direct SEC filing access is not available on the Alpha Vantage free tier. Use the search_web tool to find SEC filings.",
    suggestion: `search_web: "${ticker} ${type ?? "10-K 10-Q"} SEC filing site:sec.gov"`,
    symbol: ticker,
  };
}

// ──── Revenue Segments (not available free) ────
export async function getRevenueSegments(ticker: string, _period?: string, _limit?: number) {
  return {
    note: "Revenue segment breakdown is not available on the Alpha Vantage free tier. Use search_web to find segment data.",
    suggestion: `search_web: "${ticker} revenue breakdown by segment geography"`,
    symbol: ticker,
  };
}

// ──── Historical Stock Prices ────
export async function getStockPrices(
  ticker: string,
  _startDate?: string,
  _endDate?: string,
  _interval: "day" | "week" | "month" = "day",
  limit = 30
) {
  const data = await avApi("TIME_SERIES_DAILY", {
    symbol: ticker,
    outputsize: limit > 100 ? "full" : "compact",
  });

  const timeSeries = data["Time Series (Daily)"] ?? {};
  const entries = Object.entries(timeSeries)
    .slice(0, limit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(([date, values]: [string, any]) => ({
      date,
      open: values["1. open"],
      high: values["2. high"],
      low: values["3. low"],
      close: values["4. close"],
      volume: values["5. volume"],
    }));

  return { prices: entries, symbol: ticker };
}

// ──── Metrics Snapshot (current key metrics from OVERVIEW) ────
export async function getMetricsSnapshot(ticker: string) {
  const data = await avApi("OVERVIEW", { symbol: ticker });
  return {
    snapshot: {
      symbol: data.Symbol,
      name: data.Name,
      sector: data.Sector,
      industry: data.Industry,
      description: data.Description?.slice(0, 500),
      exchange: data.Exchange,
      currency: data.Currency,
      country: data.Country,
      market_cap: data.MarketCapitalization,
      pe_ratio: data.PERatio,
      forward_pe: data.ForwardPE,
      peg_ratio: data.PEGRatio,
      eps: data.EPS,
      revenue_ttm: data.RevenueTTM,
      profit_margin: data.ProfitMargin,
      operating_margin: data.OperatingMarginTTM,
      roe: data.ReturnOnEquityTTM,
      roa: data.ReturnOnAssetsTTM,
      beta: data.Beta,
      dividend_yield: data.DividendYield,
      week_52_high: data["52WeekHigh"],
      week_52_low: data["52WeekLow"],
      analyst_target_price: data.AnalystTargetPrice,
      moving_avg_50: data["50DayMovingAverage"],
      moving_avg_200: data["200DayMovingAverage"],
      shares_outstanding: data.SharesOutstanding,
      ebitda: data.EBITDA,
      ev_to_ebitda: data.EVToEBITDA,
      price_to_book: data.PriceToBookRatio,
    },
  };
}
