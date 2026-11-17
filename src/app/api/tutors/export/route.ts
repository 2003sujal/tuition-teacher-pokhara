import { guardAdmin } from "@/lib/api";
import { tutorQuerySchema } from "@/lib/validations";
import { exportTutors } from "@/lib/data/tutors";
import { formatDateTime } from "@/lib/utils";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  let s = String(value ?? "");
  // Prevent CSV/formula injection when opened in Excel / Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Admin: export tutor records (respecting current filters) as CSV. */
export async function GET(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = tutorQuerySchema.parse(params);
  // Exports include archived tutors unless a status filter is set.
  const rows = await exportTutors(query);

  const header = [
    "Application ID",
    "Full Name",
    "Mobile Number",
    "Location",
    "Subjects",
    "Status",
    "CV File",
    "Registered",
    "Last Updated",
    "Admin Notes",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.applicationId,
        r.fullName,
        `+977${r.normalizedMobileNumber}`,
        r.location,
        r.subjects.join("; "),
        r.status,
        r.cvFileName,
        formatDateTime(r.createdAt),
        formatDateTime(r.updatedAt),
        r.adminNotes,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens UTF-8 (Nepali names) correctly.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tutors-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
