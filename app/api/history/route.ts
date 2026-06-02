import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import path from "path";

// History is persisted to a real JSON file on the server's disk so it survives
// browser-cache clears and is shared across browsers hitting the same server.
// Note: this relies on a writable filesystem (local `npm run dev`). On a
// read-only serverless host (e.g. Vercel) you'd need a database instead.
const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "history.json");

type HistoryItem = {
  id: string;
  date: number;
  type: string;
  title: string;
  content: string;
  meta?: Record<string, unknown>;
};

async function readHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeHistory(items: HistoryItem[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json({ items: await readHistory() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = await readHistory();
    const record: HistoryItem = {
      id: randomUUID(),
      date: Date.now(),
      type: body.type || "other",
      title: body.title || "Sin título",
      content: body.content || "",
      meta: body.meta || {},
    };
    items.unshift(record);
    await writeHistory(items);
    return NextResponse.json({ item: record });
  } catch (e) {
    console.error("History POST error:", e);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id, all } = await request.json().catch(() => ({}));
    if (all) {
      await writeHistory([]);
      return NextResponse.json({ items: [] });
    }
    const items = (await readHistory()).filter((i) => i.id !== id);
    await writeHistory(items);
    return NextResponse.json({ items });
  } catch (e) {
    console.error("History DELETE error:", e);
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 });
  }
}
