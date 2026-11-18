import { Fragment } from "react";
import Image from "next/image";
import { BrandLogo } from "@/components/layout/brand";
import type { AgreementBlock, AgreementContent } from "@/lib/agreement";
import "./agreement.css";

/** Render `**bold**` markup; everything else is plain text. */
function Rich({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

function Block({ block }: { block: AgreementBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <Rich text={block.text} />
        </p>
      );
    case "note":
      return (
        <p className="ag__example">
          <Rich text={block.text} />
        </p>
      );
    case "ol":
      return (
        <ol className={block.style === "alpha" ? "ag__clauses" : "ag__parties"}>
          {block.items.map((it, i) => (
            <li key={i}>
              <Rich text={it} />
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <table className="ag__table">
          <thead>
            <tr>
              <th scope="col">{block.head[0]}</th>
              <th scope="col">{block.head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td>{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

/** The agreement sheet. `children` go after the clauses (signatures, the sign form). */
export function AgreementDocument({
  content,
  logo,
  refNo,
  children,
}: {
  content: AgreementContent;
  logo?: string;
  refNo: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="ag__paper" aria-labelledby="ag-title">
      <header className="ag__head">
        <BrandLogo name={content.agencyName} logo={logo} className="ag__logo" />
        <dl className="ag__meta">
          <div>
            <dt>Ref. No.</dt>
            <dd>{refNo}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{content.dateLabel}</dd>
          </div>
        </dl>
      </header>

      <div className="ag__titleblock">
        <p className="ag__eyebrow">{content.eyebrow}</p>
        <h1 id="ag-title">{content.title}</h1>
        <p className="ag__issuer">
          {content.agencyName} · operated by <strong>{content.companyName}</strong>
        </p>
        <p className="ag__reg">{content.companyLine}</p>
      </div>

      {content.sections.map((s) => (
        <section key={s.heading} className="ag__section">
          <h2>
            {s.num && <span className="ag__num">{s.num}</span>} {s.heading}
          </h2>
          {s.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </section>
      ))}

      {children}
    </article>
  );
}

/** Agency stamp on the left, the tutor's signature on the right. */
export function AgreementSignatures({
  agencyName,
  companyName,
  tutorName,
  tutorSub,
}: {
  agencyName: string;
  companyName: string;
  tutorName: string | null;
  tutorSub: string;
}) {
  return (
    <section className="ag__signatures" aria-label="Signatures">
      <div className="ag__sig">
        <div className="ag__sig-space">
          <Image src="/STAMP.png" alt={`Official stamp of ${companyName}`} width={580} height={134} className="ag__stamp" sizes="240px" />
        </div>
        <p className="ag__sig-line">Authorised signatory</p>
        <p className="ag__sig-name">For {agencyName}</p>
        <p className="ag__sig-sub">{companyName}</p>
      </div>
      <div className="ag__sig">
        <div className="ag__sig-space">
          {tutorName ? <span className="ag__signature">{tutorName}</span> : <span className="ag__sig-pending">Awaiting signature</span>}
        </div>
        <p className="ag__sig-line">Tutor</p>
        <p className="ag__sig-name">{tutorName ?? "Name of the Tutor"}</p>
        <p className="ag__sig-sub">{tutorSub}</p>
      </div>
    </section>
  );
}
