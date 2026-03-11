"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { EnrichedHolding, QuoteData } from "@/lib/portfolio";
import { usePortfolio } from "@/context/PortfolioContext";

interface ChartPoint { t: number; c: number; h: number; l: number; v: number; }

interface StockDetailModalProps {
  holding: EnrichedHolding | null;
  onClose: () => void;
}

const PERIODS = ["1H", "1D", "1W", "1Y", "YTD"] as const;
type Period = (typeof PERIODS)[number];

function fmt$(v: number, decimals = 2) {
  if (Math.abs(v) >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
  if (Math.abs(v) >= 1e9)  return "$" + (v / 1e9).toFixed(2) + "B";
  if (Math.abs(v) >= 1e6)  return "$" + (v / 1e6).toFixed(2) + "M";
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtVol(v: number | null) {
  if (v == null) return "—";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}
function fmtDate(t: number, period: Period) {
  const d = new Date(t);
  if (period === "1H" || period === "1D") {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: period === "1Y" || period === "YTD" ? "numeric" : undefined });
}

// ─── Animated Line Chart ────────────────────────────────────────────────────
function PriceChart({
  points,
  loading,
  period,
  accentColor,
}: {
  points: ChartPoint[];
  loading: boolean;
  period: Period;
  accentColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const mouseXRef = useRef<number | null>(null);
  const [hover, setHover] = useState<{ price: number; time: number; x: number; y: number; pctChange: number } | null>(null);

  const isUp = points.length >= 2 ? points[points.length - 1].c >= points[0].c : true;
  const lineColor = isUp ? "#00d68f" : "#ff6b6b";
  const gradientTop = isUp ? "rgba(0,214,143,0.18)" : "rgba(255,107,107,0.18)";

  const draw = useCallback(
    (progress: number, hoverX: number | null) => {
      const canvas = canvasRef.current;
      if (!canvas || points.length < 2) return;

      const dpr = window.devicePixelRatio || 1;
      // Sync canvas pixel dimensions to CSS layout size
      const cssW = canvas.offsetWidth || 400;
      const cssH = canvas.offsetHeight || 200;
      if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
      }
      const W = cssW;
      const H = cssH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const pad = { l: 12, r: 12, t: 18, b: 28 };
      const chartW = W - pad.l - pad.r;
      const chartH = H - pad.t - pad.b;

      const prices = points.map((p) => p.c);
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const range = maxP - minP || 1;

      const toX = (i: number) => pad.l + (i / (points.length - 1)) * chartW;
      const toY = (p: number) => pad.t + chartH - ((p - minP) / range) * chartH;

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i / 4) * chartH;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(W - pad.r, y);
        ctx.stroke();
      }

      // Compute how many points to draw based on progress
      const drawCount = Math.max(2, Math.round(progress * points.length));
      const visible = points.slice(0, drawCount);

      // Build path for clipping (left-to-right reveal)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, pad.l + (drawCount / points.length) * chartW + 4, H);
      ctx.clip();

      // Gradient fill
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
      grad.addColorStop(0, gradientTop);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.beginPath();
      smoothLine(ctx, visible.map((p, i) => ({ x: toX(i), y: toY(p.c) })));
      ctx.lineTo(toX(visible.length - 1), pad.t + chartH);
      ctx.lineTo(pad.l, pad.t + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      smoothLine(ctx, visible.map((p, i) => ({ x: toX(i), y: toY(p.c) })));
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.restore();

      // Hover crosshair
      if (hoverX !== null && progress >= 1) {
        const relX = hoverX - pad.l;
        const fraction = Math.max(0, Math.min(1, relX / chartW));
        const idx = Math.round(fraction * (points.length - 1));
        const pt = points[idx];
        const px = toX(idx);
        const py = toY(pt.c);

        // Vertical line
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px, pad.t);
        ctx.lineTo(px, pad.t + chartH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dot
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI);
        ctx.fillStyle = lineColor;
        ctx.fill();
        ctx.strokeStyle = "var(--bg-secondary)";
        ctx.lineWidth = 2;
        ctx.stroke();

        const pctChange = points[0].c > 0 ? ((pt.c - points[0].c) / points[0].c) * 100 : 0;
        setHover({ price: pt.c, time: pt.t, x: px, y: py, pctChange });
      } else if (hoverX === null) {
        setHover(null);
      }

      // Min / Max labels
      const minIdx = prices.indexOf(minP);
      const maxIdx = prices.indexOf(maxP);
      ctx.font = '500 10px "DM Sans", sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "center";
      ctx.fillText("▼ " + fmt$(minP), toX(minIdx), pad.t + chartH + 14);
      ctx.fillText("▲ " + fmt$(maxP), toX(maxIdx), pad.t - 6);

      ctx.restore();
    },
    [points, lineColor, gradientTop]
  );

  // Animate in on data change
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    progressRef.current = 0;
    mouseXRef.current = null;
    setHover(null);

    const speed = 0.035;
    const animate = () => {
      progressRef.current = Math.min(1, progressRef.current + speed);
      draw(progressRef.current, mouseXRef.current);
      if (progressRef.current < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [points, draw]);


  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (progressRef.current < 1) return;
      const rect = e.currentTarget.getBoundingClientRect();
      mouseXRef.current = e.clientX - rect.left;
      draw(1, mouseXRef.current);
    },
    [draw]
  );
  const handleMouseLeave = useCallback(() => {
    mouseXRef.current = null;
    draw(1, null);
  }, [draw]);

  if (loading) {
    return (
      <div className="chart-loading">
        <div className="chart-spinner" />
      </div>
    );
  }
  if (points.length < 2) {
    return <div className="chart-empty">No chart data available</div>;
  }

  return (
    <div className="price-chart-wrap">
      {hover && (
        <div
          className="chart-hover-label"
          style={{ left: Math.min(hover.x, 220), top: Math.max(4, hover.y - 48) }}
        >
          <span className="chart-hover-price">{fmt$(hover.price)}</span>
          <span className={`chart-hover-pct ${hover.pctChange >= 0 ? "pos" : "neg"}`}>
            {hover.pctChange >= 0 ? "+" : ""}{hover.pctChange.toFixed(2)}%
          </span>
        </div>
      )}
      {hover && (
        <div className="chart-hover-time" style={{ left: Math.min(hover.x, 220) }}>
          {fmtDate(hover.time, period)}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="price-chart-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

// Smooth quadratic bezier through points
function smoothLine(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  if (pts.length < 2) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
}

// ─── Volume Mini-bars ────────────────────────────────────────────────────────
function VolumeChart({ points }: { points: ChartPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.offsetWidth || 400;
    const cssH = canvas.offsetHeight || 36;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const vols = points.map((p) => p.v).filter((v) => v > 0);
    if (vols.length === 0) { ctx.restore(); return; }
    const maxV = Math.max(...vols);
    const barW = Math.max(1, W / points.length - 1);

    points.forEach((p, i) => {
      const barH = (p.v / maxV) * H * 0.85;
      const x = (i / points.length) * W;
      ctx.fillStyle = p.c >= (points[i - 1]?.c ?? p.c)
        ? "rgba(0,214,143,0.35)"
        : "rgba(255,107,107,0.35)";
      ctx.fillRect(x, H - barH, barW, barH);
    });

    ctx.restore();
  }, [points]);

  return <canvas ref={canvasRef} className="volume-chart-canvas" />;
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export default function StockDetailModal({ holding, onClose }: StockDetailModalProps) {
  const { mutateHoldings } = usePortfolio();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [period, setPeriod] = useState<Period>("1D");
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Edit / delete state
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [editShares, setEditShares] = useState("");
  const [editAvgCost, setEditAvgCost] = useState("");
  const [editName, setEditName] = useState("");
  const [editBroker, setEditBroker] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Reset everything when a different stock opens
  useEffect(() => {
    if (!holding) return;
    setPeriod("1D");
    setMode("view");
    setSaveError("");
  }, [holding?.ticker]);

  // Seed edit fields when entering edit mode
  useEffect(() => {
    if (mode === "edit" && holding) {
      setEditShares(String(holding.shares));
      setEditAvgCost(String(holding.avg_cost));
      setEditName(holding.name);
      setEditBroker(holding.broker);
      setSaveError("");
    }
  }, [mode, holding]);

  // Fetch quote metadata
  useEffect(() => {
    if (!holding) return;
    setQuote(null);
    fetch(`/api/quotes?tickers=${holding.ticker}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d) && d[0]) setQuote(d[0]); })
      .catch(() => {});
  }, [holding]);

  // Fetch chart data
  useEffect(() => {
    if (!holding) return;
    setChartLoading(true);
    setChartPoints([]);
    fetch(`/api/chart?ticker=${holding.ticker}&period=${period}`)
      .then((r) => r.json())
      .then((d) => { setChartPoints(d.quotes ?? []); })
      .catch(() => { setChartPoints([]); })
      .finally(() => setChartLoading(false));
  }, [holding, period]);

  // ESC: exit edit/delete mode first, then close
  useEffect(() => {
    if (!holding) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode !== "view") setMode("view");
        else onClose();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [holding, onClose, mode]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!holding) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/holdings/${holding.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          shares: parseFloat(editShares),
          avgCost: parseFloat(editAvgCost),
          broker: editBroker,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error || "Failed to save");
        return;
      }
      mutateHoldings();
      setMode("view");
    } catch {
      setSaveError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!holding) return;
    setSaving(true);
    try {
      await fetch(`/api/holdings/${holding.id}`, { method: "DELETE" });
      mutateHoldings();
      onClose();
    } catch {
      setSaving(false);
    }
  }

  if (!holding) return null;

  const periodStart = chartPoints[0]?.c ?? holding.price;
  const periodChange = holding.price - periodStart;
  const periodChangePct = periodStart > 0 ? (periodChange / periodStart) * 100 : 0;
  const isUp = holding.returnPct >= 0;
  const isPeriodUp = periodChange >= 0;
  const costBasis = holding.avg_cost * holding.shares;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="stock-detail stock-detail-v2">
        {/* ── Header ── */}
        <div className="detail-header">
          <div className="left">
            <div className="detail-avatar" style={{ background: holding.color }}>
              {holding.ticker.slice(0, 2)}
            </div>
            <div className="detail-title">
              <div className="ticker">{holding.ticker}</div>
              <div className="name">{holding.name}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {mode === "view" && (
              <>
                <button
                  className="detail-action-btn edit"
                  onClick={() => setMode("edit")}
                  title="Edit holding"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
                <button
                  className="detail-action-btn danger"
                  onClick={() => setMode("delete")}
                  title="Remove holding"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </>
            )}
            {mode !== "view" && (
              <button className="detail-action-btn" onClick={() => setMode("view")} title="Cancel">
                Cancel
              </button>
            )}
            <button className="detail-close" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Delete confirmation ── */}
        {mode === "delete" && (
          <div className="detail-delete-confirm">
            <div className="delete-confirm-text">
              Remove <strong>{holding.ticker}</strong> ({holding.shares} shares) from your portfolio?
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Removing…" : "Yes, remove it"}
              </button>
              <button className="sort-btn" onClick={() => setMode("view")}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Price row (only in view mode) ── */}
        {mode !== "delete" && (
          <div className="detail-price-row">
            <div className="detail-price">${holding.price.toFixed(2)}</div>
            <div className="detail-price-changes">
              <span className={`detail-change ${isPeriodUp ? "positive" : "negative"}`}>
                {isPeriodUp ? "+" : ""}{fmt$(periodChange)} ({isPeriodUp ? "+" : ""}{periodChangePct.toFixed(2)}%)
              </span>
              <span className="detail-period-label">vs period open</span>
            </div>
            <div className="detail-day-change">
              <span className={holding.dayChangePct >= 0 ? "positive" : "negative"}>
                {holding.dayChangePct >= 0 ? "▲" : "▼"} {Math.abs(holding.dayChangePct).toFixed(2)}% today
              </span>
            </div>
          </div>
        )}

        {/* ── Edit form ── */}
        {mode === "edit" && (
          <form className="detail-edit-form" onSubmit={handleSave}>
            <div className="detail-edit-grid">
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Broker</label>
                <select
                  className="form-input"
                  value={editBroker}
                  onChange={(e) => setEditBroker(e.target.value)}
                >
                  <option value="Default">Default</option>
                  <option value="Robinhood">Robinhood</option>
                  <option value="Fidelity">Fidelity</option>
                  <option value="Charles Schwab">Charles Schwab</option>
                  <option value="TD Ameritrade">TD Ameritrade</option>
                  <option value="E*TRADE">E*TRADE</option>
                  <option value="Vanguard">Vanguard</option>
                  <option value="Interactive Brokers">Interactive Brokers</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Shares</label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  min="0.0001"
                  value={editShares}
                  onChange={(e) => setEditShares(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Avg Cost / Share</label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  min="0.0001"
                  value={editAvgCost}
                  onChange={(e) => setEditAvgCost(e.target.value)}
                  required
                />
              </div>
            </div>
            {saveError && <div className="form-error" style={{ marginBottom: 8 }}>{saveError}</div>}
            <button type="submit" className="btn-primary" disabled={saving} style={{ width: "100%", padding: 10 }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}

        {/* ── Chart + stats (view mode only) ── */}
        {mode === "view" && (
          <>
            {/* Period tabs */}
            <div className="period-tabs-row">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  className={`period-tab ${period === p ? "active" : ""}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="chart-section">
              <PriceChart
                points={chartPoints}
                loading={chartLoading}
                period={period}
                accentColor={holding.color}
              />
              {chartPoints.length > 0 && (
                <div className="volume-section">
                  <div className="volume-label">Volume</div>
                  <VolumeChart points={chartPoints} />
                </div>
              )}
            </div>

            {/* Scrollable stats */}
            <div className="detail-body">
              <div className="detail-section">
                <div className="detail-section-title">Your Position</div>
                <div className="detail-metrics-v2">
                  <div className="metric-cell">
                    <div className="m-label">Shares</div>
                    <div className="m-value">{holding.shares % 1 === 0 ? holding.shares.toLocaleString() : holding.shares.toFixed(4)}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Avg Cost</div>
                    <div className="m-value">${holding.avg_cost.toFixed(2)}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Cost Basis</div>
                    <div className="m-value">{fmt$(costBasis)}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Market Value</div>
                    <div className="m-value">{fmt$(holding.value)}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Gain / Loss</div>
                    <div className={`m-value ${isUp ? "positive" : "negative"}`}>
                      {isUp ? "+" : ""}{fmt$(holding.gainLoss)}
                    </div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Total Return</div>
                    <div className={`m-value ${isUp ? "positive" : "negative"}`}>
                      {isUp ? "+" : ""}{holding.returnPct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Day P&amp;L</div>
                    <div className={`m-value ${holding.dayChange >= 0 ? "positive" : "negative"}`}>
                      {holding.dayChange >= 0 ? "+" : ""}{fmt$(holding.dayChange)}
                    </div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Broker</div>
                    <div className="m-value">{holding.broker}</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Market Data</div>
                <div className="detail-metrics-v2">
                  <div className="metric-cell">
                    <div className="m-label">Market Cap</div>
                    <div className="m-value">{fmt$(quote?.marketCap ?? 0)}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">P/E Ratio</div>
                    <div className="m-value">{quote?.peRatio?.toFixed(1) ?? "—"}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">52W High</div>
                    <div className="m-value">{quote?.week52High ? "$" + quote.week52High.toFixed(2) : "—"}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">52W Low</div>
                    <div className="m-value">{quote?.week52Low ? "$" + quote.week52Low.toFixed(2) : "—"}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Volume</div>
                    <div className="m-value">{fmtVol(quote?.volume ?? null)}</div>
                  </div>
                  <div className="metric-cell">
                    <div className="m-label">Day Change</div>
                    <div className={`m-value ${(quote?.changePercent ?? 0) >= 0 ? "positive" : "negative"}`}>
                      {(quote?.changePercent ?? 0) >= 0 ? "+" : ""}
                      {(quote?.changePercent ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {quote?.week52Low && quote?.week52High && (
                <div className="detail-section">
                  <div className="detail-section-title">52-Week Range</div>
                  <div className="range-bar-section">
                    <span className="range-val">${quote.week52Low.toFixed(2)}</span>
                    <div className="range-bar-track">
                      <div
                        className="range-bar-fill"
                        style={{
                          left: "0%",
                          width: `${Math.min(100, Math.max(0, ((holding.price - quote.week52Low) / (quote.week52High - quote.week52Low)) * 100))}%`,
                        }}
                      />
                      <div
                        className="range-bar-dot"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((holding.price - quote.week52Low) / (quote.week52High - quote.week52Low)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="range-val">${quote.week52High.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
