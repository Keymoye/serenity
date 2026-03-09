import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/infra/supabase/currentUser";
import {
  addServiceImageAdmin,
  deleteServiceImageAdmin,
  listServiceImagesAdmin,
} from "@/lib/application/admin.service";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";
import { serviceImageAddSchema, serviceImageDeleteSchema } from "@/lib/utils/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const current = await requireAdmin();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }
    const context = { userId: current.user.id, role: current.profile.role };
    const images = await listServiceImagesAdmin(id, context);
    return NextResponse.json({ images });
  } catch (error) {
    const { status: errStatus, body: errBody } = mapErrorToLegacyHttp(error);
    return NextResponse.json(errBody, { status: errStatus });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const current = await requireAdmin();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }
    const context = { userId: current.user.id, role: current.profile.role };
    const body = await request.json();
    const parsed = serviceImageAddSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    const image = await addServiceImageAdmin(
      { service_id: id, image_url: parsed.data.image_url, sort_order: parsed.data.sort_order || undefined },
      context
    );
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    const { status: errStatus, body: errBody } = mapErrorToLegacyHttp(error);
    return NextResponse.json(errBody, { status: errStatus });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const current = await requireAdmin();
    if (!current) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }
    const context = { userId: current.user.id, role: current.profile.role };
    const body = await request.json();
    const parsed = serviceImageDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    await deleteServiceImageAdmin(parsed.data.image_id, id, context);
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status: errStatus, body: errBody } = mapErrorToLegacyHttp(error);
    return NextResponse.json(errBody, { status: errStatus });
  }
}