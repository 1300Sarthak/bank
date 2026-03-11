"use client";

import { useState, useMemo, use } from "react";
import { useTellerTransactions } from "@/hooks/useTellerTransactions";
import TransactionTable from "@/components/spending/TransactionTable";
import SpendingFilters from "@/components/spending/SpendingFilters";

const ALL_CATEGORIES = [
  "Food & Drink",
  "Shopping",
  "Transport",
  "Entertainment",
  "Bills & Utilities",
  "Health",
  "Travel",
  "Other",
];

export default function AccountSpendingPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const [searchText, setSearchText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { transactions, isLoading } = useTellerTransactions(
    accountId,
    dateFrom || undefined,
    dateTo || undefined
  );

  const filteredTx = useMemo(() => {
    let result = transactions;

    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter((t) => t.description.toLowerCase().includes(s));
    }

    if (selectedCategories.length > 0) {
      result = result.filter((t) => selectedCategories.includes(t.category));
    }

    return result;
  }, [transactions, searchText, selectedCategories]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <>
      <div className="main-header fade-in">
        <h1 className="main-title">Account Transactions</h1>
      </div>

      <SpendingFilters
        accounts={[]}
        selectedAccount={accountId}
        onAccountChange={() => {}}
        categories={ALL_CATEGORIES}
        selectedCategories={selectedCategories}
        onCategoryToggle={toggleCategory}
        searchText={searchText}
        onSearchChange={setSearchText}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {isLoading ? (
        <div style={{ color: "var(--text-tertiary)", padding: 40 }}>
          Loading transactions…
        </div>
      ) : (
        <TransactionTable transactions={filteredTx} />
      )}
    </>
  );
}
