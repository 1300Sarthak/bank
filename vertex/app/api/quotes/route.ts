import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib/quotes";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
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
