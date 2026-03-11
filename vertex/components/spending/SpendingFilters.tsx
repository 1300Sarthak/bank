"use client";

interface SpendingFiltersProps {
  accounts: { id: string; name: string }[];
  selectedAccount: string | null;
  onAccountChange: (id: string | null) => void;
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (d: string) => void;
  onDateToChange: (d: string) => void;
}

export default function SpendingFilters({
  accounts,
  selectedAccount,
  onAccountChange,
  categories,
  selectedCategories,
  onCategoryToggle,
  searchText,
  onSearchChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: SpendingFiltersProps) {
  return (
    <div className="filters-bar">
      {accounts.length > 0 && (
        <select
          className="filter-select"
          value={selectedAccount || ""}
          onChange={(e) => onAccountChange(e.target.value || null)}
        >
          <option value="">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}

      <input
        type="date"
        className="filter-select"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
      />
      <span style={{ color: "var(--text-tertiary)" }}>to</span>
      <input
        type="date"
        className="filter-select"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
      />

      <div className="search-box" style={{ width: 200 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search descriptions…"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`sort-btn ${selectedCategories.includes(cat) ? "active" : ""}`}
            onClick={() => onCategoryToggle(cat)}
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
