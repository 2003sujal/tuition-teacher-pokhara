import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ShieldAlert, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { isObjectId } from "@/lib/api";
import { getSignedAgreement } from "@/lib/data/agreements";
import { getSettings } from "@/lib/data/settings";
import { formatMobile } from "@/lib/phone";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgreementDocument, AgreementSignatures } from "@/components/agreement/agreement-document";
import { PrintButton } from "@/components/agreement/print-button";
import "@/components/layout/public-studio.css";

export const metadata: Metadata = { title: "Signed agreement" };

function Row({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className={cn("min-w-0 break-words text-sm font-medium", mono && "font-mono text-[12.5px]")}>{children}</dd>
    </div>
  );
}

export default async function SignedAgreementPage({ params }: PageProps<"/admin/agreements/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const [a, settings] = await Promise.all([getSignedAgreement(id), getSettings()]);
  if (!a) notFound();

  const acceptedLong = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kathmandu",
  }).format(new Date(a.acceptedAt));

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/agreements" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> All signed agreements
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <a href={`/api/agreements/${a.id}/text`}>
              <Download aria-hidden /> Download text copy
            </a>
          </Button>
          <PrintButton />
        </div>
      </div>

      <Card className="no-print mb-6">
        <CardHeader>
          <CardTitle>Acceptance record</CardTitle>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              a.intact ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            )}
          >
            {a.intact ? <ShieldCheck className="size-3.5" aria-hidden /> : <ShieldAlert className="size-3.5" aria-hidden />}
            {a.intact ? "Integrity verified" : "Record does not match its hash"}
          </span>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <Row label="Reference number" mono>{a.refNo}</Row>
            <Row label="Signed by (typed name)">{a.signedName}</Row>
            <Row label="Registered mobile">+977 {formatMobile(a.mobileNumber)}</Row>
            <Row label="Tutor record">
              <Link href={`/admin/tutors/${a.tutorId}`} className="text-primary hover:underline">
                {a.tutorApplicationId || "Open tutor profile"}
              </Link>
            </Row>
            <Row label="Accepted on (Nepal time)">{acceptedLong}</Row>
            <Row label="Agreement version">{a.version}</Row>
            <Row label="IP address" mono>{a.ipAddress || "—"}</Row>
            <Row label="Device / browser" mono>{a.userAgent || "—"}</Row>
            <Row label="SHA-256 hash" mono>{a.contentHash}</Row>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            This is the full document exactly as shown to the tutor when they signed. The hash covers the document text,
            name, mobile number, date and version; “Integrity verified” means none of them has changed since signing.
          </p>
        </CardContent>
      </Card>

      <div className="ag ag--admin">
        <AgreementDocument content={a.content} logo={settings.logo} refNo={a.refNo}>
          <section className="ag__section">
            <h2>Statements accepted by the Tutor</h2>
            <ul className="ag__accepted">
              {a.content.statements.map((s) => (
                <li key={s}>
                  <span aria-hidden>☑</span> {s}
                </li>
              ))}
            </ul>
          </section>
          <AgreementSignatures
            agencyName={a.content.agencyName}
            companyName={a.content.companyName}
            tutorName={a.signedName}
            tutorSub={`Accepted electronically ${formatDateTime(a.acceptedAt)}`}
          />
          <p className="ag__evidence">
            Ref. No. {a.refNo} · Mobile +977 {formatMobile(a.mobileNumber)} · Version {a.version} · SHA-256{" "}
            {a.contentHash.slice(0, 16)}…
          </p>
        </AgreementDocument>
      </div>
    </>
  );
}
