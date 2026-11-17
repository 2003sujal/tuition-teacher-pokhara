import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const AdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    passwordHash: { type: String, required: true, select: false },
    // Bumped on password change; sessions carrying an older version are rejected.
    sessionVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export type AdminDoc = InferSchemaType<typeof AdminSchema>;

export const Admin: Model<AdminDoc> = (models.Admin as Model<AdminDoc>) || model<AdminDoc>("Admin", AdminSchema);
