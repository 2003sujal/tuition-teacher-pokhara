import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { guardAdmin, isObjectId, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { deletePoster } from "@/lib/cloudinary";
import { Hire } from "@/models/Hire";

export const runtime = "nodejs";

/** Remove a hire record (and its poster). The tutor's status is left as is. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/hires/[id]">) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Hire record not found", 404);

  await connectDB();
  const hire = await Hire.findById(id).select("tutorId vacancyTitle posterPublicId");
  if (!hire) return jsonError("Hire record not found", 404);

  if (hire.posterPublicId) {
    try {
      await deletePoster(hire.posterPublicId);
    } catch (err) {
      console.error("Failed to delete poster from Cloudinary", err);
    }
  }
  await hire.deleteOne();
  await logActivity({ tutorId: hire.tutorId, action: "hire_removed", admin, previousValue: hire.vacancyTitle });
  return NextResponse.json({ ok: true });
}
