import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { PublicShell } from "@/components/layout/public-shell";
import { BrandLogo } from "@/components/layout/brand";
import { AgreementSign } from "@/components/forms/agreement-sign";
import { AGREEMENT_VERSION, COMMISSION_TIERS, COMPANY, DEMO_DEPOSIT, DEMO_FREE_DAYS } from "@/lib/constants";
import { formatNpr } from "@/lib/utils";
import "./agreement.css";

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
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  }).format(now);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(now).replace(/-/g, "");

  return (
    <PublicShell settings={settings}>
      <div className="ag">
        <article className="ag__paper" aria-labelledby="ag-title">
          <header className="ag__head">
            <BrandLogo name={settings.agencyName} logo={settings.logo} className="ag__logo" />
            <dl className="ag__meta">
              <div>
                <dt>Ref. No.</dt>
                <dd>TTP/TSA/{ymd}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{today}</dd>
              </div>
            </dl>
          </header>

          <div className="ag__titleblock">
            <p className="ag__eyebrow">Official document</p>
            <h1 id="ag-title">Tutor Service Agreement</h1>
            <p className="ag__issuer">
              {settings.agencyName} · operated by <strong>{COMPANY.name}</strong>
            </p>
            <p className="ag__reg">
              Company Regd. No. {COMPANY.regdNo} · VAT/PAN No. {COMPANY.panNo} · Pokhara, Nepal
            </p>
          </div>

          <section className="ag__section">
            <h2>Parties to this agreement</h2>
            <p>
              This agreement is made on <strong>{today}</strong> between:
            </p>
            <ol className="ag__parties">
              <li>
                <strong>{settings.agencyName}</strong>, a tutor placement service operated by {COMPANY.name},
                Pokhara, Nepal (hereafter <em>“the Agency”</em>); and
              </li>
              <li>
                <strong>The tutor</strong> named and signing below, registered with the Agency (hereafter{" "}
                <em>“the Tutor”</em>).
              </li>
            </ol>
          </section>

          <section className="ag__section">
            <h2>
              <span className="ag__num">1</span> Purpose
            </h2>
            <p>
              The Agency connects the Tutor with students and parents who need tuition. This agreement sets out the
              Agency’s service charge, the demo class policy, and the Tutor’s duty of confidentiality.
            </p>
          </section>

          <section className="ag__section">
            <h2>
              <span className="ag__num">2</span> Service charge
            </h2>
            <p>
              When the Tutor is placed through the Agency, the Tutor pays the Agency a one-time service charge
              calculated on the <strong>first month’s salary</strong> of that tuition:
            </p>
            <table className="ag__table">
              <thead>
                <tr>
                  <th scope="col">First month salary</th>
                  <th scope="col">Service charge</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION_TIERS.map((t) => (
                  <tr key={t.label}>
                    <td>{t.label}</td>
                    <td>{t.charge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ag__example">
              Example: for a salary of Rs. 12,000 per month, the service charge is 30% = Rs. 3,600, paid once.
            </p>
          </section>

          <section className="ag__section">
            <h2>
              <span className="ag__num">3</span> Demo class policy
            </h2>
            <ol className="ag__clauses">
              <li>
                Before going to a demo class, the Tutor deposits a minimum of <strong>{formatNpr(DEMO_DEPOSIT)}</strong>{" "}
                with the Agency.
              </li>
              <li>
                The deposit is <strong>refunded in full</strong> if the Tutor is not selected after the demo class.
              </li>
              <li>
                The demo class is <strong>free for {DEMO_FREE_DAYS} days</strong>. If the parents have not decided by
                the end of day {DEMO_FREE_DAYS}, they pay the Tutor for classes from <strong>day {DEMO_FREE_DAYS + 1}</strong>{" "}
                onwards.
              </li>
            </ol>
          </section>

          <section className="ag__section">
            <h2>
              <span className="ag__num">4</span> Confidentiality
            </h2>
            <p>
              The Tutor must <strong>not discuss this agreement</strong> — including the service charge and the deposit —
              with parents or students. Doing so violates Agency policy, and the Agency may remove the Tutor from its
              network.
            </p>
          </section>

          <section className="ag__section">
            <h2>
              <span className="ag__num">5</span> Acceptance
            </h2>
            <p>
              The Tutor accepts this agreement electronically below. The Agency records the Tutor’s name, registered
              mobile number and the date of acceptance (version {AGREEMENT_VERSION}).
            </p>
          </section>

          <AgreementSign agencyName={settings.agencyName} companyName={COMPANY.name} today={today} />
        </article>
      </div>
    </PublicShell>
  );
}
