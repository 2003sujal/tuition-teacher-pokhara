import type { Metadata } from "next";
import Link from "next/link";
import { FileSignature } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listSignedAgreements } from "@/lib/data/agreements";
import { formatMobile } from "@/lib/phone";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Signed Agreements" };

export default async function AgreementsPage() {
  await requireAdmin();
  const rows = await listSignedAgreements();

  return (
    <>
      <PageHeader
        title="Signed Agreements"
        description="Every accepted tutor service agreement, saved in full with the date, signer and an integrity check."
      />
      <Card>
        <CardContent className="overflow-x-auto px-0 py-0">
          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FileSignature className="mx-auto size-6 text-subtle-foreground" aria-hidden />
              <p className="mt-2 text-sm font-medium">No signed agreements yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy the agreement link from the dashboard and send it to a tutor.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">Ref. No.</th>
                  <th scope="col" className="px-3 py-3 font-medium">Signed by</th>
                  <th scope="col" className="px-3 py-3 font-medium">Mobile</th>
                  <th scope="col" className="px-3 py-3 font-medium">Accepted</th>
                  <th scope="col" className="px-3 py-3 font-medium">Version</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-muted/50">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[12.5px]">{r.refNo}</td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/tutors/${r.tutorId}`} className="font-medium hover:text-primary">
                        {r.signedName}
                      </Link>
                      {r.tutorApplicationId && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{r.tutorApplicationId}</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 tabular">{formatMobile(r.mobileNumber)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDateTime(r.acceptedAt)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.version}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/agreements/${r.id}`} className="font-medium text-primary hover:underline">
                        View document
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
