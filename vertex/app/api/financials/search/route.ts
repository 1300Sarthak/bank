import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import * as fd from "@/lib/financial-data";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("financials")) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  const type = req.nextUrl.searchParams.get("type") || "snapshot";

  try {
    switch (type) {
      case "snapshot":
        return NextResponse.json(await fd.getMetricsSnapshot(ticker));
      case "income":
        return NextResponse.json(await fd.getIncomeStatements(ticker));
      case "balance":
        return NextResponse.json(await fd.getBalanceSheets(ticker));
      case "cashflow":
        return NextResponse.json(await fd.getCashFlowStatements(ticker));
      case "metrics":
        return NextResponse.json(await fd.getFinancialMetrics(ticker));
      case "estimates":
        return NextResponse.json(await fd.getAnalystEstimates(ticker));
      case "targets":
        return NextResponse.json(await fd.getPriceTargets(ticker));
      case "insider":
        return NextResponse.json(await fd.getInsiderTrades(ticker));
      case "news":
        return NextResponse.json(await fd.getCompanyNews(ticker));
      case "filings":
        return NextResponse.json(await fd.getSecFilings(ticker));
      case "segments":
        return NextResponse.json(await fd.getRevenueSegments(ticker));
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
