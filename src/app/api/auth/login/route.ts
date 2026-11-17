import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isSameOrigin, jsonError } from "@/lib/api";
import { Admin } from "@/models/Admin";

export const runtime = "nodejs";

// Used to keep response time constant when the email doesn't exist.
const DUMMY_HASH = "$2b$12$aSG2jJOzfO1K0B7xVr0cTu24A4RBHpML03UP0aAifWiBCN1ZcX3dC";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError("Cross-site request blocked", 403);

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter your email and password", 422);

  try {
    const ip = clientIp(req);
    const [byIp, byEmail] = await Promise.all([
      rateLimit(`login-ip:${ip}`, 20, 15 * 60),
      rateLimit(`login-email:${parsed.data.email}`, 8, 15 * 60),
    ]);
    if (!byIp.ok || !byEmail.ok) {
      return jsonError("Too many login attempts. Please wait 15 minutes and try again.", 429);
    }

    await connectDB();
    const admin = await Admin.findOne({ email: parsed.data.email }).select("+passwordHash name email sessionVersion");
    const valid = await bcrypt.compare(parsed.data.password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !valid) return jsonError("Invalid email or password", 401);

    admin.lastLoginAt = new Date();
    await admin.save();

    await createSession({
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      sessionVersion: admin.sessionVersion ?? 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login failed", err);
    return jsonError("Login is temporarily unavailable. Please try again.", 500);
  }
}
