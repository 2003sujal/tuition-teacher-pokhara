import "server-only";
import type { Types } from "mongoose";
import { ActivityLog, type ACTIVITY_ACTIONS } from "@/models/ActivityLog";
import type { CurrentAdmin } from "./auth";

export async function logActivity(entry: {
  tutorId: Types.ObjectId | string;
  action: (typeof ACTIVITY_ACTIONS)[number];
  admin: CurrentAdmin;
  previousValue?: string;
  newValue?: string;
  note?: string;
}) {
  try {
    await ActivityLog.create({
      tutorId: entry.tutorId,
      action: entry.action,
      previousValue: entry.previousValue ?? "",
      newValue: entry.newValue ?? "",
      note: entry.note ?? "",
      adminId: entry.admin.id,
      adminName: entry.admin.name,
    });
  } catch (err) {
    // Logging must never break the main operation.
    console.error("Failed to write activity log", err);
  }
}
