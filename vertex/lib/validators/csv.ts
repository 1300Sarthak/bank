import { z } from "zod/v4";

export const csvRowSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(10)
    .transform((v) => v.toUpperCase().trim()),
  name: z.string().min(1).max(100).transform((v) => v.trim()),
  shares: z.coerce.number().positive(),
  avgCost: z.coerce.number().positive(),
  broker: z.string().max(50).optional().default("Default"),
  color: z.string().max(20).optional().default("#6c5ce7"),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

export function validateCsvRows(
  rows: Record<string, string>[]
): { valid: CsvRow[]; errors: { row: number; message: string }[] } {
  const valid: CsvRow[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, index) => {
    const mapped = {
      ticker: row.ticker || row.Ticker || row.TICKER || row.symbol || row.Symbol || "",
      name: row.name || row.Name || row.NAME || row.company || row.Company || "",
      shares: row.shares || row.Shares || row.SHARES || row.quantity || row.Quantity || "",
      avgCost:
        row.avgCost ||
        row.avg_cost ||
        row["Avg Cost"] ||
        row.cost ||
        row.Cost ||
        row.price ||
        row.Price ||
        "",
      broker: row.broker || row.Broker || row.BROKER || "Default",
    };

    const result = csvRowSchema.safeParse(mapped);
    if (result.success) {
      valid.push(result.data);
    } else {
      const msg = result.error.issues.map((i) => i.message).join(", ");
      errors.push({ row: index + 1, message: msg });
    }
  });

  return { valid, errors };
}
