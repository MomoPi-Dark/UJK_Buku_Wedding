import { NextResponse } from "next/server";
import { getAdminSession, isDefaultAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
        error: { code: "BAD_REQUEST", message: "ID user tidak valid" },
      },
      { status: 400 },
    );
  }

  if (id === session.user.id) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Anda tidak bisa menghapus akun yang sedang login",
        },
      },
      { status: 403 },
    );
  }

  try {
    const found = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!found) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "User admin tidak ditemukan" },
        },
        { status: 404 },
      );
    }

    if (isDefaultAdminEmail(found.email)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin utama tidak boleh dihapus",
          },
        },
        { status: 403 },
      );
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: found.id,
        name: found.name,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghapus user admin";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "DELETE_FAILED", message },
      },
      { status: 500 },
    );
  }
}
