import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { DEFAULT_SETTINGS } from "@/lib/constants";

// Single-document collection keyed by `key: "global"`.
const SettingsSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true },
    agencyName: { type: String, default: DEFAULT_SETTINGS.agencyName, maxlength: 100 },
    logo: { type: String, default: "" },
    contactNumber: { type: String, default: "", maxlength: 40 },
    contactEmail: { type: String, default: "", maxlength: 120 },
    address: { type: String, default: DEFAULT_SETTINGS.address, maxlength: 200 },
    applicationHeading: { type: String, default: DEFAULT_SETTINGS.applicationHeading, maxlength: 120 },
    applicationDescription: { type: String, default: DEFAULT_SETTINGS.applicationDescription, maxlength: 400 },
    publicApplicationUrl: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true }
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;

export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) || model<SettingsDoc>("Settings", SettingsSchema);
