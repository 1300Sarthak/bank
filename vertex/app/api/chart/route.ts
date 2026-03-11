import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Interval =
  | "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m"
  | "1h" | "1d" | "5d" | "1wk" | "1mo" | "3mo";

interface PeriodConfig {
  minutes?: number;
  days?: number;
  ytd?: boolean;
  interval: Interval;
}

const PERIODS: Record<string, PeriodConfig> = {
  "1H":  { minutes: 60,  interval: "1m"  },
  "1D":  { days: 1,      interval: "5m"  },
  "1W":  { days: 7,      interval: "1h"  },
  "1Y":  { days: 365,    interval: "1d"  },
  "YTD": { ytd: true,    interval: "1d"  },
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticker = req.nextUrl.searchParams.get("ticker");
  const period = req.nextUrl.searchParams.get("period") ?? "1D";

  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const config = PERIODS[period] ?? PERIODS["1D"];
  const now = new Date();
  let period1: Date;

  if (config.ytd) {
    period1 = new Date(now.getFullYear(), 0, 1);
  } else if (config.minutes) {
    period1 = new Date(now.getTime() - config.minutes * 60 * 1000);
  } else {
    period1 = new Date(now.getTime() - (config.days ?? 1) * 24 * 60 * 60 * 1000);
  }

  try {
    const result = await yf.chart(ticker, {
      period1,
      period2: now,
      interval: config.interval,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes = ((result as any).quotes ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.close != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((q: any) => ({
        t: new Date(q.date).getTime(),
        c: q.close as number,
        h: q.high as number ?? q.close,
        l: q.low as number ?? q.close,
        v: q.volume as number ?? 0,
      }));

    return NextResponse.json({ quotes });
  } catch (err) {
    console.error("Chart error:", err);
    return NextResponse.json({ quotes: [] });
  }
}
