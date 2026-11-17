import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { isSameOrigin, jsonError } from "@/lib/api";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError("Cross-site request blocked", 403);
  await destroySession();
  return NextResponse.json({ ok: true });
}
