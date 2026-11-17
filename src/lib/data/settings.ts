import "server-only";
import { connectDB } from "../mongodb";
import { Settings } from "@/models/Settings";
import { DEFAULT_SETTINGS, type AgencySettings } from "../constants";
import { getAppUrl } from "../utils";

export async function getSettings(): Promise<AgencySettings> {
  try {
    await connectDB();
    const doc = await Settings.findOne({ key: "global" }).lean();
    if (!doc) return { ...DEFAULT_SETTINGS };
    return {
      agencyName: doc.agencyName || DEFAULT_SETTINGS.agencyName,
      logo: doc.logo ?? "",
      contactNumber: doc.contactNumber ?? "",
      contactEmail: doc.contactEmail ?? "",
      address: doc.address ?? "",
      applicationHeading: doc.applicationHeading || DEFAULT_SETTINGS.applicationHeading,
      applicationDescription: doc.applicationDescription || DEFAULT_SETTINGS.applicationDescription,
      publicApplicationUrl: doc.publicApplicationUrl ?? "",
    };
  } catch (err) {
    // Public pages must still render if the DB is briefly unreachable.
    console.error("Failed to load settings", err);
    return { ...DEFAULT_SETTINGS };
  }
}

/** The link the admin shares: settings override → NEXT_PUBLIC_APP_URL/apply. */
export function registrationLink(settings: AgencySettings) {
  return settings.publicApplicationUrl || `${getAppUrl()}/apply`;
}
