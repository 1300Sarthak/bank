"use client";

import { usePortfolio } from "@/context/PortfolioContext";

function formatMoney(v: number): string {
  if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SummaryGrid() {
  const { metrics, isLoading } = usePortfolio();

  if (isLoading) {
    return (
      <div className="summary-grid fade-in">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="summary-card" style={{ minHeight: 80 }} />
        ))}
      </div>
    );
  }

  const {
    totalValue,
    dayChange,
    totalGainLoss,
    totalReturnPct,
    bestPerformer,
    worstPerformer,
    holdingsCount,
  } = metrics;

  return (
    <div className="summary-grid fade-in fade-in-delay-1">
      <div className="summary-card">
        <div className="label">Portfolio Value</div>
        <div className="value">{formatMoney(totalValue)}</div>
      </div>
      <div className="summary-card">
        <div className="label">Today</div>
        <div className={`value ${dayChange >= 0 ? "positive" : "negative"}`}>
          {dayChange >= 0 ? "+" : ""}
          {formatMoney(dayChange)}
        </div>
      </div>
      <div className="summary-card">
        <div className="label">Total Gain/Loss</div>
        <div className={`value ${totalGainLoss >= 0 ? "positive" : "negative"}`}>
          {totalGainLoss >= 0 ? "+" : ""}
          {formatMoney(totalGainLoss)}
        </div>
        <div className={`sub ${totalGainLoss >= 0 ? "positive" : "negative"}`}>
          {totalReturnPct >= 0 ? "+" : ""}
          {totalReturnPct.toFixed(1)}%
        </div>
      </div>
      <div className="summary-card">
        <div className="label">Best Performer</div>
        <div className="value positive">{bestPerformer?.ticker ?? "—"}</div>
        <div className="sub positive">
          {bestPerformer ? `+${bestPerformer.returnPct.toFixed(1)}%` : ""}
        </div>
      </div>
      <div className="summary-card">
        <div className="label">Worst Performer</div>
        <div className={`value ${(worstPerformer?.returnPct ?? 0) >= 0 ? "positive" : "negative"}`}>
          {worstPerformer?.ticker ?? "—"}
        </div>
        <div className={`sub ${(worstPerformer?.returnPct ?? 0) >= 0 ? "positive" : "negative"}`}>
          {worstPerformer
            ? `${worstPerformer.returnPct >= 0 ? "+" : ""}${worstPerformer.returnPct.toFixed(1)}%`
            : ""}
        </div>
      </div>
      <div className="summary-card">
        <div className="label">Holdings</div>
        <div className="value">{holdingsCount}</div>
        <div className="sub neutral">stocks tracked</div>
      </div>
    </div>
  );
}
