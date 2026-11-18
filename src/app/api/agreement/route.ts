import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { agreementSchema } from "@/lib/validations";
import { normalizeNepaliMobile } from "@/lib/phone";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { jsonError, validationError } from "@/lib/api";
import { AGREEMENT_VERSION, type TutorStatus } from "@/lib/constants";
import { Tutor } from "@/models/Tutor";
import { ActivityLog } from "@/models/ActivityLog";

export const runtime = "nodejs";

// Statuses that move to "Contacted" when the tutor accepts. Tutors already at
// Demo or Hired keep their status, and archived ones are left alone.
const PROMOTE_FROM: TutorStatus[] = ["New", "Available", "Unavailable"];

/**
 * Public endpoint: a registered tutor accepts the service agreement. The tutor
 * is found by their registered mobile number, the acceptance is recorded, and
 * they move to the Contacted list in the admin panel.
 */
export async function POST(req: Request) {
  await connectDB();
  try {
    const limit = await rateLimit(`agreement:${clientIp(req)}`, 10, 60 * 60);
    if (!limit.ok) return jsonError("Too many attempts from this network. Please try again later.", 429);
  } catch (err) {
    console.error("Rate limit check failed", err);
    return jsonError("Service temporarily unavailable. Please try again shortly.", 503);
  }

  const parsed = agreementSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const mobile = normalizeNepaliMobile(parsed.data.mobileNumber);
  if (!mobile) return jsonError("Enter a valid Nepali mobile number", 422, { fields: { mobileNumber: "Enter a valid Nepali mobile number" } });

  const tutor = await Tutor.findOne({ normalizedMobileNumber: mobile }).sort({ createdAt: -1 }).select("status fullName agreementAcceptedAt");
  if (!tutor) {
    return jsonError(
      "This mobile number is not registered with us. Please register as a tutor first, then accept the agreement.",
      404,
      { fields: { mobileNumber: "This number is not registered. Use the number you registered with." }, notRegistered: true }
    );
  }

  const now = new Date();
  const previous = tutor.status as TutorStatus;
  tutor.agreementAcceptedAt = now;
  tutor.agreementSignedName = parsed.data.fullName;
  tutor.agreementVersion = AGREEMENT_VERSION;
  const promote = PROMOTE_FROM.includes(previous);
  if (promote) tutor.status = "Contacted";
  await tutor.save();

  // Public request: there is no admin, so write the log entries directly.
  const by = "Tutor (online agreement)";
  const logs: Record<string, unknown>[] = [
    {
      tutorId: tutor._id,
      action: "agreement_accepted",
      newValue: AGREEMENT_VERSION,
      note: `Signed as "${parsed.data.fullName}"`,
      adminName: by,
    },
  ];
  if (promote) {
    logs.push({
      tutorId: tutor._id,
      action: "status_changed",
      previousValue: previous,
      newValue: "Contacted",
      note: "Accepted the tutor service agreement",
      adminName: by,
    });
  }
  await ActivityLog.insertMany(logs).catch((err) => console.error("Failed to write activity log", err));

  return NextResponse.json({ ok: true, acceptedAt: now.toISOString(), firstName: tutor.fullName.split(" ")[0] });
}
