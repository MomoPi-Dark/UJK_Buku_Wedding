import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createManagementUndanganSchema = z.object({
  fileId: z
    .string()
    .trim()
    .min(1, "File ID wajib diisi")
    .max(191, "File ID terlalu panjang"),
  fileName: z
    .string()
    .trim()
    .min(1, "Nama file wajib diisi")
    .max(191, "Nama file terlalu panjang"),
  folderPath: z
    .string()
    .trim()
    .min(1, "Folder path wajib diisi")
    .max(191, "Folder path terlalu panjang"),
  mimeType: z
    .string()
    .trim()
    .min(1, "MIME type wajib diisi")
    .max(100, "MIME type terlalu panjang"),
  sizeBytes: z
    .number({ message: "Ukuran file tidak valid" })
    .int("Ukuran file harus bilangan bulat")
    .nonnegative("Ukuran file tidak boleh negatif"),
  uploadedAt: z.string().datetime("Tanggal upload tidak valid"),
});

export async function GET() {
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

  try {
    await syncManagementUndanganFromGuestVisits();

    const rows = await prisma.managementUndangan.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        items: rows,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memuat data management undangan";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "LIST_FAILED", message },
      },
      { status: 500 },
    );
  }
}

async function syncManagementUndanganFromGuestVisits() {
  const [existing, visits] = await Promise.all([
    prisma.managementUndangan.findMany({
      select: {
        fileId: true,
      },
    }),
    prisma.guestVisit.findMany({
      select: {
        photoFileId: true,
        photoFileName: true,
        photoFolderPath: true,
        photoMimeType: true,
        photoSizeBytes: true,
        photoUploadedAt: true,
      },
    }),
  ]);

  const existingIds = new Set(existing.map((row) => row.fileId));
  const missingRows = visits.filter(
    (visit) => !existingIds.has(visit.photoFileId),
  );

  if (missingRows.length === 0) {
    return;
  }

  for (const row of missingRows) {
    await prisma.managementUndangan.create({
      data: {
        id: randomUUID(),
        fileId: row.photoFileId,
        fileName: row.photoFileName,
        folderPath: row.photoFolderPath,
        mimeType: row.photoMimeType,
        sizeBytes: row.photoSizeBytes,
        uploadedAt: row.photoUploadedAt,
      },
    });
  }
}

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

  const parsed = createManagementUndanganSchema.safeParse(body);
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

  try {
    const created = await prisma.managementUndangan.create({
      data: {
        id: randomUUID(),
        fileId: parsed.data.fileId,
        fileName: parsed.data.fileName,
        folderPath: parsed.data.folderPath,
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
        uploadedAt: new Date(parsed.data.uploadedAt),
      },
    });

    return NextResponse.json({
      ok: true,
      data: created,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menambahkan data management undangan";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "CREATE_FAILED", message },
      },
      { status: 500 },
    );
  }
}
