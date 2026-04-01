import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { createHoldingSchema } from "@/lib/validators/holdings";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET() {
  const db = getDb();
  const holdings = db.prepare("SELECT * FROM holdings ORDER BY created_at DESC").all();
  return NextResponse.json(holdings);
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit("holdings")) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = await req.json();
  const result = createHoldingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { ticker, name, shares, avgCost, broker, color } = result.data;
  const db = getDb();

  const stmt = db.prepare(
    "INSERT INTO holdings (ticker, name, shares, avg_cost, broker, color) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const info = stmt.run(ticker, name, shares, avgCost, broker, color);

  const holding = db.prepare("SELECT * FROM holdings WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json(holding, { status: 201 });
}
