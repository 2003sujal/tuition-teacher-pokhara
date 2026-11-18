import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { guardAdmin, isObjectId, jsonError, validationError } from "@/lib/api";
import { hireSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";
import { uploadPoster } from "@/lib/cloudinary";
import { nepalDate } from "@/lib/data/tutors";
import { POSTER_ALLOWED_TYPES, POSTER_MAX_BYTES } from "@/lib/constants";
import { Tutor } from "@/models/Tutor";
import { Hire } from "@/models/Hire";

export const runtime = "nodejs";

function looksLikeImage(bytes: Uint8Array, type: string) {
  const s = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (type === "image/png") return s([0x89, 0x50, 0x4e, 0x47]);
  if (type === "image/jpeg") return s([0xff, 0xd8, 0xff]);
  // "RIFF" .... "WEBP"
  if (type === "image/webp") return s([0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45;
  return false;
}

/**
 * Record a hire (placement) for a tutor: vacancy, salary, our commission and an
 * optional vacancy poster. Marks the tutor as Hired if they weren't already.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/tutors/[id]/hires">) {
  const { admin, response } = await guardAdmin(req);
  if (response) return response;
  const { id } = await ctx.params;
  if (!isObjectId(id)) return jsonError("Tutor not found", 404);

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Invalid form submission", 400);

  const text = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const parsed = hireSchema.safeParse({
    vacancyTitle: text("vacancyTitle"),
    studentLocation: text("studentLocation"),
    monthlySalary: text("monthlySalary"),
    commission: text("commission"),
    hiredAt: text("hiredAt"),
    note: text("note"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const poster = form.get("poster");
  let posterBuffer: Buffer | null = null;
  if (poster instanceof File && poster.size > 0) {
    if (!POSTER_ALLOWED_TYPES.includes(poster.type)) return jsonError("Poster must be a JPG, PNG or WEBP image", 422);
    if (poster.size > POSTER_MAX_BYTES) return jsonError("Poster must be 4 MB or smaller", 422);
    posterBuffer = Buffer.from(await poster.arrayBuffer());
    if (!looksLikeImage(posterBuffer, poster.type)) return jsonError("This file is not a valid image", 422);
  }

  await connectDB();
  const tutor = await Tutor.findById(id).select("fullName status");
  if (!tutor) return jsonError("Tutor not found", 404);

  let posterUrl = "";
  let posterPublicId = "";
  if (posterBuffer) {
    try {
      ({ url: posterUrl, publicId: posterPublicId } = await uploadPoster(posterBuffer));
    } catch (err) {
      console.error("Poster upload failed", err);
      return jsonError("Poster upload failed. Please try again.", 502);
    }
  }

  const data = parsed.data;
  const hire = await Hire.create({
    tutorId: tutor._id,
    tutorName: tutor.fullName,
    vacancyTitle: data.vacancyTitle,
    studentLocation: data.studentLocation,
    monthlySalary: Math.round(data.monthlySalary),
    commission: Math.round(data.commission),
    hiredAt: nepalDate(data.hiredAt),
    posterUrl,
    posterPublicId,
    note: data.note,
    createdBy: admin.name,
  });

  await logActivity({ tutorId: tutor._id, action: "hire_added", admin, newValue: data.vacancyTitle });

  const previous = tutor.status;
  if (previous !== "Hired") {
    tutor.status = "Hired";
    tutor.archivedAt = undefined;
    await tutor.save();
    await logActivity({
      tutorId: tutor._id,
      action: "status_changed",
      admin,
      previousValue: previous ?? "",
      newValue: "Hired",
      note: `Hired for: ${data.vacancyTitle}`,
    });
  }

  return NextResponse.json({ ok: true, id: String(hire._id) }, { status: 201 });
}
