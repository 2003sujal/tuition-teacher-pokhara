import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { signedCvUrl } from "@/lib/cloudinary";
import { guardAdmin, isObjectId, jsonError } from "@/lib/api";
import { Tutor } from "@/models/Tutor";

export const runtime = "nodejs";

/**
 * Admin-only CV access. CVs are stored as private Cloudinary assets; this
 * route authenticates the admin and redirects to a signed URL that expires
 * after 5 minutes. The permanent asset URL is never sent to the browser.
 *
 *   /api/tutors/:id/cv              → open inline (where the browser supports it)
 *   /api/tutors/:id/cv?download=1   → force download
 */
export async function GET(req: Request, ctx: RouteContext<"/api/tutors/[id]/cv">) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Tutor not found", 404);

  await connectDB();
  const tutor = await Tutor.findById(id).select("cvPublicId").lean();
  if (!tutor?.cvPublicId) return jsonError("CV not found", 404);

  const download = new URL(req.url).searchParams.get("download") === "1";
  const url = signedCvUrl(tutor.cvPublicId, { attachment: download });

  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
