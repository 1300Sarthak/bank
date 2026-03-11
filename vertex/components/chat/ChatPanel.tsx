"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import ToolCallBadge from "./ToolCallBadge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: { name: string; input: Record<string, unknown> }[];
}

const SUGGESTIONS = [
  "Analyze NVDA's fundamentals",
  "Compare AAPL vs MSFT",
  "Is TSLA overvalued?",
  "What are analysts saying about META?",
  "Show me insider trades for AMZN",
];

// Human-readable tool labels
const TOOL_LABELS: Record<string, string> = {
  get_income_statements: "income statements",
  get_balance_sheets: "balance sheets",
  get_cash_flow_statements: "cash flow statements",
  get_financial_metrics: "financial metrics",
  get_analyst_estimates: "analyst estimates",
  get_price_targets: "price targets",
  get_insider_trades: "insider trades",
  get_company_news: "company news",
  get_sec_filings: "SEC filings",
  get_revenue_segments: "revenue segments",
  get_stock_price: "stock prices",
  get_metrics_snapshot: "company snapshot",
  get_stock_quote: "live quote",
  search_web: "web search",
  get_portfolio_holdings: "your portfolio",
  get_watchlist: "your watchlist",
  get_past_research: "past research",
  run_dcf_analysis: "DCF valuation",
};

// Rough ETA hints for known slow operations
function getEtaHint(tools: string[], elapsed: number): string | null {
  if (tools.includes("run_dcf_analysis")) return "DCF analysis typically takes 20–35s";
  if (tools.length >= 4) return "Multi-step research typically takes 15–25s";
  if (tools.includes("search_web")) return "Web search typically takes 8–15s";
  if (tools.length >= 2) return "Fetching data typically takes 10–20s";
  if (elapsed > 10) return "Almost there…";
  return null;
}

type Phase = "thinking" | "fetching" | "writing";

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("thinking");
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTools, loading, scrollToBottom]);

  // Elapsed timer — resets and starts when loading begins
  useEffect(() => {
    if (!loading) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleSubmit(text?: string) {
    const query = text || input.trim();
    if (!query || loading) return;

    setInput("");
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setActiveTools([]);
    setPhase("thinking");
    setCurrentTool(null);

    try {
      const chatHistory = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let toolCalls: { name: string; input: Record<string, unknown> }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const json = JSON.parse(line.slice(6));

          if (json.type === "tool_use") {
            setPhase("fetching");
            setCurrentTool(json.name);
            setActiveTools((prev) => [...prev, json.name]);
          } else if (json.type === "text") {
            setPhase("writing");
            setCurrentTool(null);
            assistantContent += (assistantContent ? "\n\n" : "") + json.content;
            setMessages((prev) => {
              const existing = prev.find(
                (m) => m.role === "assistant" && m.id === "pending"
              );
              if (existing) {
                return prev.map((m) =>
                  m.id === "pending" ? { ...m, content: assistantContent } : m
                );
              }
              return [
                ...prev,
                {
                  id: "pending",
                  role: "assistant",
                  content: assistantContent,
                },
              ];
            });
          } else if (json.type === "done") {
            toolCalls = json.toolCalls || [];
          } else if (json.type === "error") {
            assistantContent = json.message ?? "Unknown error";
            // Create the pending message immediately so the error is visible
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === "pending");
              if (existing) {
                return prev.map((m) =>
                  m.id === "pending" ? { ...m, content: assistantContent } : m
                );
              }
              return [
                ...prev,
                { id: "pending", role: "assistant" as const, content: assistantContent },
              ];
            });
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === "pending"
            ? { ...m, id: Date.now().toString(), toolCalls }
            : m
        )
      );
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error. Make sure BLACKBOXAIAPI is set in .env.local.",
        },
      ]);
    } finally {
      setLoading(false);
      setActiveTools([]);
      setPhase("thinking");
      setCurrentTool(null);
    }
  }

  const etaHint = getEtaHint(activeTools, elapsed);

  // Phase-specific label and icon color
  const phaseConfig = {
    thinking: {
      label: "Analyzing your question…",
      color: "var(--accent)",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    fetching: {
      label: currentTool
        ? `Fetching ${TOOL_LABELS[currentTool] ?? currentTool.replace(/_/g, " ")}…`
        : "Fetching data…",
      color: "#f59e0b",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    writing: {
      label: "Writing response…",
      color: "#10b981",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
  };

  const pc = phaseConfig[phase];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: "var(--accent)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Vertex AI</div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            Financial research assistant
          </div>
        </div>
        {/* Live elapsed badge in header while loading */}
        {loading && (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 20,
              background: "color-mix(in srgb, var(--accent) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
              fontSize: 11,
              color: "var(--accent)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: pc.color,
                animation: "statusPulse 1.2s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            {elapsed}s
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && !loading && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              fontSize: 13,
              lineHeight: 1.6,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderBottomLeftRadius: 4,
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Vertex AI
            </div>
            Welcome to Vertex AI. I can analyze any stock using real financial
            data — income statements, balance sheets, analyst estimates, insider
            trades, SEC filings, and more. Ask me anything.
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* ── Status card — shown the entire time the agent is running ── */}
        {loading && (
          <div
            style={{
              borderRadius: 14,
              borderBottomLeftRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--bg-hover)",
              overflow: "hidden",
              animation: "fadeSlideIn 0.2s ease-out",
            }}
          >
            {/* Phase header */}
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: activeTools.length > 0 ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Animated status dot */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: pc.color,
                  flexShrink: 0,
                  animation: "statusPulse 1.2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  color: pc.color,
                  marginRight: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {pc.icon}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  flex: 1,
                }}
              >
                {pc.label}
              </span>
              {/* Elapsed */}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                }}
              >
                {elapsed}s
              </span>
            </div>

            {/* Tool call log */}
            {activeTools.length > 0 && (
              <div
                style={{
                  padding: "8px 14px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                  borderBottom: etaHint ? "1px solid var(--border)" : "none",
                }}
              >
                {activeTools.map((tool, i) => (
                  <ToolCallBadge
                    key={i}
                    name={tool}
                    loading={i === activeTools.length - 1 && phase === "fetching"}
                  />
                ))}
              </div>
            )}

            {/* ETA / hint row */}
            {etaHint && (
              <div
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {etaHint}
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 0 && !loading && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "0 16px 12px",
          }}
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSubmit(s)}
              style={{
                padding: "6px 12px",
                border: "1px solid var(--border)",
                borderRadius: 20,
                fontSize: 11,
                color: "var(--text-secondary)",
                cursor: "pointer",
                background: "none",
                fontFamily: "var(--font-body)",
                transition: "var(--transition)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          padding: "12px 16px 16px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={loading ? "Thinking…" : "Ask about a stock…"}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--bg-tertiary)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            outline: "none",
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={loading || !input.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "none",
            background: "var(--accent)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          {loading ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ animation: "spin 1s linear infinite" }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <style jsx global>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
