import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdmin, jsonError, validationError } from "@/lib/api";
import { getYearSummaries } from "@/lib/data/hires";
import { saveManualSnapshot } from "@/lib/data/revenue-snapshots";

export const runtime = "nodejs";

const schema = z.object({
  year: z.string().regex(/^\d{4}$/, "Choose a year"),
  note: z.string().trim().max(300, "Note must be at most 300 characters").optional().default(""),
});

/** Save a snapshot of one year's revenue figures as they are right now. */
export async function POST(req: Request) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const summary = (await getYearSummaries()).find((y) => y.year === parsed.data.year);
  if (!summary) return jsonError(`There are no hires or demo classes in ${parsed.data.year} to save.`, 404);

  const id = await saveManualSnapshot(summary, admin.name, parsed.data.note);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
