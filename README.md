# Vertex — Personal Finance Dashboard

A full-stack personal finance dashboard built with **Next.js 16**, **React 19**, and **SQLite**. Track your investment portfolio, monitor spending via linked bank accounts, maintain watchlists, analyze asset allocation, and chat with an AI-powered financial research assistant that can pull real financial data, run DCF valuations, and search the web — all in one place.

**Built by [Sarthak Sethi](https://github.com/sarthaksethi)**

---

## Table of Contents

- [How I Built This](#how-i-built-this)
- [Features](#features)
- [Vertex AI — The AI Financial Assistant](#vertex-ai--the-ai-financial-assistant)
- [Things You Can Do](#things-you-can-do)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Docker](#docker)
- [Deploying to Render (Backend)](#deploying-to-render)
- [Deploying to Vercel (Frontend)](#deploying-to-vercel)
- [Testing](#testing)
- [Security](#security)
- [Roadmap](#roadmap)
- [License](#license)

---

## How I Built This

I built Vertex because I wanted a single place to see my entire financial picture — portfolio, spending, watchlist — without bouncing between Robinhood, my bank app, and Yahoo Finance. I also wanted to experiment with building an AI agent that could actually pull real financial data and reason about it, rather than just generating generic text.

**The core idea was simple:** what if I could ask "Is NVDA overvalued?" and get back an answer grounded in actual income statements, analyst estimates, and a DCF model — not hallucinated numbers?

Here's how it came together:

1. **Started with the portfolio tracker.** I chose Next.js 16 with the App Router because I wanted the frontend and backend in one codebase — no separate Express server. SQLite with better-sqlite3 was the obvious choice for a personal dashboard: zero setup, file-based, fast reads. I added Yahoo Finance for real-time quotes and built the holdings CRUD with CSV import so I could dump my brokerage exports straight in.

2. **Added the spending dashboard.** I integrated Teller.io to pull bank account balances and transactions. Teller uses mTLS (mutual TLS) for security, so I had to configure certificate-based authentication with PEM files. The spending page shows all linked accounts with filterable transaction tables.

3. **Built the AI assistant (Vertex AI / Dexter).** This was the most involved piece. I didn't want a simple chatbot — I wanted an **agentic system** that could autonomously decide which tools to call, chain multiple data fetches together, and synthesize the results. I used the OpenAI SDK pointed at OpenAI-compatible providers (Groq's free tier of Llama 3.3 70B turned out to be great for this). The agent has access to 18 tools — from pulling income statements off Alpha Vantage to running full DCF valuations with sensitivity tables. The key insight was the tool-calling loop: the LLM decides what data it needs, the server executes those tool calls, feeds the results back, and the model continues reasoning. This can iterate up to 10 times per query, which means the agent can do multi-step research like "get AAPL's financials, compare them to the sector, then run a DCF."

4. **Added web search.** I integrated both Exa (neural search with auto-prompting) and Tavily as fallbacks. This lets the AI answer questions about current events, earnings reports, or anything not covered by the structured financial APIs.

5. **Built the DCF engine.** This was a fun one — a full discounted cash flow valuation that pulls historical revenue, free cash flow, beta, and shares outstanding, then projects 5-year FCFs, computes terminal value via Gordon Growth, and generates a sensitivity matrix across WACC and growth rate assumptions. The agent can invoke this with a single tool call.

6. **Polished the UX.** Dark/light theme with system preference detection. Three-phase status indicator during AI responses (thinking → fetching → writing) with live elapsed timers and tool call badges so you can see exactly what the agent is doing. Markdown rendering for AI responses with code blocks, tables, and inline formatting.

The whole thing is a single Next.js app — no microservices, no separate API server. SQLite handles the persistence, the App Router handles both the UI and the API, and the AI agent ties it all together.

— **Sarthak Sethi**

---

## Features

### Portfolio Tracker
- Add, edit, and delete stock holdings with ticker, shares, average cost, and broker
- CSV import with preview validation (via PapaParse) — dump your brokerage exports straight in
- Real-time quotes from Yahoo Finance with batch fetching (up to 50 tickers)
- Historical OHLC charts with configurable periods (1H, 1D, 1W, 1Y, YTD)
- Stock detail modal with sparkline charts and key metrics
- Summary grid: total portfolio value, daily P&L, overall gain/loss
- Per-broker color coding (Robinhood, Fidelity, Schwab, Vanguard, E\*TRADE, Interactive Brokers)
- Search and sort across all holdings

### Spending Dashboard
- Link bank accounts via **Teller.io** with mTLS certificate authentication
- View account balances across all connected institutions
- Browse and filter transactions with date range selectors
- Per-account drill-down at `/dashboard/spending/[accountId]`
- Masked account numbers for security

### Watchlist
- Add/remove tickers to a personal watchlist
- Live price updates via Yahoo Finance
- Quick-glance sparkline charts per ticker

### Asset Allocation
- Interactive donut chart visualization of portfolio allocation
- Sortable allocation breakdown list by value, percentage, or ticker

### UI/UX
- Dark/light theme with system preference detection and localStorage persistence
- Typography: DM Sans (body), JetBrains Mono (code), Instrument Serif (display)
- Responsive sidebar navigation with active route highlighting
- Tailwind CSS 4 styling
- Smooth animations and transitions throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **UI** | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com) |
| **Language** | TypeScript 5 |
| **Database** | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (WAL mode) |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org) — Credentials provider, JWT sessions |
| **Market Data** | [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2) (quotes & charts) |
| **Financial Data** | [Alpha Vantage API](https://www.alphavantage.co) (statements, metrics, filings) |
| **Banking** | [Teller.io](https://teller.io) (accounts, balances, transactions via mTLS) |
| **AI** | [OpenAI SDK](https://github.com/openai/openai-node) (OpenAI-compatible — Blackbox AI / Groq / OpenAI) |
| **Validation** | [Zod 4](https://zod.dev), [@t3-oss/env-nextjs](https://env.t3.gg) |
| **Data Fetching** | [SWR](https://swr.vercel.app) (client-side), Route Handlers (server-side) |
| **CSV Parsing** | [PapaParse](https://www.papaparse.com) |
| **Password Hashing** | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Testing** | [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com) |
| **Linting** | ESLint with eslint-config-next |

---

## Architecture

Vertex is a **monolithic Next.js application** — the frontend and backend live in the same codebase. The App Router serves both the React UI and the API route handlers.

```
Browser
  │
  ├── /login ────────────── NextAuth Credentials login
  ├── /dashboard ────────── Portfolio overview (holdings, quotes, charts)
  ├── /dashboard/watchlist ─ Watchlist management
  ├── /dashboard/allocation  Asset allocation visualization
  ├── /dashboard/spending ── Teller-linked bank accounts & transactions
  ├── /dashboard/ai ──────── AI chat assistant
  │
  └── /api/* ────────────── Route Handlers (server-side)
        ├── /api/auth/*         NextAuth endpoints
        ├── /api/holdings       CRUD for portfolio holdings
        ├── /api/watchlist      CRUD for watchlist
        ├── /api/quotes         Batch stock quotes (Yahoo Finance)
        ├── /api/chart          Historical OHLC data (Yahoo Finance)
        ├── /api/financials/*   Financial statements & data (Alpha Vantage)
        ├── /api/chat           AI streaming chat with tool calling
        ├── /api/import         CSV import with preview
        └── /api/health         Health check
```

**Data flow:**
1. Client components use **SWR** hooks to call `/api/*` route handlers
2. Route handlers authenticate via `getServerSession` (NextAuth JWT)
3. Server-side logic in `lib/` fetches from external APIs or queries SQLite
4. The `middleware.ts` gate redirects unauthenticated users to `/login`

---

## Project Structure

```
bank/
├── README.md                    # This file
├── Dockerfile                   # Docker containerization
├── .dockerignore                # Docker build exclusions
├── .gitignore                   # Git exclusions
├── Things_to_add.md             # Product backlog / ideas
├── teller/                      # Teller.io mTLS certificates (gitignored)
│   ├── certificate.pem
│   └── private_key.pem
│
└── vertex/                      # Main application
    ├── package.json             # Dependencies & scripts
    ├── next.config.ts           # Next.js config (security headers, external packages)
    ├── tsconfig.json            # TypeScript config
    ├── postcss.config.mjs       # PostCSS / Tailwind 4
    ├── eslint.config.mjs        # ESLint config
    ├── middleware.ts             # Auth middleware (JWT gate)
    ├── env.ts                   # Validated env vars (@t3-oss/env-nextjs)
    ├── .env.example             # Environment variable template
    ├── .env.local               # Local secrets (NOT committed)
    │
    ├── app/                     # Next.js App Router
    │   ├── layout.tsx           # Root layout (fonts, theme, session)
    │   ├── page.tsx             # Landing / redirect
    │   ├── globals.css          # Global styles
    │   ├── login/page.tsx       # Login page
    │   ├── dashboard/
    │   │   ├── page.tsx         # Portfolio dashboard
    │   │   ├── watchlist/page.tsx
    │   │   ├── allocation/page.tsx
    │   │   ├── spending/page.tsx
    │   │   ├── spending/[accountId]/page.tsx
    │   │   └── ai/page.tsx
    │   └── api/                 # API route handlers
    │       ├── auth/[...nextauth]/route.ts
    │       ├── holdings/route.ts
    │       ├── holdings/[id]/route.ts
    │       ├── watchlist/route.ts
    │       ├── watchlist/[id]/route.ts
    │       ├── quotes/route.ts
    │       ├── chart/route.ts
    │       ├── chat/route.ts
    │       ├── import/route.ts
    │       ├── financials/search/route.ts
    │       └── health/route.ts
    │
    ├── components/              # React components
    │   ├── layout/Sidebar.tsx
    │   ├── portfolio/           # HoldingsTable, SummaryGrid, AddHoldingModal, etc.
    │   ├── watchlist/WatchlistCard.tsx
    │   ├── allocation/          # DonutChart, AllocationList
    │   ├── spending/            # AccountsOverview, TransactionTable, SpendingFilters
    │   ├── chat/                # ChatPanel, ChatMessage, ToolCallBadge
    │   ├── charts/Sparkline.tsx
    │   ├── ui/                  # Badge, SearchBox, ThemeToggle
    │   └── SessionProvider.tsx
    │
    ├── context/                 # React context providers
    │   ├── PortfolioContext.tsx
    │   └── ThemeContext.tsx
    │
    ├── hooks/                   # Custom React hooks
    │   ├── useTellerAccounts.ts
    │   └── useTellerTransactions.ts
    │
    ├── lib/                     # Server-side logic
    │   ├── db.ts                # SQLite connection (better-sqlite3, WAL mode)
    │   ├── auth.ts              # NextAuth config (Credentials, JWT, bcrypt)
    │   ├── quotes.ts            # Yahoo Finance quote fetching
    │   ├── teller.ts            # Teller.io mTLS client
    │   ├── financial-data.ts    # Alpha Vantage API wrapper
    │   ├── ratelimit.ts         # In-memory rate limiter
    │   ├── validators/          # Zod schemas (teller, etc.)
    │   ├── agent/               # AI agent loop
    │   │   ├── run.ts           # Multi-provider agent with tool calling
    │   │   └── prompts.ts       # System prompt
    │   └── tools/               # AI tool definitions & executor
    │       ├── definitions.ts
    │       └── executor.ts
    │
    ├── db/
    │   └── schema.sql           # SQLite DDL (holdings, watchlist, brokers, ai_sessions)
    │
    └── __tests__/               # Vitest test suite
        ├── portfolio.test.ts
        ├── csv.test.ts
        └── teller.test.ts
```

---

## Database Schema

Vertex uses **SQLite** with WAL journaling mode. The schema is auto-applied on first connection.

### `holdings`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `ticker` | TEXT | Stock symbol (e.g. AAPL) |
| `name` | TEXT | Company name |
| `shares` | REAL | Number of shares |
| `avg_cost` | REAL | Average cost basis per share |
| `broker` | TEXT | Broker name (default: 'Default') |
| `color` | TEXT | Hex color for UI display |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

### `watchlist`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `ticker` | TEXT UNIQUE | Stock symbol |
| `name` | TEXT | Company name |
| `added_at` | TEXT | ISO timestamp |

### `brokers`
Seeded with preset broker names and colors: Robinhood, Fidelity, Charles Schwab, TD Ameritrade, E\*TRADE, Vanguard, Interactive Brokers, Default.

### `ai_sessions`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `query` | TEXT | User's message |
| `response` | TEXT | Assistant's response |
| `tool_calls` | TEXT | JSON of tools invoked |
| `created_at` | DATETIME | Timestamp |

---

## API Reference

All endpoints (except `/api/auth/*` and `/api/health`) require an authenticated session (JWT cookie).

| Method | Endpoint | Description |
|---|---|---|
| `*` | `/api/auth/[...nextauth]` | NextAuth sign-in, session, CSRF |
| `GET` | `/api/health` | Health check — `{ status, timestamp }` |
| `GET` | `/api/holdings` | List all holdings |
| `POST` | `/api/holdings` | Create a holding — body: `{ ticker, name, shares, avg_cost, broker? }` |
| `PUT` | `/api/holdings/[id]` | Update a holding |
| `DELETE` | `/api/holdings/[id]` | Delete a holding |
| `GET` | `/api/watchlist` | List watchlist items |
| `POST` | `/api/watchlist` | Add to watchlist — body: `{ ticker, name }` |
| `DELETE` | `/api/watchlist/[id]` | Remove from watchlist |
| `POST` | `/api/import` | Import CSV — body: `{ csv }` or multipart; `?action=preview` for dry run |
| `GET` | `/api/quotes?tickers=AAPL,MSFT` | Batch quotes (max 50 tickers) |
| `GET` | `/api/chart?ticker=AAPL&period=1Y` | Historical chart data (periods: `1H`, `1D`, `1W`, `1Y`, `YTD`) |
| `GET` | `/api/financials/search?ticker=AAPL&type=snapshot` | Financial data (types below) |
| `POST` | `/api/chat` | AI chat — body: `{ messages }`, returns SSE stream |

### Financial Data Types (`/api/financials/search`)

`snapshot` (default), `income`, `balance`, `cashflow`, `metrics`, `estimates`, `targets`, `insider`, `news`, `filings`, `segments`

---

## Authentication

Vertex uses **NextAuth.js v4** with a single **Credentials** provider:

1. Set either `APP_PASSWORD` (plaintext, for dev) or `APP_PASSWORD_HASH` (bcrypt hash, for production) in your environment
2. Users authenticate at `/login` with the password
3. On success, a **JWT** is issued (8-hour expiry) and stored as an HTTP-only cookie
4. The `middleware.ts` intercepts every request and redirects unauthenticated users to `/login`
5. API routes additionally check `getServerSession` and return `401` if missing

**To generate a bcrypt hash for production:**
```bash
node -e "const b = require('bcryptjs'); console.log(b.hashSync('your-password', 10))"
```

---

## Vertex AI — The AI Financial Assistant

Vertex AI is the built-in financial research assistant at `/dashboard/ai`. It's not a generic chatbot — it's an **agentic system** that autonomously decides which financial data to pull, chains multiple tool calls together, and synthesizes the results into actionable analysis.

### How It Works

When you send a message, here's what happens under the hood:

1. **Your message** hits the `/api/chat` route handler, which authenticates you and starts a **Server-Sent Events (SSE)** stream back to the browser
2. **The agent loop** sends your message (plus conversation history) to the configured LLM with all 18 tool definitions attached
3. **The model decides** which tools to call — it might pull income statements, then balance sheets, then run a DCF, all in sequence
4. **Each tool call** is executed server-side (fetching from Alpha Vantage, Yahoo Finance, Exa/Tavily, or querying your local SQLite database) and the result is fed back to the model
5. **This loops up to 10 iterations** — the model keeps calling tools and reasoning until it has enough data to write a final response
6. **The response streams** token-by-token to the chat UI, with real-time tool call badges showing exactly what's happening
7. **The session is saved** to SQLite so the agent can recall past research in future conversations

### The Chat UI

The chat interface shows a real-time three-phase status indicator while the agent works:

- **Analyzing** (purple) — the model is reading your question and deciding what to do
- **Fetching** (amber) — a tool is actively running (shows which tool, e.g. "Fetching income statements…")
- **Writing** (green) — the model is generating the response

Each tool call appears as a labeled badge (e.g. "Income Statements", "DCF Valuation", "Web Search"). A live elapsed timer shows how long the query is taking, with ETA hints for slower operations like DCF analysis (20-35s) or multi-step research (15-25s).

AI responses are rendered with full markdown support: bold, headers, bullet lists, code blocks, and tables — which is especially useful for financial comparisons and DCF sensitivity matrices.

### LLM Provider Priority

The agent uses the **OpenAI SDK** pointed at OpenAI-compatible endpoints. It checks environment variables in this order:

| Priority | Provider | Env Variable | Default Model | Notes |
|---|---|---|---|---|
| 1 | Blackbox AI | `BLACKBOXAIAPI` | `moonshotai/Kimi-K2-Instruct` | Pay-as-you-go |
| 2 | Groq | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | Free tier — get a key at [console.groq.com](https://console.groq.com) |
| 3 | OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` | Paid |

If no API key is configured, the assistant displays a helpful message explaining which keys to set.

### All 18 Tools

The agent has access to these tools and decides autonomously when to use them:

| Tool | What It Does | Data Source |
|---|---|---|
| `get_metrics_snapshot` | Quick company overview: sector, market cap, P/E, EPS, margins, 52-week range, analyst target | Alpha Vantage |
| `get_stock_quote` | Real-time price, change, volume, market cap, P/E, 52-week range | Yahoo Finance |
| `get_stock_price` | Historical daily OHLC + volume (configurable limit, default 30 days) | Alpha Vantage |
| `get_income_statements` | Revenue, net income, EPS, margins (annual or quarterly, up to 5 periods) | Alpha Vantage |
| `get_balance_sheets` | Assets, liabilities, equity, cash, debt (annual or quarterly) | Alpha Vantage |
| `get_cash_flow_statements` | Operating, investing, financing cash flows + computed free cash flow | Alpha Vantage |
| `get_financial_metrics` | 30+ ratios: P/E, P/B, ROE, ROA, margins, EV/EBITDA, beta, dividends, analyst ratings | Alpha Vantage |
| `get_analyst_estimates` | Historical EPS, earnings surprises, quarterly earnings history | Alpha Vantage |
| `get_price_targets` | Analyst consensus target, strong buy/buy/hold/sell/strong sell counts | Alpha Vantage |
| `get_insider_trades` | Recent insider buys and sells by executives and directors | Alpha Vantage |
| `get_company_news` | News headlines with sentiment scores and relevance ranking | Alpha Vantage |
| `get_sec_filings` | SEC filing search (10-K, 10-Q, 8-K) via web search | Exa / Tavily |
| `get_revenue_segments` | Revenue breakdown by business line and geography via web search | Exa / Tavily |
| `search_web` | General web search for news, analysis, or any current information | Exa (primary) / Tavily (fallback) |
| `get_portfolio_holdings` | Your actual Vertex portfolio — tickers, shares, cost basis, brokers | Local SQLite |
| `get_watchlist` | Your Vertex watchlist tickers | Local SQLite |
| `get_past_research` | Recall previous AI research sessions (searchable by query text) | Local SQLite |
| `run_dcf_analysis` | Full DCF valuation with 5-year projections, terminal value, and sensitivity matrix | Alpha Vantage + computed |

### The DCF Engine

The `run_dcf_analysis` tool is a fully automated discounted cash flow model:

1. **Fetches data in parallel**: income statements (5 years), balance sheets, cash flow statements, and financial metrics
2. **Computes WACC** from beta using CAPM (risk-free rate: 4.5%, equity risk premium: 5.5%)
3. **Estimates growth** from historical revenue trends (capped between -10% and 50%)
4. **Projects 5-year free cash flows** using average FCF margins applied to growing revenue
5. **Calculates terminal value** via Gordon Growth Model (default 2.5% terminal growth rate)
6. **Discounts everything** back to present value, subtracts net debt, divides by shares outstanding
7. **Generates a sensitivity table** — a 5x5 matrix of intrinsic values across different WACC and growth rate assumptions

The output is a formatted markdown report with all assumptions, projections, and the sensitivity matrix rendered as a table.

### Web Search

The `search_web` tool uses **Exa** (neural search) as the primary engine with **Tavily** as fallback:

- **Exa**: Uses `type: "auto"` with `useAutoprompt: true` for high-relevance results. News queries get a `category: "news"` hint and 48-hour freshness filter. Returns up to 5,000 characters of full text per result.
- **Tavily**: Falls back here if Exa isn't configured. Uses `search_depth: "advanced"` for deeper results.

### Session Memory

Every AI conversation is logged to the `ai_sessions` table in SQLite. The agent can invoke `get_past_research` to recall previous sessions — for example, if you analyzed AAPL last week and now want to compare it to MSFT, the agent can pull up your prior AAPL analysis without re-fetching everything.

---

## Things You Can Do

Here's a non-exhaustive list of what you can actually ask/do across the entire app:

### Portfolio
- "Add 50 shares of NVDA at $120 average cost on Robinhood"
- Import a CSV of holdings from your brokerage (Robinhood, Fidelity, Schwab, etc.)
- Click any holding to see a detailed stock modal with sparkline charts
- Sort holdings by value, gain/loss, or ticker
- View your total portfolio value, daily change, and overall P&L at a glance

### Spending
- Connect your bank accounts via Teller and see all balances in one view
- Browse transactions with date filters
- Drill into individual accounts for detailed transaction history

### Watchlist
- Add any ticker to track without owning it
- See live prices and mini charts

### AI Assistant — Example Prompts
Here are real queries the AI can handle, each triggering different combinations of tools:

**Single-stock analysis:**
- *"Analyze NVDA's fundamentals"* → pulls metrics snapshot, income statements, balance sheets, financial metrics
- *"Is TSLA overvalued?"* → pulls metrics, estimates, price targets, possibly runs a DCF
- *"Run a DCF on AAPL"* → triggers the full DCF engine, returns a markdown report with sensitivity table

**Comparisons:**
- *"Compare AAPL vs MSFT financials"* → pulls metrics and income statements for both, builds a comparison table
- *"Which is a better buy — GOOGL or META?"* → multi-tool analysis across both tickers

**Insider activity & sentiment:**
- *"Show me insider trades for AMZN"* → pulls recent insider buys/sells with executive names and amounts
- *"What are analysts saying about META?"* → fetches price targets, buy/sell ratings, and news with sentiment scores

**Current events:**
- *"What happened with NVDA earnings?"* → searches the web for latest earnings news
- *"Latest SEC filings for TSLA"* → searches for 10-K/10-Q filings on sec.gov

**Portfolio-aware queries:**
- *"What do I own?"* → reads your actual Vertex holdings from the database
- *"Analyze my portfolio"* → fetches your holdings, then pulls quotes and metrics for each ticker
- *"What's on my watchlist?"* → reads your Vertex watchlist

**Multi-step research:**
- *"Give me a full investment thesis on NVDA"* → the agent will autonomously chain 4-6 tool calls: metrics snapshot → income statements → cash flow → analyst estimates → news → synthesize into a thesis
- *"Should I buy more AAPL based on recent earnings?"* → web search for earnings → income statements → analyst estimates → price targets → recommendation

**Recall:**
- *"What did I research last time?"* → pulls past AI sessions from the database
- *"Remind me of that AAPL analysis"* → searches past sessions for "AAPL"

---

## Getting Started

### Prerequisites
- **Node.js** >= 18
- **npm** >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/sarthaksethi/vertex.git
cd vertex

# Install dependencies
cd vertex
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section)

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
cd vertex
npm run build
npm start
```

---

## Environment Variables

Create a `.env.local` file inside the `vertex/` directory:

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | No | Canonical app URL (auto-detected on Vercel) |
| `APP_PASSWORD` | Yes* | Plain-text login password (use for development) |
| `APP_PASSWORD_HASH` | Yes* | Bcrypt hash of login password (use for production) |
| `ALPHAVANTAGE_API_KEY` | No | Alpha Vantage API key for financial data tools |
| `GROQ_API_KEY` | No | Groq API key for AI assistant (free tier) |
| `BLACKBOXAIAPI` | No | Blackbox AI API key (checked first for AI) |
| `OPENAI_API_KEY` | No | OpenAI API key (fallback for AI) |
| `EXASEARCH_API_KEY` | No | Exa search API key (enables web search tool) |
| `TAVILY_API_KEY` | No | Tavily search API key (alternative web search) |
| `TELLER_ACCESS_TOKEN` | No | Teller.io access token (for spending dashboard) |
| `TELLER_CERT_PATH` | No | Path to Teller mTLS certificate PEM |
| `TELLER_KEY_PATH` | No | Path to Teller mTLS private key PEM |
| `TELLER_API_BASE` | No | Teller API base URL (default: `https://api.teller.io`) |

\* At least one of `APP_PASSWORD` or `APP_PASSWORD_HASH` is required for login to work.

---

## Docker

A `Dockerfile` is provided at the repository root for containerized deployment.

### Build & Run Locally

```bash
# Build the image
docker build -t vertex .

# Run the container
docker run -p 3000:3000 \
  -e NEXTAUTH_SECRET=your-secret \
  -e APP_PASSWORD=your-password \
  -e ALPHAVANTAGE_API_KEY=your-key \
  -e GROQ_API_KEY=your-key \
  vertex
```

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
services:
  vertex:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_SECRET=your-secret
      - NEXTAUTH_URL=http://localhost:3000
      - APP_PASSWORD=your-password
      - ALPHAVANTAGE_API_KEY=your-key
      - GROQ_API_KEY=your-key
    volumes:
      - vertex-data:/app/vertex/vertex.db

volumes:
  vertex-data:
```

```bash
docker compose up --build
```

### Persistent Data

The SQLite database file lives at `/app/vertex/vertex.db` inside the container. Mount a volume to persist data across container restarts (see compose example above).

---

## Deploying to Render

Since Vertex is a full-stack Next.js app (API routes + frontend in one), you can deploy the entire app as a **Web Service** on Render using Docker.

### Step-by-Step

1. **Push your code to GitHub** (make sure `.env.local` and `teller/` are gitignored)

2. **Create a new Web Service on Render**
   - Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**
   - Connect your GitHub repository
   - Select the branch (e.g. `master`)

3. **Configure the service**
   - **Environment**: `Docker`
   - **Root Directory**: leave blank (Dockerfile is at repo root)
   - **Instance Type**: Starter or Standard (512MB+ RAM recommended for `better-sqlite3`)

4. **Set Environment Variables** in the Render dashboard:
   ```
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   NEXTAUTH_URL=https://your-app.onrender.com
   APP_PASSWORD_HASH=<bcrypt hash of your password>
   ALPHAVANTAGE_API_KEY=<your key>
   GROQ_API_KEY=<your key>
   ```
   Add any other optional keys (Tavily, Exa, Teller, etc.) as needed.

5. **Add a Persistent Disk** (important for SQLite)
   - In your service settings → **Disks** → **Add Disk**
   - **Mount Path**: `/app/vertex`
   - **Size**: 1 GB (or more depending on usage)
   - This ensures your SQLite database survives redeployments

6. **Deploy** — Render will build the Docker image and start the service

7. **Verify** — Visit `https://your-app.onrender.com/api/health` to confirm the service is running

### Important Notes for Render
- Render's free tier spins down after inactivity — use a paid plan for always-on
- SQLite works fine for a single-instance personal dashboard; for multi-instance scaling, consider migrating to PostgreSQL
- The Teller mTLS certificates need to be either baked into the Docker image or stored on the persistent disk and referenced via `TELLER_CERT_PATH` / `TELLER_KEY_PATH`

---

## Deploying to Vercel

Since Vertex is a full-stack Next.js app (not a split frontend/backend), you can deploy the **entire app** to Vercel. However, there is one caveat: **Vercel's serverless functions don't support SQLite with persistent file storage.** You have two options:

### Option A: Deploy Entire App to Vercel (with External DB)

If you migrate from SQLite to a hosted database (e.g. [Turso](https://turso.tech) for SQLite-over-HTTP, or Vercel Postgres), you can deploy everything to Vercel:

1. **Install the Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link & Deploy**
   ```bash
   cd vertex
   vercel
   ```
   Follow the prompts to link your project.

3. **Set Environment Variables** in the Vercel dashboard:
   - Go to your project → **Settings** → **Environment Variables**
   - Add all the variables from the [Environment Variables](#environment-variables) section
   - Set `NEXTAUTH_URL` to your Vercel deployment URL

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Option B: Frontend on Vercel + Backend on Render (Recommended)

For the current SQLite setup, deploy the **backend on Render** (with persistent disk for the database) and the **frontend on Vercel**:

1. **Deploy the backend to Render** following the [Render instructions](#deploying-to-render) above

2. **Configure the frontend to point to Render**
   - Add `NEXT_PUBLIC_API_URL=https://your-app.onrender.com` to your Vercel environment variables
   - Update API calls in client components to use this base URL for SSR/client calls

3. **Deploy to Vercel**
   ```bash
   cd vertex
   vercel --prod
   ```

4. **Set environment variables** in Vercel dashboard:
   ```
   NEXTAUTH_SECRET=<same secret as Render>
   NEXTAUTH_URL=https://your-app.vercel.app
   APP_PASSWORD_HASH=<same hash as Render>
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

### Option C: Deploy Entire App to Render (Simplest)

Since Vertex is a monolith with SQLite, the **simplest deployment** is to put everything on Render with a persistent disk. This avoids the SQLite limitation on Vercel entirely. See [Deploying to Render](#deploying-to-render).

---

## Testing

```bash
cd vertex

# Run all tests
npm test

# Watch mode
npm run test:watch
```

Tests are written with **Vitest** and **Testing Library** and live in `vertex/__tests__/`:
- `portfolio.test.ts` — Portfolio logic and holdings
- `csv.test.ts` — CSV import validation
- `teller.test.ts` — Teller integration

---

## Security

Vertex implements several security measures:

- **Authentication**: Password-protected with bcrypt hashing and JWT sessions (8-hour expiry)
- **Middleware**: All routes require authentication except `/login`, `/api/auth/*`, and static assets
- **Security Headers** (via `next.config.ts`):
  - `X-Frame-Options: DENY` — prevents clickjacking
  - `X-Content-Type-Options: nosniff` — prevents MIME sniffing
  - `Strict-Transport-Security` — enforces HTTPS (2-year max-age with preload)
  - `Content-Security-Policy` — restricts script/style/font/image sources
  - `Permissions-Policy` — disables camera, microphone, geolocation
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: on`
- **Rate Limiting**: In-memory rate limiter on sensitive endpoints
- **Server-Only Modules**: Database, auth, and financial data modules use `server-only` to prevent client-side imports
- **Input Validation**: Zod schemas validate all API inputs

---

## Roadmap

- [ ] Deeper Dexter (Vertex AI) integration — trigger AI analysis directly from portfolio, watchlist, and spending pages
- [ ] Inline AI insights on holdings (e.g. "NVDA is up 12% since you bought it — here's why")
- [ ] Simplified stock entry — search-as-you-type ticker lookup
- [ ] Cryptocurrency tracking (BTC, ETH, SOL, etc.)
- [ ] CSV export and built-in spreadsheet for daily spending tracking
- [ ] Financial goal setting and on-track/off-track progress tracking (via Teller API)
- [ ] Multi-user support with role-based access
- [ ] Further UI/UX polish and quality-of-life improvements

---

## License

This project is private. All rights reserved by **Sarthak Sethi**.
