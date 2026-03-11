"use client";

import useSWR from "swr";
import type { TellerAccount } from "@/lib/validators/teller";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch accounts");
    return r.json();
  });

export function useTellerAccounts() {
  const { data, error, isLoading } = useSWR<TellerAccount[]>(
    "/api/teller/accounts",
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    accounts: data ?? [],
    isLoading,
    error,
  };
}
