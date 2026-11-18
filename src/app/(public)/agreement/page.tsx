import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { buildAgreement } from "@/lib/agreement";
import { PublicShell } from "@/components/layout/public-shell";
import { AgreementDocument } from "@/components/agreement/agreement-document";
import { AgreementSign } from "@/components/forms/agreement-sign";

export const metadata: Metadata = {
  title: "Tutor Service Agreement",
  description: "Service agreement between Tuition Teacher Pokhara and registered tutors.",
  robots: { index: false },
};

// The agreement carries today's date (Nepal time), so render per request.
export const dynamic = "force-dynamic";

export default async function AgreementPage() {
  const settings = await getSettings();
  const now = new Date();
  const content = buildAgreement({ agencyName: settings.agencyName, date: now });
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(now).replace(/-/g, "");

  return (
    <PublicShell settings={settings}>
      <div className="ag">
        {/* The final reference number is issued when the tutor signs. */}
        <AgreementDocument content={content} logo={settings.logo} refNo={`TTP/TSA/${ymd}`}>
          <AgreementSign
            agencyName={settings.agencyName}
            companyName={content.companyName}
            today={content.dateLabel}
            statements={content.statements}
          />
        </AgreementDocument>
      </div>
    </PublicShell>
  );
}
