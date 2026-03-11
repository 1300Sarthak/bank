"use client";

import { useState, useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import type { EnrichedHolding } from "@/lib/portfolio";

function formatMoney(v: number): string {
  if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface HoldingsTableProps {
  search: string;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onRowClick: (holding: EnrichedHolding) => void;
}

export default function HoldingsTable({
  search,
  sortBy,
  onSortChange,
  onRowClick,
}: HoldingsTableProps) {
  const { holdings } = usePortfolio();

  const filtered = useMemo(() => {
    let result = [...holdings];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (h) =>
          h.ticker.toLowerCase().includes(s) ||
          h.name.toLowerCase().includes(s)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "gain") return b.gainLoss - a.gainLoss;
      if (sortBy === "pct") return b.returnPct - a.returnPct;
      return 0;
    });

    return result;
  }, [holdings, search, sortBy]);

  return (
    <div className="holdings-section fade-in fade-in-delay-3">
      <div className="section-title">
        Holdings <span className="count">{filtered.length}</span>
      </div>

      <div className="period-bar">
        <div />
        <div className="sort-controls">
          {["value", "gain", "pct"].map((s) => (
            <button
              key={s}
              className={`sort-btn ${sortBy === s ? "active" : ""}`}
              onClick={() => onSortChange(s)}
            >
              By {s === "pct" ? "%" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="holdings-table">
        <table>
          <thead>
            <tr>
              <th>Stock</th>
              <th className="right">Shares</th>
              <th className="right">Avg Cost</th>
              <th className="right">Price</th>
              <th className="right">Value</th>
              <th className="right">Gain/Loss</th>
              <th className="right">Return</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => {
              const isUp = h.returnPct >= 0;
              return (
                <tr key={h.id} onClick={() => onRowClick(h)}>
                  <td>
                    <div className="stock-cell">
                      <div
                        className="stock-avatar"
                        style={{ background: h.color }}
                      >
                        {h.ticker.slice(0, 2)}
                      </div>
                      <div className="stock-info">
                        <div className="ticker">{h.ticker}</div>
                        <div className="name">{h.name}</div>
                        {h.broker !== "Default" && (
                          <span className="broker-badge">{h.broker}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="right mono">{h.shares}</td>
                  <td className="right mono">${h.avg_cost.toFixed(2)}</td>
                  <td className="right mono">${h.price.toFixed(2)}</td>
                  <td className="right mono">{formatMoney(h.value)}</td>
                  <td className={`right mono ${h.gainLoss >= 0 ? "positive" : "negative"}`}>
                    {h.gainLoss >= 0 ? "+" : ""}
                    {formatMoney(h.gainLoss)}
                  </td>
                  <td className="right">
                    <span className={`change-badge ${isUp ? "up" : "down"}`}>
                      {isUp ? "▲" : "▼"} {Math.abs(h.returnPct).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 40 }}>
                  No holdings found. Add your first stock above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
