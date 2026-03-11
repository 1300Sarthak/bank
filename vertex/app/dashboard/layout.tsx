import Sidebar from "@/components/layout/Sidebar";
import { PortfolioProvider } from "@/context/PortfolioContext";

async function getTellerAccounts() {
  try {
    const certPath = process.env.TELLER_CERT_PATH;
    const token = process.env.TELLER_ACCESS_TOKEN;
    if (!certPath || !token) return [];

    const https = await import("https");
    const fs = await import("fs");

    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(process.env.TELLER_KEY_PATH || "");
    const agent = new https.Agent({ cert, key });

    const base = process.env.TELLER_API_BASE || "https://api.teller.io";
    const res = await fetch(`${base}/accounts`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
      },
      // @ts-expect-error Node.js fetch supports agent
      agent,
      cache: "no-store",
    });

    if (!res.ok) return [];
    const accounts = await res.json();
    return accounts.map((a: { id: string; name: string; institution: { name: string } }) => ({
      id: a.id,
      name: a.name,
      institution: a.institution.name,
    }));
  } catch {
    return [];
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tellerAccounts = await getTellerAccounts();

  return (
    <div className="app">
      <Sidebar tellerAccounts={tellerAccounts} />
      <main className="main">
        <PortfolioProvider>{children}</PortfolioProvider>
      </main>
    </div>
  );
}
