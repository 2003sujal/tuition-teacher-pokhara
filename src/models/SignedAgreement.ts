import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * A permanent copy of an accepted tutor service agreement, kept as evidence:
 * the full document exactly as shown to the tutor, who signed, when, from
 * where, and a SHA-256 hash to show the record was not altered later.
 *
 * Records are never edited and are kept even if the tutor is deleted.
 */
const SignedAgreementSchema = new Schema(
  {
    refNo: { type: String, required: true, unique: true },
    tutorId: { type: Schema.Types.ObjectId, ref: "Tutor", required: true },
    tutorApplicationId: { type: String, default: "" },
    // What the tutor typed / used to sign.
    signedName: { type: String, required: true, trim: true, maxlength: 100 },
    mobileNumber: { type: String, required: true },
    acceptedAt: { type: Date, required: true },
    version: { type: String, required: true },
    // Full agreement content (AgreementContent) as displayed, incl. accepted statements.
    content: { type: Schema.Types.Mixed, required: true },
    contentText: { type: String, required: true },
    contentHash: { type: String, required: true },
    // Technical evidence of the electronic acceptance.
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SignedAgreementSchema.index({ tutorId: 1, acceptedAt: -1 });
SignedAgreementSchema.index({ acceptedAt: -1 });

export type SignedAgreementDoc = InferSchemaType<typeof SignedAgreementSchema>;

export const SignedAgreement: Model<SignedAgreementDoc> =
  (models.SignedAgreement as Model<SignedAgreementDoc>) ||
  model<SignedAgreementDoc>("SignedAgreement", SignedAgreementSchema);
