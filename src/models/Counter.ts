import { Schema, model, models, type Model } from "mongoose";

// Atomic sequence counters (used to generate application IDs like TTP-2026-00042).
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

type CounterDoc = { _id: string; seq: number };

export const Counter: Model<CounterDoc> =
  (models.Counter as Model<CounterDoc>) || model<CounterDoc>("Counter", CounterSchema);

/** Signed agreement reference, e.g. TTP/TSA/2026/00007 (Nepal year). */
export async function nextAgreementRef() {
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric" }).format(new Date());
  const counter = await Counter.findOneAndUpdate(
    { _id: `agreement-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  ).lean();
  return `TTP/TSA/${year}/${String(counter!.seq).padStart(5, "0")}`;
}

export async function nextApplicationId() {
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `application-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  ).lean();
  return `TTP-${year}-${String(counter!.seq).padStart(5, "0")}`;
}
