import "server-only";
import * as fd from "@/lib/financial-data";

interface DcfInputs {
  ticker: string;
  revenues: number[];
  fcfMargins: number[];
  netDebt: number;
  sharesOutstanding: number;
  beta: number;
  currentFcf: number;
}

interface DcfResult {
  intrinsicValue: number;
  wacc: number;
  terminalGrowthRate: number;
  projectedFcfs: number[];
  pvOfFcfs: number;
  terminalValue: number;
  pvOfTerminalValue: number;
  sensitivityTable: SensitivityRow[];
}

interface SensitivityRow {
  wacc: number;
  growthRate: number;
  intrinsicValue: number;
}

function computeWacc(beta: number): number {
  const riskFreeRate = 0.045; // ~10Y Treasury yield
  const equityRiskPremium = 0.055;
  const costOfEquity = riskFreeRate + beta * equityRiskPremium;
  // Simplified: assume all-equity (no debt adjustment needed for basic DCF)
  return costOfEquity;
}

function runDcf(inputs: DcfInputs, wacc: number, terminalGrowthRate: number): DcfResult {
  const years = 5;

  // Estimate revenue growth from historical data
  let avgRevenueGrowth = 0.08; // default 8%
  if (inputs.revenues.length >= 2) {
    const growthRates: number[] = [];
    for (let i = 1; i < Math.min(inputs.revenues.length, 4); i++) {
      if (inputs.revenues[i - 1] > 0) {
        growthRates.push((inputs.revenues[i] - inputs.revenues[i - 1]) / inputs.revenues[i - 1]);
      }
    }
    if (growthRates.length > 0) {
      avgRevenueGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      // Cap between -10% and 50% for sanity
      avgRevenueGrowth = Math.max(-0.1, Math.min(0.5, avgRevenueGrowth));
    }
  }

  // Average FCF margin
  let avgFcfMargin =
    inputs.fcfMargins.length > 0
      ? inputs.fcfMargins.reduce((a, b) => a + b, 0) / inputs.fcfMargins.length
      : 0.12;
  avgFcfMargin = Math.max(0.01, Math.min(0.6, avgFcfMargin));

  // Latest revenue as base
  const baseRevenue =
    inputs.revenues.length > 0 ? inputs.revenues[inputs.revenues.length - 1] : 0;

  // Project FCFs over 5 years (use direct FCF growth if we have it, else via revenue * margin)
  const baseFcf = inputs.currentFcf > 0 ? inputs.currentFcf : baseRevenue * avgFcfMargin;
  const fcfGrowth = Math.min(avgRevenueGrowth, 0.4); // FCF grows roughly with revenue

  const projectedFcfs: number[] = [];
  for (let y = 1; y <= years; y++) {
    projectedFcfs.push(baseFcf * Math.pow(1 + fcfGrowth, y));
  }

  // Discount FCFs to present value
  let pvOfFcfs = 0;
  for (let y = 0; y < years; y++) {
    pvOfFcfs += projectedFcfs[y] / Math.pow(1 + wacc, y + 1);
  }

  // Terminal value (Gordon Growth Model)
  const terminalFcf = projectedFcfs[years - 1] * (1 + terminalGrowthRate);
  const terminalValue = terminalFcf / (wacc - terminalGrowthRate);
  const pvOfTerminalValue = terminalValue / Math.pow(1 + wacc, years);

  // Enterprise value
  const enterpriseValue = pvOfFcfs + pvOfTerminalValue;

  // Equity value = EV - Net Debt
  const equityValue = enterpriseValue - inputs.netDebt;

  // Per share
  const intrinsicValue =
    inputs.sharesOutstanding > 0 ? equityValue / inputs.sharesOutstanding : 0;

  return {
    intrinsicValue,
    wacc,
    terminalGrowthRate,
    projectedFcfs,
    pvOfFcfs,
    terminalValue,
    pvOfTerminalValue,
  } as DcfResult;
}

function buildSensitivityTable(
  inputs: DcfInputs,
  baseWacc: number,
  baseGrowth: number
): SensitivityRow[] {
  const waccDeltas = [-0.02, -0.01, 0, 0.01, 0.02];
  const growthDeltas = [-0.02, -0.01, 0, 0.01, 0.02];
  const rows: SensitivityRow[] = [];

  for (const wDelta of waccDeltas) {
    for (const gDelta of growthDeltas) {
      const w = Math.max(0.05, baseWacc + wDelta);
      const g = Math.max(0.0, Math.min(w - 0.01, baseGrowth + gDelta));
      const result = runDcf(inputs, w, g);
      rows.push({ wacc: w, growthRate: g, intrinsicValue: result.intrinsicValue });
    }
  }
  return rows;
}

function fmt(n: number, decimals = 1): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(decimals)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  return `$${n.toFixed(2)}`;
}

export async function runDcfAnalysis(ticker: string): Promise<string> {
  const t = ticker.toUpperCase();

  // Fetch data in parallel
  const [incomeData, balanceData, cashFlowData, metricsData] = await Promise.allSettled([
    fd.getIncomeStatements(t, "annual", 5),
    fd.getBalanceSheets(t, "annual", 2),
    fd.getCashFlowStatements(t, "annual", 5),
    fd.getFinancialMetrics(t),
  ]);

  // Extract revenues — Alpha Vantage uses totalRevenue (string values)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incomeStatements: any[] =
    incomeData.status === "fulfilled"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (incomeData.value as any).income_statements ?? []
      : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const balanceSheets: any[] =
    balanceData.status === "fulfilled"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (balanceData.value as any).balance_sheets ?? []
      : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cashFlows: any[] =
    cashFlowData.status === "fulfilled"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cashFlowData.value as any).cash_flow_statements ?? []
      : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics: any[] =
    metricsData.status === "fulfilled"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metricsData.value as any).financial_metrics ?? []
      : [];

  // Alpha Vantage field names: totalRevenue, netIncome (string values)
  const revenues = incomeStatements
    .map((s) => Number(s.totalRevenue ?? s.revenue ?? 0))
    .filter((v) => v > 0);

  const fcfs = cashFlows
    .map((s) => Number(s.free_cash_flow ?? s.operatingCashflow ?? s.operating_cash_flow ?? 0))
    .filter((v) => v !== 0);

  const fcfMargins = fcfs
    .map((f, i) => (revenues[i] > 0 ? f / revenues[i] : 0))
    .filter((v) => v > 0);

  // Alpha Vantage BALANCE_SHEET: shortLongTermDebtTotal, cashAndCashEquivalentsAtCarryingValue
  const latestBalance = balanceSheets[0] ?? {};
  const totalDebt = Number(
    latestBalance.shortLongTermDebtTotal ??
    latestBalance.totalCurrentLiabilities ??
    latestBalance.total_debt ?? 0
  );
  const cash = Number(
    latestBalance.cashAndCashEquivalentsAtCarryingValue ??
    latestBalance.cash_and_equivalents ?? 0
  );
  const netDebt = totalDebt - cash;

  // Alpha Vantage OVERVIEW metrics (returned as array of one object)
  const latestMetrics = metrics[0] ?? {};
  const beta = Number(latestMetrics.beta ?? 1.2);
  const sharesOutstanding = Number(
    latestMetrics.shares_outstanding ??
    latestMetrics.SharesOutstanding ?? 0
  );

  const currentFcf = fcfs[fcfs.length - 1] ?? 0;
  const latestRevenue = revenues[revenues.length - 1] ?? 0;

  const inputs: DcfInputs = {
    ticker: t,
    revenues,
    fcfMargins,
    netDebt,
    sharesOutstanding,
    beta,
    currentFcf,
  };

  const wacc = computeWacc(beta);
  const terminalGrowthRate = 0.025; // 2.5% long-run growth
  const result = runDcf(inputs, wacc, terminalGrowthRate);
  const sensitivity = buildSensitivityTable(inputs, wacc, terminalGrowthRate);

  // Build unique WACC and growth values for the table
  const waccVals = [...new Set(sensitivity.map((r) => r.wacc))].sort((a, b) => a - b);
  const growthVals = [...new Set(sensitivity.map((r) => r.growthRate))].sort((a, b) => a - b);

  // Format sensitivity as markdown table
  const tableHeader =
    "| WACC \\ Growth | " + growthVals.map((g) => `${(g * 100).toFixed(1)}%`).join(" | ") + " |";
  const tableSep =
    "|---|" + growthVals.map(() => "---").join("|") + "|";
  const tableRows = waccVals
    .map((w) => {
      const cells = growthVals.map((g) => {
        const row = sensitivity.find(
          (r) => Math.abs(r.wacc - w) < 0.0001 && Math.abs(r.growthRate - g) < 0.0001
        );
        return row ? `$${row.intrinsicValue.toFixed(2)}` : "—";
      });
      return `| **${(w * 100).toFixed(1)}%** | ${cells.join(" | ")} |`;
    })
    .join("\n");

  const report = `## DCF Valuation — ${t}

### Key Assumptions
- **WACC:** ${(wacc * 100).toFixed(1)}% (Beta: ${beta.toFixed(2)}, Risk-free: 4.5%, ERP: 5.5%)
- **Terminal Growth Rate:** ${(terminalGrowthRate * 100).toFixed(1)}%
- **Projection Period:** 5 years
- **Latest Revenue:** ${fmt(latestRevenue)}
- **Latest FCF:** ${fmt(currentFcf)}
- **Net Debt:** ${fmt(netDebt)}
- **Shares Outstanding:** ${sharesOutstanding > 0 ? (sharesOutstanding / 1e6).toFixed(0) + "M" : "N/A"}

### Projected Free Cash Flows
${result.projectedFcfs.map((f, i) => `- Year ${i + 1}: ${fmt(f)}`).join("\n")}

### Valuation
- **PV of FCFs (5 yr):** ${fmt(result.pvOfFcfs)}
- **Terminal Value:** ${fmt(result.terminalValue)}
- **PV of Terminal Value:** ${fmt(result.pvOfTerminalValue)}
- **Net Debt:** ${fmt(netDebt)}
- **Intrinsic Value per Share:** **$${result.intrinsicValue > 0 ? result.intrinsicValue.toFixed(2) : "N/A"}**

### Sensitivity Analysis (Intrinsic Value per Share)
${tableHeader}
${tableSep}
${tableRows}

> **Disclaimer:** This DCF is a quantitative model based on historical financials. It should be used alongside qualitative analysis, not as sole investment guidance. Actual results may differ significantly.`;

  return report;
}
