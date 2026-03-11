"use client";

import Link from "next/link";

interface Account {
  id: string;
  name: string;
  type: string;
  institution: { id: string; name: string };
  last_four?: string | null;
  currency: string;
}

interface Balance {
  account_id: string;
  available: string | null;
  ledger: string | null;
}

interface AccountsOverviewProps {
  accounts: Account[];
  balances: Balance[];
}

export default function AccountsOverview({ accounts, balances }: AccountsOverviewProps) {
  const balanceMap = new Map(balances.map((b) => [b.account_id, b]));

  return (
    <div className="spending-grid">
      {accounts.map((account) => {
        const balance = balanceMap.get(account.id);
        const available = balance?.available ? parseFloat(balance.available) : null;

        return (
          <Link
            key={account.id}
            href={`/dashboard/spending/${account.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="account-card">
              <div className="institution">{account.institution.name}</div>
              <div className="account-name">{account.name}</div>
              <div className="account-number">
                {account.last_four ? `••••${account.last_four}` : account.type}
              </div>
              <div className="balance">
                {available != null
                  ? "$" +
                    available.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—"}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
