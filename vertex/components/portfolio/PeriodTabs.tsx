"use client";

interface PeriodTabsProps {
  periods: string[];
  active: string;
  onSelect: (period: string) => void;
}

export default function PeriodTabs({ periods, active, onSelect }: PeriodTabsProps) {
  return (
    <div className="period-tabs">
      {periods.map((p) => (
        <button
          key={p}
          className={`period-tab ${p === active ? "active" : ""}`}
          onClick={() => onSelect(p)}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
