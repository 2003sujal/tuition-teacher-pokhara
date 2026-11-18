import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { guardAdmin, isObjectId, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { deletePoster } from "@/lib/cloudinary";
import { Hire } from "@/models/Hire";

export const runtime = "nodejs";

const refundSchema = z.object({ refunded: z.boolean() });

/** Mark a demo deposit as refunded (or undo it). */
export async function PATCH(req: Request, ctx: RouteContext<"/api/hires/[id]">) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Record not found", 404);

  const parsed = refundSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request", 422);

  await connectDB();
  const hire = await Hire.findById(id).select("kind tutorId vacancyTitle refunded");
  if (!hire) return jsonError("Record not found", 404);
  if (hire.kind !== "demo") return jsonError("Only demo deposits can be refunded", 422);

  hire.refunded = parsed.data.refunded;
  hire.refundedAt = parsed.data.refunded ? new Date() : undefined;
  await hire.save();
  await logActivity({
    tutorId: hire.tutorId,
    action: "details_updated",
    admin,
    note: `Demo deposit ${parsed.data.refunded ? "refunded" : "marked as not refunded"}: ${hire.vacancyTitle}`,
  });
  return NextResponse.json({ ok: true });
}

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
