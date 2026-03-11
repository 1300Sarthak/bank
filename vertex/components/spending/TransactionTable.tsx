"use client";

import { useState, useMemo } from "react";

interface Transaction {
  id: string;
  amount: string;
  date: string;
  description: string;
  status: string;
  type: string;
  category: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  pageSize?: number;
}

export default function TransactionTable({
  transactions,
  pageSize = 25,
}: TransactionTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(transactions.length / pageSize);
  const paged = useMemo(
    () => transactions.slice(page * pageSize, (page + 1) * pageSize),
    [transactions, page, pageSize]
  );

  return (
    <>
      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th className="right">Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => {
              const amt = parseFloat(t.amount);
              const isDebit = amt < 0;
              return (
                <tr key={t.id}>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    {t.date}
                  </td>
                  <td>{t.description}</td>
                  <td>
                    <span className="category-badge">{t.category}</span>
                  </td>
                  <td
                    className={`right mono ${isDebit ? "negative" : "positive"}`}
                  >
                    {isDebit ? "-" : "+"}$
                    {Math.abs(amt).toFixed(2)}
                  </td>
                  <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
                    {t.status}
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    color: "var(--text-tertiary)",
                    padding: 40,
                  }}
                >
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = page < 3 ? i : page - 2 + i;
            if (pageNum >= totalPages) return null;
            return (
              <button
                key={pageNum}
                className={`page-btn ${pageNum === page ? "active" : ""}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
