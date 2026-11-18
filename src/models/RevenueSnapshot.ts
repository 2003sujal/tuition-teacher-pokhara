import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const TotalsSchema = new Schema(
  {
    hires: { type: Number, default: 0 },
    tutors: { type: Number, default: 0 },
    salary: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    demos: { type: Number, default: 0 },
    deposits: { type: Number, default: 0 },
    collected: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * A saved copy of one year's revenue figures, so years can be compared later
 * even if hire records are edited or deleted afterwards. Never updated.
 *   kind "final":  saved automatically once the year has ended (one per year)
 *   kind "manual": saved by an admin at any time (as many as needed)
 */
const RevenueSnapshotSchema = new Schema(
  {
    year: { type: String, required: true },
    kind: { type: String, enum: ["final", "manual"], required: true },
    totals: { type: TotalsSchema, required: true },
    months: { type: [TotalsSchema], default: [] }, // Jan..Dec
    savedAt: { type: Date, required: true },
    savedBy: { type: String, default: "" },
    note: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: false }
);

RevenueSnapshotSchema.index({ year: -1, savedAt: -1 });
// At most one automatic year-end snapshot per year.
RevenueSnapshotSchema.index({ year: 1 }, { unique: true, partialFilterExpression: { kind: "final" }, name: "one_final_per_year" });

export type RevenueSnapshotDoc = InferSchemaType<typeof RevenueSnapshotSchema>;

export const RevenueSnapshot: Model<RevenueSnapshotDoc> =
  (models.RevenueSnapshot as Model<RevenueSnapshotDoc>) ||
  model<RevenueSnapshotDoc>("RevenueSnapshot", RevenueSnapshotSchema);
