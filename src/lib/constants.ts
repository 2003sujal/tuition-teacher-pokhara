export const TUTOR_STATUSES = [
  "New",
  "Available",
  "Contacted",
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
