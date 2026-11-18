import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Download, FileText, ImageIcon, BookOpen, Hash, Phone, MapPin, CalendarDays, History, FileSignature } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { isObjectId } from "@/lib/api";
import { getTutor, getTutorActivity } from "@/lib/data/tutors";
import { getTutorHires } from "@/lib/data/hires";
import { HireRecords } from "@/components/tutors/hire-records";
import { formatMobile } from "@/lib/phone";
import { formatBytes, formatDateTime, initials } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/tutors/status-badge";
import { ProfileActions } from "@/components/tutors/profile-actions";
import { NotesEditor } from "@/components/tutors/notes-editor";
import { ActivityTimeline } from "@/components/tutors/activity-timeline";
import { CopyText } from "@/components/forms/copy-text";

export const metadata: Metadata = { title: "Tutor profile" };

function Detail({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-subtle-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-foreground">{children}</dd>
      </div>
    </div>
  );
}

export default async function TutorProfilePage({ params }: PageProps<"/admin/tutors/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();

  const [tutor, activity, hires] = await Promise.all([getTutor(id), getTutorActivity(id), getTutorHires(id)]);
  if (!tutor) notFound();

  const isPdf = tutor.cvFileType === "application/pdf";
  const isImage = tutor.cvFileType.startsWith("image/");
  const viewable = isPdf || isImage;

  return (
    <>
      <Link href="/admin/tutors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Back to tutors
      </Link>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
              {initials(tutor.fullName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{tutor.fullName}</h1>
                <StatusBadge status={tutor.status} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="font-mono">{tutor.applicationId}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden /> {tutor.location}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <ProfileActions tutor={tutor} />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tutor details</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <dl className="divide-y divide-border">
                <Detail icon={Hash} label="Application ID">
                  <span className="flex items-center gap-1 font-mono">
                    {tutor.applicationId}
                    <CopyText value={tutor.applicationId} label="Copy application ID" />
                  </span>
                </Detail>
                <Detail icon={Phone} label="Mobile number">
                  <span className="flex items-center gap-1 tabular">
                    +977 {formatMobile(tutor.normalizedMobileNumber)}
                    <CopyText value={tutor.normalizedMobileNumber} label="Copy mobile number" />
                  </span>
                </Detail>
                <Detail icon={MapPin} label="Current location">
                  <Link href={`/admin/tutors?location=${encodeURIComponent(tutor.location)}`} className="hover:text-primary">
                    {tutor.location}
                  </Link>
                </Detail>
                <Detail icon={BookOpen} label="Subjects">
                  {tutor.subjects.length ? (
                    <span className="mt-0.5 flex flex-wrap gap-1.5">
                      {tutor.subjects.map((sub) => (
                        <Link
                          key={sub}
                          href={`/admin/tutors?subject=${encodeURIComponent(sub)}`}
                          className="rounded-md bg-primary-soft px-2 py-0.5 text-[13px] font-medium text-primary hover:bg-[#e1e9f4]"
                          title={`All tutors who teach ${sub}`}
                        >
                          {sub}
                        </Link>
                      ))}
                    </span>
                  ) : (
                    <span className="font-normal text-muted-foreground">Not provided</span>
                  )}
                </Detail>
                <Detail icon={FileSignature} label="Service agreement">
                  {tutor.agreementAcceptedAt ? (
                    <span className="text-emerald-700">Accepted {formatDateTime(tutor.agreementAcceptedAt)}</span>
                  ) : (
                    <span className="font-normal text-muted-foreground">Not signed yet — send the agreement link from the dashboard</span>
                  )}
                </Detail>
                <Detail icon={CalendarDays} label="Registered">{formatDateTime(tutor.createdAt)}</Detail>
                <Detail icon={History} label="Last updated">{formatDateTime(tutor.updatedAt)}</Detail>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>CV / Resume</CardTitle>
                <CardDescription>Stored privately. Links expire after 5 minutes.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/50 p-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface text-primary shadow-card">
                  {isImage ? <ImageIcon className="size-5" aria-hidden /> : <FileText className="size-5" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={tutor.cvFileName}>
                    {tutor.cvFileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(tutor.cvFileName.split(".").pop() ?? "").toUpperCase()} · {formatBytes(tutor.cvFileSize)} · Uploaded{" "}
                    {formatDateTime(tutor.cvUploadedAt)}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild variant="secondary">
                  <a href={`/api/tutors/${tutor.id}/cv`} target="_blank" rel="noopener">
                    <ExternalLink aria-hidden /> {isImage ? "View photo" : isPdf ? "View CV" : "Open CV"}
                  </a>
                </Button>
                <Button asChild variant="secondary">
                  <a href={`/api/tutors/${tutor.id}/cv?download=1`}>
                    <Download aria-hidden /> Download
                  </a>
                </Button>
              </div>
              {!viewable && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Word documents usually download instead of opening in the browser.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Hire records</CardTitle>
                <CardDescription>Vacancy posters, salary and our commission for each placement.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <HireRecords tutorId={tutor.id} tutorName={tutor.fullName} hires={hires} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Private admin notes</CardTitle>
                <CardDescription>Subjects, availability, call history — anything useful for matching.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <NotesEditor tutorId={tutor.id} initial={tutor.adminNotes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Status history &amp; activity</CardTitle>
                <CardDescription>Every status change, with who made it and when.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityTimeline items={activity} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
