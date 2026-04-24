import { NextResponse } from "next/server";
import { VisitPurpose } from "@prisma/client/index-browser";
import { getAdminSession } from "@/lib/auth";
import { getPurposeLabel } from "@/lib/guestbook";
import { mimeTypeToExtension, uploadVisitPhoto } from "@/lib/google-script";
import { prisma } from "@/lib/prisma";
import { guestVisitInputSchema, sanitizePhone } from "@/lib/validation";

export async function POST(request: Request) {
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

  const parsed = guestVisitInputSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: firstError },
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const extension = mimeTypeToExtension(payload.photoMimeType);

  try {
    const uploaded = await uploadVisitPhoto({
      name: payload.name,
      purpose: getPurposeLabel(payload.purpose),
      mimeType: payload.photoMimeType,
      extension,
      base64Data: payload.photoBase64,
      visitAt: new Date().toISOString(),
    });

    const created = await prisma.guestVisit.create({
      data: {
        name: payload.name,
        institutionOrigin: payload.institutionOrigin,
        address: payload.address,
        phone: sanitizePhone(payload.phone),
        purpose: payload.purpose as VisitPurpose,
        otherPurposeNote:
          payload.purpose === "LAYANAN_LAINNYA" ? (payload.otherPurposeNote?.trim() ?? null) : null,
        photoFileId: uploaded.fileId,
        photoFileName: uploaded.fileName,
        photoFolderPath: uploaded.folderPath,
        photoMimeType: payload.photoMimeType,
        photoSizeBytes: payload.photoSizeBytes,
        photoUploadedAt: new Date(uploaded.uploadedAt),
      },
      select: {
        id: true,
        visitAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan data kunjungan";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "CREATE_FAILED", message },
      },
      { status: 500 },
    );
  }
}
