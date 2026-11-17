import { Schema, model, models, type Model } from "mongoose";

// Fixed-window counters stored in MongoDB so limits hold across serverless
// instances. Documents expire automatically via the TTL index.
const RateLimitSchema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

type RateLimitDoc = { _id: string; count: number; expiresAt: Date };

export const RateLimit: Model<RateLimitDoc> =
  (models.RateLimit as Model<RateLimitDoc>) || model<RateLimitDoc>("RateLimit", RateLimitSchema);
