import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM watchlist WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM watchlist WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
