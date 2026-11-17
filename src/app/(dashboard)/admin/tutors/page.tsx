import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listTutors } from "@/lib/data/tutors";
import { tutorQuerySchema } from "@/lib/validations";
import { flatParams } from "@/lib/utils";
import { getSettings, registrationLink } from "@/lib/data/settings";
import { PageHeader } from "@/components/layout/page-header";
import { TutorsToolbar } from "@/components/tutors/tutors-toolbar";
import { TutorsTable } from "@/components/tutors/tutors-table";
import { CopyLinkButton } from "@/components/forms/copy-text";

export const metadata: Metadata = { title: "Tutors" };

const TITLES: Record<string, { title: string; description: string }> = {
  Available: { title: "Available Tutors", description: "Tutors ready to take on new tuition." },
  Contacted: { title: "Contacted Tutors", description: "Tutors you have reached out to." },
  Hired: { title: "Hired Tutors", description: "Tutors currently placed with students." },
  Unavailable: { title: "Unavailable Tutors", description: "Tutors who are not taking tuition right now." },
  Archived: { title: "Archived Tutors", description: "Records kept for reference, hidden from the main list." },
  New: { title: "New Applications", description: "Tutors who registered and haven't been reviewed yet." },
};

export default async function TutorsPage({ searchParams }: PageProps<"/admin/tutors">) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const query = tutorQuerySchema.parse(params);
  const [result, settings] = await Promise.all([listTutors(query), getSettings()]);
  const heading = (query.status && TITLES[query.status]) || {
    title: "All Tutors",
    description: "Every active tutor in your database. Archived records are under Archived Tutors.",
  };
  const filtered = Boolean(query.q || query.location || query.from || query.to);

  return (
    <>
      <PageHeader
        title={heading.title}
        description={`${heading.description} ${result.total} record${result.total === 1 ? "" : "s"}.`}
        actions={<CopyLinkButton url={registrationLink(settings)} variant="secondary" />}
      />
      <TutorsToolbar />
      <TutorsTable
        {...result}
        page={Math.min(result.page, result.pageCount)}
        searchParams={params}
        basePath="/admin/tutors"
        filtered={filtered || Boolean(query.status)}
      />
    </>
  );
}
