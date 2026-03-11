"use client";

import { useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";

interface AddHoldingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddHoldingModal({ open, onClose }: AddHoldingModalProps) {
  const { mutateHoldings } = usePortfolio();
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [broker, setBroker] = useState("Default");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickerValid, setTickerValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) {
      setTicker("");
      setName("");
      setShares("");
      setAvgCost("");
      setBroker("Default");
      setError("");
      setTickerValid(null);
    }
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  async function validateTicker() {
    if (!ticker.trim()) return;
    try {
      const res = await fetch(`/api/quotes?tickers=${ticker.trim().toUpperCase()}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].price > 0) {
        setTickerValid(true);
        if (!name) setName(ticker.toUpperCase());
      } else {
        setTickerValid(false);
      }
    } catch {
      setTickerValid(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: ticker.trim().toUpperCase(),
        name: name.trim(),
        shares: parseFloat(shares),
        avgCost: parseFloat(avgCost),
        broker,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add holding");
      return;
    }

    mutateHoldings();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="stock-detail" style={{ maxWidth: 500 }}>
        <div className="detail-header">
          <div className="detail-title">
            <div className="ticker">Add Holding</div>
          </div>
          <button className="detail-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "20px 32px 28px" }}>
          <div className="form-group">
            <label className="form-label">Ticker</label>
            <input
              className="form-input"
              value={ticker}
              onChange={(e) => { setTicker(e.target.value); setTickerValid(null); }}
              onBlur={validateTicker}
              placeholder="e.g. AAPL"
              required
            />
            {tickerValid === false && (
              <div className="form-error">Could not validate ticker</div>
            )}
            {tickerValid === true && (
              <div style={{ fontSize: 11, color: "var(--green)", marginTop: 4 }}>
                Valid ticker
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apple Inc."
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Shares</label>
              <input
                className="form-input"
                type="number"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Avg Cost</label>
              <input
                className="form-input"
                type="number"
                step="any"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Broker</label>
            <select
              className="form-input"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
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
          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", padding: 12 }}
            disabled={loading}
          >
            {loading ? "Adding…" : "Add Holding"}
          </button>
        </form>
      </div>
    </div>
  );
}
