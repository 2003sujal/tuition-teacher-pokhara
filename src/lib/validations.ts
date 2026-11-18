import { z } from "zod";
import { TUTOR_STATUSES, SORT_OPTIONS, MAX_SUBJECTS } from "./constants";
import { isValidNepaliMobile } from "./phone";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const fullNameSchema = trimmed(2, 100, "Full name").regex(
  /^[\p{L}\p{M}\s.'-]+$/u,
  "Full name can only contain letters, spaces, dots, apostrophes and hyphens"
);

export const mobileSchema = z
  .string({ error: "Mobile number is required" })
  .trim()
  .min(1, "Mobile number is required")
  .refine(isValidNepaliMobile, "Enter a valid Nepali mobile number (e.g. 98XXXXXXXX)");

export const locationSchema = trimmed(2, 120, "Location");

/** Tidy a subject name: collapse spaces, capitalise words ("optional maths" → "Optional Maths"). */
export function tidySubject(input: string) {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[\s(/-])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
}

export const subjectsSchema = z
  .array(z.string().trim().max(40, "Each subject must be at most 40 characters"))
  .transform((list) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of list) {
      const s = tidySubject(raw);
      if (s && !seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        out.push(s);
      }
    }
    return out;
  })
  .pipe(
    z
      .array(z.string())
      .min(1, "Select or add at least one subject you can teach")
      .max(MAX_SUBJECTS, `You can add up to ${MAX_SUBJECTS} subjects`)
  );

/** Text fields of the public application form (the CV file is validated separately). */
export const applicationFieldsSchema = z.object({
  fullName: fullNameSchema,
  mobileNumber: mobileSchema,
  location: locationSchema,
  subjects: subjectsSchema,
});

export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").max(120).toLowerCase(),
  password: z.string().min(1, "Password is required").max(200),
});

export const tutorUpdateSchema = z.object({
  fullName: fullNameSchema,
  mobileNumber: mobileSchema,
  location: locationSchema,
  subjects: subjectsSchema,
});

export const statusUpdateSchema = z.object({
  status: z.enum(TUTOR_STATUSES),
  note: z.string().trim().max(1000).optional().default(""),
});

const amount = (label: string, min: number) =>
  z.coerce
    .number({ error: `Enter the ${label}` })
    .refine(Number.isFinite, `Enter the ${label}`)
    .min(min, min > 0 ? `Enter the ${label}` : `${label} cannot be negative`)
    .max(10_000_000, `${label} looks too large`);

/** Text fields of a hire record (the poster image is validated separately). */
export const hireSchema = z.object({
  vacancyTitle: trimmed(2, 150, "Vacancy / job"),
  studentLocation: z.string().trim().max(120, "Location must be at most 120 characters").optional().default(""),
  monthlySalary: amount("monthly salary", 1),
  commission: amount("commission", 0),
  hiredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the hire date"),
  note: z.string().trim().max(1000, "Note must be at most 1000 characters").optional().default(""),
});

export type HireInput = z.infer<typeof hireSchema>;

const mustAccept = (message: string) => z.literal(true, { error: message });

/** Public tutor service agreement acceptance. */
export const agreementSchema = z.object({
  fullName: fullNameSchema,
  mobileNumber: mobileSchema,
  acceptCharges: mustAccept("Please confirm you accept the service charges"),
  acceptDemo: mustAccept("Please confirm you accept the demo class policy"),
  acceptConfidential: mustAccept("Please confirm you will keep this agreement confidential"),
  acceptAll: mustAccept("Please confirm you have read and will follow this agreement"),
});

export const notesSchema = z.object({
  adminNotes: z.string().max(5000, "Notes must be at most 5000 characters"),
});

export const settingsSchema = z.object({
  agencyName: trimmed(2, 100, "Agency name"),
  contactNumber: z.string().trim().max(40),
  contactEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(120)]),
  address: z.string().trim().max(200),
  applicationHeading: trimmed(3, 120, "Form heading"),
  applicationDescription: trimmed(3, 400, "Form description"),
  publicApplicationUrl: z.union([z.literal(""), z.string().trim().url("Enter a full URL starting with https://").max(300)]),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const profileSchema = z.object({
  name: trimmed(2, 80, "Name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(10, "Use at least 10 characters")
      .max(200)
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

/** Query-string filters for tutor listing / CSV export. Invalid values fall back to defaults. */
export const tutorQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  location: z.string().trim().max(120).optional().catch(undefined),
  subject: z.string().trim().max(40).optional().catch(undefined),
  status: z.enum(TUTOR_STATUSES).optional().catch(undefined),
  from: dateString,
  to: dateString,
  sort: z
    .enum(Object.keys(SORT_OPTIONS) as [keyof typeof SORT_OPTIONS, ...(keyof typeof SORT_OPTIONS)[]])
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).max(10000).optional().catch(undefined),
});

export type TutorQuery = z.infer<typeof tutorQuerySchema>;

export const dateRangeSchema = z.object({ from: dateString, to: dateString });
