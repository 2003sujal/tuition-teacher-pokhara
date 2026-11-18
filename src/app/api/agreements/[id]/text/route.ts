import { guardAdmin, isObjectId, jsonError } from "@/lib/api";
import { getSignedAgreement } from "@/lib/data/agreements";

export const runtime = "nodejs";

/** Admin-only: the signed agreement as a plain-text file, with its evidence. */
export async function GET(req: Request, ctx: RouteContext<"/api/agreements/[id]/text">) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Agreement not found", 404);

  const a = await getSignedAgreement(id);
  if (!a) return jsonError("Agreement not found", 404);

  const body = [
    a.contentText,
    "",
    "----------------------------------------------------------------",
    "ELECTRONIC ACCEPTANCE RECORD",
    `Reference number : ${a.refNo}`,
    `Signed by        : ${a.signedName}`,
    `Registered mobile: +977 ${a.mobileNumber}`,
    `Tutor ID         : ${a.tutorApplicationId}`,
    `Accepted at (UTC): ${a.acceptedAt}`,
    `Version          : ${a.version}`,
    `IP address       : ${a.ipAddress || "-"}`,
    `Device / browser : ${a.userAgent || "-"}`,
    `Citizenship file : ${a.citizenship ? `${a.citizenship.fileName} (${a.citizenship.fileType}, ${a.citizenship.fileSize} bytes)` : "not attached"}`,
    ...(a.citizenship?.sha256 ? [`Citizenship SHA-256: ${a.citizenship.sha256}`] : []),
    `SHA-256          : ${a.contentHash}`,
    `Integrity        : ${a.intact ? "verified (record unchanged since signing)" : "MISMATCH - record differs from its hash"}`,
    "",
  ].join("\r\n");

  const filename = `${a.refNo.replace(/\//g, "-")}.txt`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
