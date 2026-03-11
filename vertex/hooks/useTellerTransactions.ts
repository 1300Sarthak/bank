"use client";

import useSWR from "swr";

interface Transaction {
  id: string;
  account_id: string;
  amount: string;
  date: string;
  description: string;
  status: string;
  type: string;
  category: string;
  details?: {
    category?: string | null;
    counterparty?: { name?: string | null; type?: string | null } | null;
  } | null;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch transactions");
    return r.json();
  });

export function useTellerTransactions(
  accountId: string | null,
  from?: string,
  to?: string
) {
  let key: string | null = null;
  if (accountId) {
    const params = new URLSearchParams({ accountId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    key = `/api/teller/transactions?${params.toString()}`;
  }

  const { data, error, isLoading } = useSWR<Transaction[]>(key, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    transactions: data ?? [],
    isLoading,
    error,
  };
}
