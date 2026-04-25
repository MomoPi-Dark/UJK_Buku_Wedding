import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const reactionTypeSchema = z.enum(["heart", "bouquet", "sparkle"]);
type ReactionType = z.infer<typeof reactionTypeSchema>;

const reactionPayloadSchema = z.object({
  messageId: z.number().int().positive(),
  reaction: reactionTypeSchema,
  reactorId: z.string().trim().min(8).max(191),
});

function emptyReactionTotals() {
  return {
    heart: 0,
    bouquet: 0,
    sparkle: 0,
  } satisfies Record<ReactionType, number>;
}

async function getReactionSnapshot(messageId: number, reactorId: string) {
  const [totals, activeRows] = await Promise.all([
    prisma.guestVisitReaction.groupBy({
      by: ["reactionType"],
      where: {
        guestVisitId: messageId,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.guestVisitReaction.findMany({
      where: {
        guestVisitId: messageId,
        reactorId,
      },
      select: {
        reactionType: true,
      },
    }),
  ]);

  const reactions = emptyReactionTotals();
  for (const item of totals) {
    reactions[item.reactionType as ReactionType] = item._count._all;
  }

  const viewerReactions: Record<ReactionType, boolean> = {
    heart: false,
    bouquet: false,
    sparkle: false,
  };
  for (const item of activeRows) {
    viewerReactions[item.reactionType as ReactionType] = true;
  }

  return { reactions, viewerReactions };
}

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

  const parsed = reactionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Data reaksi tidak valid",
        },
      },
      { status: 400 },
    );
  }

  const { messageId, reaction, reactorId } = parsed.data;

  const visit = await prisma.guestVisit.findUnique({
    where: {
      id: messageId,
    },
    select: {
      id: true,
    },
  });

  if (!visit) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Love note tidak ditemukan",
        },
      },
      { status: 404 },
    );
  }

  const existing = await prisma.guestVisitReaction.findUnique({
    where: {
      guestVisitId_reactionType_reactorId: {
        guestVisitId: messageId,
        reactionType: reaction,
        reactorId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await prisma.guestVisitReaction.delete({
      where: {
        id: existing.id,
      },
    });
  } else {
    await prisma.guestVisitReaction.create({
      data: {
        guestVisitId: messageId,
        reactionType: reaction,
        reactorId,
      },
    });
  }

  const snapshot = await getReactionSnapshot(messageId, reactorId);

  return NextResponse.json({
    ok: true,
    data: {
      messageId,
      reactions: snapshot.reactions,
      viewerReactions: snapshot.viewerReactions,
    },
  });
}
