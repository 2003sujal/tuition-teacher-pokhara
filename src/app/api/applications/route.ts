import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { uploadCv, deleteCv } from "@/lib/cloudinary";
import { applicationFieldsSchema } from "@/lib/validations";
import { normalizeNepaliMobile } from "@/lib/phone";
import { checkCvMeta, checkCvSignature, sanitizeFileName } from "@/lib/file-validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { jsonError, validationError } from "@/lib/api";
import { tidyLocation } from "@/lib/utils";
import { CV_MAX_BYTES } from "@/lib/constants";
import { Tutor } from "@/models/Tutor";
import { ActivityLog } from "@/models/ActivityLog";
import { nextApplicationId } from "@/models/Counter";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Public endpoint: submit a tutor application (multipart/form-data). */
export async function POST(req: Request) {
  // Reject oversized bodies early (Vercel caps at 4.5 MB anyway).
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > CV_MAX_BYTES + 64 * 1024) return jsonError("File is too large", 413);

  // Start the database work now so it overlaps with receiving the file.
  const dbReady = connectDB();
  dbReady.catch(() => {}); // a failure surfaces where it is awaited
  const ip = clientIp(req);
  const limitCheck = dbReady.then(() => rateLimit(`apply:${ip}`, 5, 60 * 60)); // 5 submissions / hour / IP
  limitCheck.catch(() => {}); // awaited below; avoid an unhandled rejection on early returns

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Invalid form submission", 400);
  }

  // Honeypot + minimum fill time: quietly pretend success for bots.
  const honeypot = String(form.get("website") ?? "");
  const elapsed = Number(form.get("elapsed") ?? 0);
  if (honeypot || (elapsed > 0 && elapsed < 2500)) {
    return NextResponse.json({ ok: true, applicationId: "TTP-0000-00000" }, { status: 201 });
  }

  try {
    const limit = await limitCheck;
    if (!limit.ok) return jsonError("Too many submissions from this network. Please try again later.", 429);
  } catch (err) {
    console.error("Rate limit check failed", err);
    return jsonError("Service temporarily unavailable. Please try again shortly.", 503);
  }

  const parsed = applicationFieldsSchema.safeParse({
    fullName: form.get("fullName") ?? "",
    mobileNumber: form.get("mobileNumber") ?? "",
    location: form.get("location") ?? "",
    subjects: form.getAll("subjects").map(String),
  });
  if (!parsed.success) return validationError(parsed.error);

  const cv = form.get("cv");
  if (!(cv instanceof File)) {
    return jsonError("Please upload your CV / resume", 422, { fields: { cv: "Please upload your CV / resume" } });
  }
  const meta = checkCvMeta(cv);
  if (!meta.ok) return jsonError(meta.error, 422, { fields: { cv: meta.error } });

  const buffer = Buffer.from(await cv.arrayBuffer());
  if (buffer.byteLength > CV_MAX_BYTES) return jsonError("File is too large", 413);
  if (!checkCvSignature(buffer, meta.extension)) {
    const msg = "This file doesn't look like a valid PDF, Word document or photo";
    return jsonError(msg, 422, { fields: { cv: msg } });
  }

  const normalized = normalizeNepaliMobile(parsed.data.mobileNumber)!;

  try {
    await dbReady;
    // The application number and the Cloudinary upload don't depend on each other: run them together.
    const [idResult, uploadResult] = await Promise.allSettled([
      nextApplicationId(),
      uploadCv(buffer, { extension: meta.extension }),
    ]);
    if (idResult.status === "rejected" || uploadResult.status === "rejected") {
      if (uploadResult.status === "fulfilled") await deleteCv(uploadResult.value.publicId).catch(() => {});
      throw idResult.status === "rejected" ? idResult.reason : (uploadResult as PromiseRejectedResult).reason;
    }
    const applicationId = idResult.value;
    const uploaded = uploadResult.value;

    // Pre-assign the id so the tutor record and its history entry are written together.
    const tutorId = new Types.ObjectId();
    try {
      await Promise.all([
        Tutor.create({
        _id: tutorId,
        applicationId,
        fullName: parsed.data.fullName.replace(/\s+/g, " "),
        mobileNumber: normalized,
        normalizedMobileNumber: normalized,
        location: tidyLocation(parsed.data.location),
        locationKey: tidyLocation(parsed.data.location).toLowerCase(),
        subjects: parsed.data.subjects,
        subjectKeys: parsed.data.subjects.map((s) => s.toLowerCase()),
        cvUrl: uploaded.url,
        cvPublicId: uploaded.publicId,
        cvFileName: sanitizeFileName(cv.name),
        cvFileType: meta.mime,
        cvFileSize: uploaded.bytes || buffer.byteLength,
        cvUploadedAt: new Date(),
        status: "New",
        }),
        ActivityLog.create({
          tutorId,
          action: "application_submitted",
          newValue: "New",
          note: "Submitted via public registration form",
        }),
      ]);
    } catch (dbErr) {
      // Don't leave orphaned files or half-written records if a DB write fails.
      await Promise.all([
        deleteCv(uploaded.publicId).catch(() => {}),
        Tutor.deleteOne({ _id: tutorId }).catch(() => {}),
        ActivityLog.deleteMany({ tutorId }).catch(() => {}),
      ]);
      throw dbErr;
    }

    return NextResponse.json({ ok: true, applicationId }, { status: 201 });
  } catch (err) {
    console.error("Application submission failed", err);
    return jsonError("We couldn't save your application right now. Please try again in a moment.", 500);
  }
}
