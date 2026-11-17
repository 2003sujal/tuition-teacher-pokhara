// Edge-safe session token helpers (used by both proxy.ts and server code).
import { SignJWT, jwtVerify } from "jose";
import { SESSION_TTL_SECONDS } from "./constants";

export type SessionPayload = {
  sub: string; // admin id
  name: string;
  email: string;
  v: number; // admin.sessionVersion at login
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ name: payload.name, email: payload.email, v: payload.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("tuition-teacher-pokhara")
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: "tuition-teacher-pokhara",
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      v: Number(payload.v ?? 0),
    };
  } catch {
    return null;
  }
}
