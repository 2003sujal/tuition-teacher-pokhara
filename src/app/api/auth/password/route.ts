import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { createSession } from "@/lib/auth";
import { guardAdmin, jsonError, validationError } from "@/lib/api";
import { passwordChangeSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { Admin } from "@/models/Admin";

export const runtime = "nodejs";

/** Change password. Bumps sessionVersion so every other session is signed out. */
export async function POST(req: Request) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;

  const parsed = passwordChangeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const limit = await rateLimit(`password:${admin.id}`, 5, 15 * 60);
  if (!limit.ok) return jsonError("Too many attempts. Please wait and try again.", 429);

  await connectDB();
  const doc = await Admin.findById(admin.id).select("+passwordHash name email sessionVersion");
  if (!doc) return jsonError("Account not found", 404);

  const ok = await bcrypt.compare(parsed.data.currentPassword, doc.passwordHash);
  if (!ok) return jsonError("Current password is incorrect", 422, { fields: { currentPassword: "Current password is incorrect" } });

  doc.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  doc.sessionVersion = (doc.sessionVersion ?? 0) + 1;
  await doc.save();

  await createSession({ id: String(doc._id), name: doc.name, email: doc.email, sessionVersion: doc.sessionVersion });
  return NextResponse.json({ ok: true });
}
