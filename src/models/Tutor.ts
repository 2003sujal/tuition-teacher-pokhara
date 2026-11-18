import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { TUTOR_STATUSES } from "@/lib/constants";

const TutorSchema = new Schema(
  {
    applicationId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    mobileNumber: { type: String, required: true, trim: true, maxlength: 20 },
    normalizedMobileNumber: { type: String, required: true },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    // Lower-cased copy used for case-insensitive grouping in reports.
    locationKey: { type: String, required: true },
    subjects: { type: [String], default: [] },
    // Lower-cased copies for case-insensitive search / grouping.
    subjectKeys: { type: [String], default: [] },
    cvUrl: { type: String, required: true },
    cvPublicId: { type: String, required: true },
    cvFileName: { type: String, required: true, maxlength: 200 },
    cvFileType: { type: String, required: true },
    cvFileSize: { type: Number, required: true },
    cvUploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: TUTOR_STATUSES, default: "New" },
    adminNotes: { type: String, default: "", maxlength: 5000 },
    archivedAt: { type: Date },
    // Tutor service agreement (accepted on the public /agreement page).
    agreementAcceptedAt: { type: Date },
    agreementSignedName: { type: String, trim: true, maxlength: 100 },
    agreementVersion: { type: String },
  },
  { timestamps: true }
);

TutorSchema.index({ fullName: 1 });
TutorSchema.index({ normalizedMobileNumber: 1 });
TutorSchema.index({ location: 1 });
TutorSchema.index({ locationKey: 1 });
TutorSchema.index({ subjectKeys: 1 });
TutorSchema.index({ status: 1, createdAt: -1 });
TutorSchema.index({ createdAt: -1 });

export type TutorDoc = InferSchemaType<typeof TutorSchema>;

export const Tutor: Model<TutorDoc> = (models.Tutor as Model<TutorDoc>) || model<TutorDoc>("Tutor", TutorSchema);
