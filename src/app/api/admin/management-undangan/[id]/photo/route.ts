import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { fetchPrivatePhoto } from "@/lib/google-script";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
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
        error: { code: "INVALID_ID", message: "ID data tidak valid" },
      },
      { status: 400 },
    );
  }

  const row = await prisma.managementUndangan.findUnique({
    where: { id },
    select: {
      fileId: true,
      fileName: true,
      mimeType: true,
    },
  });

  if (!row) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "NOT_FOUND", message: "Data undangan tidak ditemukan" },
      },
      { status: 404 },
    );
  }

  try {
    const photo = await fetchPrivatePhoto(row.fileId);
    const binary = Buffer.from(photo.base64Data, "base64");

    return new NextResponse(binary, {
      status: 200,
      headers: {
        "content-type": photo.mimeType || row.mimeType,
        "cache-control": "private, max-age=60",
        "content-disposition": `inline; filename=\"${photo.fileName || row.fileName}\"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil gambar undangan";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "PHOTO_FETCH_FAILED", message },
      },
      { status: 500 },
    );
  }
}
