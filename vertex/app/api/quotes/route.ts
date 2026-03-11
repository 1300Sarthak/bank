import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getQuotes } from "@/lib/quotes";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("quotes")) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const tickersParam = req.nextUrl.searchParams.get("tickers");
  if (!tickersParam) {
    return NextResponse.json({ error: "tickers parameter required" }, { status: 400 });
  }

  const tickers = tickersParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 50);

  const quotes = await getQuotes(tickers);
  return NextResponse.json(quotes);
}
