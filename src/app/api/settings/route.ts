import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { guardAdmin, validationError } from "@/lib/api";
import { settingsSchema } from "@/lib/validations";
import { getSettings } from "@/lib/data/settings";
import { Settings } from "@/models/Settings";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;

  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  await connectDB();
  await Settings.findOneAndUpdate({ key: "global" }, { $set: parsed.data }, { upsert: true });
  return NextResponse.json({ ok: true });
}
