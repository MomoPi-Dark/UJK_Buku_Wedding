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
  viewerReactions: WallReactionState;
};

type WallReactionState = {
  heart: boolean;
  bouquet: boolean;
  sparkle: boolean;
};

const DEFAULT_LIMIT = 16;
const MAX_LIMIT = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const reactorId = searchParams.get("reactorId")?.trim() ?? "";

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

    const visitIds = visits.map((visit) => visit.id);
    const [reactionCounts, viewerReactionRows] = await Promise.all([
      visitIds.length > 0
        ? prisma.guestVisitReaction.groupBy({
            by: ["guestVisitId", "reactionType"],
            where: {
              guestVisitId: {
                in: visitIds,
              },
            },
            _count: {
              _all: true,
            },
          })
        : Promise.resolve([]),
      reactorId && visitIds.length > 0
        ? prisma.guestVisitReaction.findMany({
            where: {
              guestVisitId: {
                in: visitIds,
              },
              reactorId,
            },
            select: {
              guestVisitId: true,
              reactionType: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const reactionMap = new Map<number, WallReaction>();
    for (const visit of visits) {
      reactionMap.set(visit.id, {
        heart: 0,
        bouquet: 0,
        sparkle: 0,
      });
    }

    for (const item of reactionCounts) {
      const current = reactionMap.get(item.guestVisitId);
      if (current) {
        current[item.reactionType] = item._count._all;
      }
    }

    const viewerReactionMap = new Map<number, WallReactionState>();
    for (const visit of visits) {
      viewerReactionMap.set(visit.id, {
        heart: false,
        bouquet: false,
        sparkle: false,
      });
    }

    for (const item of viewerReactionRows) {
      const current = viewerReactionMap.get(item.guestVisitId);
      if (current) {
        current[item.reactionType] = true;
      }
    }

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
      reactions: reactionMap.get(visit.id) ?? {
        heart: 0,
        bouquet: 0,
        sparkle: 0,
      },
      viewerReactions: viewerReactionMap.get(visit.id) ?? {
        heart: false,
        bouquet: false,
        sparkle: false,
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
