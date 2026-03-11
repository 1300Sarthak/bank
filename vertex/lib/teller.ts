import "server-only";
import https from "https";
import fs from "fs";

let agent: https.Agent | null = null;

function getAgent(): https.Agent | null {
  if (agent) return agent;

  const certPath = process.env.TELLER_CERT_PATH;
  const keyPath = process.env.TELLER_KEY_PATH;

  if (!certPath || !keyPath) return null;

  try {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    agent = new https.Agent({ cert, key });
    return agent;
  } catch {
    console.error("Failed to load Teller certificates");
    return null;
  }
}

export async function tellerGet<T>(path: string): Promise<T> {
  const tlsAgent = getAgent();
  if (!tlsAgent) throw new Error("Teller mTLS not configured");

  const token = process.env.TELLER_ACCESS_TOKEN;
  if (!token) throw new Error("TELLER_ACCESS_TOKEN not set");

  const baseUrl = process.env.TELLER_API_BASE || "https://api.teller.io";
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
    },
    // @ts-expect-error Node.js fetch supports agent
    agent: tlsAgent,
  });

  if (!response.ok) {
    throw new Error(`Teller API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function maskAccountNumber(number: string): string {
  if (number.length <= 4) return number;
  return "••••" + number.slice(-4);
}
