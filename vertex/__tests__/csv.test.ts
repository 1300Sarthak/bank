import { describe, it, expect } from "vitest";
import { validateCsvRows } from "@/lib/validators/csv";

describe("validateCsvRows", () => {
  it("validates correct rows", () => {
    const rows = [
      { ticker: "AAPL", name: "Apple Inc.", shares: "10", avgCost: "150.50" },
      { ticker: "nvda", name: "NVIDIA", shares: "20", avgCost: "48.30" },
    ];

    const { valid, errors } = validateCsvRows(rows);
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(0);
    expect(valid[0].ticker).toBe("AAPL");
    expect(valid[1].ticker).toBe("NVDA"); // uppercased
    expect(valid[0].shares).toBe(10);
    expect(valid[0].avgCost).toBe(150.50);
  });

  it("handles alternative column names", () => {
    const rows = [
      { Ticker: "MSFT", Name: "Microsoft", Shares: "5", "Avg Cost": "300" },
    ];

    const { valid, errors } = validateCsvRows(rows);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(0);
    expect(valid[0].ticker).toBe("MSFT");
  });

  it("rejects invalid rows", () => {
    const rows = [
      { ticker: "", name: "No Ticker", shares: "10", avgCost: "100" },
      { ticker: "AAPL", name: "Apple", shares: "-5", avgCost: "100" },
      { ticker: "GOOG", name: "Google", shares: "abc", avgCost: "100" },
    ];

    const { valid, errors } = validateCsvRows(rows);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(3);
  });

  it("defaults broker to Default", () => {
    const rows = [
      { ticker: "AAPL", name: "Apple", shares: "10", avgCost: "150" },
    ];

    const { valid } = validateCsvRows(rows);
    expect(valid[0].broker).toBe("Default");
  });
});
