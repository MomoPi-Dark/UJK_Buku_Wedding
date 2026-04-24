import { NextResponse } from "next/server";
import { getPurposeLabel } from "@/lib/guestbook";
import { prisma } from "@/lib/prisma";

type WallReaction = {
  heart: number;
  bouquet: number;
  sparkle: number;
};

type WallMessage = {
  id: number;
  author: string;
  message: string;
  origin: string;
  category: string;
  visitAt: string;
  highlighted: boolean;
  reactions: WallReaction;
};

const DEFAULT_LIMIT = 16;
const MAX_LIMIT = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  try {
    const visits = await prisma.guestVisit.findMany({
      take: limit,
      orderBy: { visitAt: "desc" },
      select: {
        id: true,
        name: true,
        address: true,
        institutionOrigin: true,
        purpose: true,
        visitAt: true,
      },
    });

    const messages: WallMessage[] = visits.map((visit, index) => ({
      id: visit.id,
      author: visit.name,
      message: visit.address,
      origin: visit.institutionOrigin,
      category: getPurposeLabel(
        visit.purpose as Parameters<typeof getPurposeLabel>[0],
      ),
      visitAt: visit.visitAt.toISOString(),
      highlighted: index === 0,
      reactions: {
        heart: ((visit.id * 5) % 7) + 1,
        bouquet: ((visit.id * 3) % 6) + 1,
        sparkle: ((visit.id * 7) % 4) + 1,
      },
    }));

    return NextResponse.json({
      ok: true,
      data: {
        messages,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memuat wedding memory wall";
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "WALL_FETCH_FAILED",
          message,
        },
      },
      { status: 500 },
    );
  }
}
