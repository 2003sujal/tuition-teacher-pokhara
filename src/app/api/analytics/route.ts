import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/api";
import { dateRangeSchema } from "@/lib/validations";
import { getReport } from "@/lib/data/analytics";

export const runtime = "nodejs";

/** Admin: status counts, monthly registrations and location distribution for a date range. */
export async function GET(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;

  const range = dateRangeSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const report = await getReport(range);
  return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
}
