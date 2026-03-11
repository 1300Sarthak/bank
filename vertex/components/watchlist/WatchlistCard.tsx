"use client";

interface WatchlistCardProps {
  ticker: string;
  name: string;
  onRemove: () => void;
}

export default function WatchlistCard({ ticker, name, onRemove }: WatchlistCardProps) {
  return (
    <div className="watchlist-card">
      <div className="wl-header">
        <span className="wl-ticker">{ticker}</span>
      </div>
      <div className="wl-name">{name}</div>
      <div className="wl-actions" onClick={(e) => e.stopPropagation()}>
        <button className="wl-btn added" onClick={onRemove}>
          ✓ Watching
        </button>
      </div>
    </div>
  );
}
