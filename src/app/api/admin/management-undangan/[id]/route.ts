import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateManagementUndanganSchema = z.object({
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

export async function PATCH(request: Request, context: RouteContext) {
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
  if (!id) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "ID data tidak valid" },
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

  const parsed = updateManagementUndanganSchema.safeParse(body);
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
    const existing = await prisma.managementUndangan.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "Data tidak ditemukan" },
        },
        { status: 404 },
      );
    }

    const updated = await prisma.managementUndangan.update({
      where: { id },
      data: {
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
      data: updated,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui data management undangan";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UPDATE_FAILED", message },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
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
  if (!id) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "ID data tidak valid" },
      },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.managementUndangan.findUnique({
      where: { id },
      select: { id: true, fileName: true },
    });

    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "Data tidak ditemukan" },
        },
        { status: 404 },
      );
    }

    await prisma.managementUndangan.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: existing.id,
        fileName: existing.fileName,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menghapus data management undangan";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "DELETE_FAILED", message },
      },
      { status: 500 },
    );
  }
}
