"use client";

import { useState, useMemo } from "react";
import { useTellerAccounts } from "@/hooks/useTellerAccounts";
import { useTellerTransactions } from "@/hooks/useTellerTransactions";
import useSWR from "swr";
import AccountsOverview from "@/components/spending/AccountsOverview";
import TransactionTable from "@/components/spending/TransactionTable";
import SpendingFilters from "@/components/spending/SpendingFilters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export default function SpendingPage() {
  const { accounts, isLoading: accountsLoading, error: accountsError } = useTellerAccounts();
  const { data: balances = [] } = useSWR(
    accounts.length > 0 ? "/api/teller/balances" : null,
    fetcher
  );

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const activeAccountId = selectedAccount || (accounts.length > 0 ? accounts[0].id : null);
  const { transactions, isLoading: txLoading } = useTellerTransactions(
    activeAccountId,
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

  if (accountsError) {
    return (
      <>
        <div className="main-header fade-in">
          <h1 className="main-title">Spending</h1>
        </div>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 40,
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <p style={{ marginBottom: 8 }}>
            Unable to connect to Teller.io
          </p>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            Ensure your Teller certificates and access token are configured in .env.local
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="main-header fade-in">
        <h1 className="main-title">Spending</h1>
      </div>

      {accountsLoading ? (
        <div style={{ color: "var(--text-tertiary)", padding: 40 }}>Loading accounts…</div>
      ) : (
        <>
          <AccountsOverview accounts={accounts} balances={balances} />

          <div className="fade-in fade-in-delay-2">
            <div className="section-title" style={{ marginTop: 24 }}>
              Transactions
            </div>

            <SpendingFilters
              accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
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

            {txLoading ? (
              <div style={{ color: "var(--text-tertiary)", padding: 40 }}>
                Loading transactions…
              </div>
            ) : (
              <TransactionTable transactions={filteredTx} />
            )}
          </div>
        </>
      )}
    </>
  );
}
