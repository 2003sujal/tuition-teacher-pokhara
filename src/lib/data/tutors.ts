import "server-only";
import type { QueryFilter, SortOrder } from "mongoose";
import { connectDB } from "../mongodb";
import { Tutor, type TutorDoc } from "@/models/Tutor";
import { ActivityLog } from "@/models/ActivityLog";
import { PAGE_SIZE, TUTOR_STATUSES, type TutorStatus } from "../constants";
import { escapeRegex } from "../utils";
import type { TutorQuery } from "../validations";

/** Shape sent to the UI. Never includes the raw Cloudinary URL / public id. */
export type TutorRow = {
  id: string;
  applicationId: string;
  fullName: string;
  mobileNumber: string;
  normalizedMobileNumber: string;
  location: string;
  subjects: string[];
  cvFileName: string;
  cvFileType: string;
  cvFileSize: number;
  cvUploadedAt: string;
  status: TutorStatus;
  createdAt: string;
  updatedAt: string;
};

export type TutorDetail = TutorRow & { adminNotes: string };

type LeanTutor = TutorDoc & { _id: unknown; createdAt: Date; updatedAt: Date };

function toRow(t: LeanTutor): TutorRow {
  return {
    id: String(t._id),
    applicationId: t.applicationId,
    fullName: t.fullName,
    mobileNumber: t.mobileNumber,
    normalizedMobileNumber: t.normalizedMobileNumber,
    location: t.location,
    subjects: t.subjects ?? [],
    cvFileName: t.cvFileName,
    cvFileType: t.cvFileType,
    cvFileSize: t.cvFileSize,
    cvUploadedAt: new Date(t.cvUploadedAt ?? t.createdAt).toISOString(),
    status: t.status as TutorStatus,
    createdAt: new Date(t.createdAt).toISOString(),
    updatedAt: new Date(t.updatedAt).toISOString(),
  };
}

const ROW_FIELDS =
  "applicationId fullName mobileNumber normalizedMobileNumber location subjects cvFileName cvFileType cvFileSize cvUploadedAt status createdAt updatedAt";

/** Parse a YYYY-MM-DD date as Nepal local midnight (UTC+05:45). */
export function nepalDate(date: string, endOfDay = false) {
  const d = new Date(`${date}T00:00:00+05:45`);
  if (endOfDay) d.setTime(d.getTime() + 24 * 60 * 60 * 1000 - 1);
  return d;
}

export function buildTutorFilter(query: TutorQuery, opts: { includeArchived?: boolean } = {}): QueryFilter<TutorDoc> {
  const filter: QueryFilter<TutorDoc> = {};

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    const digits = query.q.replace(/\D/g, "");
    const or: QueryFilter<TutorDoc>[] = [{ fullName: rx }, { applicationId: rx }, { mobileNumber: rx }, { subjects: rx }];
    if (digits.length >= 3) or.push({ normalizedMobileNumber: new RegExp(escapeRegex(digits.replace(/^977/, ""))) });
    filter.$or = or;
  }
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), "i");
  if (query.subject) filter.subjectKeys = new RegExp(escapeRegex(query.subject.toLowerCase()));
  if (query.status) filter.status = query.status;
  else if (!opts.includeArchived) filter.status = { $ne: "Archived" }; // archived hidden unless asked for

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = nepalDate(query.from);
    if (query.to) filter.createdAt.$lte = nepalDate(query.to, true);
  }
  return filter;
}

function sortFor(sort: TutorQuery["sort"]): Record<string, SortOrder> {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "name-asc":
      return { fullName: 1, createdAt: -1 };
    case "name-desc":
      return { fullName: -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
}

export async function listTutors(query: TutorQuery) {
  await connectDB();
  const filter = buildTutorFilter(query);
  const page = query.page ?? 1;
  const [items, total] = await Promise.all([
    Tutor.find(filter)
      .select(ROW_FIELDS)
      .sort(sortFor(query.sort))
      .collation({ locale: "en", strength: 2 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean<LeanTutor[]>(),
    Tutor.countDocuments(filter),
  ]);
  return {
    items: items.map(toRow),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function exportTutors(query: TutorQuery) {
  await connectDB();
  const items = await Tutor.find(buildTutorFilter(query, { includeArchived: true }))
    .select(`${ROW_FIELDS} adminNotes`)
    .sort(sortFor(query.sort))
    .collation({ locale: "en", strength: 2 })
    .limit(20000)
    .lean<(LeanTutor & { adminNotes: string })[]>();
  return items.map((t) => ({ ...toRow(t), adminNotes: t.adminNotes ?? "" }));
}

export async function getTutor(id: string): Promise<TutorDetail | null> {
  await connectDB();
  const t = await Tutor.findById(id).select(`${ROW_FIELDS} adminNotes`).lean<LeanTutor | null>();
  if (!t) return null;
  return { ...toRow(t), adminNotes: t.adminNotes ?? "" };
}

export type ActivityItem = {
  id: string;
  action: string;
  previousValue: string;
  newValue: string;
  note: string;
  adminName: string;
  createdAt: string;
};

export async function getTutorActivity(tutorId: string): Promise<ActivityItem[]> {
  await connectDB();
  const logs = await ActivityLog.find({ tutorId }).sort({ createdAt: -1 }).limit(50).lean();
  return logs.map((l) => ({
    id: String(l._id),
    action: l.action,
    previousValue: l.previousValue ?? "",
    newValue: l.newValue ?? "",
    note: l.note ?? "",
    adminName: l.adminName ?? "",
    createdAt: new Date((l as { createdAt?: Date }).createdAt ?? Date.now()).toISOString(),
  }));
}

export type StatusCounts = Record<TutorStatus, number> & { total: number };

export async function getStatusCounts(match: QueryFilter<TutorDoc> = {}): Promise<StatusCounts> {
  await connectDB();
  const rows = await Tutor.aggregate<{ _id: TutorStatus; count: number }>([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(TUTOR_STATUSES.map((s) => [s, 0])) as Record<TutorStatus, number>;
  let total = 0;
  for (const r of rows) {
    if (r._id in counts) counts[r._id] = r.count;
    total += r.count;
  }
  return { ...counts, total };
}

export async function getRecentTutors(limit = 6) {
  await connectDB();
  const items = await Tutor.find().select(ROW_FIELDS).sort({ createdAt: -1 }).limit(limit).lean<LeanTutor[]>();
  return items.map(toRow);
}
