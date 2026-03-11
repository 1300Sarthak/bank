"use client";

import { useState } from "react";
import SummaryGrid from "@/components/portfolio/SummaryGrid";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import AddHoldingModal from "@/components/portfolio/AddHoldingModal";
import ImportCSVModal from "@/components/portfolio/ImportCSVModal";
import StockDetailModal from "@/components/portfolio/StockDetailModal";
import SearchBox from "@/components/ui/SearchBox";
import type { EnrichedHolding } from "@/lib/portfolio";

export default function PortfolioPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("value");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<EnrichedHolding | null>(null);

  return (
    <>
      <div className="main-header fade-in">
        <h1 className="main-title">Portfolio</h1>
        <div className="header-actions">
          <SearchBox
            placeholder="Search stocks…"
            value={search}
            onChange={setSearch}
          />
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            + Add
          </button>
          <button className="sort-btn" onClick={() => setImportOpen(true)}>
            Import CSV
          </button>
        </div>
      </div>

      <SummaryGrid />

      <HoldingsTable
        search={search}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onRowClick={setSelectedHolding}
      />

      <AddHoldingModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ImportCSVModal open={importOpen} onClose={() => setImportOpen(false)} />
      <StockDetailModal
        holding={selectedHolding}
        onClose={() => setSelectedHolding(null)}
      />
    </>
  );
}
