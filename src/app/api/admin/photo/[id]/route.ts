import { NextResponse } from "next/server";
import { fetchPrivatePhoto } from "@/lib/google-script";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
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
      photoFileId: true,
      photoMimeType: true,
      photoFileName: true,
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
    const photo = await fetchPrivatePhoto(visit.photoFileId);
    const binary = Buffer.from(photo.base64Data, "base64");

    return new NextResponse(binary, {
      status: 200,
      headers: {
        "content-type": photo.mimeType || visit.photoMimeType,
        "cache-control": "private, max-age=60",
        "content-disposition": `inline; filename=\"${photo.fileName || visit.photoFileName}\"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil foto";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "PHOTO_FETCH_FAILED", message },
      },
      { status: 500 },
    );
  }
}
