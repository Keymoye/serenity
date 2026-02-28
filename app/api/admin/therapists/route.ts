import { NextResponse } from "next/server";
import { z } from "zod";
import * as db from "@/lib/db/therapists";
import { logger } from "@/lib/utils/logger";

const TherapistCreateSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional().nullable(),
  id: z.string().optional(),
});

export async function GET() {
  try {
    const items = await db.listTherapists();
    return NextResponse.json(items);
  } catch (err) {
    logger.error("GET /api/admin/therapists failed", err);
    return NextResponse.json({ error: "Failed to load therapists" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = TherapistCreateSchema.omit({ id: true }).parse(body);
    const created = await db.createTherapist(parsed);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    logger.error("POST /api/admin/therapists failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message ?? "Invalid payload" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parsed = TherapistCreateSchema.parse(body);
    if (!parsed.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const updated = await db.updateTherapist(parsed.id, { name: parsed.name, bio: parsed.bio });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    logger.error("PUT /api/admin/therapists failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message ?? "Update failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.deleteTherapist(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logger.error("DELETE /api/admin/therapists failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message ?? "Delete failed" }, { status: 500 });
  }
}
