import type OpenAI from "openai";

export const financialTools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_income_statements",
      description:
        "Get income statements (revenue, net income, EPS, margins, etc.) for a company. Returns historical income statement data.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL)" },
          period: {
            type: "string",
            enum: ["annual", "quarterly"],
            description: "Reporting period. Default: annual",
          },
          limit: { type: "number", description: "Number of periods to return. Default: 4" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_balance_sheets",
      description:
        "Get balance sheets (assets, liabilities, equity, cash, debt, etc.) for a company.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
          period: {
            type: "string",
            enum: ["annual", "quarterly"],
            description: "Default: annual",
          },
          limit: { type: "number", description: "Number of periods. Default: 4" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cash_flow_statements",
      description:
        "Get cash flow statements (operating, investing, financing cash flows, free cash flow, capex) for a company.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
          period: {
            type: "string",
            enum: ["annual", "quarterly"],
            description: "Default: annual",
          },
          limit: { type: "number", description: "Number of periods. Default: 4" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_metrics",
      description:
        "Get key financial metrics and ratios (P/E, P/B, ROE, ROA, debt-to-equity, profit margins, EPS, dividend yield, beta, market cap, analyst ratings) for a company.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analyst_estimates",
      description:
        "Get earnings history, EPS surprises, and available analyst estimates for a company.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
          limit: { type: "number", description: "Number of periods. Default: 4" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_price_targets",
      description:
        "Get analyst consensus price target from company overview data. Note: detailed per-analyst targets not available on free tier.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_insider_trades",
      description:
        "Get recent insider trading activity (buys, sells) by company executives and directors.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
          limit: { type: "number", description: "Number of trades. Default: 20" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_company_news",
      description:
        "Get recent news headlines and sentiment analysis for a company. Includes overall sentiment score and relevance.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
          limit: { type: "number", description: "Number of articles. Default: 10" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sec_filings",
      description:
        "Search for recent news and SEC filing summaries via web search, since direct SEC filing access requires a premium data tier.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
          type: {
            type: "string",
            description: "Filing type (e.g. 10-K, 10-Q, 8-K). Optional.",
          },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue_segments",
      description:
        "Search for revenue segment breakdown by business line and geography via web search. Direct segment data requires a premium data tier.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stock_price",
      description:
        "Get historical daily stock price data (open, high, low, close, volume) for a stock.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
          limit: { type: "number", description: "Number of trading days. Default: 30" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_metrics_snapshot",
      description:
        "Get a quick snapshot of current key metrics: market cap, P/E, EPS, dividend yield, 52-week range, revenue, sector, analyst target price, and more.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stock_quote",
      description:
        "Get a real-time stock quote with current price, change, volume, market cap, P/E, 52-week range using Yahoo Finance.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol" },
        },
        required: ["ticker"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description:
        "Search the web for financial news, analysis, SEC filings, market commentary, or any other information. Use this when you need current information beyond the financial data tools.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Number of results. Default: 5" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_portfolio_holdings",
      description:
        "Get the user's current portfolio holdings from Vertex. Returns ticker, shares, avg_cost, broker, and other holding details. Use this when the user asks what they own, their portfolio, or positions.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_watchlist",
      description:
        "Get the user's watchlist tickers from Vertex. Use this when the user asks about their watchlist.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_past_research",
      description:
        "Recall past AI research sessions. Optionally filter by query text to find relevant prior research.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search text to filter past sessions (optional)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_dcf_analysis",
      description:
        "Run a full discounted cash flow (DCF) valuation for a stock ticker. Computes intrinsic value per share with sensitivity analysis across WACC and growth rate assumptions. Returns a formatted markdown report.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL)" },
        },
        required: ["ticker"],
      },
    },
  },
];
