import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteVisitPhoto } from "@/lib/google-script";
import { prisma } from "@/lib/prisma";
import { adminVisitUpdateSchema } from "@/lib/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Akses admin dibutuhkan" },
      },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const visitId = Number(id);
  if (!Number.isInteger(visitId) || visitId <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_ID", message: "ID kunjungan tidak valid" },
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_JSON", message: "Format request tidak valid" },
      },
      { status: 400 },
    );
  }

  const parsed = adminVisitUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Data tidak valid",
        },
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    const updated = await prisma.guestVisit.update({
      where: { id: visitId },
      data: {
        name: payload.name,
        relation: payload.relation,
        address: payload.address,
        purpose: payload.purpose,
        otherPurposeNote:
          payload.purpose === "UCAPAN_LAINNYA"
            ? (payload.otherPurposeNote?.trim() ?? null)
            : null,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: updated,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui data kunjungan";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UPDATE_FAILED", message },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Akses admin dibutuhkan" },
      },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const visitId = Number(id);

  if (!Number.isInteger(visitId) || visitId <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_ID", message: "ID kunjungan tidak valid" },
      },
      { status: 400 },
    );
  }

  const visit = await prisma.guestVisit.findUnique({
    where: { id: visitId },
    select: {
      id: true,
      photoFileId: true,
    },
  });

  if (!visit) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "NOT_FOUND", message: "Data kunjungan tidak ditemukan" },
      },
      { status: 404 },
    );
  }

  try {
    await deleteVisitPhoto(visit.photoFileId);
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Gagal menghapus foto kunjungan";
    const normalizedMessage = rawMessage.toLowerCase();
    const needsScriptUpdate =
      normalizedMessage.includes("unsupported action") ||
      normalizedMessage.includes("invalid_action") ||
      normalizedMessage.includes("invalid field: name") ||
      normalizedMessage.includes("invalid field: purpose") ||
      normalizedMessage.includes("invalid field: mimetype");
    const message = needsScriptUpdate
      ? "Endpoint Apps Script upload belum support action delete. Update endpoint upload lalu redeploy /exec."
      : rawMessage;

    return NextResponse.json(
      {
        ok: false,
        error: { code: "PHOTO_DELETE_FAILED", message },
      },
      { status: 502 },
    );
  }

  try {
    await prisma.guestVisit.delete({
      where: { id: visit.id },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghapus data kunjungan";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VISIT_DELETE_FAILED", message },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: visit.id,
    },
  });
}
