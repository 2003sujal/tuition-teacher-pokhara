import "server-only";
import { connectDB } from "./mongodb";
import { RateLimit } from "@/models/RateLimit";

/**
 * Fixed-window rate limiter backed by MongoDB (works across serverless instances).
 * Returns { ok: false } once `limit` hits occur within `windowSeconds`.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  await connectDB();
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds);
  const id = `${key}:${windowStart}`;
  const expiresAt = new Date((windowStart + 1) * windowSeconds * 1000);

  const doc = await RateLimit.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, returnDocument: "after" }
  ).lean();

  const count = doc?.count ?? 1;
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
