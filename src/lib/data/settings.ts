import "server-only";
import { connectDB } from "../mongodb";
import { Settings } from "@/models/Settings";
import { DEFAULT_SETTINGS, PUBLIC_SITE_URL, type AgencySettings } from "../constants";

// Settings change rarely but are read on every page, so keep them in memory
// briefly instead of a database round trip per request. Saving settings calls
// invalidateSettings(), so the admin sees changes immediately; other server
// instances pick them up within SETTINGS_TTL_MS.
const SETTINGS_TTL_MS = 60_000;
const globalForSettings = globalThis as unknown as {
  __ttpSettings?: { value: AgencySettings; expires: number; pending?: Promise<AgencySettings> };
};

async function loadSettings(): Promise<AgencySettings> {
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
}

export async function getSettings(): Promise<AgencySettings> {
  const cached = globalForSettings.__ttpSettings;
  if (cached && cached.expires > Date.now()) return cached.value;
  if (cached?.pending) return cached.pending;

  const pending = loadSettings()
    .then((value) => {
      globalForSettings.__ttpSettings = { value, expires: Date.now() + SETTINGS_TTL_MS };
      return value;
    })
    .catch((err) => {
      // Public pages must still render if the DB is briefly unreachable.
      console.error("Failed to load settings", err);
      if (globalForSettings.__ttpSettings) delete globalForSettings.__ttpSettings.pending;
      return cached?.value ?? { ...DEFAULT_SETTINGS };
    });
  globalForSettings.__ttpSettings = { value: cached?.value ?? { ...DEFAULT_SETTINGS }, expires: 0, pending };

  // Never let a slow or unreachable database hold up a page: after 2.5s use the
  // last known settings (or the defaults) and let the load finish in the background.
  const fallback = new Promise<AgencySettings>((resolve) =>
    setTimeout(() => resolve(cached?.value ?? { ...DEFAULT_SETTINGS }), 2500)
  );
  return Promise.race([pending, fallback]);
}

/** Call after settings are saved so the next read hits the database. */
export function invalidateSettings() {
  delete globalForSettings.__ttpSettings;
}

/**
 * The link the admin shares: the settings override, else the live site's form.
 * Never a localhost URL, even when the admin panel runs locally.
 */
export function registrationLink(settings: AgencySettings) {
  const override = settings.publicApplicationUrl;
  if (override && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(override)) return override;
  return `${PUBLIC_SITE_URL}/apply`;
}
