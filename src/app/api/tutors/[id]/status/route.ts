import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { guardAdmin, isObjectId, jsonError, validationError } from "@/lib/api";
import { statusUpdateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { Tutor } from "@/models/Tutor";

export const runtime = "nodejs";

/** Change a tutor's status and record it in the status history. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/tutors/[id]/status">) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Tutor not found", 404);

  const parsed = statusUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  await connectDB();
  const tutor = await Tutor.findById(id).select("status");
  if (!tutor) return jsonError("Tutor not found", 404);

  const previous = tutor.status;
  if (previous === parsed.data.status) return NextResponse.json({ ok: true, status: previous });

  // Hired and Demo carry money (commission / demo deposit), so they must be set
  // through POST /api/tutors/:id/hires with those details — never silently here.
  if (parsed.data.status === "Hired" || parsed.data.status === "Demo") {
    return jsonError(
      `Add the ${parsed.data.status === "Hired" ? "salary and commission" : "demo deposit"} to mark this tutor as ${parsed.data.status}.`,
      422
    );
  }

  tutor.status = parsed.data.status;
  tutor.archivedAt = parsed.data.status === "Archived" ? new Date() : undefined;
  await tutor.save();

  await logActivity({
    tutorId: tutor._id,
    action: "status_changed",
    admin,
    previousValue: previous ?? "",
    newValue: parsed.data.status,
    note: parsed.data.note,
  });
  return NextResponse.json({ ok: true, status: parsed.data.status });
}
