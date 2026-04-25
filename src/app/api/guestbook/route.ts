import { NextResponse } from "next/server";
import { getPurposeLabel } from "@/lib/guestbook";
import { mimeTypeToExtension, uploadVisitPhoto } from "@/lib/google-script";
import { saveManagementUndanganFromUpload } from "@/lib/management-undangan";
import { prisma } from "@/lib/prisma";
import { guestVisitInputSchema } from "@/lib/validation";

type RateEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 6;
const rateMap = new Map<string, RateEntry>();

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!passRateLimit(ip)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message:
            "Terlalu banyak pengiriman love note. Silakan coba lagi dalam 1 menit.",
        },
      },
      { status: 429 },
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
        relation: payload.relation,
        address: payload.address,
        purpose: payload.purpose,
        otherPurposeNote:
          payload.purpose === "UCAPAN_LAINNYA"
            ? (payload.otherPurposeNote?.trim() ?? null)
            : null,
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

    await saveManagementUndanganFromUpload({
      fileId: uploaded.fileId,
      fileName: uploaded.fileName,
      folderPath: uploaded.folderPath,
      mimeType: payload.photoMimeType,
      sizeBytes: payload.photoSizeBytes,
      uploadedAt: uploaded.uploadedAt,
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: created.id,
        visitAt: created.visitAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menyimpan love note";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SUBMIT_FAILED", message },
      },
      { status: 500 },
    );
  }
}

function passRateLimit(key: string): boolean {
  const now = Date.now();
  const current = rateMap.get(key);

  if (!current || current.resetAt < now) {
    rateMap.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }

  current.count += 1;
  rateMap.set(key, current);
  return true;
}
