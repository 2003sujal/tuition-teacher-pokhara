import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import { guardAdmin, jsonError, validationError } from "@/lib/api";
import { profileSchema } from "@/lib/validations";
import { Admin } from "@/models/Admin";

export const runtime = "nodejs";

/** Update the signed-in admin's name and email. */
export async function PUT(req: Request) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;

  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  await connectDB();
  const taken = await Admin.exists({ email: parsed.data.email, _id: { $ne: admin.id } });
  if (taken) return jsonError("Another administrator already uses this email", 409);

  const updated = await Admin.findByIdAndUpdate(admin.id, { $set: parsed.data }, { returnDocument: "after" });
  if (!updated) return jsonError("Account not found", 404);

  // Refresh the session so the new name/email show immediately.
  await createSession({
    id: String(updated._id),
    name: updated.name,
    email: updated.email,
    sessionVersion: updated.sessionVersion ?? 0,
  });
  return NextResponse.json({ ok: true });
}
