"use client";

import { useState, useMemo } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import DonutChart from "@/components/allocation/DonutChart";
import AllocationList from "@/components/allocation/AllocationList";

const ALLOC_COLORS = [
  "#6c5ce7", "#00d68f", "#ff9900", "#4285f4", "#cc0000",
  "#0668e1", "#76b900", "#ffc857", "#4ecdc4",
];

export default function AllocationPage() {
  const { holdings, metrics } = usePortfolio();
  const [brokerFilter, setBrokerFilter] = useState<string | null>(null);

  const brokers = useMemo(() => {
    const set = new Set(holdings.map((h) => h.broker));
    return Array.from(set).sort();
  }, [holdings]);

  const filtered = useMemo(() => {
    if (!brokerFilter) return holdings;
    return holdings.filter((h) => h.broker === brokerFilter);
  }, [holdings, brokerFilter]);

  const allocationData = useMemo(() => {
    const total = filtered.reduce((s, h) => s + h.value, 0);
    return filtered
      .map((h, i) => ({
        ticker: h.ticker,
        name: h.name,
        value: h.value,
        percentage: total > 0 ? (h.value / total) * 100 : 0,
        color: h.color !== "#6c5ce7" ? h.color : ALLOC_COLORS[i % ALLOC_COLORS.length],
        price: h.price,
        shares: h.shares,
        gainLoss: h.gainLoss,
        returnPct: h.returnPct,
        dayChangePct: h.dayChangePct,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  return (
    <>
      <div className="main-header fade-in">
        <h1 className="main-title">Allocation</h1>
        {brokers.length > 1 && (
          <div className="header-actions">
            <button
              className={`sort-btn ${!brokerFilter ? "active" : ""}`}
              onClick={() => setBrokerFilter(null)}
            >
              All
            </button>
            {brokers.map((b) => (
              <button
                key={b}
                className={`sort-btn ${brokerFilter === b ? "active" : ""}`}
                onClick={() => setBrokerFilter(b)}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="allocation-section fade-in fade-in-delay-1">
        <DonutChart data={allocationData} totalLabel="Total Value" />
        <AllocationList items={allocationData} />
      </div>
    </>
  );
}
