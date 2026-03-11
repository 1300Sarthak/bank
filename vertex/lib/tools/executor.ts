import "server-only";
import * as fd from "@/lib/financial-data";
import { getQuotes } from "@/lib/quotes";
import getDb from "@/lib/db";
import { runDcfAnalysis } from "@/lib/skills/dcf";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  try {
    switch (name) {
      case "get_income_statements": {
        const result = await fd.getIncomeStatements(
          input.ticker,
          input.period || "annual",
          input.limit || 4
        );
        return JSON.stringify(result, null, 2);
      }

      case "get_balance_sheets": {
        const result = await fd.getBalanceSheets(
          input.ticker,
          input.period || "annual",
          input.limit || 4
        );
        return JSON.stringify(result, null, 2);
      }

      case "get_cash_flow_statements": {
        const result = await fd.getCashFlowStatements(
          input.ticker,
          input.period || "annual",
          input.limit || 4
        );
        return JSON.stringify(result, null, 2);
      }

      case "get_financial_metrics": {
        const result = await fd.getFinancialMetrics(
          input.ticker,
          input.period || "annual",
          input.limit || 4
        );
        return JSON.stringify(result, null, 2);
      }

      case "get_analyst_estimates": {
        const result = await fd.getAnalystEstimates(input.ticker, input.limit || 4);
        return JSON.stringify(result, null, 2);
      }

      case "get_price_targets": {
        const result = await fd.getPriceTargets(input.ticker, input.limit || 10);
        return JSON.stringify(result, null, 2);
      }

      case "get_insider_trades": {
        const result = await fd.getInsiderTrades(input.ticker, input.limit || 20);
        return JSON.stringify(result, null, 2);
      }

      case "get_company_news": {
        const result = await fd.getCompanyNews(input.ticker, input.limit || 10);
        return JSON.stringify(result, null, 2);
      }

      case "get_sec_filings": {
        // Alpha Vantage free tier has no direct SEC filing access — fall back to web search
        const filingType = input.type ? String(input.type) : "10-K 10-Q 8-K";
        return await searchWeb(
          `${input.ticker} ${filingType} SEC filing site:sec.gov OR site:investor.${String(input.ticker).toLowerCase()}.com`,
          input.limit || 5
        );
      }

      case "get_revenue_segments": {
        // Alpha Vantage free tier has no segment data — fall back to web search
        return await searchWeb(
          `${input.ticker} revenue breakdown by segment geography annual report`,
          5
        );
      }

      case "get_stock_price": {
        const result = await fd.getStockPrices(
          input.ticker,
          input.start_date,
          input.end_date,
          input.interval || "day",
          input.limit || 30
        );
        return JSON.stringify(result, null, 2);
      }

      case "get_metrics_snapshot": {
        const result = await fd.getMetricsSnapshot(input.ticker);
        return JSON.stringify(result, null, 2);
      }

      case "get_stock_quote": {
        const quotes = await getQuotes([input.ticker]);
        if (quotes.length === 0) return JSON.stringify({ error: "Ticker not found" });
        return JSON.stringify(quotes[0], null, 2);
      }

      case "search_web": {
        return await searchWeb(input.query, input.limit || 5);
      }

      case "get_portfolio_holdings": {
        const db = getDb();
        const holdings = db.prepare("SELECT * FROM holdings").all();
        return JSON.stringify(holdings, null, 2);
      }

      case "get_watchlist": {
        const db = getDb();
        const watchlist = db.prepare("SELECT * FROM watchlist").all();
        return JSON.stringify(watchlist, null, 2);
      }

      case "get_past_research": {
        const db = getDb();
        const query = input.query ? `%${input.query}%` : "%";
        const sessions = db
          .prepare(
            "SELECT query, response, tool_calls, created_at FROM ai_sessions WHERE query LIKE ? ORDER BY created_at DESC LIMIT 5"
          )
          .all(query);
        return JSON.stringify(sessions, null, 2);
      }

      case "run_dcf_analysis": {
        const report = await runDcfAnalysis(input.ticker);
        return report;
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return JSON.stringify({ error: message });
  }
}

async function searchWeb(query: string, limit: number): Promise<string> {
  // Exa neural search with finance-optimised settings
  const exaKey = process.env.EXASEARCH_API_KEY;
  if (exaKey) {
    try {
      // Detect if query is likely news-oriented for category hint
      const isNews = /news|earnings|report|announce|beat|miss|quarter|guidance/i.test(query);

      const body: Record<string, unknown> = {
        query,
        numResults: limit,
        type: "auto",            // balanced relevance & speed; falls back to neural
        useAutoprompt: true,     // Exa rewrites query for better retrieval
        contents: {
          text: { maxCharacters: 5000 }, // full text for richer context
        },
      };

      if (isNews) {
        body.category = "news";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (body as any).livecrawlOptions = { maxAgeHours: 48 }; // fresh news
      }

      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "x-api-key": exaKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return JSON.stringify(data.results?.map((r: any) => ({
          title: r.title,
          url: r.url,
          published: r.publishedDate,
          text: r.text?.slice(0, 2000),
        })) ?? [], null, 2);
      }
    } catch { /* fall through to Tavily */ }
  }

  // Tavily fallback
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          max_results: limit,
          search_depth: "advanced",
          include_raw_content: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return JSON.stringify(data.results?.map((r: any) => ({
          title: r.title,
          url: r.url,
          published: r.published_date,
          text: r.content?.slice(0, 2000),
        })) ?? [], null, 2);
      }
    } catch { /* fall through */ }
  }

  return JSON.stringify({
    note: "Web search not available. Set EXASEARCH_API_KEY or TAVILY_API_KEY in .env.local to enable.",
  });
}
