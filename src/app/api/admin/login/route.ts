import { NextResponse } from "next/server";
import { z } from "zod";
import { bootstrapLegacyAdminLogin } from "@/lib/auth";

const bootstrapLoginSchema = z.object({
  email: z.email("Email login tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(request: Request) {
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

  const parsed = bootstrapLoginSchema.safeParse(body);
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
    const bootstrapped = await bootstrapLegacyAdminLogin(
      parsed.data.email,
      parsed.data.password,
    );

    if (!bootstrapped) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email atau password tidak valid",
          },
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        bootstrapped: true,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menyiapkan akun admin";

    return NextResponse.json(
      {
        ok: false,
        error: { code: "BOOTSTRAP_FAILED", message },
      },
      { status: 500 },
    );
  }
}
