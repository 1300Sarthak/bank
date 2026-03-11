import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getDb from "@/lib/db";
import { updateHoldingSchema } from "@/lib/validators/holdings";
import { checkRateLimit } from "@/lib/ratelimit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("holdings")) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = updateHoldingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = db.prepare("SELECT * FROM holdings WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = result.data;
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.ticker !== undefined) { fields.push("ticker = ?"); values.push(data.ticker); }
  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.shares !== undefined) { fields.push("shares = ?"); values.push(data.shares); }
  if (data.avgCost !== undefined) { fields.push("avg_cost = ?"); values.push(data.avgCost); }
  if (data.broker !== undefined) { fields.push("broker = ?"); values.push(data.broker); }
  if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }

  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  fields.push("updated_at = datetime('now')");
  values.push(Number(id));

  db.prepare(`UPDATE holdings SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const updated = db.prepare("SELECT * FROM holdings WHERE id = ?").get(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const existing = db.prepare("SELECT * FROM holdings WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM holdings WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
