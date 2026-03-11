"use client";

interface AllocationItem {
  ticker: string;
  value: number;
  percentage: number;
  color: string;
}

interface AllocationListProps {
  items: AllocationItem[];
}

export default function AllocationList({ items }: AllocationListProps) {
  return (
    <div className="allocation-list">
      {items.map((item) => (
        <div key={item.ticker} className="alloc-item">
          <div className="alloc-color" style={{ background: item.color }} />
          <div className="alloc-ticker">{item.ticker}</div>
          <div className="alloc-bar-wrap">
            <div
              className="alloc-bar"
              style={{
                width: `${item.percentage}%`,
                background: item.color,
              }}
            />
          </div>
          <div className="alloc-pct">{item.percentage.toFixed(1)}%</div>
        </div>
      ))}
      {items.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 20 }}>
          No holdings to display
        </div>
      )}
    </div>
  );
}
