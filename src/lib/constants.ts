export const TUTOR_STATUSES = [
  "New",
  "Available",
  "Contacted",
  "Demo",
  "Hired",
  "Unavailable",
  "Archived",
] as const;

export type TutorStatus = (typeof TUTOR_STATUSES)[number];

export const SORT_OPTIONS = {
  newest: "Newest registration",
  oldest: "Oldest registration",
  "name-asc": "Name A–Z",
  "name-desc": "Name Z–A",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export const PAGE_SIZE = 15;

/** One-tap suggestions on the registration form (tutors can also type their own). */
export const COMMON_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Nepali",
  "Social Studies",
  "Computer",
  "Optional Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Accountancy",
  "Economics",
  "All Subjects (Primary)",
];

export const MAX_SUBJECTS = 12;

// Vercel serverless functions cap request bodies at 4.5 MB, so the CV limit
// stays safely below that.
export const CV_MAX_BYTES = 4 * 1024 * 1024;
export const CV_MAX_LABEL = "4 MB";

export const CV_ALLOWED: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  // Photos of a CV (e.g. taken with a phone camera).
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
};

export const CV_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export const CV_ACCEPT_ATTR =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp";

export const CV_TYPES_LABEL = "PDF, Word (DOC/DOCX) or a photo (JPG, PNG, WEBP)";

export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

// Vacancy posters attached to hire records (resized in the browser first).
export const POSTER_MAX_BYTES = 4 * 1024 * 1024;
export const POSTER_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Live site: the registration link the admin copies always points here. */
export const PUBLIC_SITE_URL = "https://tuition-teacher-pokhara.vercel.app";
export const FACEBOOK_URL = "https://www.facebook.com/tuitionteacherpokhara/";
export const TIKTOK_URL = "https://www.tiktok.com/@tutionteacherpokhara";

export const COMPANY = {
  name: "Asva Innovation Lab Pvt. Ltd.",
  website: "https://asva.com.np/",
  regdNo: "398769/83/84",
  panNo: "623692657",
  logo: "/logoasva.png",
  certificate: "/asva.png",
  mapUrl: "https://maps.app.goo.gl/4qWHREYWgfWsPsSeA",
};

// ---- Tutor service agreement ---------------------------------------------

/** Bump when the agreement wording changes; stored with each acceptance. */
export const AGREEMENT_VERSION = "2026-11.2";

/** Citizenship certificate attached when signing (kept private, like CVs). */
export const CITIZENSHIP_ALLOWED: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};
export const CITIZENSHIP_MAX_BYTES = 4 * 1024 * 1024;
export const CITIZENSHIP_ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

/** Service charge on the tutor's first month salary (NPR). */
export const COMMISSION_TIERS = [
  { upTo: 5000, label: "Below Rs. 5,000", charge: "Rs. 1,000 (flat)", flat: 1000 },
  { upTo: 10000, label: "Rs. 5,000 – Rs. 9,999", charge: "20% of first month salary", percent: 20 },
  { upTo: 15000, label: "Rs. 10,000 – Rs. 14,999", charge: "30% of first month salary", percent: 30 },
  { upTo: Infinity, label: "Rs. 15,000 and above", charge: "35% of first month salary", percent: 35 },
] as const;

/** Our service charge for a monthly salary, per the agreement. */
export function commissionFor(monthlySalary: number) {
  const tier = COMMISSION_TIERS.find((t) => monthlySalary < t.upTo) ?? COMMISSION_TIERS[COMMISSION_TIERS.length - 1]!;
  return "flat" in tier ? tier.flat : Math.round((monthlySalary * tier.percent) / 100);
}

export const DEMO_DEPOSIT = 1000;
export const DEMO_FREE_DAYS = 3;

export const SESSION_COOKIE = "ttp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export const WHATSAPP_MESSAGE =
  "Namaste, we are contacting you from Tuition Teacher Pokhara regarding a tuition teaching opportunity.";

export const DEFAULT_SETTINGS = {
  agencyName: "Tuition Teacher Pokhara",
  logo: "",
  contactNumber: "",
  contactEmail: "",
  address: "Pokhara, Nepal",
  applicationHeading: "Register as a Tutor",
  applicationDescription:
    "Join Tuition Teacher Pokhara. Submit your details and CV to become part of our tutor network.",
  publicApplicationUrl: "",
};

export type AgencySettings = typeof DEFAULT_SETTINGS;
