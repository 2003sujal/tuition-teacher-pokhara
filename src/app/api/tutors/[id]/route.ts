import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { deleteCv } from "@/lib/cloudinary";
import { guardAdmin, isObjectId, jsonError, validationError } from "@/lib/api";
import { tutorUpdateSchema } from "@/lib/validations";
import { normalizeNepaliMobile } from "@/lib/phone";
import { tidyLocation } from "@/lib/utils";
import { getTutor } from "@/lib/data/tutors";
import { logActivity } from "@/lib/activity";
import { Tutor } from "@/models/Tutor";
import { ActivityLog } from "@/models/ActivityLog";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: RouteContext<"/api/tutors/[id]">) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Tutor not found", 404);

  const tutor = await getTutor(id);
  if (!tutor) return jsonError("Tutor not found", 404);
  return NextResponse.json(tutor, { headers: { "Cache-Control": "no-store" } });
}

/** Edit basic information (name, mobile, location). */
export async function PATCH(req: Request, ctx: RouteContext<"/api/tutors/[id]">) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Tutor not found", 404);

  const parsed = tutorUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  await connectDB();
  const tutor = await Tutor.findById(id);
  if (!tutor) return jsonError("Tutor not found", 404);

  const normalized = normalizeNepaliMobile(parsed.data.mobileNumber)!;
  const location = tidyLocation(parsed.data.location);
  const describe = () =>
    `${tutor.fullName} · ${tutor.normalizedMobileNumber} · ${tutor.location} · ${(tutor.subjects ?? []).join(", ") || "no subjects"}`;
  const before = describe();

  tutor.fullName = parsed.data.fullName.replace(/\s+/g, " ");
  tutor.mobileNumber = normalized;
  tutor.normalizedMobileNumber = normalized;
  tutor.location = location;
  tutor.locationKey = location.toLowerCase();
  if (JSON.stringify(tutor.subjects ?? []) !== JSON.stringify(parsed.data.subjects)) {
    tutor.subjects = parsed.data.subjects;
    tutor.subjectKeys = parsed.data.subjects.map((s) => s.toLowerCase());
  }

  if (!tutor.isModified()) return NextResponse.json({ ok: true });
  await tutor.save();

  await logActivity({
    tutorId: tutor._id,
    action: "details_updated",
    admin,
    previousValue: before,
    newValue: describe(),
  });
  return NextResponse.json({ ok: true });
}

/** Permanently delete a tutor record and their CV file. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/tutors/[id]">) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Tutor not found", 404);

  await connectDB();
  const tutor = await Tutor.findById(id).select("cvPublicId");
  if (!tutor) return jsonError("Tutor not found", 404);

  try {
    await deleteCv(tutor.cvPublicId);
  } catch (err) {
    console.error("Failed to delete CV from Cloudinary", err);
  }
  await Promise.all([tutor.deleteOne(), ActivityLog.deleteMany({ tutorId: tutor._id })]);
  return NextResponse.json({ ok: true });
}
