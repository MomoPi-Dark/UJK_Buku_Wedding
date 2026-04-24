import { NextResponse } from "next/server";
import { getDashboardSummary, parseRange } from "@/lib/visit-report";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));
  const data = await getDashboardSummary(range);
  return NextResponse.json({ ok: true, data });
}
