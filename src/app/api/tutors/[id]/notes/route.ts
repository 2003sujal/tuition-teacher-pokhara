import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { guardAdmin, isObjectId, jsonError, validationError } from "@/lib/api";
import { notesSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { Tutor } from "@/models/Tutor";

export const runtime = "nodejs";

/** Save private admin notes for a tutor. */
export async function PUT(req: Request, ctx: RouteContext<"/api/tutors/[id]/notes">) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Tutor not found", 404);

  const parsed = notesSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  await connectDB();
  const tutor = await Tutor.findById(id).select("adminNotes");
  if (!tutor) return jsonError("Tutor not found", 404);

  const next = parsed.data.adminNotes.trim();
  if ((tutor.adminNotes ?? "") === next) return NextResponse.json({ ok: true });

  tutor.adminNotes = next;
  await tutor.save();
  await logActivity({ tutorId: tutor._id, action: "notes_updated", admin });
  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
}
