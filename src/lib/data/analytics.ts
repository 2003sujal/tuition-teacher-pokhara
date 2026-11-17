import "server-only";
import type { QueryFilter } from "mongoose";
import { connectDB } from "../mongodb";
import { Tutor, type TutorDoc } from "@/models/Tutor";
import { getStatusCounts, nepalDate } from "./tutors";
import { tidyLocation } from "../utils";

export type MonthlyPoint = { key: string; label: string; count: number };
export type LocationPoint = { location: string; count: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TZ = "+05:45";

/** Registrations per month, zero-filled, between two dates (defaults: last 12 months). */
export async function getMonthlyRegistrations(range: { from?: string; to?: string } = {}): Promise<MonthlyPoint[]> {
  await connectDB();
  const end = range.to ? nepalDate(range.to, true) : new Date();
  const start = range.from
    ? nepalDate(range.from)
    : new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1));

  const rows = await Tutor.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: TZ } }, count: { $sum: 1 } } },
  ]);
  const byKey = new Map(rows.map((r) => [r._id, r.count]));

  const points: MonthlyPoint[] = [];
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  const endKey = end.getUTCFullYear() * 12 + end.getUTCMonth();
  // Cap at 36 months so a very wide range stays readable.
  while (y * 12 + m <= endKey && points.length < 36) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    points.push({ key, label: `${MONTHS[m]} ${String(y).slice(2)}`, count: byKey.get(key) ?? 0 });
    m += 1;
    if (m === 12) {
      m = 0;
      y += 1;
    }
  }
  return points;
}

/** Case-insensitive grouping of the free-text location field. */
export async function getLocationDistribution(match: QueryFilter<TutorDoc> = {}, limit = 10): Promise<LocationPoint[]> {
  await connectDB();
  const rows = await Tutor.aggregate<{ _id: string; count: number; sample: string }>([
    { $match: match },
    { $group: { _id: "$locationKey", count: { $sum: 1 }, sample: { $first: "$location" } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ location: tidyLocation(r.sample || r._id), count: r.count }));
}

export type SubjectPoint = { subject: string; count: number };

/** How many tutors teach each subject (case-insensitive). */
export async function getSubjectDistribution(match: QueryFilter<TutorDoc> = {}, limit = 12): Promise<SubjectPoint[]> {
  await connectDB();
  const rows = await Tutor.aggregate<{ _id: string; count: number; sample: string }>([
    { $match: match },
    { $unwind: "$subjects" },
    { $group: { _id: { $toLower: "$subjects" }, count: { $sum: 1 }, sample: { $first: "$subjects" } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ subject: r.sample || r._id, count: r.count }));
}

export function rangeMatch(range: { from?: string; to?: string }): QueryFilter<TutorDoc> {
  if (!range.from && !range.to) return {};
  const createdAt: Record<string, Date> = {};
  if (range.from) createdAt.$gte = nepalDate(range.from);
  if (range.to) createdAt.$lte = nepalDate(range.to, true);
  return { createdAt };
}

export async function getReport(range: { from?: string; to?: string }) {
  const match = rangeMatch(range);
  const [counts, monthly, locations, subjects] = await Promise.all([
    getStatusCounts(match),
    getMonthlyRegistrations(range),
    getLocationDistribution(match, 15),
    getSubjectDistribution(match, 15),
  ]);
  return { counts, monthly, locations, subjects };
}
