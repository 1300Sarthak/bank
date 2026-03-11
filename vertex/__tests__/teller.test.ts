import { describe, it, expect } from "vitest";
import { mapCategory, tellerAccountSchema, tellerTransactionSchema } from "@/lib/validators/teller";

describe("mapCategory", () => {
  it("maps known categories", () => {
    expect(mapCategory("dining")).toBe("Food & Drink");
    expect(mapCategory("groceries")).toBe("Food & Drink");
    expect(mapCategory("shopping")).toBe("Shopping");
    expect(mapCategory("transport")).toBe("Transport");
    expect(mapCategory("entertainment")).toBe("Entertainment");
    expect(mapCategory("utilities")).toBe("Bills & Utilities");
    expect(mapCategory("health")).toBe("Health");
    expect(mapCategory("accommodation")).toBe("Travel");
  });

  it("maps null/undefined to Other", () => {
    expect(mapCategory(null)).toBe("Other");
    expect(mapCategory(undefined)).toBe("Other");
  });

  it("maps unknown categories to Other", () => {
    expect(mapCategory("randomthing")).toBe("Other");
  });

  it("is case insensitive", () => {
    expect(mapCategory("DINING")).toBe("Food & Drink");
    expect(mapCategory("Shopping")).toBe("Shopping");
  });
});

describe("tellerAccountSchema", () => {
  it("validates a valid account", () => {
    const account = {
      id: "acc_123",
      name: "Checking",
      type: "depository",
      subtype: "checking",
      status: "open",
      institution: { id: "inst_1", name: "Chase" },
      last_four: "1234",
      currency: "USD",
      enrollment_id: "enr_1",
    };

    const result = tellerAccountSchema.safeParse(account);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = tellerAccountSchema.safeParse({ id: "123" });
    expect(result.success).toBe(false);
  });
});

describe("tellerTransactionSchema", () => {
  it("validates a valid transaction", () => {
    const tx = {
      id: "tx_1",
      account_id: "acc_1",
      amount: "-42.50",
      date: "2024-01-15",
      description: "Starbucks",
      status: "posted",
      type: "card_payment",
      details: {
        category: "dining",
        counterparty: { name: "Starbucks", type: "merchant" },
        processing_status: "complete",
      },
    };

    const result = tellerTransactionSchema.safeParse(tx);
    expect(result.success).toBe(true);
  });

  it("accepts null details", () => {
    const tx = {
      id: "tx_2",
      account_id: "acc_1",
      amount: "100.00",
      date: "2024-01-16",
      description: "Direct Deposit",
      status: "posted",
      type: "deposit",
      details: null,
    };

    const result = tellerTransactionSchema.safeParse(tx);
    expect(result.success).toBe(true);
  });
});
