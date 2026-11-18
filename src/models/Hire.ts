import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * One placement: a tutor hired for a specific vacancy. Kept even if the tutor
 * record is later deleted, so revenue history stays accurate (tutorName is a
 * snapshot for that case).
 */
const HireSchema = new Schema(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: "Tutor", required: true },
    // "hire": a placement (commission = our service charge).
    // "demo": a demo class (commission = the tutor's refundable demo deposit,
    //         monthlySalary = the expected salary, may be 0).
    kind: { type: String, enum: ["hire", "demo"], default: "hire" },
    refunded: { type: Boolean, default: false },
    refundedAt: { type: Date },
    tutorName: { type: String, required: true, trim: true, maxlength: 100 },
    vacancyTitle: { type: String, required: true, trim: true, maxlength: 150 },
    studentLocation: { type: String, default: "", trim: true, maxlength: 120 },
    // Amounts in NPR.
    monthlySalary: { type: Number, required: true, min: 0 },
    commission: { type: Number, required: true, min: 0 },
    hiredAt: { type: Date, required: true },
    posterUrl: { type: String, default: "" },
    posterPublicId: { type: String, default: "" },
    note: { type: String, default: "", maxlength: 1000 },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

HireSchema.index({ hiredAt: -1 });
HireSchema.index({ tutorId: 1, hiredAt: -1 });

export type HireDoc = InferSchemaType<typeof HireSchema>;

export const Hire: Model<HireDoc> = (models.Hire as Model<HireDoc>) || model<HireDoc>("Hire", HireSchema);
