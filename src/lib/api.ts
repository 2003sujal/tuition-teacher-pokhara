import "server-only";
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import type { ZodError } from "zod";
import { getCurrentAdmin, type CurrentAdmin } from "./auth";

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function zodFieldErrors(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function validationError(error: ZodError) {
  const fields = zodFieldErrors(error);
  return jsonError(Object.values(fields)[0] ?? "Invalid input", 422, { fields });
}

/**
 * CSRF defence for cookie-authenticated mutations: the Origin (or Referer)
 * must match the host serving the request. Combined with SameSite=Lax cookies.
 */
export function isSameOrigin(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!host || !origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Guarded =
  | { admin: CurrentAdmin; response?: undefined }
  | { admin?: undefined; response: NextResponse };

/** Authenticate an admin API request (and enforce same-origin for mutations). */
export async function guardAdmin(req: Request): Promise<Guarded> {
  const method = req.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && !isSameOrigin(req)) {
    return { response: jsonError("Cross-site request blocked", 403) };
  }
  const admin = await getCurrentAdmin();
  if (!admin) return { response: jsonError("Unauthorized", 401) };
  return { admin };
}

export function isObjectId(id: string) {
  return isValidObjectId(id) && /^[a-f\d]{24}$/i.test(id);
}
