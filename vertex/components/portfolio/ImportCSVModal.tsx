"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePortfolio } from "@/context/PortfolioContext";

interface CsvRow {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  broker: string;
}

interface ImportCSVModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportCSVModal({ open, onClose }: ImportCSVModalProps) {
  const { mutateHoldings } = usePortfolio();
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [csvText, setCsvText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setPreview([]);
      setErrors([]);
      setCsvText("");
    }
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    await previewCsv(text);
  }, []);

  async function previewCsv(text: string) {
    const res = await fetch("/api/import?action=preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text }),
    });
    const data = await res.json();
    if (data.preview) setPreview(data.preview);
    if (data.errors) setErrors(data.errors);
  }

  async function handleImport() {
    if (!csvText || preview.length === 0) return;
    setImporting(true);

    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText }),
    });

    setImporting(false);

    if (res.ok) {
      mutateHoldings();
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="stock-detail" style={{ maxWidth: 700 }}>
        <div className="detail-header">
          <div className="detail-title">
            <div className="ticker">Import CSV</div>
            <div className="name">Upload a CSV file with your holdings</div>
          </div>
          <button className="detail-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "20px 32px 28px" }}>
          {preview.length === 0 ? (
            <div
              className={`drop-zone ${dragOver ? "dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-tertiary)"
                strokeWidth="1.5"
                style={{ marginBottom: 12 }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Drop CSV file here or click to browse
              </div>
              <div style={{ color: "var(--text-tertiary)", fontSize: 12, marginTop: 8 }}>
                Required columns: ticker, name, shares, avgCost
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
                {preview.length} valid row{preview.length !== 1 ? "s" : ""} found
                {errors.length > 0 && `, ${errors.length} error${errors.length !== 1 ? "s" : ""}`}
              </div>

              <div className="holdings-table" style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Name</th>
                      <th className="right">Shares</th>
                      <th className="right">Avg Cost</th>
                      <th>Broker</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td className="mono">{row.ticker}</td>
                        <td>{row.name}</td>
                        <td className="right mono">{row.shares}</td>
                        <td className="right mono">${row.avgCost.toFixed(2)}</td>
                        <td>{row.broker}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {errors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {errors.map((err, i) => (
                    <div key={i} className="form-error">
                      Row {err.row}: {err.message}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={importing || preview.length === 0}
                  style={{ flex: 1, padding: 12 }}
                >
                  {importing ? "Importing…" : `Import ${preview.length} Holdings`}
                </button>
                <button
                  className="sort-btn"
                  onClick={() => {
                    setPreview([]);
                    setErrors([]);
                    setCsvText("");
                  }}
                  style={{ padding: "12px 20px" }}
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
