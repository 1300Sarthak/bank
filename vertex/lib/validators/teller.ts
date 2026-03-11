import { z } from "zod/v4";

export const tellerAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  subtype: z.string().nullable().optional(),
  status: z.string(),
  institution: z.object({
    id: z.string(),
    name: z.string(),
  }),
  last_four: z.string().nullable().optional(),
  currency: z.string(),
  enrollment_id: z.string(),
});

export const tellerBalanceSchema = z.object({
  account_id: z.string(),
  available: z.string().nullable(),
  ledger: z.string().nullable(),
});

export const tellerTransactionSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  amount: z.string(),
  date: z.string(),
  description: z.string(),
  status: z.string(),
  type: z.string(),
  details: z
    .object({
      category: z.string().nullable().optional(),
      counterparty: z
        .object({
          name: z.string().nullable().optional(),
          type: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
      processing_status: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type TellerAccount = z.infer<typeof tellerAccountSchema>;
export type TellerBalance = z.infer<typeof tellerBalanceSchema>;
export type TellerTransaction = z.infer<typeof tellerTransactionSchema>;

export const CATEGORY_MAP: Record<string, string> = {
  accommodation: "Travel",
  advertising: "Other",
  bar: "Food & Drink",
  charity: "Other",
  clothing: "Shopping",
  dining: "Food & Drink",
  education: "Other",
  electronics: "Shopping",
  entertainment: "Entertainment",
  fuel: "Transport",
  general: "Other",
  groceries: "Food & Drink",
  health: "Health",
  home: "Bills & Utilities",
  income: "Other",
  insurance: "Bills & Utilities",
  investment: "Other",
  loan: "Bills & Utilities",
  office: "Other",
  phone: "Bills & Utilities",
  service: "Other",
  shopping: "Shopping",
  software: "Other",
  sport: "Entertainment",
  tax: "Bills & Utilities",
  transport: "Transport",
  transportation: "Transport",
  utilities: "Bills & Utilities",
};

export function mapCategory(category: string | null | undefined): string {
  if (!category) return "Other";
  return CATEGORY_MAP[category.toLowerCase()] || "Other";
}
