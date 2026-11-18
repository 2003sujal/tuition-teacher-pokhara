import { NextResponse } from "next/server";
import { guardAdmin, isObjectId, jsonError } from "@/lib/api";
import { getCitizenshipPublicId } from "@/lib/data/agreements";
import { signedCvUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";

/**
 * Admin-only access to the citizenship certificate attached to a signed
 * agreement. Redirects to a private signed URL that expires in 5 minutes.
 *   ?download=1 forces a download.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/agreements/[id]/citizenship">) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Not found", 404);

  const publicId = await getCitizenshipPublicId(id);
  if (!publicId) return jsonError("No citizenship certificate on this agreement", 404);

  const download = new URL(req.url).searchParams.get("download") === "1";
  return NextResponse.redirect(signedCvUrl(publicId, { attachment: download }), {
    status: 302,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
