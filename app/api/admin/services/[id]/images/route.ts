import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/services/authService";
import {
  addServiceImageAdmin,
  deleteServiceImageAdmin,
  listServiceImagesAdmin,
} from "@/lib/application/admin.service";
import { mapErrorToLegacyHttp } from "@/lib/utils/errorMapper";

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
    const { image_url, sort_order } = body;
    if (!image_url || typeof image_url !== "string") {
      return NextResponse.json(
        { error: "image_url is required" },
        { status: 400 }
      );
    }
    const image = await addServiceImageAdmin(
      { service_id: id, image_url, sort_order },
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
    const { image_id } = body;
    if (!image_id) {
      return NextResponse.json(
        { error: "image_id is required" },
        { status: 400 }
      );
    }
    await deleteServiceImageAdmin(image_id, id, context);
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status: errStatus, body: errBody } = mapErrorToLegacyHttp(error);
    return NextResponse.json(errBody, { status: errStatus });
  }
}