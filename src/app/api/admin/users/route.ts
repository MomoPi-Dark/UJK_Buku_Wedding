import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, getAdminSession, isDefaultAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAdminUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama admin wajib diisi")
    .max(120, "Nama admin terlalu panjang"),
  email: z.email("Email admin tidak valid"),
  password: z
    .string()
    .min(8, "Password admin minimal 8 karakter")
    .max(128, "Password admin terlalu panjang"),
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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        users: users.map(
          (user: {
            id: string;
            name: string | null;
            email: string;
            createdAt: Date;
          }) => ({
          ...user,
          username: user.email.split("@")[0] ?? user.email,
          isDefaultAdmin: isDefaultAdminEmail(user.email),
          }),
        ),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memuat daftar admin";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "LIST_FAILED", message },
      },
      { status: 500 },
    );
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

  const parsed = createAdminUserSchema.safeParse(body);
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

  const email = parsed.data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ALREADY_EXISTS",
          message: "Email admin sudah digunakan",
        },
      },
      { status: 409 },
    );
  }

  try {
    const created = await auth.api.signUpEmail({
      body: {
        name: parsed.data.name.trim(),
        email,
        password: parsed.data.password,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: created.user.id,
        email: created.user.email,
        name: created.user.name,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menambahkan admin";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "CREATE_FAILED", message },
      },
      { status: 500 },
    );
  }
}
