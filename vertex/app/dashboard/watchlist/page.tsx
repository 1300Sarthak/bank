"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import SearchBox from "@/components/ui/SearchBox";

interface WatchlistItem {
  id: number;
  ticker: string;
  name: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WatchlistPage() {
  const { data: items = [], mutate } = useSWR<WatchlistItem[]>("/api/watchlist", fetcher);
  const [search, setSearch] = useState("");
  const [addTicker, setAddTicker] = useState("");
  const [addName, setAddName] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return item.ticker.toLowerCase().includes(s) || item.name.toLowerCase().includes(s);
  });

  const handleAdd = useCallback(async () => {
    if (!addTicker.trim() || !addName.trim()) return;
    setAdding(true);

    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: addTicker.trim(), name: addName.trim() }),
    });

    setAddTicker("");
    setAddName("");
    setAdding(false);
    mutate();
  }, [addTicker, addName, mutate]);

  const handleRemove = useCallback(
    async (id: number) => {
      await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      mutate();
    },
    [mutate]
  );

  return (
    <>
      <div className="main-header fade-in">
        <h1 className="main-title">Watchlist</h1>
        <div className="header-actions">
          <SearchBox placeholder="Search watchlist…" value={search} onChange={setSearch} />
        </div>
      </div>

      <div className="fade-in fade-in-delay-1" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="form-input"
            placeholder="Ticker"
            value={addTicker}
            onChange={(e) => setAddTicker(e.target.value)}
            style={{ width: 100 }}
          />
          <input
            className="form-input"
            placeholder="Company Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            style={{ width: 200 }}
          />
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={adding || !addTicker.trim() || !addName.trim()}
          >
            {adding ? "Adding…" : "+ Add"}
          </button>
        </div>
      </div>

      <div className="watchlist-grid fade-in fade-in-delay-2">
        {filtered.map((item) => (
          <div key={item.id} className="watchlist-card">
            <div className="wl-header">
              <span className="wl-ticker">{item.ticker}</span>
            </div>
            <div className="wl-name">{item.name}</div>
            <div className="wl-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="wl-btn added"
                onClick={() => handleRemove(item.id)}
              >
                ✓ Watching
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: "var(--text-tertiary)", padding: 40 }}>
            No stocks in your watchlist yet. Add one above.
          </div>
        )}
      </div>
    </>
  );
}
