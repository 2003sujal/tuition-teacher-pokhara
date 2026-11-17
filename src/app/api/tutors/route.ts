import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/api";
import { tutorQuerySchema } from "@/lib/validations";
import { listTutors } from "@/lib/data/tutors";

export const runtime = "nodejs";

/** Admin: paginated tutor list with search / filters / sort. */
export async function GET(req: Request) {
  const { response } = await guardAdmin(req);
  if (response) return response;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const query = tutorQuerySchema.parse(params);
  const result = await listTutors(query);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
