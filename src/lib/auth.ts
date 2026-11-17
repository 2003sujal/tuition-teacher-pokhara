import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "./mongodb";
import { Admin } from "@/models/Admin";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "./constants";
import { signSession, verifySession } from "./session-token";

export type CurrentAdmin = { id: string; name: string; email: string };

export async function createSession(admin: { id: string; name: string; email: string; sessionVersion: number }) {
  const token = await signSession({ sub: admin.id, name: admin.name, email: admin.email, v: admin.sessionVersion });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Data Access Layer entry point: verifies the signed cookie AND that the admin
 * still exists with the same session version (password changes revoke old sessions).
 * Memoised per request.
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  await connectDB();
  const admin = await Admin.findById(session.sub).select("name email sessionVersion").lean();
  if (!admin || (admin.sessionVersion ?? 0) !== session.v) return null;

  return { id: String(admin._id), name: admin.name, email: admin.email };
});

/** For Server Components / pages: redirect to login when not authenticated. */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
