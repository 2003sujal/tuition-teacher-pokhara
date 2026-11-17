import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listTutors } from "@/lib/data/tutors";
import { tutorQuerySchema } from "@/lib/validations";
import { getSettings, registrationLink } from "@/lib/data/settings";
import { PageHeader } from "@/components/layout/page-header";
import { TutorsToolbar } from "@/components/tutors/tutors-toolbar";
import { TutorsTable } from "@/components/tutors/tutors-table";
import { CopyLinkButton } from "@/components/forms/copy-text";
import { flatParams } from "@/lib/utils";

export const metadata: Metadata = { title: "New Applications" };

export default async function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  delete params.status;
  const query = { ...tutorQuerySchema.parse(params), status: "New" as const };
  const [result, settings] = await Promise.all([listTutors(query), getSettings()]);

  return (
    <>
      <PageHeader
        title="New Applications"
        description={`Tutors who registered and haven't been reviewed yet. ${result.total} waiting. Change a tutor's status to move them out of this list.`}
        actions={<CopyLinkButton url={registrationLink(settings)} variant="secondary" />}
      />
      <TutorsToolbar lockStatus />
      <TutorsTable
        {...result}
        page={Math.min(result.page, result.pageCount)}
        searchParams={params}
        basePath="/admin/applications"
        filtered={Boolean(query.q || query.location || query.from || query.to)}
      />
    </>
  );
}
