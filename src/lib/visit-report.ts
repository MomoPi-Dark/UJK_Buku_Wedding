import { VisitPurpose } from "@prisma/client";
import { subDays } from "@/lib/time";
import { prisma } from "@/lib/prisma";

type RangePreset = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<RangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export async function getDashboardSummary(range: RangePreset = "30d") {
  const now = new Date();
  const start = subDays(now, RANGE_DAYS[range] - 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = subDays(todayStart, 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalInRange,
    totalToday,
    totalWeek,
    totalMonth,
    visitsInRange,
    latestVisits,
    purposeCounts,
    latestReactionCounts,
  ] = await Promise.all([
    prisma.guestVisit.count({ where: { visitAt: { gte: start } } }),
    prisma.guestVisit.count({ where: { visitAt: { gte: todayStart } } }),
    prisma.guestVisit.count({ where: { visitAt: { gte: weekStart } } }),
    prisma.guestVisit.count({ where: { visitAt: { gte: monthStart } } }),
    prisma.guestVisit.findMany({
      where: { visitAt: { gte: start } },
      select: { visitAt: true },
    }),
    prisma.guestVisit.findMany({
      take: 25,
      orderBy: { visitAt: "desc" },
    }),
    prisma.guestVisit.groupBy({
      by: ["purpose"],
      where: { visitAt: { gte: start } },
      _count: { _all: true },
    }),
    prisma.guestVisitReaction.groupBy({
      by: ["guestVisitId", "reactionType"],
      _count: { _all: true },
    }),
  ]);

  const reactionMap = new Map<
    number,
    { heart: number; bouquet: number; sparkle: number }
  >();

  for (const reaction of latestReactionCounts) {
    const current = reactionMap.get(reaction.guestVisitId) ?? {
      heart: 0,
      bouquet: 0,
      sparkle: 0,
    };
    current[reaction.reactionType] = reaction._count._all;
    reactionMap.set(reaction.guestVisitId, current);
  }

  const chartMap = new Map<string, number>();
  for (let i = 0; i < RANGE_DAYS[range]; i += 1) {
    const day = subDays(now, RANGE_DAYS[range] - 1 - i);
    const key = formatDayKey(day);
    chartMap.set(key, 0);
  }

  for (const item of visitsInRange) {
    const key = formatDayKey(item.visitAt);
    chartMap.set(key, (chartMap.get(key) ?? 0) + 1);
  }

  const chart = Array.from(chartMap.entries()).map(([date, total]) => ({
    date,
    total,
  }));
  const purpose = purposeCounts.map((entry) => ({
    purpose: entry.purpose,
    total: entry._count._all,
  }));

  return {
    totals: {
      range: totalInRange,
      today: totalToday,
      week: totalWeek,
      month: totalMonth,
    },
    chart,
    purpose,
    latestVisits: latestVisits.map((visit) => ({
      ...visit,
      reactions: reactionMap.get(visit.id) ?? {
        heart: 0,
        bouquet: 0,
        sparkle: 0,
      },
    })),
  };
}

function formatDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseRange(input: string | null): RangePreset {
  if (input === "7d" || input === "30d" || input === "90d") {
    return input;
  }
  return "30d";
}

export function isVisitPurpose(value: string): value is VisitPurpose {
  return [
    "DOA_RESTU",
    "UCAPAN_BAHAGIA",
    "CERITA_KENANGAN",
    "NASIHAT_PERNIKAHAN",
    "DOA_KELUARGA",
    "HARAPAN_MASA_DEPAN",
    "SALAM_KEHADIRAN",
    "UCAPAN_LAINNYA",
  ].includes(value);
}
