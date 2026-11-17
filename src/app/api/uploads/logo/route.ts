import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { uploadLogo } from "@/lib/cloudinary";
import { guardAdmin, jsonError } from "@/lib/api";
import { LOGO_ALLOWED_TYPES, LOGO_MAX_BYTES } from "@/lib/constants";
import { Settings } from "@/models/Settings";

export const runtime = "nodejs";

function looksLikeImage(bytes: Uint8Array, type: string) {
  const s = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (type === "image/png") return s([0x89, 0x50, 0x4e, 0x47]);
  if (type === "image/jpeg") return s([0xff, 0xd8, 0xff]);
  if (type === "image/webp") return s([0x52, 0x49, 0x46, 0x46]);
  if (type === "image/svg+xml") {
    const head = new TextDecoder().decode(bytes.slice(0, 512)).toLowerCase();
    return head.includes("<svg") && !head.includes("<script");
  }
  return false;
}

/** Upload (POST) or remove (DELETE) the agency logo. */
export async function POST(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;

  const form = await req.formData().catch(() => null);
  const file = form?.get("logo");
  if (!(file instanceof File)) return jsonError("Choose an image to upload", 422);
  if (!LOGO_ALLOWED_TYPES.includes(file.type)) return jsonError("Logo must be PNG, JPG, WEBP or SVG", 422);
  if (file.size > LOGO_MAX_BYTES) return jsonError("Logo must be 1 MB or smaller", 422);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImage(buffer, file.type)) return jsonError("This file is not a valid image", 422);

  try {
    const url = await uploadLogo(buffer);
    await connectDB();
    await Settings.findOneAndUpdate({ key: "global" }, { $set: { logo: url } }, { upsert: true });
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("Logo upload failed", err);
    return jsonError("Logo upload failed. Please try again.", 500);
  }
}

export async function DELETE(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  await connectDB();
  await Settings.findOneAndUpdate({ key: "global" }, { $set: { logo: "" } }, { upsert: true });
  return NextResponse.json({ ok: true });
}
