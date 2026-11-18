import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const ACTIVITY_ACTIONS = [
  "application_submitted",
  "status_changed",
  "details_updated",
  "notes_updated",
  "cv_viewed",
  "tutor_deleted",
  "hire_added",
  "hire_removed",
  "agreement_accepted",
] as const;

const ActivityLogSchema = new Schema(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: "Tutor", required: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    previousValue: { type: String, default: "" },
    newValue: { type: String, default: "" },
    note: { type: String, default: "", maxlength: 1000 },
    adminId: { type: Schema.Types.ObjectId, ref: "Admin" },
    adminName: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ tutorId: 1, createdAt: -1 });

export type ActivityLogDoc = InferSchemaType<typeof ActivityLogSchema>;

export const ActivityLog: Model<ActivityLogDoc> =
  (models.ActivityLog as Model<ActivityLogDoc>) || model<ActivityLogDoc>("ActivityLog", ActivityLogSchema);
