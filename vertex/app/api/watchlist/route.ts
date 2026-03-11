import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getDb from "@/lib/db";
import { z } from "zod/v4";

const addWatchlistSchema = z.object({
  ticker: z.string().min(1).max(10).transform((v) => v.toUpperCase()),
  name: z.string().min(1).max(100),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const items = db.prepare("SELECT * FROM watchlist ORDER BY added_at DESC").all();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = addWatchlistSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const { ticker, name } = result.data;
  const db = getDb();

  try {
    db.prepare("INSERT INTO watchlist (ticker, name) VALUES (?, ?)").run(ticker, name);
  } catch {
    return NextResponse.json({ error: "Already in watchlist" }, { status: 409 });
  }

  const item = db.prepare("SELECT * FROM watchlist WHERE ticker = ?").get(ticker);
  return NextResponse.json(item, { status: 201 });
}
