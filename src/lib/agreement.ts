/**
 * The tutor service agreement as data. The public page renders it, and the
 * exact same content is saved with every acceptance, so the admin can later
 * show precisely what a tutor agreed to (even after the wording changes).
 *
 * Text may use **bold** markup; nothing else is interpreted.
 */
import { AGREEMENT_VERSION, COMMISSION_TIERS, COMPANY, DEMO_DEPOSIT, DEMO_FREE_DAYS } from "./constants";

export type AgreementBlock =
  | { type: "p"; text: string }
  | { type: "ol"; style: "decimal" | "alpha"; items: string[] }
  | { type: "table"; head: [string, string]; rows: [string, string][] }
  | { type: "note"; text: string };

export type AgreementSection = { num?: number; heading: string; blocks: AgreementBlock[] };

export type AgreementContent = {
  version: string;
  title: string;
  eyebrow: string;
  agencyName: string;
  companyName: string;
  companyLine: string;
  dateLabel: string;
  sections: AgreementSection[];
  statements: string[];
};

/** The four statements the tutor ticks before signing. */
export const AGREEMENT_STATEMENTS = [
  "Yes, I understand and accept the service charges in Clause 2.",
  "Yes, I understand and accept the demo class policy in Clause 3, including the deposit.",
  "Yes, I will keep this agreement confidential and will not discuss it with parents or students.",
  "I have read this agreement in full, I understand it, and I agree to follow it.",
] as const;

const rs = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

/** Long Nepal-time date, e.g. "Wednesday, 18 November 2026". */
export function agreementDate(at: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  }).format(at);
}

export function buildAgreement({ agencyName, date }: { agencyName: string; date: Date }): AgreementContent {
  const dateLabel = agreementDate(date);
  return {
    version: AGREEMENT_VERSION,
    title: "Tutor Service Agreement",
    eyebrow: "Official document",
    agencyName,
    companyName: COMPANY.name,
    companyLine: `Company Regd. No. ${COMPANY.regdNo} · VAT/PAN No. ${COMPANY.panNo} · Pokhara, Nepal`,
    dateLabel,
    sections: [
      {
        heading: "Parties to this agreement",
        blocks: [
          { type: "p", text: `This agreement is made on **${dateLabel}** between:` },
          {
            type: "ol",
            style: "decimal",
            items: [
              `**${agencyName}**, a tutor placement service operated by ${COMPANY.name}, Pokhara, Nepal (hereafter “the Agency”); and`,
              "**The tutor** named and signing below, registered with the Agency (hereafter “the Tutor”).",
            ],
          },
        ],
      },
      {
        num: 1,
        heading: "Purpose",
        blocks: [
          {
            type: "p",
            text: "The Agency connects the Tutor with students and parents who need tuition. This agreement sets out the Agency’s service charge, the demo class policy, and the Tutor’s duty of confidentiality.",
          },
        ],
      },
      {
        num: 2,
        heading: "Service charge",
        blocks: [
          {
            type: "p",
            text: "When the Tutor is placed through the Agency, the Tutor pays the Agency a one-time service charge calculated on the **first month’s salary** of that tuition:",
          },
          {
            type: "table",
            head: ["First month salary", "Service charge"],
            rows: COMMISSION_TIERS.map((t) => [t.label, t.charge] as [string, string]),
          },
          { type: "note", text: "Example: for a salary of Rs. 12,000 per month, the service charge is 30% = Rs. 3,600, paid once." },
        ],
      },
      {
        num: 3,
        heading: "Demo class policy",
        blocks: [
          {
            type: "ol",
            style: "alpha",
            items: [
              `Before going to a demo class, the Tutor deposits a minimum of **${rs(DEMO_DEPOSIT)}** with the Agency.`,
              "The deposit is **refunded in full** if the Tutor is not selected after the demo class.",
              `The demo class is **free for ${DEMO_FREE_DAYS} days**. If the parents have not decided by the end of day ${DEMO_FREE_DAYS}, they pay the Tutor for classes from **day ${DEMO_FREE_DAYS + 1}** onwards.`,
            ],
          },
        ],
      },
      {
        num: 4,
        heading: "Confidentiality",
        blocks: [
          {
            type: "p",
            text: "The Tutor must **not discuss this agreement** — including the service charge and the deposit — with parents or students. Doing so violates Agency policy, and the Agency may remove the Tutor from its network.",
          },
        ],
      },
      {
        num: 5,
        heading: "Acceptance",
        blocks: [
          {
            type: "p",
            text: `The Tutor accepts this agreement electronically below. The Agency records the Tutor’s name, registered mobile number and the date of acceptance (version ${AGREEMENT_VERSION}).`,
          },
        ],
      },
    ],
    statements: [...AGREEMENT_STATEMENTS],
  };
}

/** Plain-text rendering (for the integrity hash and text export). */
export function agreementPlainText(c: AgreementContent) {
  const strip = (s: string) => s.replace(/\*\*/g, "");
  const out: string[] = [c.title.toUpperCase(), `${c.agencyName} · operated by ${c.companyName}`, c.companyLine, `Date: ${c.dateLabel}`, ""];
  for (const s of c.sections) {
    out.push(`${s.num ? `${s.num}. ` : ""}${s.heading}`);
    for (const b of s.blocks) {
      if (b.type === "p" || b.type === "note") out.push(strip(b.text));
      else if (b.type === "ol") b.items.forEach((it, i) => out.push(`  ${b.style === "alpha" ? String.fromCharCode(97 + i) : i + 1}) ${strip(it)}`));
      else {
        out.push(`  ${b.head.join(" | ")}`);
        b.rows.forEach((r) => out.push(`  ${r.join(" | ")}`));
      }
    }
    out.push("");
  }
  out.push("Statements accepted by the Tutor:");
  c.statements.forEach((s) => out.push(`  [x] ${s}`));
  return out.join("\n");
}
