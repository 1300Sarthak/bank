import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import Papa from "papaparse";
import { validateCsvRows } from "@/lib/validators/csv";

export async function POST(req: NextRequest) {
  if (!checkRateLimit("import")) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const contentType = req.headers.get("content-type") || "";

  let csvText: string;
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    csvText = await file.text();
  } else {
    const body = await req.json();
    csvText = body.csv;
    if (!csvText) return NextResponse.json({ error: "No CSV data" }, { status: 400 });
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return NextResponse.json(
      { error: "CSV parse failed", details: parsed.errors },
      { status: 400 }
    );
  }

  const { valid, errors } = validateCsvRows(parsed.data);

  const action = req.nextUrl.searchParams.get("action");

  if (action === "preview") {
    return NextResponse.json({ preview: valid, errors, total: parsed.data.length });
  }

  // Insert valid rows
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO holdings (ticker, name, shares, avg_cost, broker, color) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const insertMany = db.transaction((rows: typeof valid) => {
    for (const row of rows) {
      stmt.run(row.ticker, row.name, row.shares, row.avgCost, row.broker, row.color);
    }
  });

  insertMany(valid);

  return NextResponse.json({
    inserted: valid.length,
    errors,
    total: parsed.data.length,
  });
}
